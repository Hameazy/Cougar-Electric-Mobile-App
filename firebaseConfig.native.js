import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from '@firebase/auth';
import { app } from './firebaseApp';

function getOrInitializeAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
}

export const auth = getOrInitializeAuth();
