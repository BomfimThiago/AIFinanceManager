import React from 'react';

interface BankLogoProps {
  integration: {
    institution_name: string;
    metadata?: {
      logo?: string;
      icon_logo?: string;
      text_logo?: string;
      primary_color?: string;
      display_name?: string;
      name?: string;
    };
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BankLogo: React.FC<BankLogoProps> = ({ integration, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  // Try different logo sources in order of preference
  const logo =
    integration.metadata?.logo ||
    integration.metadata?.icon_logo ||
    integration.metadata?.text_logo;

  const bankName =
    integration.metadata?.display_name ||
    integration.metadata?.name ||
    integration.institution_name ||
    'Bank';

  const primaryColor = integration.metadata?.primary_color || '#6B7280';

  if (logo) {
    return (
      <img
        src={logo}
        alt={`${bankName} logo`}
        className={`${sizeClasses[size]} rounded object-contain ${className}`}
        onError={e => {
          // Fallback to colored circle with initial if image fails
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
    );
  }

  // Fallback: Colored circle with bank initial
  const initial = bankName.charAt(0).toUpperCase();

  return (
    <div
      className={`${sizeClasses[size]} rounded-lg flex items-center justify-center text-white font-bold text-sm ${className}`}
      style={{ backgroundColor: primaryColor }}
    >
      {initial}
    </div>
  );
};

export default BankLogo;
