import React from 'react';

import { useAppNotifications } from '../../hooks/useAppNotifications';
import type { NotificationState } from '../../store/AppStateManager';
import NotificationToast, { NotificationData } from './NotificationToast';

interface NotificationContainerProps {
  notifications?: NotificationData[] | NotificationState[];
  onDismiss?: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications: propNotifications,
  onDismiss: propOnDismiss,
}) => {
  // Use global notifications if no props provided (new architecture)
  const { notifications: globalNotifications, removeNotification } = useAppNotifications();

  const notifications = propNotifications || globalNotifications;
  const onDismiss = propOnDismiss || removeNotification;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification as NotificationData}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
