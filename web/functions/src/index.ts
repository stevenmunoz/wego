/**
 * WeGo Cloud Functions
 *
 * Entry point for all Firebase Cloud Functions
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export notification triggers
export { onExternalRideCreated } from './triggers/onExternalRideCreated';

// Export InDriver document processing trigger
export { processInDriverDocument } from './triggers/processInDriverDocument';
