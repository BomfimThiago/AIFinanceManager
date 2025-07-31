import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { goalsApi } from '../../services/apiService';
import { Goal, GoalCreate, GoalUpdate } from '../../types';

// Query keys for goals
export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (filters: string) => [...goalKeys.lists(), { filters }] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: number) => [...goalKeys.details(), id] as const,
  active: () => [...goalKeys.all, 'active'] as const,
  byType: (type: string) => [...goalKeys.all, 'type', type] as const,
  summary: () => [...goalKeys.all, 'summary'] as const,
};

// Query hooks
export const useGoals = () => {
  return useQuery({
    queryKey: goalKeys.lists(),
    queryFn: async () => {
      const response = await goalsApi.getAll();
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGoal = (id: number) => {
  return useQuery({
    queryKey: goalKeys.detail(id),
    queryFn: () => goalsApi.getById(id),
    enabled: !!id,
  });
};

export const useActiveGoals = () => {
  return useQuery({
    queryKey: goalKeys.active(),
    queryFn: async () => {
      const response = await goalsApi.getActive();
      return response || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGoalsByType = (goalType: string) => {
  return useQuery({
    queryKey: goalKeys.byType(goalType),
    queryFn: async () => {
      const response = await goalsApi.getByType(goalType);
      return response || [];
    },
    enabled: !!goalType,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGoalsSummary = () => {
  return useQuery({
    queryKey: goalKeys.summary(),
    queryFn: () => goalsApi.getSummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks
export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goal: GoalCreate) => goalsApi.create(goal),
    onSuccess: (newGoal) => {
      // Invalidate and refetch goals lists
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.summary() });
      
      // Invalidate by type if goal has a type
      if (newGoal.goal_type) {
        queryClient.invalidateQueries({ queryKey: goalKeys.byType(newGoal.goal_type) });
      }

      // Add the new goal to the cache
      queryClient.setQueryData(goalKeys.detail(newGoal.id), newGoal);
    },
    onError: (error) => {
      console.error('Failed to create goal:', error);
      throw error;
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, goal }: { id: number; goal: GoalUpdate }) =>
      goalsApi.update(id, goal),
    onSuccess: (updatedGoal) => {
      // Update the specific goal in cache
      queryClient.setQueryData(goalKeys.detail(updatedGoal.id), updatedGoal);
      
      // Invalidate and refetch goals lists
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.summary() });
      
      // Invalidate by type if goal has a type
      if (updatedGoal.goal_type) {
        queryClient.invalidateQueries({ queryKey: goalKeys.byType(updatedGoal.goal_type) });
      }
    },
    onError: (error) => {
      console.error('Failed to update goal:', error);
      throw error;
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => goalsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove the goal from cache
      queryClient.removeQueries({ queryKey: goalKeys.detail(deletedId) });
      
      // Invalidate and refetch all goal lists
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.summary() });
      
      // Invalidate all type-based queries
      queryClient.invalidateQueries({ queryKey: [...goalKeys.all, 'type'] });
    },
    onError: (error) => {
      console.error('Failed to delete goal:', error);
      throw error;
    },
  });
};

export const useUpdateGoalProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      id, 
      progress 
    }: { 
      id: number; 
      progress: { amount: number; date?: string; notes?: string } 
    }) => goalsApi.updateProgress(id, progress),
    onSuccess: (updatedGoal) => {
      // Update the specific goal in cache
      queryClient.setQueryData(goalKeys.detail(updatedGoal.id), updatedGoal);
      
      // Invalidate and refetch goals lists to update progress everywhere
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.summary() });
      
      // Invalidate by type if goal has a type
      if (updatedGoal.goal_type) {
        queryClient.invalidateQueries({ queryKey: goalKeys.byType(updatedGoal.goal_type) });
      }
    },
    onError: (error) => {
      console.error('Failed to update goal progress:', error);
      throw error;
    },
  });
};

export const useSetGoalProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      goalsApi.setProgress(id, amount),
    onSuccess: (updatedGoal) => {
      // Update the specific goal in cache
      queryClient.setQueryData(goalKeys.detail(updatedGoal.id), updatedGoal);
      
      // Invalidate and refetch goals lists to update progress everywhere
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalKeys.active() });
      queryClient.invalidateQueries({ queryKey: goalKeys.summary() });
      
      // Invalidate by type if goal has a type
      if (updatedGoal.goal_type) {
        queryClient.invalidateQueries({ queryKey: goalKeys.byType(updatedGoal.goal_type) });
      }
    },
    onError: (error) => {
      console.error('Failed to set goal progress:', error);
      throw error;
    },
  });
};