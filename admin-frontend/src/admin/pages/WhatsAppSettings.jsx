import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

/**
 * Enhanced WhatsApp Management Dashboard with QR Code Display
 * 
 * This component provides a comprehensive dashboard to manage WhatsApp automation 
 * with QR code display directly in the admin panel
 */
const WhatsAppDashboardWithQR = () => {
    const [whatsappStatus, setWhatsappStatus] = useState({
        isReady: false,
        isInitializing: false,
        queuedMessages: 0,
        hasSession: false,
        hasQRCode: false,
        qrCodeDataURL: null
    });
    const [loading, setLoading] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [testMessage, setTestMessage] = useState({
        phoneNumber: '',
        message: 'Hello from Sushant Computerized Mobile Repaire Center Admin System! This is a test message.'
    });
    const [templates, setTemplates] = useState([]);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const intervalRef = useRef(null);

    // API base URL - using existing environment variable pattern
    const API_BASE = `${import.meta.env.VITE_APIURL}/api` || 'http://localhost:3000/api';

    useEffect(() => {
        fetchWhatsAppStatus();
        fetchTemplates();
        
        // Cleanup interval on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => {
                fetchWhatsAppStatus();
            }, 3000); // Refresh every 3 seconds
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh]);

    const getAuthToken = () => {
        return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    };

    const fetchWhatsAppStatus = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setWhatsappStatus(data.status);
                
                // If QR code is available and we don't have it, fetch it
                if (data.status.hasQRCode && !data.status.qrCodeDataURL) {
                    fetchQRCode();
                }
            }
        } catch (error) {
            console.error('Error fetching WhatsApp status:', error);
        }
    };

    const fetchQRCode = async () => {
        try {
            setQrLoading(true);
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/qr-code`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success && data.qrCodeDataURL) {
                setWhatsappStatus(prev => ({
                    ...prev,
                    qrCodeDataURL: data.qrCodeDataURL
                }));
            } else if (!data.success) {
                console.log('QR Code not available:', data.message);
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
        } finally {
            setQrLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const token = getAuthToken();
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
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/initialize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp initialization started! QR code will appear below.');
                setAutoRefresh(true); // Start auto-refresh to get QR code
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
            const token = getAuthToken();
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
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp service logged out successfully');
                setAutoRefresh(false); // Stop auto-refresh
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
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/restart`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp service restart initiated');
                setAutoRefresh(true); // Start auto-refresh for new QR code
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
            return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">✅ Ready</span>;
        } else if (whatsappStatus.isInitializing) {
            return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">⏳ Initializing</span>;
        } else {
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">❌ Not Ready</span>;
        }
    };

    const downloadQRCode = () => {
        if (whatsappStatus.qrCodeDataURL) {
            const link = document.createElement('a');
            link.download = 'whatsapp-qr-code.png';
            link.href = whatsappStatus.qrCodeDataURL;
            link.click();
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-7xl mx-auto">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    📱 WhatsApp Automation Dashboard
                    <span className="ml-4 text-sm">
                        {getStatusBadge()}
                    </span>
                </h2>
                <p className="text-gray-600">
                    Manage WhatsApp integration for automated notifications with QR code authentication
                </p>
            </div>

            {/* Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">Connection Status</span>
                    </div>
                    <p className="text-lg font-semibold text-blue-900 mt-1">
                        {whatsappStatus.isReady ? '🟢 Connected' : '🔴 Disconnected'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-700">Queued Messages</span>
                    </div>
                    <p className="text-lg font-semibold text-purple-900 mt-1">
                        📬 {whatsappStatus.queuedMessages}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">Session</span>
                    </div>
                    <p className="text-lg font-semibold text-green-900 mt-1">
                        {whatsappStatus.hasSession ? '✅ Available' : '❌ None'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-orange-700">QR Code</span>
                    </div>
                    <p className="text-lg font-semibold text-orange-900 mt-1">
                        {whatsappStatus.hasQRCode ? '📱 Available' : '❌ None'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-700">Templates</span>
                    </div>
                    <p className="text-lg font-semibold text-indigo-900 mt-1">
                        📝 {templates.length}
                    </p>
                </div>
            </div>

            {/* QR Code Section */}
            {(whatsappStatus.hasQRCode || whatsappStatus.isInitializing) && !whatsappStatus.isReady && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6">
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center justify-center">
                            📱 WhatsApp QR Code Authentication
                            <label className="ml-4 flex items-center">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-600">Auto-refresh</span>
                            </label>
                        </h3>
                        
                        {qrLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                <span className="ml-3 text-gray-600">Loading QR Code...</span>
                            </div>
                        ) : whatsappStatus.qrCodeDataURL ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-blue-300">
                                    <img 
                                        src={whatsappStatus.qrCodeDataURL} 
                                        alt="WhatsApp QR Code" 
                                        className="w-64 h-64 object-contain"
                                    />
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600 mb-3">
                                        📱 <strong>Instructions:</strong>
                                    </p>
                                    <ol className="text-sm text-gray-700 space-y-1 max-w-md mx-auto">
                                        <li>1️⃣ Open WhatsApp on your phone</li>
                                        <li>2️⃣ Go to <strong>Settings → Linked Devices</strong></li>
                                        <li>3️⃣ Tap <strong>"Link a Device"</strong></li>
                                        <li>4️⃣ Scan the QR code above</li>
                                    </ol>
                                    <div className="flex gap-3 justify-center mt-4">
                                        <button
                                            onClick={downloadQRCode}
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-medium"
                                        >
                                            💾 Download QR
                                        </button>
                                        <button
                                            onClick={fetchQRCode}
                                            disabled={qrLoading}
                                            className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm font-medium"
                                        >
                                            🔄 Refresh QR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : whatsappStatus.isInitializing ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-pulse text-center">
                                    <div className="w-64 h-64 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                                    <p className="text-gray-600">⏳ Generating QR Code...</p>
                                    <p className="text-sm text-gray-500 mt-2">Please wait while we initialize WhatsApp Web</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-600 mb-4">📱 QR Code not yet available</p>
                                <button
                                    onClick={fetchQRCode}
                                    disabled={qrLoading || loading}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                                >
                                    {qrLoading ? 'Loading...' : '🔄 Get QR Code'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Success Message */}
            {whatsappStatus.isReady && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <div className="text-green-600 text-2xl mr-3">🎉</div>
                        <div>
                            <h3 className="text-lg font-semibold text-green-800">WhatsApp Connected Successfully!</h3>
                            <p className="text-green-700">Your WhatsApp is now ready to send automated notifications.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
                <button
                    onClick={initializeWhatsApp}
                    disabled={loading || whatsappStatus.isReady}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium flex items-center"
                >
                    {loading ? '⏳ Initializing...' : '🚀 Initialize WhatsApp'}
                </button>

                <button
                    onClick={fetchWhatsAppStatus}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    🔄 Refresh Status
                </button>

                <button
                    onClick={restartWhatsApp}
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    🔄 Restart Service
                </button>

                <button
                    onClick={logoutWhatsApp}
                    disabled={loading || !whatsappStatus.isReady}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    🚪 Logout WhatsApp
                </button>
            </div>

            {/* Test Message Section */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    📨 Send Test Message
                    {!whatsappStatus.isReady && (
                        <span className="ml-2 text-sm text-red-600">(WhatsApp must be connected first)</span>
                    )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number (International format)
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
                    disabled={loading || !whatsappStatus.isReady || !testMessage.phoneNumber || !testMessage.message}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                >
                    {loading ? '📤 Sending...' : '📤 Send Test Message'}
                </button>
            </div>

            {/* Templates Section */}
            <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📝 Available Message Templates
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map((template) => (
                        <div key={template} className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
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
                    💡 Setup Instructions
                </h3>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                        <li>Click "🚀 Initialize WhatsApp" to start the service</li>
                        <li>Wait for the QR code to appear in the section above</li>
                        <li>Scan the QR code with your WhatsApp mobile app (Settings → Linked Devices → Link a Device)</li>
                        <li>Once connected, the status will show "✅ Ready"</li>
                        <li>Test the connection by sending a test message to your phone</li>
                        <li>WhatsApp notifications will be sent automatically when enabled in your notification settings</li>
                    </ol>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg mt-4 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        <strong>⚠️ Important:</strong> This uses your personal WhatsApp account. 
                        Use responsibly and follow WhatsApp's terms of service. 
                        Not suitable for large-scale commercial messaging.
                        Keep this page open during initial setup to see the QR code.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppDashboardWithQR;
