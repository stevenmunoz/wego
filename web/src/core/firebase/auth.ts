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
  getAuth,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { firebaseAuth, firebaseConfig } from './config';

// Google Auth Provider instance
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Debug: Log Firebase config on load (dev only)
if (import.meta.env.DEV) {
  console.log('[Firebase] Auth initialized with domain:', firebaseAuth.config.authDomain);
}

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
  if (import.meta.env.DEV) {
    console.log('[Firebase] signInWithGoogle: Opening popup...');
    console.log('[Firebase] Auth domain:', firebaseAuth.config.authDomain);
    console.log('[Firebase] Current origin:', window.location.origin);
  }

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

/**
 * Create a new user as admin without logging out the current user.
 * Uses a secondary Firebase app instance to avoid affecting the main auth state.
 */
export const createUserAsAdmin = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; uid?: string; error?: string }> => {
  let secondaryApp: FirebaseApp | null = null;

  try {
    // Create a secondary Firebase app instance
    secondaryApp = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    // Create the user with the secondary auth instance
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);

    // Update the user's display name
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }

    const uid = userCredential.user.uid;

    // Sign out from secondary auth and clean up
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    return { success: true, uid };
  } catch (error) {
    // Clean up secondary app on error
    if (secondaryApp) {
      try {
        await deleteApp(secondaryApp);
      } catch {
        // Ignore cleanup errors
      }
    }

    console.error('[Auth] Error creating user as admin:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    // Map Firebase error codes to Spanish messages
    if (errorMsg.includes('email-already-in-use')) {
      return { success: false, error: 'Este correo ya está registrado' };
    }
    if (errorMsg.includes('invalid-email')) {
      return { success: false, error: 'El correo no es válido' };
    }
    if (errorMsg.includes('weak-password')) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    return { success: false, error: errorMsg };
  }
};
