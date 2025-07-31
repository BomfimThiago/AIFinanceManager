import React, { useEffect, useState } from 'react';

import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // Auto-dismiss duration in ms (0 for no auto-dismiss)
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface NotificationToastProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true);

    // Auto-dismiss timer
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Match exit animation duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStyles = () => {
    const baseStyles = 'border-l-4 shadow-lg';

    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-500`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-500`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-500`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-500`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-500`;
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-4 max-w-md w-full
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getStyles()}
        rounded-lg p-4
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>

        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">{notification.title}</h3>
          <div className="mt-1 text-sm text-gray-700">{notification.message}</div>

          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    text-xs font-medium px-3 py-1.5 rounded-md transition-colors
                    ${
                      action.variant === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
