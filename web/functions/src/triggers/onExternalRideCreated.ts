/**
 * Cloud Function trigger for external ride creation
 * Creates a notification when an external driver registers a new ride
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { createNotification } from '../services/notificationService';

/**
 * Triggers when a new ride is created in any driver's driver_rides subcollection.
 * Creates a notification if the ride category is 'external'.
 */
export const onExternalRideCreated = functions
  .region('us-central1')
  .firestore.document('drivers/{driverId}/driver_rides/{rideId}')
  .onCreate(async (snapshot, context) => {
    const rideData = snapshot.data();
    const { driverId, rideId } = context.params;

    // Only trigger for external rides
    if (rideData.category !== 'external') {
      console.log(
        `[onExternalRideCreated] Ride ${rideId} is not external (category: ${rideData.category}), skipping notification`
      );
      return null;
    }

    console.log(`[onExternalRideCreated] External ride detected: ${rideId} by driver ${driverId}`);

    try {
      // Fetch driver info for the notification message
      const driverDoc = await admin.firestore().collection('drivers').doc(driverId).get();

      let driverName = 'Conductor desconocido';

      if (driverDoc.exists) {
        const driverData = driverDoc.data();
        driverName = driverData?.name || driverData?.full_name || driverName;

        // If driver document doesn't have name, try to get it from linked user
        if (driverName === 'Conductor desconocido' && driverData?.user_id) {
          const userDoc = await admin.firestore().collection('users').doc(driverData.user_id).get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            driverName = userData?.full_name || userData?.name || driverName;
          }
        }
      }

      // Build notification message
      const destination = rideData.destination_address || '';
      const message = destination
        ? `${driverName} ha registrado un nuevo viaje externo hacia ${destination}`
        : `${driverName} ha registrado un nuevo viaje externo`;

      // Create the notification
      const notificationId = await createNotification({
        type: 'external_driver_ride',
        title: 'Nuevo viaje externo registrado',
        message,
        source_collection: 'driver_rides',
        source_document_id: rideId,
        source_driver_id: driverId,
        target_role: 'admin',
        metadata: {
          driver_name: driverName,
          ride_destination: destination || undefined,
          ride_amount: rideData.base_fare || rideData.total_received || undefined,
          ride_category: rideData.category,
        },
      });

      console.log(
        `[onExternalRideCreated] Notification ${notificationId} created for external ride ${rideId}`
      );
      return null;
    } catch (error) {
      console.error(
        `[onExternalRideCreated] Error creating notification for ride ${rideId}:`,
        error
      );
      throw error;
    }
  });
