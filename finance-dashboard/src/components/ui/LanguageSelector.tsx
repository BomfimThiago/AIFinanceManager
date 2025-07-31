import React, { useEffect, useRef, useState } from 'react';

import { Check, ChevronDown, Globe } from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';

interface Language {
  code: string;
  label: string;
  native_label: string;
  flag: string;
}

const LanguageSelector: React.FC = () => {
  const { sessionLanguage, setSessionLanguage, availableLanguages, isLoading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Map language codes to flags and native names
  const languageDetails: Record<string, { native_label: string; flag: string }> = {
    en: { native_label: 'English', flag: '🇺🇸' },
    es: { native_label: 'Español', flag: '🇪🇸' },
    pt: { native_label: 'Português', flag: '🇧🇷' },
  };

  // Build languages array from available languages
  const languages: Language[] = Object.keys(availableLanguages).map(code => ({
    code,
    label: availableLanguages[code],
    native_label: languageDetails[code]?.native_label || availableLanguages[code],
    flag: languageDetails[code]?.flag || '🌐',
  }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLanguage = languages.find(lang => lang.code === sessionLanguage) || languages[0];

  if (isLoading || !selectedLanguage) {
    return (
      <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm">
        <Globe className="h-3 w-3 text-gray-400" />
        <span className="font-medium text-gray-400 text-sm">...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        title="Change language (session only)"
      >
        <span className="text-sm">{selectedLanguage.flag}</span>
        <span className="font-medium text-gray-700 text-sm">
          {selectedLanguage.code.toUpperCase()}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {languages.map(language => {
              const isSelected = language.code === sessionLanguage;

              return (
                <button
                  key={language.code}
                  onClick={() => {
                    setSessionLanguage(language.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{language.flag}</span>
                    <div>
                      <div className="font-medium text-gray-900">{language.code.toUpperCase()}</div>
                      <div className="text-sm text-gray-500">{language.native_label}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                </button>
              );
            })}
          </div>

          {/* Helper text */}
          <div className="border-t border-gray-100 px-4 py-2">
            <div className="text-xs text-gray-500">
              <Globe className="h-3 w-3 inline mr-1" />
              Session only. Change default in preferences.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
