import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const NotificationTestDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [users, setUsers] = useState([]);
  const [scenarios, setScenarios] = useState({});
  const [selectedUser, setSelectedUser] = useState('');
  const [storageInfo, setStorageInfo] = useState(null);
  const [userDiagnosis, setUserDiagnosis] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load users
      const usersResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/users`, {
        headers: getAuthHeaders()
      });
      const usersData = await usersResponse.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }

      // Load scenarios
      const scenariosResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/scenarios`, {
        headers: getAuthHeaders()
      });
      const scenariosData = await scenariosResponse.json();
      if (scenariosData.success) {
        setScenarios(scenariosData.scenarios);
      }

      // Load storage info
      const storageResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/storage`, {
        headers: getAuthHeaders()
      });
      const storageData = await storageResponse.json();
      if (storageData.success) {
        setStorageInfo(storageData.summary);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error loading initial data');
    }
  };

  const runComprehensiveTests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/run-all`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: selectedUser || undefined
        })
      });
      
      const data = await response.json();
      setTestResults(data);
      
      if (data.success) {
        toast.success(`Tests completed: ${data.summary.successRate} success rate`);
      } else {
        toast.error('Some tests failed - check results below');
      }

      // Refresh storage info
      loadInitialData();
    } catch (error) {
      console.error('Error running tests:', error);
      toast.error('Error running comprehensive tests');
    } finally {
      setLoading(false);
    }
  };

  const testSpecificScenario = async (scenarioId) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/test-scenario`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          scenario: scenarioId,
          userId: selectedUser || undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${scenarioId} test completed successfully`);
      } else {
        toast.error(`${scenarioId} test failed`);
      }
      
      console.log(`Test result for ${scenarioId}:`, data);
    } catch (error) {
      console.error('Error testing scenario:', error);
      toast.error(`Error testing ${scenarioId}`);
    } finally {
      setLoading(false);
    }
  };

  const diagnoseUser = async (userId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/diagnose/${userId}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUserDiagnosis(data.diagnosis);
        toast.info('User diagnosis completed - check results below');
      }
    } catch (error) {
      console.error('Error diagnosing user:', error);
      toast.error('Error diagnosing user');
    }
  };

  const getStatusIcon = (success) => {
    return success ? '✅' : '❌';
  };

  const getBadgeClass = (condition) => {
    return condition 
      ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800';
  };

  const getPriorityBadgeClass = (priority) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    switch (priority) {
      case 'High':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'Normal':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };
      
      const data = await response.json();
      setTestResults(data);
      
      if (data.success) {
        toast.success(`Tests completed: ${data.summary.passed}/${data.summary.total} passed`);
      } else {
        toast.error('Tests failed: ' + data.error);
      }
    } catch (error) {
      toast.error('Error running tests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSpecificType = async (type) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/type/${type}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`${type} test passed`);
      } else {
        toast.error(`${type} test failed: ` + data.error);
      }
      
      console.log(`${type} test result:`, data);
    } catch (error) {
      toast.error(`Error testing ${type}: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testUserNotification = async () => {
    if (!selectedUser) {
      toast.warning('Please select a user first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/user/${selectedUser}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test notification from the test dashboard'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('User notification test completed');
        console.log('User test results:', data.results);
      } else {
        toast.error('User notification test failed: ' + data.error);
      }
    } catch (error) {
      toast.error('Error testing user notification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const diagnoseUser = async () => {
    if (!selectedUser) {
      toast.warning('Please select a user first');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notification-test/diagnose/${selectedUser}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDiagnosis(data.diagnosis);
        toast.success('Diagnosis completed');
      } else {
        toast.error('Diagnosis failed: ' + data.error);
      }
    } catch (error) {
      toast.error('Error running diagnosis: ' + error.message);
    }
  };

  const getStatusColor = (success) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">📡 Notification Test Dashboard</h1>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            🧪 Run All Tests
          </button>
          
          <button
            onClick={() => testSpecificType('inventory-approval')}
            disabled={loading}
            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
          >
            📦 Test Inventory Approval
          </button>
          
          <button
            onClick={() => testSpecificType('task-status')}
            disabled={loading}
            className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400"
          >
            📋 Test Task Status
          </button>
        </div>

        {/* User Selection */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">👤 User-Specific Tests</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 min-w-64 p-2 border rounded"
            >
              <option value="">Select a user...</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role}) - {user.deviceTokenCount} tokens
                </option>
              ))}
            </select>
            
            <button
              onClick={testUserNotification}
              disabled={loading || !selectedUser}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-400"
            >
              🔔 Test User
            </button>
            
            <button
              onClick={diagnoseUser}
              disabled={loading || !selectedUser}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
            >
              🔍 Diagnose
            </button>
          </div>
        </div>

        {/* Specific Notification Type Tests */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3">🎯 Specific Tests</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {[
              { type: 'inventory-request', label: '📥 Request', color: 'bg-blue-500' },
              { type: 'inventory-approval', label: '✅ Approval', color: 'bg-green-500' },
              { type: 'task-status', label: '📋 Task', color: 'bg-purple-500' },
              { type: 'admin', label: '👑 Admin', color: 'bg-red-500' },
              { type: 'role', label: '🎭 Role', color: 'bg-yellow-500' }
            ].map(test => (
              <button
                key={test.type}
                onClick={() => testSpecificType(test.type)}
                disabled={loading}
                className={`p-2 ${test.color} text-white rounded text-sm hover:opacity-80 disabled:bg-gray-400`}
              >
                {test.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">👥 Users Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.hasTokens).length}
            </div>
            <div className="text-sm text-gray-600">With Device Tokens</div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {users.reduce((sum, u) => sum + u.deviceTokenCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Tokens</div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Role</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Tokens</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{user.name}</td>
                  <td className="p-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-2 text-gray-600">{user.email}</td>
                  <td className="p-2">{user.deviceTokenCount}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.hasTokens ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.hasTokens ? '✅ Ready' : '❌ No Tokens'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📊 Test Results</h2>
          <div className="mb-4">
            <div className="text-lg">
              Success Rate: <span className={getStatusColor(testResults.summary.passed === testResults.summary.total)}>
                {testResults.summary.successRate}
              </span> ({testResults.summary.passed}/{testResults.summary.total})
            </div>
          </div>
          
          <div className="space-y-2">
            {testResults.results?.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <span className={result.success ? '✅' : '❌'}></span>
                  <span className="font-medium">{result.test}</span>
                </div>
                <div className={`text-sm ${getStatusColor(result.success)}`}>
                  {result.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnosis Results */}
      {diagnosis && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Diagnosis Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">User Info</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div>Name: {diagnosis.user.name}</div>
                <div>Role: {diagnosis.user.role}</div>
                <div>Email: {diagnosis.user.email}</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Device Tokens</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div>Count: {diagnosis.deviceTokens.count}</div>
                <div>Valid: {diagnosis.deviceTokens.hasValidTokens ? '✅ Yes' : '❌ No'}</div>
              </div>
            </div>
          </div>
          
          {diagnosis.recommendations.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">🔧 Recommendations</h3>
              <div className="space-y-2">
                {diagnosis.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 border-l-4 border-orange-500 bg-orange-50">
                    <div className={`font-medium ${getSeverityColor(rec.severity)}`}>
                      {rec.issue}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {rec.solution}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationTestDashboard;
