import { useState } from 'react';

export const usePrivacyMode = () => {
  const [hideAmounts, setHideAmounts] = useState(false);

  const togglePrivacyMode = () => {
    setHideAmounts(prev => !prev);
  };

  return {
    hideAmounts,
    togglePrivacyMode,
  };
};
