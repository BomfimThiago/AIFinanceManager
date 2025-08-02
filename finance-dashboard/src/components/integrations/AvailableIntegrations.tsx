import React from 'react';

import { AlertCircle, CheckCircle, ExternalLink, Settings, XCircle } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import type { ConnectedIntegration } from '../../hooks/useIntegrations';

// Bank provider icon components
const PlaidIcon: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <div
    className={`${className} bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm`}
  >
    P
  </div>
);

const BelvoIcon: React.FC<{ className?: string }> = ({ className = 'h-8 w-8' }) => (
  <div
    className={`${className} bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm`}
  >
    B
  </div>
);

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  accountInfo?: string;
  supportedCountries: string[];
  provider: 'plaid' | 'belvo';
}

interface AvailableIntegrationsProps {
  connectedIntegrations: ConnectedIntegration[];
  connectingIntegration: string | null;
  belvoLoading: boolean;
  isSDKLoaded: boolean;
  onConnect: (integrationId: string) => void;
}

const getIntegrations = (connectedIntegrations: ConnectedIntegration[]): Integration[] => {
  const belvoConnected = connectedIntegrations.some(int => int.status === 'connected');

  return [
    {
      id: 'plaid',
      name: 'Plaid',
      description: 'connectBanksDescription',
      icon: PlaidIcon,
      status: 'disconnected', // TODO: Update when Plaid is implemented
      supportedCountries: [
        '🇺🇸 United States',
        '🇨🇦 Canada',
        '🇬🇧 United Kingdom',
        '🇪🇸 Spain',
        '🇫🇷 France',
        '🇳🇱 Netherlands',
        '🇮🇪 Ireland',
      ],
      provider: 'plaid',
    },
    {
      id: 'belvo',
      name: 'Belvo',
      description: 'Connect Latin American banks in Mexico and Brazil',
      icon: BelvoIcon,
      status: belvoConnected ? 'connected' : 'disconnected',
      supportedCountries: [
        '🇲🇽 Mexico',
        '🇧🇷 Brazil',
      ],
      provider: 'belvo',
      lastSync: belvoConnected
        ? connectedIntegrations
            .filter(int => int.status === 'connected' && int.last_sync)
            .sort((a, b) => new Date(b.last_sync!).getTime() - new Date(a.last_sync!).getTime())[0]
            ?.last_sync || undefined
        : undefined,
      accountInfo: belvoConnected
        ? (() => {
            const connectedBanks = connectedIntegrations.filter(int => int.status === 'connected');
            const bankNames = connectedBanks
              .map(bank => {
                return (
                  bank.metadata?.display_name ||
                  bank.metadata?.institution?.display_name ||
                  bank.institution_name ||
                  'Unknown Bank'
                );
              })
              .slice(0, 2); // Show first 2 bank names
            const totalBanks = connectedBanks.length;

            if (totalBanks === 1) {
              return bankNames[0];
            } else if (totalBanks === 2) {
              return `${bankNames[0]}, ${bankNames[1]}`;
            } else if (totalBanks > 2) {
              return `${bankNames[0]}, ${bankNames[1]} +${totalBanks - 2} more`;
            }
            return `${totalBanks} ${totalBanks === 1 ? 'bank connected' : 'banks connected'}`;
          })()
        : undefined,
    },
  ];
};

const getStatusIcon = (status: Integration['status']) => {
  switch (status) {
    case 'connected':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-gray-400" />;
  }
};

const getStatusText = (status: Integration['status'], t: any) => {
  switch (status) {
    case 'connected':
      return t('integrations.connected');
    case 'error':
      return t('integrations.connectionError');
    default:
      return t('integrations.notConnected');
  }
};

const getStatusColor = (status: Integration['status']) => {
  switch (status) {
    case 'connected':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
};

const getButtonText = (
  integrationId: string,
  connectedIntegrations: ConnectedIntegration[],
  t: any
) => {
  if (integrationId === 'belvo') {
    const belvoIntegrations = connectedIntegrations.filter(int => int.status === 'connected');
    return belvoIntegrations.length > 0
      ? t('integrations.viewIntegrations')
      : t('integrations.connectAccount');
  }
  return t('integrations.connectAccount');
};

const AvailableIntegrations: React.FC<AvailableIntegrationsProps> = ({
  connectedIntegrations,
  connectingIntegration,
  belvoLoading,
  isSDKLoaded,
  onConnect,
}) => {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const integrations = getIntegrations(connectedIntegrations);

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {connectedIntegrations.length > 0
          ? t('integrations.addMoreBanks')
          : t('integrations.availableIntegrations')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map(integration => {
          const Icon = integration.icon;
          const isConnecting = connectingIntegration === integration.id;
          const isBelvoLoading = integration.id === 'belvo' && (belvoLoading || !isSDKLoaded);

          return (
            <div
              key={integration.id}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Icon className="h-12 w-12" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{integration.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(integration.status)}
                      <span className={`text-sm font-medium ${getStatusColor(integration.status)}`}>
                        {getStatusText(integration.status, t)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex-1">
                <p className="text-gray-600 text-sm mb-4">
                  {integration.description === 'connectBanksDescription'
                    ? t('integrations.connectBanksDescription')
                    : integration.description}
                </p>

                {/* Supported Countries */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    {t('integrations.supportedCountries')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {integration.supportedCountries.map((country, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>

                {integration.status === 'connected' && integration.lastSync && (
                  <div className="text-xs text-gray-500 mb-4">
                    {t('integrations.lastSync')}: {formatDateTime(integration.lastSync)}
                  </div>
                )}

                {integration.status === 'connected' && integration.accountInfo && (
                  <div className="text-xs text-gray-500 mb-4">
                    {t('integrations.connectedBanks')}: {integration.accountInfo}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-auto">
                {integration.status === 'connected' ? (
                  <button
                    onClick={() => onConnect(integration.id)}
                    disabled={isConnecting || isBelvoLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('integrations.connecting')}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>{t('integrations.connectMoreAccounts')}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => onConnect(integration.id)}
                    disabled={isConnecting || isBelvoLoading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('integrations.connecting')}</span>
                      </>
                    ) : isBelvoLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{t('integrations.loadingSDK')}</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        <span>{getButtonText(integration.id, connectedIntegrations, t)}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableIntegrations;
