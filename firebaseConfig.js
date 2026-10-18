// Fallback for non-Metro tooling. Expo selects firebaseConfig.native.js on
// iOS/Android and firebaseConfig.web.js on web.
export { auth } from './firebaseConfig.web';
