// CEI-7: keeps track of failed sign-ins on the Sign In screen and runs the short lockout timer.
import { useEffect, useState } from 'react';
import { lockSecondsAfter, signInErrorMessage } from './SignInErrors';

export function useSignInAttempts() {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState('');

  // count down once a second while locked
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function recordFailure(error: unknown) {
    const attempts = failedAttempts + 1;
    const lock = lockSecondsAfter(attempts);
    setFailedAttempts(lock ? 0 : attempts);
    setSecondsLeft(lock);
    setMessage(lock ? '' : signInErrorMessage(error));
  }

  function recordSuccess() {
    setFailedAttempts(0);
    setSecondsLeft(0);
    setMessage('');
  }

  const locked = secondsLeft > 0;
  return {
    message: locked ? `Too many failed attempts. Try again in ${secondsLeft}s.` : message,
    locked,
    recordFailure,
    recordSuccess,
    clearMessage: () => setMessage(''),
  };
}
