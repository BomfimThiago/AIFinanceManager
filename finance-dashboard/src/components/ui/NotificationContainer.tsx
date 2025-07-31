import React from 'react';

import NotificationToast, { NotificationData } from './NotificationToast';

interface NotificationContainerProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onDismiss,
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
