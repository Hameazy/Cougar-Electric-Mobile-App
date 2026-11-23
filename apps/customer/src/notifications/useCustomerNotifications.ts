import { collection, getFirestore, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { app } from '../../firebaseApp';

export type CustomerNotification = {
  id: string;
  message: string;
  title: string;
};

const db = getFirestore(app);

export function useCustomerNotifications(customerId?: string) {
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!customerId) return;
    const customerMessages = query(
      collection(db, 'supportMessages'),
      where('customerId', '==', customerId),
    );

    return onSnapshot(customerMessages, (snapshot) => {
      const next = snapshot.docs.flatMap((messageDocument) => {
        const data = messageDocument.data();
        const reply = firstText(data.response, data.technicianResponse, data.reply);
        const status = typeof data.status === 'string' ? data.status : '';
        const hasResponse = !!reply || ['responded', 'answered', 'new-response'].includes(status);
        const isRead = !!data.readAt || data.customerRead === true;
        if (!hasResponse || isRead) return [];

        return [{
          id: messageDocument.id,
          title: 'New message from Cougar Electric',
          message: reply || 'A technician responded to your message.',
        }];
      });

      setNotifications(next);
      setLoading(false);
      setErrorMessage('');
    }, () => {
      setLoading(false);
      setErrorMessage('Notifications could not be loaded. Please try again.');
    });
  }, [customerId]);

  return customerId
    ? { notifications, loading, errorMessage }
    : { notifications: [], loading: false, errorMessage: '' };
}

function firstText(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === 'string' && !!value.trim())?.trim() ?? '';
}
