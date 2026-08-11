import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Users, TrendingUp, Filter, Download, Eye, Edit } from 'lucide-react';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    department: '',
    status: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  const departments = ['Reception', 'Technician', 'Manager', 'Admin', 'Inventory', 'Diagnostic'];
  const statuses = ['Present', 'Absent', 'Late', 'Half Day', 'Holiday', 'Leave'];

  useEffect(() => {
    fetchAttendanceData();
    fetchSummaryData();
  }, [pagination.page, filters]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.department && { department: filters.department }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/biometric/attendance?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setAttendanceData(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const response = await fetch(`/api/biometric/reports/summary?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
    }
  };

  const handleEditAttendance = (attendance) => {
    setEditingAttendance(attendance);
    setShowEditModal(true);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'Present': 'bg-green-100 text-green-800',
      'Absent': 'bg-red-100 text-red-800',
      'Late': 'bg-yellow-100 text-yellow-800',
      'Half Day': 'bg-blue-100 text-blue-800',
      'Holiday': 'bg-purple-100 text-purple-800',
      'Leave': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const SummaryCards = () => {
    if (!summary) return null;

    const totalPresent = summary.summary.find(s => s._id === 'Present')?.count || 0;
    const totalAbsent = summary.summary.find(s => s._id === 'Absent')?.count || 0;
    const totalLate = summary.summary.find(s => s._id === 'Late')?.count || 0;
    const totalHours = summary.summary.reduce((acc, s) => acc + (s.totalWorkingHours || 0), 0);

    const cards = [
      {
        title: 'Total Present',
        value: totalPresent,
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Total Absent',
        value: totalAbsent,
        icon: Users,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      {
        title: 'Late Arrivals',
        value: totalLate,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50'
      },
      {
        title: 'Total Working Hours',
        value: Math.round(totalHours),
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
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
        <h1 className="text-2xl font-bold text-gray-800">Attendance Management</h1>
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search employee..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Working Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : attendanceData.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No attendance records found</td>
              </tr>
            ) : (
              attendanceData.map((attendance) => (
                <tr key={attendance._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {attendance.biometricUserId?.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {attendance.biometricUserId?.employeeId || attendance.employeeId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendance.biometricUserId?.department}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(attendance.date)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatTime(attendance.checkIn?.time)}
                    </div>
                    {attendance.checkIn?.method && (
                      <div className="text-xs text-gray-500">
                        via {attendance.checkIn.method}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatTime(attendance.checkOut?.time)}
                    </div>
                    {attendance.checkOut?.method && (
                      <div className="text-xs text-gray-500">
                        via {attendance.checkOut.method}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {attendance.workingHours ? `${attendance.workingHours.toFixed(1)}h` : '-'}
                    </div>
                    {attendance.overtime?.duration > 0 && (
                      <div className="text-xs text-blue-600">
                        +{Math.round(attendance.overtime.duration / 60)}h OT
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(attendance.status)}`}>
                      {attendance.status}
                    </span>
                    {attendance.manuallyEdited && (
                      <div className="text-xs text-orange-600 mt-1">
                        Manually edited
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAttendance(attendance)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Attendance"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
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

      {/* Edit Attendance Modal */}
      {showEditModal && (
        <EditAttendanceModal
          attendance={editingAttendance}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            fetchAttendanceData();
          }}
        />
      )}
    </div>
  );
};

// Modal Component for Editing Attendance
const EditAttendanceModal = ({ attendance, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    status: '',
    checkIn: {
      time: '',
      method: 'manual'
    },
    checkOut: {
      time: '',
      method: 'manual'
    },
    remarks: '',
    editReason: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (attendance) {
      setFormData({
        status: attendance.status || '',
        checkIn: {
          time: attendance.checkIn?.time 
            ? new Date(attendance.checkIn.time).toISOString().slice(0, 16)
            : '',
          method: attendance.checkIn?.method || 'manual'
        },
        checkOut: {
          time: attendance.checkOut?.time 
            ? new Date(attendance.checkOut.time).toISOString().slice(0, 16)
            : '',
          method: attendance.checkOut?.method || 'manual'
        },
        remarks: attendance.remarks || '',
        editReason: ''
      });
    }
  }, [attendance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/biometric/attendance/${attendance._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Attendance updated successfully');
        onSave();
      } else {
        alert(data.message || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['Present', 'Absent', 'Late', 'Half Day', 'Holiday', 'Leave'];
  const methods = ['manual', 'biometric', 'card', 'mobile'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Edit Attendance Record</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check In Time</label>
              <input
                type="datetime-local"
                value={formData.checkIn.time}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  checkIn: { ...prev.checkIn, time: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check In Method</label>
              <select
                value={formData.checkIn.method}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  checkIn: { ...prev.checkIn, method: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {methods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Time</label>
              <input
                type="datetime-local"
                value={formData.checkOut.time}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  checkOut: { ...prev.checkOut, time: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check Out Method</label>
              <select
                value={formData.checkOut.method}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  checkOut: { ...prev.checkOut, method: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {methods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Additional remarks..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Edit (Required)</label>
            <textarea
              value={formData.editReason}
              onChange={(e) => setFormData(prev => ({ ...prev, editReason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows="2"
              placeholder="Explain why this attendance record is being edited..."
              required
            />
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
              {loading ? 'Updating...' : 'Update Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceManagement;