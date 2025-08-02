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
  type: 'delete' | null;
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
  requestDeleteIntegration: (integrationId: number) => void;
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
        console.error('Failed to fetch integrations:', errorText);
        // Show user-friendly error message
        setError('Unable to load your connected banks. Please try refreshing the page.');
        showError('Connection Error', 'Unable to load your connected banks. Please try refreshing the page.');
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
      // Show user-friendly error message
      setError('Unable to connect to the server. Please check your internet connection.');
      showError('Network Error', 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }, [showError]);


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
          showError('Unable to Disconnect', 'We couldn\'t disconnect your bank right now. Please try again later.');
          setConfirmationState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('Error deleting integration:', err);
        showError(
          'Connection Problem',
          'Unable to complete this action. Please check your internet connection and try again.'
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


  const handleConfirmation = useCallback(async () => {
    if (!confirmationState.integrationId) return;

    if (confirmationState.type === 'delete') {
      await performDeleteIntegration(confirmationState.integrationId);
    }
  }, [confirmationState, performDeleteIntegration]);

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
    requestDeleteIntegration,
    handleConfirmation,
    closeConfirmation,
  };
};
