import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Component that adds a smooth transition effect when language is changing
 * to prevent the flickering of translation keys.
 */
export const LanguageTransition: React.FC<LanguageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  const { isChangingLanguage } = useLanguage();

  return (
    <div
      className={`transition-opacity duration-200 ${
        isChangingLanguage ? 'opacity-75' : 'opacity-100'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default LanguageTransition;