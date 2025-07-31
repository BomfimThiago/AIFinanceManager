import React, { createContext, useContext } from 'react';

import NotificationContainer from '../components/ui/NotificationContainer';
import { NotificationData, NotificationType } from '../components/ui/NotificationToast';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      duration?: number;
      actions?: NotificationData['actions'];
    }
  ) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showSuccess: (
    title: string,
    message: string,
    options?: { duration?: number; actions?: NotificationData['actions'] }
  ) => string;
  showError: (
    title: string,
    message: string,
    options?: { actions?: NotificationData['actions'] }
  ) => string;
  showWarning: (
    title: string,
    message: string,
    options?: { duration?: number; actions?: NotificationData['actions'] }
  ) => string;
  showInfo: (
    title: string,
    message: string,
    options?: { duration?: number; actions?: NotificationData['actions'] }
  ) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationMethods = useNotifications();

  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
      <NotificationContainer
        notifications={notificationMethods.notifications}
        onDismiss={notificationMethods.removeNotification}
      />
    </NotificationContext.Provider>
  );
};
