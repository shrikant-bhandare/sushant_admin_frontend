import React, { useState } from 'react';
import { toast } from 'react-toastify';

const NotificationTestPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Test Notification',
    message: 'This is a test notification message',
    type: 'general',
    priority: 'normal',
    targetRoles: ['admin'],
    requiresAction: false,
    actionUrl: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Notification sent successfully!');
        console.log('Notification sent:', data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'targetRoles') {
      const roles = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({ ...prev, [name]: roles }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const quickTests = [
    {
      title: 'Sale Order Created',
      message: 'New sale order TC-10001 has been created for customer John Doe',
      type: 'sale_order_created',
      priority: 'normal',
      requiresAction: true,
      actionUrl: '/sale-orders/123'
    },
    {
      title: 'Task Assigned',
      message: 'A new repair task has been assigned to you for iPhone 14',
      type: 'task_assigned',
      priority: 'high',
      requiresAction: true,
      actionUrl: '/tasks/456'
    },
    {
      title: 'Inventory Alert',
      message: 'iPhone 14 screen protectors are running low (only 5 left)',
      type: 'inventory_low',
      priority: 'urgent',
      requiresAction: true,
      actionUrl: '/inventory'
    },
    {
      title: 'System Maintenance',
      message: 'System maintenance scheduled for tonight at 2 AM',
      type: 'system_alert',
      priority: 'normal',
      requiresAction: false,
      actionUrl: ''
    }
  ];

  const sendQuickTest = async (testData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...testData,
          targetRoles: ['admin', 'manager']
        })
      });

      if (response.ok) {
        toast.success(`${testData.title} notification sent!`);
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      toast.error('Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔔 Notification Test Center</h1>
      
      {/* Quick Tests */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickTests.map((test, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{test.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{test.message}</p>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    test.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    test.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {test.priority}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                    {test.type.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => sendQuickTest(test)}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Notification Form */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Custom Notification</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="sale_order_created">Sale Order Created</option>
                <option value="task_assigned">Task Assigned</option>
                <option value="task_completed">Task Completed</option>
                <option value="ticket_created">Ticket Created</option>
                <option value="inventory_low">Inventory Low</option>
                <option value="system_alert">System Alert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Roles
            </label>
            <select
              name="targetRoles"
              multiple
              value={formData.targetRoles}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              size={4}
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="technician">Technician</option>
              <option value="support">Support</option>
              <option value="all">All Users</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple roles</p>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiresAction"
                checked={formData.requiresAction}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Requires Action</span>
            </label>
          </div>

          {formData.requiresAction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action URL
              </label>
              <input
                type="text"
                name="actionUrl"
                value={formData.actionUrl}
                onChange={handleChange}
                placeholder="/sale-orders/123 or https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Custom Notification'}
          </button>
        </form>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Watch the notification bell icon in the top-right corner</li>
          <li>• Notifications will appear as toast messages</li>
          <li>• Click the bell to see the notification dropdown</li>
          <li>• Browser notifications may require permission</li>
          <li>• Make sure you're logged in to send notifications</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTestPage;
