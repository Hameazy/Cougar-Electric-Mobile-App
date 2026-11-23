
import { FirebaseError } from 'firebase/app';
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import type { Attachment } from '../helpers/AttachmentRules';
import { auth } from '../../firebaseConfig';
import { app } from '../../firebaseApp';
import {
  validateServiceRequest,
  type ServiceRequestInput,
} from './validateServiceRequestSubmission';
import { SERVICE_REQUESTS_COLLECTION } from './ServiceRequestConstants';

const db = getFirestore(app);
const storage = getStorage(app);

function logFirebaseError(stage: string, error: unknown) {
  if (!__DEV__) return;

  if (error instanceof FirebaseError) {
    console.error(`[service-request] ${stage}`, {
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error(`[service-request] ${stage}`, error);
}

// Upload with a stable path so a retry overwrites instead of duplicating files.
async function uploadAttachments(
  files: Attachment[],
  customerId: string,
  requestId: string,
): Promise<string[]> {
  return Promise.all(
    files.map(async (file, index) => {
      const safeName = file.fileName.replace(/[^\w.-]/g, '_');
      const fileRef = storageRef(
        storage,
        `serviceRequests/${customerId}/${requestId}/${index}-${safeName}`,
      );
      const blob = await (await fetch(file.uri)).blob();
      await uploadBytes(fileRef, blob, {
        contentType: file.mimeType ?? blob.type ?? undefined,
      });
      return getDownloadURL(fileRef);
    }),
  );
}

// Generate an ID once for each new service request.
// Reuse the same ID if the customer retries submitting it.
export function createServiceRequestId(): string {
  return doc(collection(db, SERVICE_REQUESTS_COLLECTION)).id;
}

// Save the completed request for the signed-in customer.
export async function submitServiceRequest(
  request: ServiceRequestInput,
  requestId: string,
  files: Attachment[] = [],
): Promise<string> {
  const errors = validateServiceRequest(request);

  if (Object.keys(errors).length > 0) {
    throw new Error('Please complete all required fields before submitting.');
  }

  if (!request.timing) {
    throw new Error('Please choose when you need a technician.');
  }

  if (!requestId.trim() || requestId.includes('/')) {
    throw new Error('Invalid service request ID. Please try again.');
  }

  const customer = auth.currentUser;

  if (!customer) {
    throw new Error('Please sign in before submitting a service request.');
  }

  const requestRef = doc(db, SERVICE_REQUESTS_COLLECTION, requestId);

  try {
    let attachmentUrls = request.attachments ?? [];
    if (files.length > 0) {
      try {
        attachmentUrls = await uploadAttachments(files, customer.uid, requestId);
      } catch (error) {
        logFirebaseError('attachment upload failed', error);
        throw new Error(
          'We could not upload your photos or videos. Please try again.',
        );
      }
    }

    try {
      await setDoc(requestRef, {
        customerId: customer.uid,
        timing: request.timing,
        ...(request.timing === 'scheduled' && request.schedulePreference
          ? { schedulePreference: request.schedulePreference }
          : {}),
        issueType: request.issueType.trim(),
        description: request.description.trim(),
        address: request.address.trim(),
        city: request.city.trim(),
        state: request.state.trim().toUpperCase(),
        zip: request.zip.trim(),
        ...(request.latitude !== undefined && request.longitude !== undefined
          ? { latitude: request.latitude, longitude: request.longitude }
          : {}),
        attachments: attachmentUrls,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      // If the create reached Firestore but its acknowledgement was lost, a
      // retry with the same ID is successful when the saved request is ours.
      try {
        const existingRequest = await getDoc(requestRef);
        if (
          existingRequest.exists()
          && existingRequest.data().customerId === customer.uid
        ) {
          return requestRef.id;
        }
      } catch {
        // Preserve the original write error; it is the actionable failure.
      }

      throw error;
    }

    return requestRef.id;
  } catch (error) {
    logFirebaseError('submission failed', error);

    if (error instanceof FirebaseError) {
      if (error.code === 'permission-denied') {
        throw new Error(
          'Service request submission is not available yet. Please contact support.',
        );
      }

      if (
        error.code === 'unavailable' ||
        error.code === 'deadline-exceeded'
      ) {
        throw new Error(
          'Unable to connect. Please check your internet connection and try again.',
        );
      }
    }

    if (
      error instanceof Error &&
      (error.message === 'This service request ID is already in use.' ||
        error.message.startsWith('We could not upload'))
    ) {
      throw error;
    }

    throw new Error('We could not submit your request. Please try again.');
  }
}
