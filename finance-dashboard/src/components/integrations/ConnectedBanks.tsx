import React from 'react';

import { AlertCircle, Calendar, CheckCircle, Clock, Globe, Settings, Trash2 } from 'lucide-react';

import { useTranslation } from '../../contexts/LanguageContext';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import type { ConnectedIntegration } from '../../hooks/useIntegrations';

interface ConnectedBanksProps {
  integrations: ConnectedIntegration[];
  onDelete: (integrationId: number) => void;
}

const ConnectedBanks: React.FC<ConnectedBanksProps> = ({ integrations, onDelete }) => {
  const { t } = useTranslation();
  const { formatShortDate } = useDateFormatter();

  if (integrations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('integrations.yourConnectedBanks')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => {
          const bankName =
            integration.metadata?.display_name ||
            integration.metadata?.institution?.display_name ||
            integration.institution_name ||
            'Unknown Bank';
          const logo =
            integration.metadata?.logo ||
            integration.metadata?.icon_logo ||
            integration.metadata?.institution?.icon_logo;
          const primaryColor =
            integration.metadata?.primary_color ||
            integration.metadata?.institution?.primary_color ||
            '#056dae';
          const countryCode = integration.metadata?.country_code || 'BR';
          const countryFlag = countryCode === 'BR' ? '🇧🇷' : countryCode === 'MX' ? '🇲🇽' : '🌎';

          // Get status icon and color based on integration status
          const getStatusIcon = () => {
            switch (integration.status) {
              case 'connected':
                return <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />;
              case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500 flex-shrink-0" />;
              case 'error':
              case 'expired':
                return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;
              default:
                return <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />;
            }
          };

          const getStatusText = () => {
            switch (integration.status) {
              case 'connected':
                return t('integrations.connected');
              case 'pending':
                return t('integrations.connecting');
              case 'error':
                return t('integrations.error');
              case 'expired':
                return t('integrations.expired');
              default:
                return integration.status;
            }
          };

          return (
            <div
              key={integration.id}
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: primaryColor,
                backgroundColor: `${primaryColor}08`, // Very subtle background tint (5% opacity)
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                {logo ? (
                  <div
                    className="h-16 w-16 bg-contain bg-center bg-no-repeat flex-shrink-0"
                    style={{ backgroundImage: `url(${logo})` }}
                    role="img"
                    aria-label={`${bankName} logo`}
                  />
                ) : (
                  <div
                    className="h-16 w-16 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {bankName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{bankName}</h4>
                    {getStatusIcon()}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">
                      {countryFlag} {countryCode}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{getStatusText()}</span>
                    {integration.status === 'connected' && integration.last_sync && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {t('integrations.synced')} {formatShortDate(integration.last_sync)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Integration Details */}
              <div className="space-y-2 mb-3 text-xs text-gray-600">
                {integration.created_at && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span>
                      {t('integrations.connectedOn')}: {formatShortDate(integration.created_at)}
                    </span>
                  </div>
                )}
                {integration.last_sync && integration.status === 'connected' && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>
                      {t('integrations.lastSync')}: {formatShortDate(integration.last_sync)}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => onDelete(integration.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-xs flex items-center space-x-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>{t('integrations.disconnect')}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectedBanks;
