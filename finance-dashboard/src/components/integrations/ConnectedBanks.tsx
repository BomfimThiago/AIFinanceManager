import React from 'react';
import { CheckCircle, ExternalLink, Settings } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import type { ConnectedIntegration } from '../../hooks/useIntegrations';

interface ConnectedBanksProps {
  integrations: ConnectedIntegration[];
  onGetTransactions: (integrationId: number) => void;
  onShowSettings: () => void;
}

const ConnectedBanks: React.FC<ConnectedBanksProps> = ({
  integrations,
  onGetTransactions,
  onShowSettings
}) => {
  const { t } = useTranslation();
  
  if (integrations.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('integrations.yourConnectedBanks')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => {
          const bankName = integration.metadata?.display_name || 
                         integration.metadata?.institution?.display_name ||
                         integration.institution_name || 'Unknown Bank';
          const logo = integration.metadata?.logo || 
                      integration.metadata?.icon_logo || 
                      integration.metadata?.institution?.icon_logo;
          const primaryColor = integration.metadata?.primary_color || 
                             integration.metadata?.institution?.primary_color || '#056dae';
          const countryCode = integration.metadata?.country_code || 'BR';
          const countryFlag = countryCode === 'BR' ? '🇧🇷' : countryCode === 'MX' ? '🇲🇽' : '🌎';
          
          return (
            <div 
              key={integration.id} 
              className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3 mb-3">
                {logo ? (
                  <img
                    src={logo}
                    alt={`${bankName} logo`}
                    className="h-10 w-10 rounded-lg object-contain border border-gray-200 bg-white p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${!logo ? '' : 'hidden'}`}
                  style={{ backgroundColor: primaryColor }}
                >
                  {bankName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{bankName}</h4>
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{countryFlag} {countryCode}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {integration.last_sync 
                        ? `${t('integrations.synced')} ${new Date(integration.last_sync).toLocaleDateString()}`
                        : t('integrations.neverSynced')
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => onGetTransactions(integration.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>{t('integrations.sync')}</span>
                </button>
                <button
                  onClick={onShowSettings}
                  className="px-3 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-colors text-xs"
                >
                  <Settings className="h-3 w-3" />
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