// CEI-35: what a customer document in Firestore looks like (collection: customers, doc ID: the user's uid).
// Firestore doesn't force a structure on its own, so this type plus firestore.rules is our "schema".
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { app } from '../../firebaseApp';
import type { RegistrationRequest } from '../auth/AuthenticationTypes';

export const CUSTOMERS_COLLECTION = 'customers';

export type CustomerProfile = {
  fullName: string;
  email: string;
  phone: string;
  address: string; // street address
  city: string;
  state: string; // two-letter code, uppercase (CA)
  zip: string; // 95814 or 95814-1234
  // createdAt and updatedAt are added with serverTimestamp() when the document is saved
};

export type CustomerProfileInput = Omit<RegistrationRequest, 'password'>;

const db = getFirestore(app);

// Turns the Create Account form into the profile we save.
// The password fields are left out on purpose -- Firebase Auth keeps those, not Firestore.
export function toCustomerProfile(form: CustomerProfileInput): CustomerProfile {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase(),
    zip: form.zip.trim(),
  };
}

// Creating at a deterministic uid makes this safe to retry after an uncertain
// network result. If the document already exists, the profile step is complete.
export async function createCustomerProfile(
  uid: string,
  form: CustomerProfileInput,
): Promise<void> {
  const customerRef = doc(db, CUSTOMERS_COLLECTION, uid);
  const existingProfile = await getDoc(customerRef);

  if (existingProfile.exists()) return;

  await setDoc(customerRef, {
    ...toCustomerProfile(form),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  const snapshot = await getDoc(doc(db, CUSTOMERS_COLLECTION, uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    fullName: typeof data.fullName === 'string' ? data.fullName : '',
    email: typeof data.email === 'string' ? data.email : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    address: typeof data.address === 'string' ? data.address : '',
    city: typeof data.city === 'string' ? data.city : '',
    state: typeof data.state === 'string' ? data.state : '',
    zip: typeof data.zip === 'string' ? data.zip : '',
  };
}
