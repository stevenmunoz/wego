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
  reassignRideToDriver,
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
  getOwnerVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  setVehicleAsPrimary,
  assignDriver,
  unassignDriver,
  type FirestoreVehicle,
} from './vehicles';
export {
  uploadVehicleImage,
  deleteVehicleImage,
  deleteStorageFile,
  compressImage,
  uploadVehicleDocument,
  deleteVehicleDocument,
  uploadExpenseReceipt,
  type DocumentType,
} from './storage';
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
export {
  initRemoteConfig,
  isMaintenanceMode,
  getMaintenanceTitle,
  getMaintenanceMessage,
  isPromoBannerEnabled,
  getPromoBannerText,
} from './remote-config';
