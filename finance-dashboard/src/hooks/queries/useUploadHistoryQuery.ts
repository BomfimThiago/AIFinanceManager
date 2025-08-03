import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { uploadHistoryApi } from '../../services/apiService';
import { UploadHistory } from '../../types';
import { useAppNotifications } from '../useAppNotifications';

// Query key factory
export const uploadHistoryKeys = {
  all: ['uploadHistory'] as const,
  lists: () => [...uploadHistoryKeys.all, 'list'] as const,
};

// Get all upload history
export const useUploadHistoryQuery = () => {
  return useQuery<UploadHistory[]>({
    queryKey: uploadHistoryKeys.lists(),
    queryFn: uploadHistoryApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Delete upload history mutation
export const useDeleteUploadHistoryMutation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAppNotifications();

  return useMutation({
    mutationFn: uploadHistoryApi.delete,
    onSuccess: () => {
      // Invalidate and refetch upload history
      queryClient.invalidateQueries({ queryKey: uploadHistoryKeys.lists() });
      showSuccess('History Deleted', 'Upload history deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete upload history:', error);
      showError('Delete Failed', error?.message || 'Failed to delete upload history');
    },
  });
};
