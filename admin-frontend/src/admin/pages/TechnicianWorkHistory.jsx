import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const TechnicianWorkHistory = () => {
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Fetch technician list for dropdown
    const fetchTechnicians = async () => {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${import.meta.env.VITE_APIURL}/api/user/list-users?role=technician`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'Success') setTechnicians(data.data);
    };
    fetchTechnicians();
  }, []);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const params = [];
    if (selectedTech) params.push(`technician=${selectedTech}`);
    if (fromDate) params.push(`fromDate=${fromDate}`);
    if (toDate) params.push(`toDate=${toDate}`);
    // Only add status if not empty string
    if (status && status !== '') params.push(`status=${encodeURIComponent(status)}`);
    params.push(`page=${page}`);
    params.push(`pageSize=${pagination.pageSize}`);
    const query = params.length ? '?' + params.join('&') : '';
    const res = await fetch(`${import.meta.env.VITE_APIURL}/api/technician/work-history${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.status === 'Success') {
      setHistory(data.data);
      setPagination(data.pagination || { currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
    } else {
      setHistory([]);
      setPagination({ currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
    }
    setLoading(false);
  };
  // Clear all filters
  const handleClear = () => {
    setSelectedTech('');
    setFromDate('');
    setToDate('');
    setStatus('');
  };

  useEffect(() => { fetchHistory(1); }, [selectedTech, fromDate, toDate, status]);
  // Export to Excel
  const handleExportExcel = async () => {
    const token = localStorage.getItem('accessToken');
    const params = [];
    if (selectedTech) params.push(`technician=${selectedTech}`);
    if (fromDate) params.push(`fromDate=${fromDate}`);
    if (toDate) params.push(`toDate=${toDate}`);
    if (status) params.push(`status=${status}`);
    params.push('page=1');
    params.push('pageSize=10000');
    const query = params.length ? '?' + params.join('&') : '';
    const res = await fetch(`${import.meta.env.VITE_APIURL}/api/technician/work-history${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const allRows = Array.isArray(data.data) ? data.data : [];
    if (!allRows.length) return;
    const exportData = allRows.map(row => ({
      'Ticket No': row.ticketNumber || '-',
      'Task': row.taskName || '-',
      'Technician': row.technician?.name || '-',
      'Date': row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
      'Status': row.status || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TechnicianWorkHistory');
    XLSX.writeFile(wb, 'TechnicianWorkHistory.xlsx');
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  return (
    <div className="p-2 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-blue-100">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-4 tracking-tight flex items-center gap-2">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            Technician Work History
          </h1>
          <div className="flex flex-wrap gap-3 items-end mb-3 justify-between">
            <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
              <select value={selectedTech || ''} onChange={e => setSelectedTech(e.target.value)} className="p-2 border rounded w-40 bg-gray-50 text-sm">
                <option value="">All Technicians</option>
                {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status || ''} onChange={e => setStatus(e.target.value)} className="p-2 border rounded w-32 bg-gray-50 text-sm">
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input type="date" value={fromDate || ''} onChange={e => setFromDate(e.target.value)} className="p-2 border rounded w-32 bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input type="date" value={toDate || ''} onChange={e => setToDate(e.target.value)} className="p-2 border rounded w-32 bg-gray-50 text-sm" />
            </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleClear}
                className="p-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded shadow font-semibold transition text-sm"
                type="button"
              >
                Clear
              </button>
              <button
                onClick={handleExportExcel}
                className="p-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded shadow font-semibold transition text-sm"
                type="button"
                disabled={!history.length}
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 border border-blue-100">
          <div className="flex items-center justify-between my-2">
            <div className="text-gray-600 text-sm">
              Page <span className="font-bold">{pagination.currentPage}</span> of <span className="font-bold">{pagination.totalPages}</span> | Total: <span className="font-bold">{pagination.totalRecords}</span>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border border-blue-200 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold disabled:opacity-50"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr className="bg-blue-50 text-blue-800 text-center">
                  <th className="p-2 font-semibold border-b text-center text-sm">Ticket</th>
                  <th className="p-2 font-semibold border-b text-center text-sm">Task</th>
                  <th className="p-2 font-semibold border-b text-center text-sm">Technician</th>
                  <th className="p-2 font-semibold border-b text-center text-sm">Date</th>
                  <th className="p-2 font-semibold border-b text-center text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center text-blue-600">Loading...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-400">No records found</td></tr>
                ) : history.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50 transition text-center">
                    <td className="p-2 border-b text-center text-sm">{row.ticketNumber || '-'}</td>
                    <td className="p-2 border-b text-center text-sm">{row.taskName || '-'}</td>
                    <td className="p-2 border-b text-center text-sm">{row.technician?.name || '-'}</td>
                    <td className="p-2 border-b text-center text-sm">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="p-2 border-b text-center text-sm">
                      {row.status === 'Completed' ? (
                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-700 border border-green-200">Completed</span>
                      ) : row.status === 'In Progress' ? (
                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-700 border border-yellow-200">In Progress</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-gray-200 text-gray-700 border border-gray-300">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianWorkHistory;
