import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_NOTICE_DURATION_MS = 3000;

export function useTemporaryNotice(durationMs = DEFAULT_NOTICE_DURATION_MS) {
  const [notice, setNotice] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotice = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setNotice(message);
    timer.current = setTimeout(() => {
      timer.current = null;
      setNotice('');
    }, durationMs);
  }, [durationMs]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { notice, showNotice };
}
