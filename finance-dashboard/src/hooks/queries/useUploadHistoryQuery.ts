import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadHistoryApi } from '../../services/apiService';
import { UploadHistory } from '../../types';
import { useToast } from '../../contexts/ToastContext';

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
  const { showToast } = useToast();

  return useMutation({
    mutationFn: uploadHistoryApi.delete,
    onSuccess: () => {
      // Invalidate and refetch upload history
      queryClient.invalidateQueries({ queryKey: uploadHistoryKeys.lists() });
      showToast('success', 'Upload history deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete upload history:', error);
      showToast(
        'error',
        error?.message || 'Failed to delete upload history'
      );
    },
  });
}; 