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
import { aggregateAllData, type VehicleFinanceData } from '../utils/aggregations';
import type {
  ReportingAggregations,
  UseReportingDataOptions,
  UseReportingDataReturn,
  DateRange,
} from '../types';
import type { FirestoreInDriverRide } from '@/core/firebase/firestore';

interface VehicleInfo {
  id: string;
  plate: string;
}

interface IncomeDoc {
  amount: number;
  date: Timestamp;
  type?: 'weekly_payment' | 'tip_share' | 'bonus' | 'other';
}

interface ExpenseDoc {
  amount: number;
  date: Timestamp;
  category?: 'fuel' | 'maintenance' | 'insurance_soat' | 'tecnomecanica' | 'taxes' | 'fines' | 'parking' | 'car_wash' | 'accessories' | 'other';
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
  const vehicleIdsRef = useRef<string[]>([]);

  // Ref to store vehicle finance data
  const vehicleFinancesRef = useRef<VehicleFinanceData>({
    totalIncome: 0,
    totalExpenses: 0,
    incomeByType: { weekly_payment: 0, tip_share: 0, bonus: 0, other: 0 },
    expensesByCategory: {
      fuel: 0, maintenance: 0, insurance_soat: 0, tecnomecanica: 0,
      taxes: 0, fines: 0, parking: 0, car_wash: 0, accessories: 0, other: 0,
    },
  });

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
      const driverNames = new Map<string, string>();

      // Fetch users FIRST - this is the primary source for names
      // Driver IDs match user IDs in the system
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.docs.forEach((doc) => {
        const data = doc.data() as { full_name?: string; name?: string };
        const name = data.full_name || data.name;
        if (name) {
          driverNames.set(doc.id, name);
        }
      });

      // Fetch drivers to ensure we have all driver IDs covered
      // (in case a driver exists but doesn't have a user record)
      const driversSnapshot = await getDocs(collection(db, 'drivers'));
      driversSnapshot.docs.forEach((doc) => {
        if (!driverNames.has(doc.id)) {
          driverNames.set(doc.id, `Conductor ${doc.id.slice(0, 6)}`);
        }
      });

      // Fetch vehicles
      const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'));
      const vehiclePlates = new Map<string, string>();
      const vehicleIds: string[] = [];
      vehiclesSnapshot.docs.forEach((doc) => {
        const data = doc.data() as VehicleInfo;
        vehiclePlates.set(doc.id, data.plate || 'Sin placa');
        vehicleIds.push(doc.id);
      });

      driverNamesRef.current = driverNames;
      vehiclePlatesRef.current = vehiclePlates;
      vehicleIdsRef.current = vehicleIds;

      return { driverNames, vehiclePlates, vehicleIds };
    } catch (err) {
      console.error('[useReportingData] Error fetching lookup data:', err);
      return {
        driverNames: new Map<string, string>(),
        vehiclePlates: new Map<string, string>(),
        vehicleIds: [],
      };
    }
  }, []);

  // Fetch vehicle finances (income and expenses) with breakdown
  const fetchVehicleFinances = useCallback(async (vehicleIds: string[], startDate: Date, endDate: Date): Promise<VehicleFinanceData> => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const incomeByType = {
      weekly_payment: 0,
      tip_share: 0,
      bonus: 0,
      other: 0,
    };
    const expensesByCategory = {
      fuel: 0,
      maintenance: 0,
      insurance_soat: 0,
      tecnomecanica: 0,
      taxes: 0,
      fines: 0,
      parking: 0,
      car_wash: 0,
      accessories: 0,
      other: 0,
    };

    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    try {
      // Fetch income and expenses for all vehicles in parallel
      const promises = vehicleIds.map(async (vehicleId) => {
        // Fetch income
        const incomeSnapshot = await getDocs(collection(db, 'vehicles', vehicleId, 'income'));
        incomeSnapshot.docs.forEach((doc) => {
          const data = doc.data() as IncomeDoc;
          if (data.date && data.date.toMillis() >= startTs.toMillis() && data.date.toMillis() <= endTs.toMillis()) {
            const amount = data.amount || 0;
            totalIncome += amount;
            const incomeType = data.type || 'other';
            incomeByType[incomeType] = (incomeByType[incomeType] || 0) + amount;
          }
        });

        // Fetch expenses
        const expenseSnapshot = await getDocs(collection(db, 'vehicles', vehicleId, 'expenses'));
        expenseSnapshot.docs.forEach((doc) => {
          const data = doc.data() as ExpenseDoc;
          if (data.date && data.date.toMillis() >= startTs.toMillis() && data.date.toMillis() <= endTs.toMillis()) {
            const amount = data.amount || 0;
            totalExpenses += amount;
            const category = data.category || 'other';
            expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
          }
        });
      });

      await Promise.all(promises);

      console.log('[useReportingData] Vehicle finances:', { totalIncome, totalExpenses, incomeByType, expensesByCategory });
      return { totalIncome, totalExpenses, incomeByType, expensesByCategory };
    } catch (err) {
      console.error('[useReportingData] Error fetching vehicle finances:', err);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        incomeByType,
        expensesByCategory,
      };
    }
  }, []);

  // Process rides and calculate aggregations
  const processRides = useCallback(
    (rides: FirestoreInDriverRide[], vehicleFinances?: VehicleFinanceData) => {
      const dateRange = dateRangeRef.current;
      const finances = vehicleFinances || vehicleFinancesRef.current;
      const agg = aggregateAllData(
        rides,
        driverNamesRef.current,
        vehiclePlatesRef.current,
        dateRange,
        finances
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
      const { vehicleIds } = await fetchLookupData();

      // Fetch vehicle finances for the date range
      const finances = await fetchVehicleFinances(
        vehicleIds,
        options.startDate,
        options.endDate
      );
      vehicleFinancesRef.current = finances;

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

          processRides(rides, finances);
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
  }, [isAdmin, options.startDate, options.endDate, fetchLookupData, fetchVehicleFinances, processRides]);

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
