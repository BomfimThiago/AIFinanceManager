import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'h-8 w-8',
    text: 'text-xl',
    spacing: 'space-x-2',
  },
  md: {
    icon: 'h-12 w-12',
    text: 'text-2xl',
    spacing: 'space-x-3',
  },
  lg: {
    icon: 'h-16 w-16',
    text: 'text-4xl',
    spacing: 'space-x-4',
  },
  xl: {
    icon: 'h-20 w-20',
    text: 'text-5xl',
    spacing: 'space-x-5',
  },
  '2xl': {
    icon: 'h-24 w-24',
    text: 'text-6xl',
    spacing: 'space-x-6',
  },
};

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const config = sizeConfig[size];

  return (
    <div className={`flex items-center ${config.spacing} ${className}`}>
      <img 
        src="/konta-icon.svg" 
        alt="Konta" 
        className={config.icon}
      />
      <h1 className={`font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent ${config.text}`}>
        Konta
      </h1>
    </div>
  );
};

export default Logo;