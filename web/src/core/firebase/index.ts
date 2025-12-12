/**
 * Firebase module exports
 */

export { firebaseApp, firebaseAuth, firebaseStorage, initAnalytics } from './config';
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
export {
  db,
  saveInDriverRides,
  getInDriverRides,
  updateInDriverRide,
  type FirestoreInDriverRide,
} from './firestore';
export {
  getDriverVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setVehicleAsPrimary,
  type FirestoreVehicle,
} from './vehicles';
export {
  uploadVehicleImage,
  deleteVehicleImage,
  compressImage,
} from './storage';
