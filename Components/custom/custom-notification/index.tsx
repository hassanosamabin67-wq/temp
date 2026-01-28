'use client'
import React, { createContext, useContext, ReactNode } from 'react';
import { notification, NotificationArgsProps } from 'antd';

type NotificationContextType = {
  notify: (args: NotificationArgsProps) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  const notificationKey = 'globalNotification';
  const notify = (args: NotificationArgsProps) => {
    api.destroy(notificationKey);

    api.open({
      ...args,
      key: notificationKey,
    });
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};
