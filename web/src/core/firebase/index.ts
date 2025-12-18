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
  createUserAsAdmin,
  type FirebaseAuthUser,
} from './auth';
export {
  db,
  saveInDriverRides,
  getInDriverRides,
  updateInDriverRide,
  getUserProfile,
  getAllUsers,
  createUserProfile,
  updateUserProfile,
  getAllDrivers,
  getDriverProfile,
  getDriverWithUser,
  createDriverProfile,
  updateDriverProfile,
  generateSlugFromName,
  type FirestoreInDriverRide,
  type FirestoreUser,
  type FirestoreDriver,
  type DriverWithUser,
  type UserRole,
} from './firestore';
export {
  getAllVehicles,
  getDriverVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setVehicleAsPrimary,
  reassignVehicle,
  type FirestoreVehicle,
} from './vehicles';
export { uploadVehicleImage, deleteVehicleImage, compressImage } from './storage';
export {
  getVehicleIncome,
  createVehicleIncome,
  updateVehicleIncome,
  deleteVehicleIncome,
  getVehicleExpenses,
  createVehicleExpense,
  updateVehicleExpense,
  deleteVehicleExpense,
  calculatePLSummary,
  convertFirestoreIncome,
  convertFirestoreExpense,
  type FirestoreVehicleIncome,
  type FirestoreVehicleExpense,
} from './vehicle-finances';
