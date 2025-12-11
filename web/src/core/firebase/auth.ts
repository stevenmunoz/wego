/**
 * Firebase Authentication service
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from './config';

// Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Debug: Log Firebase config on load
console.log('Firebase Auth initialized with domain:', firebaseAuth.config.authDomain);

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  photoURL: string | null;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

  // Update the user profile with display name
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
    // Send email verification
    await sendEmailVerification(userCredential.user);
  }

  return userCredential;
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(firebaseAuth, email, password);
};

/**
 * Sign in with Google using popup
 */
export const signInWithGoogle = (): Promise<UserCredential> => {
  console.log('signInWithGoogle: Opening popup...');
  console.log('signInWithGoogle: Auth domain:', firebaseAuth.config.authDomain);
  console.log('signInWithGoogle: Current origin:', window.location.origin);

  return signInWithPopup(firebaseAuth, googleProvider);
};

/**
 * Sign out the current user
 */
export const logOut = async (): Promise<void> => {
  return signOut(firebaseAuth);
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  return sendPasswordResetEmail(firebaseAuth, email);
};

/**
 * Get the current Firebase user
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return firebaseAuth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  return onAuthStateChanged(firebaseAuth, callback);
};

/**
 * Convert Firebase user to app user format
 */
export const mapFirebaseUser = (user: FirebaseUser): FirebaseAuthUser => ({
  uid: user.uid,
  email: user.email,
  displayName: user.displayName,
  emailVerified: user.emailVerified,
  photoURL: user.photoURL,
});

/**
 * Get the current user's ID token
 */
export const getIdToken = async (): Promise<string | null> => {
  const user = getCurrentUser();
  if (!user) return null;
  return user.getIdToken();
};
