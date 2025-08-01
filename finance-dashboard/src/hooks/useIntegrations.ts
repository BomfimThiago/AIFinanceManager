import { useCallback, useEffect, useState } from 'react';

import { useAppNotifications } from './useAppNotifications';

export interface ConnectedIntegration {
  id: number;
  status: string;
  institution_name: string;
  institution_id: string;
  last_sync: string | null;
  created_at: string;
  metadata: {
    // Core identification (matches Belvo structure)
    institution_id?: string;
    name?: string;
    display_name?: string;
    code?: string;

    // Visual branding
    logo?: string;
    icon_logo?: string;
    text_logo?: string;
    primary_color?: string;

    // Geographic information
    country_code?: string;
    country_codes?: string[];

    // Technical details
    type?: string;
    website?: string | null;
    status?: string;
    integration_type?: string;

    // Capabilities
    resources?: string[];
    features?: any[];
    form_fields?: any[];
    openbanking_information?: any;

    // Connection metadata
    connected_at?: string;
    integration_source?: string;
    raw_institution_data?: any;

    // Legacy nested institution object (for backward compatibility)
    institution?: {
      display_name?: string;
      logo?: string;
      icon_logo?: string;
      text_logo?: string;
      primary_color?: string;
      name?: string;
      type?: string;
    };
  };
}

interface ConfirmationState {
  isOpen: boolean;
  type: 'delete' | 'sync' | null;
  integrationId: number | null;
  bankName: string;
  title: string;
  message: string;
  confirmText: string;
  variant: 'danger' | 'warning' | 'info';
  isLoading: boolean;
}

interface UseIntegrationsReturn {
  connectedIntegrations: ConnectedIntegration[];
  loading: boolean;
  error: string | null;
  confirmationState: ConfirmationState;
  fetchConnectedIntegrations: () => Promise<void>;
  syncIntegration: (integrationId: number) => Promise<void>;
  requestDeleteIntegration: (integrationId: number) => void;
  requestGetTransactions: (integrationId: number) => void;
  handleConfirmation: () => Promise<void>;
  closeConfirmation: () => void;
}

export const useIntegrations = (): UseIntegrationsReturn => {
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
    isOpen: false,
    type: null,
    integrationId: null,
    bankName: '',
    title: '',
    message: '',
    confirmText: '',
    variant: 'danger',
    isLoading: false,
  });
  const { showSuccess, showError } = useAppNotifications();

  const fetchConnectedIntegrations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/integrations/belvo/integrations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnectedIntegrations(data.integrations || []);
      } else {
        const errorText = await response.text();
        setError(`Failed to fetch integrations: ${errorText}`);
        console.error('Failed to fetch integrations:', errorText);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error fetching integrations: ${errorMessage}`);
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const syncIntegration = useCallback(
    async (integrationId: number) => {
      try {
        const response = await fetch(`/api/integrations/belvo/sync/${integrationId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.ok) {
          showSuccess('Sync Complete!', 'Bank transactions have been synchronized successfully.');
          await fetchConnectedIntegrations();
        } else {
          const errorData = await response.text();
          console.error('Sync failed:', errorData);
          showError('Sync Failed', 'Failed to synchronize transactions. Please try again.');
        }
      } catch (err) {
        console.error('Error syncing integration:', err);
        showError('Sync Error', 'Failed to sync. Please check your connection and try again.');
      }
    },
    [fetchConnectedIntegrations, showSuccess, showError]
  );

  const performDeleteIntegration = useCallback(
    async (integrationId: number) => {
      try {
        setConfirmationState(prev => ({ ...prev, isLoading: true }));

        const response = await fetch(`/api/integrations/belvo/integrations/${integrationId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        });

        if (response.ok) {
          const integration = connectedIntegrations.find(int => int.id === integrationId);
          const bankName =
            integration?.metadata?.display_name ||
            integration?.metadata?.institution?.display_name ||
            integration?.institution_name ||
            'Unknown Bank';

          showSuccess('Bank Disconnected', `${bankName} has been disconnected successfully.`);
          await fetchConnectedIntegrations();
          setConfirmationState(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } else {
          const errorData = await response.text();
          console.error('Delete failed:', errorData);
          showError('Disconnect Failed', 'Failed to disconnect bank. Please try again.');
          setConfirmationState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('Error deleting integration:', err);
        showError(
          'Disconnect Error',
          'Failed to disconnect bank. Please check your connection and try again.'
        );
        setConfirmationState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [connectedIntegrations, fetchConnectedIntegrations, showSuccess, showError]
  );

  const requestDeleteIntegration = useCallback(
    (integrationId: number) => {
      const integration = connectedIntegrations.find(int => int.id === integrationId);
      const bankName =
        integration?.metadata?.display_name ||
        integration?.metadata?.institution?.display_name ||
        integration?.institution_name ||
        'Unknown Bank';

      setConfirmationState({
        isOpen: true,
        type: 'delete',
        integrationId,
        bankName,
        title: 'Disconnect Bank?',
        message: `Are you sure you want to disconnect ${bankName}? This will remove the integration and stop syncing transactions from this bank.`,
        confirmText: 'Disconnect',
        variant: 'danger',
        isLoading: false,
      });
    },
    [connectedIntegrations]
  );

  const performGetTransactions = useCallback(
    async (integrationId: number) => {
      try {
        setConfirmationState(prev => ({ ...prev, isLoading: true }));

        const response = await fetch(
          `/api/integrations/belvo/integrations/${integrationId}/sync-transactions`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const { transactions_fetched, expenses_created, errors = 0 } = data;

          const integration = connectedIntegrations.find(int => int.id === integrationId);
          const bankName =
            integration?.metadata?.display_name ||
            integration?.metadata?.institution?.display_name ||
            integration?.institution_name ||
            'Unknown Bank';

          let message = `Successfully processed transactions from ${bankName}:\n`;
          message += `• ${transactions_fetched} transactions fetched\n`;
          message += `• ${expenses_created} expenses created`;
          if (errors > 0) {
            message += `\n• ${errors} transactions failed to process`;
          }

          showSuccess('Transactions Processed!', message);
          await fetchConnectedIntegrations();
          setConfirmationState(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } else {
          const errorData = await response.text();
          console.error('Get transactions failed:', errorData);
          const integration = connectedIntegrations.find(int => int.id === integrationId);
          const bankName =
            integration?.metadata?.display_name ||
            integration?.metadata?.institution?.display_name ||
            integration?.institution_name ||
            'Unknown Bank';

          showError(
            'Fetch Failed',
            `Failed to fetch transactions from ${bankName}. Please try again.`
          );
          setConfirmationState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('Error getting transactions:', err);
        const integration = connectedIntegrations.find(int => int.id === integrationId);
        const bankName =
          integration?.metadata?.display_name ||
          integration?.metadata?.institution?.display_name ||
          integration?.institution_name ||
          'Unknown Bank';

        showError(
          'Fetch Error',
          `Failed to fetch transactions from ${bankName}. Please check your connection and try again.`
        );
        setConfirmationState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [connectedIntegrations, fetchConnectedIntegrations, showSuccess, showError]
  );

  const requestGetTransactions = useCallback(
    (integrationId: number) => {
      const integration = connectedIntegrations.find(int => int.id === integrationId);
      const bankName =
        integration?.metadata?.display_name ||
        integration?.metadata?.institution?.display_name ||
        integration?.institution_name ||
        'Unknown Bank';

      setConfirmationState({
        isOpen: true,
        type: 'sync',
        integrationId,
        bankName,
        title: 'Fetch Transactions?',
        message: `Fetch all transactions from ${bankName} and convert to expenses? This may take a few moments for banks with many transactions.`,
        confirmText: 'Fetch Transactions',
        variant: 'info',
        isLoading: false,
      });
    },
    [connectedIntegrations]
  );

  const handleConfirmation = useCallback(async () => {
    if (!confirmationState.integrationId) return;

    if (confirmationState.type === 'delete') {
      await performDeleteIntegration(confirmationState.integrationId);
    } else if (confirmationState.type === 'sync') {
      await performGetTransactions(confirmationState.integrationId);
    }
  }, [confirmationState, performDeleteIntegration, performGetTransactions]);

  const closeConfirmation = useCallback(() => {
    setConfirmationState(prev => ({ ...prev, isOpen: false, isLoading: false }));
  }, []);

  useEffect(() => {
    fetchConnectedIntegrations();
  }, [fetchConnectedIntegrations]);

  return {
    connectedIntegrations,
    loading,
    error,
    confirmationState,
    fetchConnectedIntegrations,
    syncIntegration,
    requestDeleteIntegration,
    requestGetTransactions,
    handleConfirmation,
    closeConfirmation,
  };
};
