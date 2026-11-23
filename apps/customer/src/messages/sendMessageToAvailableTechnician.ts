import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';
import { app } from '../../firebaseApp';

const db = getFirestore(app);
export const SUPPORT_MESSAGES_COLLECTION = 'supportMessages';

export async function sendTechnicianMessage(customerId: string, message: string) {
  const text = message.trim();
  if (!text) throw new Error('Write a message before sending.');
  if (text.length > 1000) throw new Error('Keep your message under 1,000 characters.');

  await addDoc(collection(db, SUPPORT_MESSAGES_COLLECTION), {
    customerId,
    recipient: 'any-technician',
    message: text,
    status: 'awaiting-response',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
