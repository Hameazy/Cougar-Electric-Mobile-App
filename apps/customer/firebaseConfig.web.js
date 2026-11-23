import { getAuth } from 'firebase/auth';
import { app } from './firebaseApp';

// Browser Auth selects its supported local persistence automatically.
export const auth = getAuth(app);
