import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit, Trash2, Power, Settings, 
  Wifi, WifiOff, Activity, AlertCircle, CheckCircle,
  Smartphone, Monitor, Fingerprint, Eye, Bluetooth,
  Usb, Globe, RefreshCw, Download, Upload, BarChart3
} from 'lucide-react';

const BiometricDeviceManagement = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    deviceType: '',
    manufacturer: '',
    status: '',
    location: ''
  });
  const [deviceStats, setDeviceStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const deviceTypes = [
    'KTeco K40', 'KTeco MB20', 'KTeco UFace',
    'Mantra MFS100', 'Morpho MSO1300E', 'StarTek FM220',
    'eSSL X990', 'Mobile Camera Face'
  ];

  const manufacturers = ['KTeco', 'Mantra', 'Morpho', 'StarTek', 'eSSL', 'Mobile'];
  const connectionTypes = ['USB', 'Ethernet', 'WiFi', 'Bluetooth', 'Serial', 'Mobile'];
  const statuses = ['connected', 'disconnected', 'error', 'maintenance'];

  useEffect(() => {
    fetchDevices();
    fetchDeviceStats();
  }, [pagination.page, searchTerm, filters]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/biometric/devices?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      
      if (data.success) {
        setDevices(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeviceStats = async () => {
    try {
      const response = await fetch('/api/biometric/devices-stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      if (data.success) {
        setDeviceStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching device stats:', error);
    }
  };

  const handleTestConnection = async (deviceId) => {
    try {
      const response = await fetch(`/api/biometric/devices/${deviceId}/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Connection successful! Response time: ${data.data.responseTime}ms`);
      } else {
        alert(`Connection failed: ${data.message}`);
      }
      
      fetchDevices(); // Refresh to show updated status
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Failed to test connection');
    }
  };

  const handleSyncUsers = async (deviceId) => {
    try {
      const response = await fetch(`/api/biometric/devices/${deviceId}/sync-users`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Users synced successfully! ${data.data.syncedUsers} users synchronized.`);
      } else {
        alert(`Sync failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      alert('Failed to sync users');
    }
  };

  const handleDownloadAttendance = async (deviceId) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      
      const response = await fetch(
        `/api/biometric/devices/${deviceId}/download-attendance?startDate=${startDate.toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert(`Attendance downloaded! ${data.data.totalRecords} records processed, ${data.data.newRecords} new records.`);
      } else {
        alert(`Download failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error downloading attendance:', error);
      alert('Failed to download attendance');
    }
  };

  const getDeviceIcon = (deviceType) => {
    if (deviceType.includes('UFace') || deviceType.includes('Mobile Camera')) {
      return <Eye className="w-5 h-5 text-blue-600" />;
    }
    return <Fingerprint className="w-5 h-5 text-green-600" />;
  };

  const getConnectionIcon = (connectionType) => {
    switch (connectionType) {
      case 'WiFi':
      case 'Ethernet':
        return <Wifi className="w-4 h-4" />;
      case 'USB':
        return <Usb className="w-4 h-4" />;
      case 'Bluetooth':
        return <Bluetooth className="w-4 h-4" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status, isOnline) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    
    if (status === 'connected' && isOnline) {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800 flex items-center gap-1`}>
          <CheckCircle className="w-3 h-3" />
          Online
        </span>
      );
    } else if (status === 'maintenance') {
      return (
        <span className={`${baseClasses} bg-yellow-100 text-yellow-800 flex items-center gap-1`}>
          <Settings className="w-3 h-3" />
          Maintenance
        </span>
      );
    } else if (status === 'error') {
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 flex items-center gap-1`}>
          <AlertCircle className="w-3 h-3" />
          Error
        </span>
      );
    } else {
      return (
        <span className={`${baseClasses} bg-gray-100 text-gray-800 flex items-center gap-1`}>
          <WifiOff className="w-3 h-3" />
          Offline
        </span>
      );
    }
  };

  const StatsCards = () => {
    if (!deviceStats) return null;

    const cards = [
      {
        title: 'Total Devices',
        value: deviceStats.summary.total,
        icon: Monitor,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      },
      {
        title: 'Online Devices',
        value: deviceStats.summary.online,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Offline Devices',
        value: deviceStats.summary.offline,
        icon: WifiOff,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      {
        title: 'Maintenance Due',
        value: deviceStats.summary.maintenanceDue,
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {cards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-lg p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Biometric Device Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Device
        </button>
      </div>

      {/* Statistics Cards */}
      <StatsCards />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
            />
          </div>
          <select
            value={filters.deviceType}
            onChange={(e) => setFilters(prev => ({ ...prev, deviceType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Device Types</option>
            {deviceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={filters.manufacturer}
            onChange={(e) => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Manufacturers</option>
            {manufacturers.map(mfr => (
              <option key={mfr} value={mfr}>{mfr}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location..."
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type & Connection</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statistics</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No devices found</td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.deviceType)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{device.deviceName}</div>
                        <div className="text-sm text-gray-500">ID: {device.deviceId}</div>
                        <div className="text-sm text-gray-500">{device.serialNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{device.deviceType}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        {getConnectionIcon(device.connectionType)}
                        {device.connectionType}
                      </div>
                      {(device.ipAddress || device.port) && (
                        <div className="text-xs text-gray-400">
                          {device.ipAddress}:{device.port}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{device.location.name}</div>
                    <div className="text-sm text-gray-500">{device.location.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(device.status.connectionStatus, device.status.isOnline)}
                    <div className="text-xs text-gray-500 mt-1">
                      Last seen: {new Date(device.status.lastSeen).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      Total Scans: {device.statistics.totalScans}
                    </div>
                    <div className="text-sm text-gray-500">
                      Success Rate: {device.statistics.totalScans > 0 
                        ? Math.round((device.statistics.successfulScans / device.statistics.totalScans) * 100)
                        : 0}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleTestConnection(device._id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Test Connection"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSyncUsers(device._id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Sync Users"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadAttendance(device._id)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                        title="Download Attendance"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDevice(device);
                          setShowConfigModal(true);
                        }}
                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                        title="Configure"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingDevice(device);
                          setShowAddModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(pagination.pages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setPagination(prev => ({ ...prev, page: index + 1 }))}
                    className={`px-3 py-1 border rounded text-sm ${
                      pagination.page === index + 1 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Device Modal */}
      {showAddModal && (
        <DeviceModal
          device={editingDevice}
          onClose={() => {
            setShowAddModal(false);
            setEditingDevice(null);
          }}
          onSave={() => {
            setShowAddModal(false);
            setEditingDevice(null);
            fetchDevices();
            fetchDeviceStats();
          }}
        />
      )}

      {/* Device Configuration Modal */}
      {showConfigModal && selectedDevice && (
        <DeviceConfigModal
          device={selectedDevice}
          onClose={() => {
            setShowConfigModal(false);
            setSelectedDevice(null);
          }}
          onSave={() => {
            setShowConfigModal(false);
            setSelectedDevice(null);
            fetchDevices();
          }}
        />
      )}
    </div>
  );
};

// Device Modal Component (Add/Edit)
const DeviceModal = ({ device, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    deviceType: 'KTeco K40',
    connectionType: 'Ethernet',
    ipAddress: '',
    port: '',
    serialNumber: '',
    macAddress: '',
    location: {
      name: '',
      description: '',
      coordinates: { latitude: '', longitude: '' }
    },
    configuration: {
      timeout: 10000,
      quality: 70,
      securityLevel: 3
    },
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    'KTeco K40', 'KTeco MB20', 'KTeco UFace',
    'Mantra MFS100', 'Morpho MSO1300E', 'StarTek FM220',
    'eSSL X990', 'Mobile Camera Face'
  ];

  const connectionTypes = ['USB', 'Ethernet', 'WiFi', 'Bluetooth', 'Serial', 'Mobile'];

  useEffect(() => {
    if (device) {
      setFormData({
        ...device,
        port: device.port || '',
        location: device.location || formData.location,
        configuration: device.configuration || formData.configuration
      });
    }
  }, [device]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = device ? `/api/biometric/devices/${device._id}` : '/api/biometric/devices';
      const method = device ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert(device ? 'Device updated successfully' : 'Device created successfully');
        onSave();
      } else {
        alert(data.message || 'Failed to save device');
      }
    } catch (error) {
      console.error('Error saving device:', error);
      alert('Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {device ? 'Edit Biometric Device' : 'Add New Biometric Device'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
              <input
                type="text"
                required
                value={formData.deviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Unique device identifier"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
              <input
                type="text"
                required
                value={formData.deviceName}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Display name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {deviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Connection Type</label>
              <select
                value={formData.connectionType}
                onChange={(e) => setFormData(prev => ({ ...prev, connectionType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {connectionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Network Settings */}
          {(formData.connectionType === 'Ethernet' || formData.connectionType === 'WiFi') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input
                  type="text"
                  value={formData.ipAddress}
                  onChange={(e) => setFormData(prev => ({ ...prev, ipAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="192.168.1.100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="80"
                />
              </div>
            </div>
          )}

          {/* Hardware Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Device serial number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">MAC Address</label>
              <input
                type="text"
                value={formData.macAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, macAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="00:11:22:33:44:55"
              />
            </div>
          </div>

          {/* Location */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-3">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                <input
                  type="text"
                  required
                  value={formData.location.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Main Entrance, Reception Desk, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.location.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, description: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Additional location details"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (device ? 'Update Device' : 'Create Device')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Device Configuration Modal
const DeviceConfigModal = ({ device, onClose, onSave }) => {
  const [config, setConfig] = useState({
    timeout: 10000,
    quality: 70,
    securityLevel: 3,
    voice: {
      enabled: true,
      language: 'English',
      volume: 50
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (device) {
      setConfig(device.configuration || config);
    }
  }, [device]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/biometric/devices/${device._id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ configuration: config })
      });

      const data = await response.json();

      if (data.success) {
        alert('Configuration updated successfully');
        onSave();
      } else {
        alert(data.message || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Device Configuration</h2>
        <p className="text-gray-600 mb-4">{device.deviceName} ({device.deviceType})</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
              <input
                type="number"
                value={config.timeout}
                onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1000"
                max="60000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality Threshold</label>
              <input
                type="number"
                value={config.quality}
                onChange={(e) => setConfig(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Level</label>
              <select
                value={config.securityLevel}
                onChange={(e) => setConfig(prev => ({ ...prev, securityLevel: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {[1,2,3,4,5,6,7,8,9].map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voice Volume</label>
              <input
                type="range"
                value={config.voice?.volume || 50}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  voice: { ...prev.voice, volume: parseInt(e.target.value) }
                }))}
                className="w-full"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-500">{config.voice?.volume || 50}%</span>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BiometricDeviceManagement;