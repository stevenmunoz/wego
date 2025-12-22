/**
 * useReportingGoals Hook
 *
 * Manages CRUD operations for reporting goals.
 * Admin-only functionality for setting global performance targets.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import {
  getReportingGoals,
  updateReportingGoal,
  deleteReportingGoal,
  upsertReportingGoal,
} from '@/core/firebase/reporting-goals';
import type {
  ReportingGoal,
  ReportingGoalInput,
  UseReportingGoalsReturn,
  GoalTargetType,
} from '../types';

export function useReportingGoals(): UseReportingGoalsReturn {
  const [goals, setGoals] = useState<ReportingGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);

  const isAdmin = userRole === 'admin';
  const ownerId = user?.id;

  // Fetch goals
  const fetchGoals = useCallback(async () => {
    if (!ownerId || !isAdmin) {
      setGoals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedGoals = await getReportingGoals(ownerId);
      setGoals(fetchedGoals);
    } catch (err) {
      console.error('[useReportingGoals] Error fetching goals:', err);
      const message = err instanceof Error ? err.message : 'Error al cargar metas';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, isAdmin]);

  // Initial fetch
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Create goal
  const handleCreateGoal = useCallback(
    async (input: ReportingGoalInput) => {
      if (!ownerId || !isAdmin) {
        return { success: false, error: 'No autorizado' };
      }

      // Use upsert to ensure only one goal per type
      const result = await upsertReportingGoal(ownerId, input);

      if (result.success) {
        await fetchGoals();
      } else {
        setError(result.error || 'Error al crear meta');
      }

      return result;
    },
    [ownerId, isAdmin, fetchGoals]
  );

  // Update goal
  const handleUpdateGoal = useCallback(
    async (goalId: string, input: Partial<ReportingGoalInput>) => {
      if (!ownerId || !isAdmin) {
        return { success: false, error: 'No autorizado' };
      }

      const result = await updateReportingGoal(goalId, input);

      if (result.success) {
        await fetchGoals();
      } else {
        setError(result.error || 'Error al actualizar meta');
      }

      return result;
    },
    [ownerId, isAdmin, fetchGoals]
  );

  // Delete goal
  const handleDeleteGoal = useCallback(
    async (goalId: string) => {
      if (!ownerId || !isAdmin) {
        return { success: false, error: 'No autorizado' };
      }

      const result = await deleteReportingGoal(goalId);

      if (result.success) {
        await fetchGoals();
      } else {
        setError(result.error || 'Error al eliminar meta');
      }

      return result;
    },
    [ownerId, isAdmin, fetchGoals]
  );

  // Get the active goal (prioritize weekly, then monthly)
  const getActiveGoal = (): ReportingGoal | null => {
    if (goals.length === 0) return null;

    // Prefer rides goals over revenue goals
    const priorityOrder: GoalTargetType[] = [
      'rides_per_week',
      'rides_per_month',
      'revenue_per_week',
      'revenue_per_month',
    ];

    for (const targetType of priorityOrder) {
      const goal = goals.find((g) => g.target_type === targetType);
      if (goal) return goal;
    }

    return goals[0];
  };

  return {
    goals,
    activeGoal: getActiveGoal(),
    isLoading,
    error,
    createGoal: handleCreateGoal,
    updateGoal: handleUpdateGoal,
    deleteGoal: handleDeleteGoal,
    refetch: fetchGoals,
  };
}
