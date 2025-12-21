/**
 * Firestore reporting goals service
 *
 * Goals are stored in a top-level collection:
 * - reporting_goals/{goalId}
 *
 * Admin-only access for configuring global performance targets.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firestore';
import type {
  ReportingGoal,
  ReportingGoalInput,
  GoalTargetType,
} from '@/features/reporting/types';

// ============ Firestore Types ============

export interface FirestoreReportingGoal {
  id: string;
  owner_id: string;
  target_type: GoalTargetType;
  target_value: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============ CRUD Operations ============

/**
 * Get all reporting goals for an owner (admin)
 */
export async function getReportingGoals(
  ownerId: string
): Promise<ReportingGoal[]> {
  const goalsCollection = collection(db, 'reporting_goals');
  const q = query(
    goalsCollection,
    where('owner_id', '==', ownerId),
    orderBy('created_at', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as ReportingGoal);
}

/**
 * Get active goal for a specific period type
 */
export async function getActiveGoalByType(
  ownerId: string,
  targetType: GoalTargetType
): Promise<ReportingGoal | null> {
  const goalsCollection = collection(db, 'reporting_goals');
  const q = query(
    goalsCollection,
    where('owner_id', '==', ownerId),
    where('target_type', '==', targetType)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as ReportingGoal;
}

/**
 * Create a new reporting goal
 */
export async function createReportingGoal(
  ownerId: string,
  input: ReportingGoalInput
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    const goalsCollection = collection(db, 'reporting_goals');
    const goalRef = doc(goalsCollection);
    const now = Timestamp.now();

    const goal: FirestoreReportingGoal = {
      id: goalRef.id,
      owner_id: ownerId,
      target_type: input.target_type,
      target_value: input.target_value,
      created_at: now,
      updated_at: now,
    };

    await setDoc(goalRef, goal);

    return { success: true, goalId: goalRef.id };
  } catch (error) {
    console.error('[reporting-goals] Error creating goal:', error);
    const message = error instanceof Error ? error.message : 'Error al crear meta';
    return { success: false, error: message };
  }
}

/**
 * Update an existing reporting goal
 */
export async function updateReportingGoal(
  goalId: string,
  updates: Partial<ReportingGoalInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const goalRef = doc(db, 'reporting_goals', goalId);

    const updateData: Record<string, unknown> = {
      updated_at: Timestamp.now(),
    };

    if (updates.target_type !== undefined) {
      updateData.target_type = updates.target_type;
    }
    if (updates.target_value !== undefined) {
      updateData.target_value = updates.target_value;
    }

    await updateDoc(goalRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('[reporting-goals] Error updating goal:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar meta';
    return { success: false, error: message };
  }
}

/**
 * Delete a reporting goal
 */
export async function deleteReportingGoal(
  goalId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const goalRef = doc(db, 'reporting_goals', goalId);
    await deleteDoc(goalRef);

    return { success: true };
  } catch (error) {
    console.error('[reporting-goals] Error deleting goal:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar meta';
    return { success: false, error: message };
  }
}

/**
 * Create or update a goal by type (upsert pattern)
 * This ensures only one goal per type per owner
 */
export async function upsertReportingGoal(
  ownerId: string,
  input: ReportingGoalInput
): Promise<{ success: boolean; goalId?: string; error?: string }> {
  try {
    // Check if goal of this type already exists
    const existingGoal = await getActiveGoalByType(ownerId, input.target_type);

    if (existingGoal) {
      // Update existing
      const result = await updateReportingGoal(existingGoal.id, {
        target_value: input.target_value,
      });
      return { ...result, goalId: existingGoal.id };
    } else {
      // Create new
      return await createReportingGoal(ownerId, input);
    }
  } catch (error) {
    console.error('[reporting-goals] Error upserting goal:', error);
    const message = error instanceof Error ? error.message : 'Error al guardar meta';
    return { success: false, error: message };
  }
}
