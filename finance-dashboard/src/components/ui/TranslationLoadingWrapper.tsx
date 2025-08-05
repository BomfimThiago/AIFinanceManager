import React from 'react';

import { Loader2 } from 'lucide-react';

import { useLanguage } from '../../contexts/LanguageContext';

interface TranslationLoadingWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that shows a loading screen until translations are loaded.
 * This prevents the flickering of translation keys during initial load.
 */
export const TranslationLoadingWrapper: React.FC<TranslationLoadingWrapperProps> = ({
  children,
}) => {
  const { isLoading } = useLanguage();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TranslationLoadingWrapper;
