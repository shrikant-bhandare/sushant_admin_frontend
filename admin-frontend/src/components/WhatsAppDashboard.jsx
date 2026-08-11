import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * WhatsApp Management Component for Sushant Computerized Mobile Repaire Center Admin
 * 
 * This component provides a dashboard to manage WhatsApp automation features
 */
const WhatsAppDashboard = () => {
    const [whatsappStatus, setWhatsappStatus] = useState({
        isReady: false,
        isInitializing: false,
        queuedMessages: 0,
        hasSession: false
    });
    const [loading, setLoading] = useState(false);
    const [testMessage, setTestMessage] = useState({
        phoneNumber: '',
        message: 'Hello from Sushant Computerized Mobile Repaire Center Admin System! This is a test message.'
    });
    const [templates, setTemplates] = useState([]);

    // API base URL - using existing environment variable pattern
    const API_BASE = `${import.meta.env.VITE_APIURL}/api` || 'http://localhost:3000/api';

    useEffect(() => {
        fetchWhatsAppStatus();
        fetchTemplates();
    }, []);

    const fetchWhatsAppStatus = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE}/whatsapp/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setWhatsappStatus(data.status);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp status:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE}/whatsapp/templates`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const initializeWhatsApp = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE}/whatsapp/initialize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp initialization started! Check console for QR code.');
                fetchWhatsAppStatus();
            } else {
                toast.error(data.message || 'Failed to initialize WhatsApp');
            }
        } catch (error) {
            console.error('Error initializing WhatsApp:', error);
            toast.error('Error initializing WhatsApp service');
        } finally {
            setLoading(false);
        }
    };

    const sendTestMessage = async () => {
        if (!testMessage.phoneNumber || !testMessage.message) {
            toast.error('Please enter phone number and message');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE}/whatsapp/send-test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testMessage)
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('Test message sent successfully!');
                setTestMessage(prev => ({ ...prev, phoneNumber: '' }));
            } else {
                toast.error(data.message || 'Failed to send test message');
            }
        } catch (error) {
            console.error('Error sending test message:', error);
            toast.error('Error sending test message');
        } finally {
            setLoading(false);
        }
    };

    const logoutWhatsApp = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE}/whatsapp/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp service logged out successfully');
                fetchWhatsAppStatus();
            } else {
                toast.error(data.message || 'Failed to logout WhatsApp');
            }
        } catch (error) {
            console.error('Error logging out WhatsApp:', error);
            toast.error('Error logging out WhatsApp service');
        } finally {
            setLoading(false);
        }
    };

    const restartWhatsApp = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${API_BASE}/whatsapp/restart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp service restart initiated');
                fetchWhatsAppStatus();
            } else {
                toast.error(data.message || 'Failed to restart WhatsApp');
            }
        } catch (error) {
            console.error('Error restarting WhatsApp:', error);
            toast.error('Error restarting WhatsApp service');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = () => {
        if (whatsappStatus.isReady) {
            return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Ready</span>;
        } else if (whatsappStatus.isInitializing) {
            return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Initializing</span>;
        } else {
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Not Ready</span>;
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    📱 WhatsApp Automation Dashboard
                </h2>
                <p className="text-gray-600">
                    Manage WhatsApp integration for automated notifications
                </p>
            </div>

            {/* Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Status</span>
                        {getStatusBadge()}
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                        {whatsappStatus.isReady ? 'Connected' : 'Disconnected'}
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Queued Messages</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                        {whatsappStatus.queuedMessages}
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Session</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                        {whatsappStatus.hasSession ? 'Available' : 'None'}
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Templates</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                        {templates.length}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={initializeWhatsApp}
                    disabled={loading || whatsappStatus.isReady}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    {loading ? 'Initializing...' : 'Initialize WhatsApp'}
                </button>

                <button
                    onClick={fetchWhatsAppStatus}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    Refresh Status
                </button>

                <button
                    onClick={restartWhatsApp}
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    Restart Service
                </button>

                <button
                    onClick={logoutWhatsApp}
                    disabled={loading || !whatsappStatus.isReady}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    Logout WhatsApp
                </button>
            </div>

            {/* Test Message Section */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📨 Send Test Message
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            value={testMessage.phoneNumber}
                            onChange={(e) => setTestMessage(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            placeholder="+1234567890"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Message
                        </label>
                        <input
                            type="text"
                            value={testMessage.message}
                            onChange={(e) => setTestMessage(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Enter your test message"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <button
                    onClick={sendTestMessage}
                    disabled={loading || !whatsappStatus.isReady}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    {loading ? 'Sending...' : 'Send Test Message'}
                </button>
            </div>

            {/* Templates Section */}
            <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📝 Available Message Templates
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map((template) => (
                        <div key={template} className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-sm font-medium text-gray-700">
                                {template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Instructions */}
            <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💡 Instructions
                </h3>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Click "Initialize WhatsApp" to start the service</li>
                        <li>Scan the QR code that appears in the server console with your WhatsApp mobile app</li>
                        <li>Once connected, the status will show "Ready"</li>
                        <li>Test the connection by sending a test message to your phone</li>
                        <li>WhatsApp notifications will be sent automatically when enabled in your notification settings</li>
                    </ol>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Important:</strong> This uses your personal WhatsApp account. 
                        Use responsibly and follow WhatsApp's terms of service. 
                        Not suitable for large-scale commercial messaging.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppDashboard;
