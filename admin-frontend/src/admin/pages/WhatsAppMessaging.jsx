import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

/**
 * Complete WhatsApp Management Dashboard with Messaging Interface
 * 
 * This component provides a comprehensive WhatsApp management system including:
 * - QR code authentication
 * - Real-time messaging interface
 * - Received messages history
 * - Sent messages tracking
 * - Contact management
 * - Conversation view
 */
const WhatsAppMessagingDashboard = () => {
    const [whatsappStatus, setWhatsappStatus] = useState({
        isReady: false,
        isInitializing: false,
        queuedMessages: 0,
        hasSession: false,
        hasQRCode: false,
        qrCodeDataURL: null,
        receivedCount: 0,
        sentCount: 0,
        contactsCount: 0
    });
    
    const [activeTab, setActiveTab] = useState('status');
    const [loading, setLoading] = useState(false);
    const [qrLoading, setQrLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    
    // Messaging data
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [sentMessages, setSentMessages] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [conversation, setConversation] = useState([]);
    
    // New message form
    const [newMessage, setNewMessage] = useState({
        phoneNumber: '',
        message: '',
        template: 'general'
    });
    
    const [templates, setTemplates] = useState([]);
    const intervalRef = useRef(null);

    // API base URL - using existing environment variable pattern
    const API_BASE = `${import.meta.env.VITE_APIURL}/api` || 'http://localhost:3000/api';

    useEffect(() => {
        fetchWhatsAppStatus();
        fetchTemplates();
        
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
                if (whatsappStatus.isReady) {
                    fetchReceivedMessages();
                    fetchContacts();
                }
            }, 5000); // Refresh every 5 seconds
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
    }, [autoRefresh, whatsappStatus.isReady]);

    // Fetch data when WhatsApp becomes ready
    useEffect(() => {
        if (whatsappStatus.isReady) {
            fetchReceivedMessages();
            fetchSentMessages();
            fetchContacts();
        }
    }, [whatsappStatus.isReady]);

    const getAuthToken = () => {
        return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    };

    const handleAuthError = (response) => {
        if (response.status === 401) {
            // Clear invalid tokens
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            // Redirect to login
            window.location.href = '/admin/login';
            return true;
        }
        return false;
    };

    const fetchWhatsAppStatus = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (handleAuthError(response)) return;

            const data = await response.json();
            
            if (data.success) {
                setWhatsappStatus(data.status);
                
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
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (handleAuthError(response)) return;
            const data = await response.json();
            
            if (data.success && data.qrCodeDataURL) {
                setWhatsappStatus(prev => ({
                    ...prev,
                    qrCodeDataURL: data.qrCodeDataURL
                }));
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
        } finally {
            setQrLoading(false);
        }
    };

    const fetchReceivedMessages = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/messages/received?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setReceivedMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching received messages:', error);
        }
    };

    const fetchSentMessages = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/messages/sent?limit=50`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setSentMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching sent messages:', error);
        }
    };

    const fetchContacts = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/contacts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };

    const fetchConversation = async (phoneNumber) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/conversation/${encodeURIComponent(phoneNumber)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setConversation(data.conversation);
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE}/whatsapp/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
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

            if (handleAuthError(response)) return;

            const data = await response.json();
            
            if (data.success) {
                toast.success('WhatsApp initialization started!');
                setActiveTab('status'); // Switch to status tab
                setAutoRefresh(true);
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

    const sendMessage = async () => {
        if (!newMessage.phoneNumber || !newMessage.message) {
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
                body: JSON.stringify({
                    phoneNumber: newMessage.phoneNumber,
                    message: newMessage.message
                })
            });
            const data = await response.json();
            
            if (data.success) {
                toast.success('Message sent successfully!');
                setNewMessage(prev => ({ ...prev, phoneNumber: '', message: '' }));
                
                // Refresh sent messages
                setTimeout(() => {
                    fetchSentMessages();
                }, 1000);
            } else {
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Error sending message');
        } finally {
            setLoading(false);
        }
    };

    const selectContact = (contact) => {
        setSelectedContact(contact);
        fetchConversation(contact.number);
        setActiveTab('conversation');
    };

    const getStatusBadge = () => {
        if (whatsappStatus.isReady) {
            return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">✅ Connected</span>;
        } else if (whatsappStatus.isInitializing) {
            return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">⏳ Initializing</span>;
        } else {
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">❌ Disconnected</span>;
        }
    };

    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const truncateMessage = (message, length = 100) => {
        return message.length > length ? message.substring(0, length) + '...' : message;
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    📱 WhatsApp Messaging Dashboard
                    <span className="ml-4 text-sm">{getStatusBadge()}</span>
                </h2>
                <p className="text-gray-600">
                    Complete WhatsApp management with messaging capabilities
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-700">Status</span>
                    <p className="text-lg font-semibold text-blue-900 mt-1">
                        {whatsappStatus.isReady ? '🟢 Ready' : '🔴 Not Ready'}
                    </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <span className="text-sm font-medium text-green-700">Received</span>
                    <p className="text-lg font-semibold text-green-900 mt-1">
                        📨 {whatsappStatus.receivedCount}
                    </p>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <span className="text-sm font-medium text-purple-700">Sent</span>
                    <p className="text-lg font-semibold text-purple-900 mt-1">
                        📤 {whatsappStatus.sentCount}
                    </p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <span className="text-sm font-medium text-orange-700">Contacts</span>
                    <p className="text-lg font-semibold text-orange-900 mt-1">
                        👥 {whatsappStatus.contactsCount}
                    </p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                    <span className="text-sm font-medium text-indigo-700">Queued</span>
                    <p className="text-lg font-semibold text-indigo-900 mt-1">
                        ⏳ {whatsappStatus.queuedMessages}
                    </p>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-center text-sm">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="mr-2"
                        />
                        Auto-refresh
                    </label>
                </div>
            </div>

            {/* Action Buttons */}
            {!whatsappStatus.isReady && (
                <div className="flex flex-wrap gap-3 mb-6">
                    <button
                        onClick={initializeWhatsApp}
                        disabled={loading || whatsappStatus.isReady}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
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
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'status', label: '📊 Status & Setup', show: true },
                        { id: 'send', label: '📤 Send Message', show: whatsappStatus.isReady },
                        { id: 'received', label: '📨 Received Messages', show: whatsappStatus.isReady },
                        { id: 'sent', label: '📋 Sent Messages', show: whatsappStatus.isReady },
                        { id: 'contacts', label: '👥 Contacts', show: whatsappStatus.isReady },
                        { id: 'conversation', label: '💬 Conversation', show: whatsappStatus.isReady && selectedContact }
                    ].filter(tab => tab.show).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Status & Setup Tab */}
                {activeTab === 'status' && (
                    <div>
                        {/* QR Code Section */}
                        {(whatsappStatus.hasQRCode || whatsappStatus.isInitializing) && !whatsappStatus.isReady && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                                    📱 WhatsApp QR Code Authentication
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
                                                📱 <strong>Scan with WhatsApp:</strong>
                                            </p>
                                            <ol className="text-sm text-gray-700 space-y-1 max-w-md mx-auto">
                                                <li>1️⃣ Open WhatsApp on your phone</li>
                                                <li>2️⃣ Settings → Linked Devices → Link a Device</li>
                                                <li>3️⃣ Scan the QR code above</li>
                                            </ol>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600 mb-4">📱 Generating QR Code...</p>
                                        <div className="animate-pulse w-64 h-64 bg-gray-200 rounded-lg mx-auto"></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Success Message */}
                        {whatsappStatus.isReady && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                                <div className="flex items-center">
                                    <div className="text-green-600 text-3xl mr-4">🎉</div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-green-800">WhatsApp Connected Successfully!</h3>
                                        <p className="text-green-700 mt-2">
                                            Your WhatsApp is ready for messaging. You can now:
                                        </p>
                                        <ul className="text-green-700 mt-2 space-y-1">
                                            <li>• 📤 Send messages to any contact</li>
                                            <li>• 📨 View received messages in real-time</li>
                                            <li>• 👥 Manage your contacts</li>
                                            <li>• 💬 View conversation history</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Send Message Tab */}
                {activeTab === 'send' && (
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-xl font-semibold text-gray-900 mb-6">📤 Send WhatsApp Message</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number (International format)
                                </label>
                                <input
                                    type="tel"
                                    value={newMessage.phoneNumber}
                                    onChange={(e) => setNewMessage(prev => ({ ...prev, phoneNumber: e.target.value }))}
                                    placeholder="+1234567890"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message Template
                                </label>
                                <select
                                    value={newMessage.template}
                                    onChange={(e) => setNewMessage(prev => ({ ...prev, template: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {templates.map(template => (
                                        <option key={template} value={template}>
                                            {template.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message Content
                                </label>
                                <textarea
                                    value={newMessage.message}
                                    onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Enter your message here..."
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <button
                                onClick={sendMessage}
                                disabled={loading || !newMessage.phoneNumber || !newMessage.message}
                                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-medium text-lg"
                            >
                                {loading ? '📤 Sending...' : '📤 Send Message'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Received Messages Tab */}
                {activeTab === 'received' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">📨 Received Messages ({receivedMessages.length})</h3>
                            <button
                                onClick={fetchReceivedMessages}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {receivedMessages.length > 0 ? (
                                receivedMessages.map((message, index) => (
                                    <div key={message.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-900">{message.fromName}</span>
                                                <span className="text-sm text-gray-500 ml-2">({message.from})</span>
                                                {message.isGroup && <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded ml-2">Group</span>}
                                            </div>
                                            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                                        </div>
                                        <p className="text-gray-700">{message.body}</p>
                                        {message.hasMedia && (
                                            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-2">
                                                📎 Has Media
                                            </span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    📭 No received messages yet
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sent Messages Tab */}
                {activeTab === 'sent' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">📋 Sent Messages ({sentMessages.length})</h3>
                            <button
                                onClick={fetchSentMessages}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {sentMessages.length > 0 ? (
                                sentMessages.map((message, index) => (
                                    <div key={message.id || index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center">
                                                <span className="font-medium text-gray-900">To: {message.to}</span>
                                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-2">
                                                    {message.type}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                                        </div>
                                        <p className="text-gray-700">{truncateMessage(message.body)}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    📤 No sent messages yet
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">👥 Contacts ({contacts.length})</h3>
                            <button
                                onClick={fetchContacts}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {contacts.length > 0 ? (
                                contacts.map((contact, index) => (
                                    <div key={contact.number || index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">{contact.name}</span>
                                            {contact.isBlocked && (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Blocked</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">{contact.number}</p>
                                        {contact.lastSeen && (
                                            <p className="text-xs text-gray-500 mb-3">
                                                Last seen: {formatTimestamp(contact.lastSeen)}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => selectContact(contact)}
                                            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm font-medium"
                                        >
                                            💬 View Conversation
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-8 text-gray-500">
                                    👥 No contacts available yet
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Conversation Tab */}
                {activeTab === 'conversation' && selectedContact && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                                💬 Conversation with {selectedContact.name}
                            </h3>
                            <button
                                onClick={() => fetchConversation(selectedContact.number)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                            {conversation.length > 0 ? (
                                <div className="space-y-3">
                                    {conversation.map((message, index) => (
                                        <div
                                            key={message.id || index}
                                            className={`flex ${message.direction === 'sent' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-xs px-4 py-2 rounded-lg ${
                                                    message.direction === 'sent'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-900 border border-gray-200'
                                                }`}
                                            >
                                                <p className="text-sm">{message.body}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.direction === 'sent' ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                    {formatTimestamp(message.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    💬 No conversation history yet
                                </div>
                            )}
                        </div>

                        {/* Quick Reply */}
                        <div className="mt-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage.message}
                                    onChange={(e) => setNewMessage(prev => ({ 
                                        ...prev, 
                                        message: e.target.value,
                                        phoneNumber: selectedContact.number 
                                    }))}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && newMessage.message.trim()) {
                                            sendMessage();
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        setNewMessage(prev => ({ ...prev, phoneNumber: selectedContact.number }));
                                        sendMessage();
                                    }}
                                    disabled={loading || !newMessage.message.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
                                >
                                    📤 Send
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppMessagingDashboard;
