import React, { useState, useEffect } from 'react';
import { Clock, User, CheckCircle, XCircle, Search, Fingerprint, Calendar } from 'lucide-react';

const QuickAttendance = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchTodayAttendance();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/biometric/users?limit=100&isActive=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/biometric/attendance?startDate=${today}&endDate=${today}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        const attendanceMap = {};
        data.data.forEach(record => {
          attendanceMap[record.userId] = record;
        });
        setTodayAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const markAttendance = async (user, action) => {
    setMarkingAttendance(true);
    try {
      const response = await fetch('/api/biometric/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: user.userId,
          employeeId: user.employeeId,
          method: 'manual',
          action: action,
          location: {
            address: 'Reception Desk'
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`${action === 'checkin' ? 'Check-in' : 'Check-out'} successful for ${user.name}`);
        fetchTodayAttendance(); // Refresh attendance data
      } else {
        alert(data.message || `Failed to ${action}`);
      }
    } catch (error) {
      console.error(`Error marking ${action}:`, error);
      alert(`Failed to ${action}`);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAttendanceStatus = (user) => {
    const attendance = todayAttendance[user.userId] || todayAttendance[user._id];
    if (!attendance) return { status: 'Not marked', color: 'text-gray-500' };
    
    if (attendance.checkIn.time && attendance.checkOut.time) {
      return { status: 'Completed', color: 'text-green-600' };
    } else if (attendance.checkIn.time) {
      return { status: 'Checked In', color: 'text-blue-600' };
    }
    return { status: 'Absent', color: 'text-red-600' };
  };

  const QuickMarkCard = ({ user }) => {
    const attendance = todayAttendance[user.userId] || todayAttendance[user._id];
    const statusInfo = getAttendanceStatus(user);
    const canCheckIn = !attendance || !attendance.checkIn.time;
    const canCheckOut = attendance && attendance.checkIn.time && !attendance.checkOut.time;

    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.employeeId}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.status}
            </p>
            {attendance && (
              <p className="text-xs text-gray-500">
                {formatTime(attendance.checkIn?.time)} - {formatTime(attendance.checkOut?.time) || 'Active'}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {canCheckIn && (
            <button
              onClick={() => markAttendance(user, 'checkin')}
              disabled={markingAttendance}
              className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Check In
            </button>
          )}
          
          {canCheckOut && (
            <button
              onClick={() => markAttendance(user, 'checkout')}
              disabled={markingAttendance}
              className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Check Out
            </button>
          )}

          {!canCheckIn && !canCheckOut && (
            <button
              disabled
              className="flex-1 bg-gray-300 text-gray-500 py-2 px-3 rounded text-sm font-medium cursor-not-allowed"
            >
              Completed
            </button>
          )}
        </div>
      </div>
    );
  };

  const TodayStats = () => {
    const stats = {
      total: users.length,
      present: Object.values(todayAttendance).filter(a => a.checkIn.time).length,
      absent: users.length - Object.values(todayAttendance).filter(a => a.checkIn.time).length,
      completed: Object.values(todayAttendance).filter(a => a.checkIn.time && a.checkOut.time).length
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Employees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-sm text-gray-600">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            <p className="text-sm text-gray-600">Not Marked</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quick Attendance</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Today's Stats */}
      <TodayStats />

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
          />
        </div>
      </div>

      {/* Quick Mark Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Mark Attendance</h2>
        
        {filteredUsers.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No employees found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <QuickMarkCard key={user._id} user={user} />
            ))}
          </div>
        )}
      </div>

      {/* Biometric Device Status */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Biometric Devices</h3>
              <p className="text-sm text-gray-500">Device status and connectivity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600">Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAttendance;