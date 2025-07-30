import React, { useState } from 'react';
import ConnectedIntegrationsModal from '../ui/ConnectedIntegrationsModal';
import ConnectedBanks from '../integrations/ConnectedBanks';
import AvailableIntegrations from '../integrations/AvailableIntegrations';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ConsentManagementModal } from '../ui/ConsentManagementModal';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { useBelvoSDK } from '../../hooks/useBelvoSDK';
import { useIntegrations } from '../../hooks/useIntegrations';


const Integrations: React.FC = () => {
  const { t } = useTranslation();
  const [connectingIntegration, setConnectingIntegration] = useState<string | null>(null);
  const [showConnectedIntegrationsModal, setShowConnectedIntegrationsModal] = useState(false);
  const [showConsentManagementModal, setShowConsentManagementModal] = useState(false);
  // Removed unused state - consent option is managed in the modal
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
      // Note: The Belvo callback provides link (string) and institution (string name)
      const response = await fetch('/api/integrations/belvo/save-connection', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          link_id: link,  // This is the Belvo link ID
          institution: {
            raw_data: institution,  // This is the institution name string from Belvo
            name: institution,      // Use the institution name
            id: link               // Use link_id as fallback ID
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          t('integrations.bankConnected'), 
          t('integrations.bankConnectedMessage').replace('{bank}', data.institution_name)
        );
        // Refresh integrations list
        await fetchConnectedIntegrations();
      } else {
        const errorData = await response.text();
        console.error('Failed to save integration:', errorData);
        showError(
          t('integrations.connectionFailed'), 
          t('integrations.connectionFailedMessage')
        );
      }
    } catch (error) {
      console.error('Error processing Belvo callback:', error);
      showError(
        t('integrations.connectionError'), 
        t('integrations.connectionErrorMessage')
      );
    }
  };

  // Belvo SDK exit callback
  const handleBelvoExit = (data: any) => {
    console.log('Belvo widget closed:', data);
    if (data?.last_encountered_error) {
      const error = data.last_encountered_error;
      showWarning(
        t('integrations.connectionIssue'),
        t('integrations.connectionIssueMessage').replace('{error}', error.message || 'Please try again.')
      );
    }
  };

  // Belvo SDK event callback
  const handleBelvoEvent = (data: any) => {
    console.log('Belvo widget event:', data);
    if (data?.eventName === 'ERROR') {
      const error = data.meta_data;
      showError(
        t('integrations.connectionError'),
        error?.error_message || t('integrations.connectionErrorMessage')
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
      t('integrations.comingSoon'), 
      t('integrations.plaidComingSoon')
    );
  };

  const handleBelvoConnect = async () => {
    if (!isSDKLoaded) {
      showError(
        t('integrations.sdkNotReady'),
        t('integrations.sdkNotReadyMessage')
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
        t('integrations.connectionFailed'), 
        `${t('integrations.connectionFailedMessage')}: ${errorMessage}`
      );
    } finally {
      setConnectingIntegration(null);
    }
  };





  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('integrations.title')}</h2>
          <p className="text-gray-600 mt-1">{t('integrations.subtitle')}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Public MBP - direct link as per documentation
              window.open('https://meuportal.belvo.com/?mode=landing', '_blank', 'noopener,noreferrer');
              showInfo(t('integrations.consentPortalOpened'), t('integrations.manageConsentMessage'));
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>{t('integrations.manageConsents')}</span>
          </button>
          
          <button
            onClick={() => setShowConsentManagementModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{t('integrations.customPortal')}</span>
          </button>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('integrations.providerComparison')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('integrations.provider')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('integrations.coverage')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('integrations.bestFor')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('integrations.connectionMethod')}</th>
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
                <td className="px-6 py-4 text-sm text-gray-600">{t('integrations.plaidCoverage')}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t('integrations.plaidBestFor')}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t('integrations.plaidMethod')}</td>
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
                <td className="px-6 py-4 text-sm text-gray-600">{t('integrations.belvoCoverage')}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t('integrations.belvoBestFor')}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t('integrations.belvoMethod')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('integrations.howItWorks')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-medium mb-2">🔒 {t('integrations.securityFirst')}</h4>
            <p className="text-sm">{t('integrations.securityDescription')}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔄 {t('integrations.automaticSync')}</h4>
            <p className="text-sm">{t('integrations.automaticSyncDescription')}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">📊 {t('integrations.smartCategorization')}</h4>
            <p className="text-sm">{t('integrations.smartCategorizationDescription')}</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🌍 {t('integrations.multiCurrency')}</h4>
            <p className="text-sm">{t('integrations.multiCurrencyDescription')}</p>
          </div>
        </div>
      </div>

      {/* Consent Management Section */}
      <div className="bg-green-50 p-6 rounded-xl border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">{t('integrations.consentManagement')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Public Portal Option */}
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-green-900">{t('integrations.publicPortal')}</h4>
            </div>
            <p className="text-sm text-green-700 mb-3">
              {t('integrations.publicPortalDescription')}
            </p>
            <ul className="text-xs text-green-600 space-y-1">
              <li>• {t('integrations.noSetupRequired')}</li>
              <li>• {t('integrations.viewAllConsents')}</li>
              <li>• {t('integrations.standardAuth')}</li>
              <li>• {t('integrations.recommendedOption')}</li>
            </ul>
          </div>

          {/* Custom Portal Option */}
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-green-900">{t('integrations.customPortal')}</h4>
            </div>
            <p className="text-sm text-green-700 mb-3">
              {t('integrations.customPortalDescription')}
            </p>
            <ul className="text-xs text-green-600 space-y-1">
              <li>• {t('integrations.applicationSpecific')}</li>
              <li>• {t('integrations.requiresCpf')}</li>
              <li>• {t('integrations.focusedExperience')}</li>
              <li>• {t('integrations.enhancedPrivacy')}</li>
            </ul>
          </div>
        </div>

        <div className="text-green-700">
          <h4 className="font-medium mb-2">{t('integrations.whatYouCanDo')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-1">✅ {t('integrations.viewActiveConsents')}</h5>
              <p className="text-sm">{t('integrations.viewActiveConsentsDescription')}</p>
            </div>
            <div>
              <h5 className="font-medium mb-1">⏰ {t('integrations.checkExpiryDates')}</h5>
              <p className="text-sm">{t('integrations.checkExpiryDatesDescription')}</p>
            </div>
            <div>
              <h5 className="font-medium mb-1">🔄 {t('integrations.renewExpiredConsents')}</h5>
              <p className="text-sm">{t('integrations.renewExpiredConsentsDescription')}</p>
            </div>
            <div>
              <h5 className="font-medium mb-1">🗑️ {t('integrations.revokeAccess')}</h5>
              <p className="text-sm">{t('integrations.revokeAccessDescription')}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>{t('integrations.regulatoryCompliance')}</strong> {t('integrations.regulatoryComplianceDescription')}
            </p>
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

      {/* Consent Management Modal */}
      <ConsentManagementModal
        isOpen={showConsentManagementModal}
        onClose={() => setShowConsentManagementModal(false)}
        mode="management"
      />
      
      {/* Belvo Widget Container - Required by Belvo SDK */}
      <div id="belvo" style={{ display: 'none' }}></div>
    </div>
  );
};

export default Integrations;