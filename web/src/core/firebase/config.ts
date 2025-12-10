/**
 * Firebase configuration and initialization
 */

import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDP-oLaDT63ojGhMuJGoK85UfD-d_HS63Y',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wego-bac88.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wego-bac88',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wego-bac88.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '522655457786',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:522655457786:web:9cac5c387a8659609ac443',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-JXGGSLPZVY',
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const firebaseAuth = getAuth(firebaseApp);

// Set persistence to local (persists even after browser close)
setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
  console.error('Error setting auth persistence:', error);
});

// Initialize Analytics (only in browser and if supported)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined' && (await isSupported())) {
    return getAnalytics(firebaseApp);
  }
  return null;
};
