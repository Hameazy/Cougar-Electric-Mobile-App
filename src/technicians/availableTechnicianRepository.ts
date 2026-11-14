import {
  collection,
  getFirestore,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { app } from '../../firebaseApp';
import type { AvailableTechnician } from './AvailableTechnicianTypes';

const db = getFirestore(app);
const TECHNICIANS_COLLECTION = 'technicians';

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readTechnician(snapshot: QueryDocumentSnapshot<DocumentData>): AvailableTechnician | null {
  const data = snapshot.data();
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const latitude = readNumber(data.latitude);
  const longitude = readNumber(data.longitude);

  if (!name || latitude === undefined || longitude === undefined || data.availability !== 'available') {
    return null;
  }

  return {
    id: snapshot.id,
    name,
    rating: readNumber(data.rating),
    latitude,
    longitude,
    availability: 'available',
  };
}

export function subscribeToAvailableTechnicians(
  onTechnicians: (technicians: AvailableTechnician[]) => void,
  onError: (message: string) => void,
): Unsubscribe {
  const availableTechniciansQuery = query(
    collection(db, TECHNICIANS_COLLECTION),
    where('availability', '==', 'available'),
  );

  return onSnapshot(
    availableTechniciansQuery,
    (snapshot) => {
      onTechnicians(
        snapshot.docs
          .map(readTechnician)
          .filter((technician): technician is AvailableTechnician => technician !== null),
      );
    },
    (error) => {
      if (error.code === 'permission-denied') {
        onError('Nearby technician information is not available. Please sign in again.');
      } else if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
        onError('Unable to load nearby technicians. Check your connection and try again.');
      } else {
        onError('We could not load nearby technicians.');
      }
    },
  );
}
