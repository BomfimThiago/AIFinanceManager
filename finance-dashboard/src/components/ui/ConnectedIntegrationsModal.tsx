import React from 'react';
import { X, Settings, CheckCircle, XCircle, Plus, Trash2, RefreshCw, Download } from 'lucide-react';

// Helper function to get country flag emoji
const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '🌎';
  
  const flags: Record<string, string> = {
    'BR': '🇧🇷',
    'MX': '🇲🇽',
    'CO': '🇨🇴',
    'AR': '🇦🇷',
    'CL': '🇨🇱',
    'PE': '🇵🇪',
  };
  
  return flags[countryCode.toUpperCase()] || '🌎';
};

// Bank Icon Component that uses real logos or fallback
const BankIcon: React.FC<{ 
  integration: ConnectedIntegration;
  className?: string; 
}> = ({ integration, className = "h-10 w-10" }) => {
  // Try direct metadata first, then nested institution object
  const iconUrl = integration.metadata?.icon_logo || 
                  integration.metadata?.logo || 
                  integration.metadata?.institution?.icon_logo || 
                  integration.metadata?.institution?.logo;
  const bankName = integration.metadata?.display_name || 
                   integration.metadata?.name ||
                   integration.metadata?.institution?.display_name || 
                   integration.institution_name;
  const primaryColor = integration.metadata?.primary_color || 
                       integration.metadata?.institution?.primary_color || 
                       '#056dae';
  
  if (iconUrl) {
    return (
      <div className={`${className} rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center`}>
        <img 
          src={iconUrl} 
          alt={`${bankName} logo`}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback to text icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-sm" style="background: ${primaryColor};">${bankName.charAt(0).toUpperCase()}</div>`;
            }
          }}
        />
      </div>
    );
  }
  
  // Fallback to colored letter icon
  return (
    <div 
      className={`${className} rounded-lg flex items-center justify-center text-white font-bold text-sm`}
      style={{ backgroundColor: primaryColor }}
    >
      {bankName.charAt(0).toUpperCase()}
    </div>
  );
};

interface ConnectedIntegration {
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
    country?: string;
    
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

interface ConnectedIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrations: ConnectedIntegration[];
  onAddNew: () => void;
  onSync?: (integrationId: number) => Promise<void>;
  onDelete?: (integrationId: number) => void;
  onGetTransactions?: (integrationId: number) => void;
}

const ConnectedIntegrationsModal: React.FC<ConnectedIntegrationsModalProps> = ({
  isOpen,
  onClose,
  integrations,
  onAddNew,
  onSync,
  onDelete,
  onGetTransactions
}) => {
  const [syncingId, setSyncingId] = React.useState<number | null>(null);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [fetchingTransactionsId, setFetchingTransactionsId] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const handleSync = async (integrationId: number) => {
    if (!onSync) return;
    setSyncingId(integrationId);
    try {
      await onSync(integrationId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (integrationId: number) => {
    if (!onDelete) return;
    setDeletingId(integrationId);
    try {
      await onDelete(integrationId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGetTransactions = async (integrationId: number) => {
    if (!onGetTransactions) return;
    setFetchingTransactionsId(integrationId);
    try {
      await onGetTransactions(integrationId);
    } finally {
      setFetchingTransactionsId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Connected Integrations</h2>
            <p className="text-sm text-gray-600 mt-1">
              {integrations.length} {integrations.length === 1 ? 'bank connected' : 'banks connected'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
              <p className="text-gray-600 mb-4">Connect your first bank account to get started.</p>
              <button
                onClick={onAddNew}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Connect Bank
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => {
                // Use direct metadata first, then nested institution object
                const bankName = integration.metadata?.display_name || 
                               integration.metadata?.name ||
                               integration.metadata?.institution?.display_name || 
                               integration.institution_name;
                const institution = integration.metadata?.institution; // Keep for backward compatibility
                
                return (
                  <div 
                    key={integration.id} 
                    className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <BankIcon integration={integration} className="h-12 w-12" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900 text-lg">{bankName}</h4>
                              <div className="flex items-center space-x-1">
                                {integration.status === 'connected' ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  integration.status === 'connected' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {integration.status === 'connected' ? 'Connected' : 'Error'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Institution Details */}
                            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mt-2">
                              <div>
                                <span className="font-medium text-gray-700">Connected:</span>
                                <div className="text-gray-600">{formatDate(integration.created_at)}</div>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Last sync:</span>
                                <div className="flex items-center space-x-1">
                                  {syncingId === integration.id ? (
                                    <span className="text-blue-600 font-medium">Syncing...</span>
                                  ) : integration.last_sync ? (
                                    <span className="text-gray-600">{formatDate(integration.last_sync)}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">Never synced</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Institution Type & Country */}
                            <div className="flex items-center space-x-3 mt-2">
                              {(institution?.type || integration.metadata?.type) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700 border border-blue-200">
                                  {((institution?.type || integration.metadata?.type) || 'bank').charAt(0).toUpperCase() + ((institution?.type || integration.metadata?.type) || 'bank').slice(1)}
                                </span>
                              )}
                              {(integration.metadata?.country_code || integration.metadata?.country) && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-50 text-gray-700 border border-gray-200">
                                  {getCountryFlag(integration.metadata?.country_code || integration.metadata?.country)} {integration.metadata?.country_code || integration.metadata?.country}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-50 text-purple-700 border border-purple-200">
                                ID: {integration.institution_id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        {onSync && integration.status === 'connected' && (
                          <button
                            onClick={() => handleSync(integration.id)}
                            disabled={syncingId === integration.id}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sync data"
                          >
                            {syncingId === integration.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        {onGetTransactions && integration.status === 'connected' && (
                          <button
                            onClick={() => handleGetTransactions(integration.id)}
                            disabled={fetchingTransactionsId === integration.id}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Get transactions and convert to expenses"
                          >
                            {fetchingTransactionsId === integration.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        
                        <button
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Settings"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                        
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(integration.id)}
                            disabled={deletingId === integration.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove integration"
                          >
                            {deletingId === integration.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {integrations.length > 0 && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total: {integrations.length} {integrations.length === 1 ? 'integration' : 'integrations'}
              </div>
              <button
                onClick={onAddNew}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Bank</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectedIntegrationsModal;