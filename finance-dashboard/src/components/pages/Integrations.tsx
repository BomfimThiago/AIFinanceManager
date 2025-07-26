import React, { useState } from 'react';
import ConnectedIntegrationsModal from '../ui/ConnectedIntegrationsModal';
import ConnectedBanks from '../integrations/ConnectedBanks';
import AvailableIntegrations from '../integrations/AvailableIntegrations';
import ConfirmationModal from '../ui/ConfirmationModal';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useBelvoSDK } from '../../hooks/useBelvoSDK';
import { useIntegrations } from '../../hooks/useIntegrations';


const Integrations: React.FC = () => {
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null);
  const [showConnectedIntegrationsModal, setShowConnectedIntegrationsModal] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useNotificationContext();
  const { isSDKLoaded, isLoading: belvoLoading, openBelvoWidget } = useBelvoSDK();
  const {
    connectedIntegrations,
    loading,
    error,
    confirmationState,
    fetchConnectedIntegrations,
    syncIntegration,
    requestDeleteIntegration,
    requestGetTransactions,
    handleConfirmation,
    closeConfirmation
  } = useIntegrations();


  // Belvo SDK success callback
  const handleBelvoSuccess = async (link: string, institution: any) => {
    try {
      console.log('Belvo connection successful:');
      console.log('Link ID:', link);
      console.log('Institution data:', JSON.stringify(institution, null, 2));
      
      // Hide the Belvo widget container
      const belvoContainer = document.getElementById('belvo');
      if (belvoContainer) {
        belvoContainer.style.display = 'none';
      }
      
      // Send link data to backend
      const response = await fetch('/api/belvo/save-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          link_id: link,
          institution: {
            // Core identification (from Belvo institution structure)
            id: institution.id,
            name: institution.name,
            display_name: institution.display_name,
            code: institution.code,
            
            // Visual branding
            logo: institution.logo,
            icon_logo: institution.icon_logo,
            text_logo: institution.text_logo,
            primary_color: institution.primary_color,
            
            // Geographic info
            country_code: institution.country_code,
            country_codes: institution.country_codes,
            
            // Technical details
            type: institution.type,
            website: institution.website,
            status: institution.status,
            integration_type: institution.integration_type,
            
            // Capabilities
            resources: institution.resources,
            features: institution.features,
            form_fields: institution.form_fields,
            openbanking_information: institution.openbanking_information,
            
            // Store the complete original data
            raw_data: institution
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          'Bank Connected!', 
          `Successfully connected to ${data.institution_name}. You can now sync transactions.`
        );
        // Refresh integrations list
        await fetchConnectedIntegrations();
      } else {
        const errorData = await response.text();
        console.error('Failed to save integration:', errorData);
        showError(
          'Connection Failed', 
          'Failed to save bank integration. Please try connecting again.'
        );
      }
    } catch (error) {
      console.error('Error processing Belvo callback:', error);
      showError(
        'Connection Error', 
        'Failed to process bank connection. Please check your internet connection and try again.'
      );
    }
  };

  // Belvo SDK exit callback
  const handleBelvoExit = (data: any) => {
    console.log('Belvo widget closed:', data);
    if (data?.last_encountered_error) {
      const error = data.last_encountered_error;
      showWarning(
        'Connection Issue',
        `Bank connection failed: ${error.message || 'Please try again.'}`
      );
    }
  };

  // Belvo SDK event callback
  const handleBelvoEvent = (data: any) => {
    console.log('Belvo widget event:', data);
    if (data?.eventName === 'ERROR') {
      const error = data.meta_data;
      showError(
        'Connection Error',
        error?.error_message || 'An error occurred during connection.'
      );
    }
  };


  const handleConnect = async (integrationId: string) => {
    if (integrationId === 'plaid') {
      await handlePlaidConnect();
    } else if (integrationId === 'belvo') {
      // Check if user already has Belvo integrations
      const belvoIntegrations = connectedIntegrations.filter(int => int.status === 'connected');
      if (belvoIntegrations.length > 0) {
        // Show connected integrations modal
        setShowConnectedIntegrationsModal(true);
      } else {
        // Connect directly (no modal needed)
        await handleBelvoConnect();
      }
    }
  };

  const handlePlaidConnect = async () => {
    // TODO: Implement Plaid Link
    console.log('Starting Plaid Link flow...');
    showInfo(
      'Coming Soon', 
      'Plaid integration will be available once API credentials are configured.'
    );
  };

  const handleBelvoConnect = async () => {
    if (!isSDKLoaded) {
      showError(
        'SDK Not Ready',
        'Belvo SDK is still loading. Please try again in a moment.'
      );
      return;
    }

    setConnectingIntegration('belvo');
    
    try {
      // Open Belvo widget using SDK
      await openBelvoWidget({
        callback: handleBelvoSuccess,
        onExit: handleBelvoExit,
        onEvent: handleBelvoEvent
      });
      
    } catch (error) {
      console.error('Failed to start Belvo connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError(
        'Connection Failed', 
        `Failed to connect bank account: ${errorMessage}`
      );
    } finally {
      setConnectingIntegration(null);
    }
  };





  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bank Integrations</h2>
          <p className="text-gray-600 mt-1">Connect your bank accounts to automatically sync transactions</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Connected Banks */}
      {!loading && (
        <ConnectedBanks
          integrations={connectedIntegrations}
          onGetTransactions={requestGetTransactions}
          onShowSettings={() => setShowConnectedIntegrationsModal(true)}
        />
      )}

      {/* Available Integrations */}
      {!loading && (
        <AvailableIntegrations
          connectedIntegrations={connectedIntegrations}
          connectingIntegration={connectingIntegration}
          belvoLoading={belvoLoading}
          isSDKLoaded={isSDKLoaded}
          onConnect={handleConnect}
          onShowSettings={() => setShowConnectedIntegrationsModal(true)}
        />
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Comparison</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best For</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Connection Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 mr-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      P
                    </div>
                    <span className="font-medium">Plaid</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">12,000+ institutions in US, Canada & Europe</td>
                <td className="px-6 py-4 text-sm text-gray-600">North American & European banks</td>
                <td className="px-6 py-4 text-sm text-gray-600">Instant OAuth connection</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 mr-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      B
                    </div>
                    <span className="font-medium">Belvo</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">200+ institutions in Latin America</td>
                <td className="px-6 py-4 text-sm text-gray-600">Mexican, Brazilian banks</td>
                <td className="px-6 py-4 text-sm text-gray-600">Secure credential connection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How Bank Integration Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-medium mb-2">🔒 Security First</h4>
            <p className="text-sm">Your banking credentials are never stored on our servers. All connections use bank-grade encryption.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔄 Automatic Sync</h4>
            <p className="text-sm">Once connected, your transactions sync automatically. Manual sync available anytime.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📊 Smart Categorization</h4>
            <p className="text-sm">AI automatically categorizes your transactions and converts currencies.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🌍 Multi-Currency</h4>
            <p className="text-sm">All transactions are converted to your preferred currency with historical rates.</p>
          </div>
        </div>
      </div>


      {/* Connected Integrations Modal */}
      <ConnectedIntegrationsModal
        isOpen={showConnectedIntegrationsModal}
        onClose={() => setShowConnectedIntegrationsModal(false)}
        integrations={connectedIntegrations}
        onAddNew={async () => {
          setShowConnectedIntegrationsModal(false);
          await handleBelvoConnect();
        }}
        onSync={syncIntegration}
        onDelete={requestDeleteIntegration}
        onGetTransactions={requestGetTransactions}
      />
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirmation}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        variant={confirmationState.variant}
        isLoading={confirmationState.isLoading}
      />
      
      {/* Belvo Widget Container - Required by Belvo SDK */}
      <div id="belvo" style={{ display: 'none' }}></div>
    </div>
  );
};

export default Integrations;