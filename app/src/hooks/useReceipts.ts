import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { receiptsApi } from '../services/api';
import { Receipt, PaginatedResponse } from '../types';

interface UseReceiptsOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export function useReceipts(options: UseReceiptsOptions = {}) {
  const { enabled = true, page = 1, limit = 50 } = options;
  return useQuery({
    queryKey: ['receipts', page, limit],
    queryFn: () => receiptsApi.getAll(page, limit),
    enabled,
  });
}

export function useReceipt(id: number) {
  return useQuery({
    queryKey: ['receipts', id],
    queryFn: () => receiptsApi.getById(id),
    enabled: !!id,
  });
}

interface UploadReceiptParams {
  uri: string;
  mimeType?: string;
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ uri, mimeType }: UploadReceiptParams) =>
      receiptsApi.upload(uri, mimeType),
    onSuccess: async () => {
      // Refetch both receipts and expenses since upload creates expenses
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['receipts'], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['expenses'], type: 'active' }),
      ]);
    },
  });
}

export function useUpdateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Receipt> }) =>
      receiptsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['receipts', variables.id] });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: receiptsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
