import React from 'react';
import NotificationCenter from './notifications/NotificationCenter';
import { useSocket, useSocketEvent } from '../customHooks/useSocket';

const HeaderWithNotifications = ({ userData }) => {
  const { isConnected, unreadCount } = useSocket(userData);

  // Example of listening to specific socket events
  useSocketEvent('sale_order_created', (notification) => {
    console.log('New sale order created:', notification);
    // You can add custom logic here for specific events
  });

  useSocketEvent('task_assigned', (notification) => {
    console.log('Task assigned:', notification);
    // Custom logic for task assignments
  });

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Sushant Computerized Mobile Repaire Center Admin</h1>
      </div>
      
      <div className="header-right">
        <div className="connection-status">
          {isConnected ? (
            <span className="status-connected">🟢 Connected</span>
          ) : (
            <span className="status-disconnected">🔴 Disconnected</span>
          )}
        </div>
        
        <NotificationCenter userData={userData} />
        
        {/* User profile or other header items */}
        <div className="user-profile">
          <span>{userData?.userName || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default HeaderWithNotifications;
