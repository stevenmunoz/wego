/**
 * useReportingData Hook
 *
 * Real-time subscription to driver rides for reporting aggregations.
 * Uses Firestore collection group query with onSnapshot for live updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collectionGroup,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
  collection,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/core/firebase/firestore';
import { useAuthStore } from '@/core/store/auth-store';
import { aggregateAllData } from '../utils/aggregations';
import type {
  ReportingAggregations,
  UseReportingDataOptions,
  UseReportingDataReturn,
  DateRange,
} from '../types';
import type { FirestoreInDriverRide } from '@/core/firebase/firestore';

interface DriverInfo {
  id: string;
  name: string;
}

interface VehicleInfo {
  id: string;
  plate: string;
}

export function useReportingData(options: UseReportingDataOptions): UseReportingDataReturn {
  const [aggregations, setAggregations] = useState<ReportingAggregations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);

  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  // Refs to store driver and vehicle lookup maps
  const driverNamesRef = useRef<Map<string, string>>(new Map());
  const vehiclePlatesRef = useRef<Map<string, string>>(new Map());

  // Ref to store unsubscribe function
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Stable date range ref to avoid dependency issues
  const dateRangeRef = useRef<DateRange>({
    startDate: options.startDate,
    endDate: options.endDate,
  });

  // Update date range ref when options change
  useEffect(() => {
    dateRangeRef.current = {
      startDate: options.startDate,
      endDate: options.endDate,
    };
  }, [options.startDate, options.endDate]);

  // Fetch driver and vehicle lookup data
  const fetchLookupData = useCallback(async () => {
    try {
      // Fetch drivers
      const driversSnapshot = await getDocs(collection(db, 'drivers'));
      const driverNames = new Map<string, string>();
      driversSnapshot.docs.forEach((doc) => {
        const data = doc.data() as DriverInfo;
        driverNames.set(doc.id, data.name || 'Conductor desconocido');
      });

      // Also fetch users for fallback names
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data() as { full_name?: string; name?: string };
        if (!driverNames.has(doc.id)) {
          driverNames.set(doc.id, data.full_name || data.name || 'Usuario');
        }
      });

      // Fetch vehicles
      const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
      const vehiclePlates = new Map<string, string>();
      vehiclesSnapshot.docs.forEach((doc) => {
        const data = doc.data() as VehicleInfo;
        vehiclePlates.set(doc.id, data.plate || 'Sin placa');
      });

      driverNamesRef.current = driverNames;
      vehiclePlatesRef.current = vehiclePlates;

      return { driverNames, vehiclePlates };
    } catch (err) {
      console.error('[useReportingData] Error fetching lookup data:', err);
      return {
        driverNames: new Map<string, string>(),
        vehiclePlates: new Map<string, string>(),
      };
    }
  }, []);

  // Process rides and calculate aggregations
  const processRides = useCallback(
    (rides: FirestoreInDriverRide[]) => {
      const dateRange = dateRangeRef.current;
      const agg = aggregateAllData(
        rides,
        driverNamesRef.current,
        vehiclePlatesRef.current,
        dateRange
      );
      setAggregations(agg);
    },
    []
  );

  // Subscribe to rides with real-time updates
  const subscribe = useCallback(async () => {
    if (!isAdmin) {
      setError('Acceso no autorizado');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First fetch lookup data
      await fetchLookupData();

      // Build the query
      const ridesCollectionGroup = collectionGroup(db, 'driver_rides');
      let q = query(ridesCollectionGroup, orderBy('date', 'asc'));

      // Add date filters
      q = query(q, where('date', '>=', Timestamp.fromDate(options.startDate)));
      q = query(q, where('date', '<=', Timestamp.fromDate(options.endDate)));

      // Clean up existing subscription
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(
            '[useReportingData] Received',
            snapshot.docs.length,
            'rides'
          );

          const rides: FirestoreInDriverRide[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as FirestoreInDriverRide;
            // Get driver_id from document path
            const pathDriverId = docSnap.ref.parent.parent?.id;
            return {
              ...data,
              id: docSnap.id,
              driver_id: pathDriverId || data.driver_id,
              _docPath: docSnap.ref.path,
            };
          });

          processRides(rides);
          setIsLoading(false);
          setIsRealtime(true);
        },
        (err) => {
          console.error('[useReportingData] Subscription error:', err);
          setError('Error al cargar datos de viajes');
          setIsLoading(false);
          setIsRealtime(false);
        }
      );

      unsubscribeRef.current = unsubscribe;
    } catch (err) {
      console.error('[useReportingData] Error setting up subscription:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar datos';
      setError(message);
      setIsLoading(false);
      setIsRealtime(false);
    }
  }, [isAdmin, options.startDate, options.endDate, fetchLookupData, processRides]);

  // Manual refetch function
  const refetch = useCallback(() => {
    subscribe();
  }, [subscribe]);

  // Subscribe on mount and when date range changes
  useEffect(() => {
    subscribe();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [subscribe]);

  return {
    aggregations,
    isLoading,
    error,
    isRealtime,
    refetch,
  };
}
