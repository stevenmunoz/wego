/**
 * Firebase module exports
 */

export { firebaseApp, firebaseAuth, initAnalytics } from './config';
export {
  signUp,
  signIn,
  signInWithGoogle,
  logOut,
  resetPassword,
  getCurrentUser,
  onAuthChange,
  mapFirebaseUser,
  getIdToken,
  type FirebaseAuthUser,
} from './auth';
