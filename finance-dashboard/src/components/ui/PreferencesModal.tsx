import React, { useEffect, useState } from 'react';

import { Check, DollarSign, Globe, X } from 'lucide-react';

import { useUserPreferencesContext } from '../../contexts/UserPreferencesContext';
import { useTranslation } from '../../contexts/LanguageContext';
import { UserPreferencesUpdate } from '../../services/apiService';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
  const { preferences, availableCurrencies, availableLanguages, isLoading, updatePreferences } =
    useUserPreferencesContext();
  const { t } = useTranslation();

  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form values when preferences load
  useEffect(() => {
    if (preferences) {
      setSelectedCurrency(preferences.default_currency);
      setSelectedLanguage(preferences.language);
    }
  }, [preferences]);

  // Track if there are unsaved changes
  useEffect(() => {
    if (preferences) {
      const changed =
        selectedCurrency !== preferences.default_currency ||
        selectedLanguage !== preferences.language;
      setHasChanges(changed);
    }
  }, [selectedCurrency, selectedLanguage, preferences]);

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const updates: UserPreferencesUpdate = {};

      if (selectedCurrency !== preferences?.default_currency) {
        updates.default_currency = selectedCurrency as 'USD' | 'EUR' | 'BRL';
      }

      if (selectedLanguage !== preferences?.language) {
        updates.language = selectedLanguage as 'en' | 'es' | 'pt';
      }

      await updatePreferences(updates);
      onClose();
    } catch (error) {
      // Error is already handled in the context
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (preferences) {
      setSelectedCurrency(preferences.default_currency);
      setSelectedLanguage(preferences.language);
    }
    onClose();
  };

  if (!isOpen) return null;

  const getCurrencyFlag = (currency: string) => {
    switch (currency) {
      case 'USD':
        return '🇺🇸';
      case 'EUR':
        return '🇪🇺';
      case 'BRL':
        return '🇧🇷';
      default:
        return '🏳️';
    }
  };

  const getCurrencyName = (currency: string) => {
    switch (currency) {
      case 'USD':
        return t('preferences.usDollar');
      case 'EUR':
        return t('preferences.euro');
      case 'BRL':
        return t('preferences.brazilianReal');
      default:
        return currency;
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en':
        return t('preferences.english');
      case 'es':
        return t('preferences.spanish');
      case 'pt':
        return t('preferences.portuguese');
      default:
        return code;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('preferences.title')}</h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Currency Selection */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t('preferences.defaultCurrency')}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {t('preferences.defaultCurrencyHelp')}
                </p>
                <div className="space-y-2">
                  {availableCurrencies.map(currency => (
                    <button
                      key={currency}
                      onClick={() => setSelectedCurrency(currency)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        selectedCurrency === currency
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xl">{getCurrencyFlag(currency)}</span>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 text-sm">{currency}</div>
                          <div className="text-xs text-gray-500">{getCurrencyName(currency)}</div>
                        </div>
                      </div>
                      {selectedCurrency === currency && <Check className="h-5 w-5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 mr-2" />
                  {t('preferences.defaultLanguage')}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {t('preferences.defaultLanguageHelp')}
                </p>
                <div className="space-y-2">
                  {availableLanguages.map(language => (
                    <button
                      key={language.code}
                      onClick={() => setSelectedLanguage(language.code)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                        selectedLanguage === language.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">{getLanguageName(language.code)}</div>
                        <div className="text-xs text-gray-500">{language.native_label}</div>
                      </div>
                      {selectedLanguage === language.code && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isSaving}
          >
            {t('preferences.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{t('preferences.saving')}</span>
              </>
            ) : (
              <span>{t('preferences.saveChanges')}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
