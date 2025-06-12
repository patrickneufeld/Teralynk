import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const value = {
    notifications: [],
    addNotification: () => {},
    removeNotification: () => {},
    clearNotifications: () => {},
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {}
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default NotificationProvider;
