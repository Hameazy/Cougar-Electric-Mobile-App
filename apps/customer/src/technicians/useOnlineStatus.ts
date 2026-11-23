// Tells the map screen when the browser goes offline so it can say so, instead of
// leaving the customer wondering why nothing loads. On phones this always says
// "online": a failed request there already shows its own error message.
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const update = () => setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
}
