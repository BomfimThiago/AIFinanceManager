import { useCallback, useState } from 'react';

import { NotificationData, NotificationType } from '../components/ui/NotificationToast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      options?: {
        duration?: number;
        actions?: NotificationData['actions'];
      }
    ) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const notification: NotificationData = {
        id,
        type,
        title,
        message,
        duration: options?.duration ?? (type === 'error' ? 0 : 5000), // Errors don't auto-dismiss
        actions: options?.actions,
      };

      setNotifications(prev => [...prev, notification]);
      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback(
    (
      title: string,
      message: string,
      options?: { duration?: number; actions?: NotificationData['actions'] }
    ) => {
      return addNotification('success', title, message, options);
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message: string, options?: { actions?: NotificationData['actions'] }) => {
      return addNotification('error', title, message, { duration: 0, ...options });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (
      title: string,
      message: string,
      options?: { duration?: number; actions?: NotificationData['actions'] }
    ) => {
      return addNotification('warning', title, message, options);
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (
      title: string,
      message: string,
      options?: { duration?: number; actions?: NotificationData['actions'] }
    ) => {
      return addNotification('info', title, message, options);
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
