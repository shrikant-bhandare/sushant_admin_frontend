
import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

const PartUsedHistory = () => {
  console.log('Rendering PartUsedHistory component');
  // Export to Excel (must be inside the component to access state)
  const handleExportExcel = async () => {
    // Fetch all data from backend for export
    const token = localStorage.getItem('accessToken');
    const params = [];
    if (filters.technician) params.push(`technician=${filters.technician}`);
    if (filters.ticketNumber) params.push(`ticketNumber=${filters.ticketNumber}`);
    if (filters.fromDate) params.push(`fromDate=${filters.fromDate}`);
    if (filters.toDate) params.push(`toDate=${filters.toDate}`);
    params.push(`page=1`);
    params.push(`pageSize=10000`); // Large enough to get all records
    const query = params.length ? '?' + params.join('&') : '';
    const res = await fetch(`${import.meta.env.VITE_APIURL}/api/task/parts-used-history${query}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const allRows = Array.isArray(data.data) ? data.data : [];
    if (!allRows.length) return;
    const exportData = allRows.map(row => ({
      'Ticket No': row.ticketNumber,
      'Part Name': row.part?.name || '-',
      'Quantity': row.quantity,
      'Requested By': row.requestedBy?.name || '-',
      'Approved By': row.status === 'Approved' && row.approvedBy?.name ? row.approvedBy.name : '-',
      'Technician': row.approvedBy?.name || '-',
      'Date': row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-',
      'Status': row.status === 'Approved' ? 'Approved' : 'Requested',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PartUsedHistory');
    XLSX.writeFile(wb, 'PartUsedHistory.xlsx');
  };
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
  const [filters, setFilters] = useState({
  technician: '',
  ticketNumber: '',
  fromDate: '',
  toDate: '',
  status: '',
  });
  const [dateError, setDateError] = useState('');
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    // Fetch technician list for filter dropdown
    const fetchTechnicians = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${import.meta.env.VITE_APIURL}/api/user/list-users?role=technician`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'Success') setTechnicians(data.data);
      } catch {}
    };
    fetchTechnicians();
  }, []);

  const fetchHistory = async (page = pagination.currentPage) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const params = [];
    if (filters.technician) params.push(`technician=${filters.technician}`);
    if (filters.ticketNumber) params.push(`ticketNumber=${filters.ticketNumber}`);
    if (filters.fromDate) params.push(`fromDate=${filters.fromDate}`);
    if (filters.toDate) params.push(`toDate=${filters.toDate}`);
    if (filters.status) params.push(`status=${filters.status}`);
      params.push(`page=${page}`);
      params.push(`pageSize=${pagination.pageSize}`);
      const query = params.length ? '?' + params.join('&') : '';
      const res = await fetch(`${import.meta.env.VITE_APIURL}/api/task/parts-used-history${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log('Fetched part used history:', data);
      if (data.status === 'Success') {
        setHistory(data.data);
        setPagination(data.pagination || { currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
      } else {
        setHistory([]);
        setPagination({ currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
      }
    } catch (e) {
      setHistory([]);
      setPagination({ currentPage: 1, pageSize: 20, totalPages: 1, totalRecords: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(1); }, [filters]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(f => {
      const updated = { ...f, [name]: value };
      // Date validation
      if (updated.fromDate && updated.toDate && updated.fromDate > updated.toDate) {
        setDateError('From date cannot be after To date.');
      } else {
        setDateError('');
      }
      return updated;
    });
  };

  const handleClear = () => {
    setFilters({ technician: '', ticketNumber: '', fromDate: '', toDate: '' });
    setDateError('');
  };

  return (
    <div className="p-2 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4 border border-blue-100">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-4 tracking-tight flex items-center gap-2">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path fill="#2563eb" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            Part Used History
          </h1>
          <div className="flex flex-wrap gap-3 items-end mb-3 justify-between">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                <select name="technician" value={filters.technician} onChange={handleFilterChange} className="p-2 border rounded w-40 bg-gray-50 text-sm">
                  <option value="">All Technicians</option>
                  {technicians.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded w-32 bg-gray-50 text-sm">
                  <option value="">All</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Requested</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket No</label>
                <input type="text" name="ticketNumber" value={filters.ticketNumber} onChange={handleFilterChange} placeholder="Ticket No" className="p-2 border rounded w-32 bg-gray-50 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="p-2 border rounded w-32 bg-gray-50 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="p-2 border rounded w-32 bg-gray-50 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => fetchHistory(1)}
                className="p-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded shadow font-semibold transition text-sm"
                disabled={!!dateError}
              >
                Filter
              </button>
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
          {dateError && (
            <div className="text-red-600 text-sm mt-2 font-semibold">{dateError}</div>
          )}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 border border-blue-100">
          {/* Pagination Controls */}
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
                <tr className="bg-blue-50 text-blue-800">
                  <th className="p-2 font-semibold border-b text-sm">Ticket No</th>
                  <th className="p-2 font-semibold border-b text-sm">Part Name</th>
                  <th className="p-2 font-semibold border-b text-sm">Quantity</th>
                  <th className="p-2 font-semibold border-b text-sm">Requested By</th>
                  <th className="p-2 font-semibold border-b text-sm">Approved By</th>
                  <th className="p-2 font-semibold border-b text-sm">Technician</th>
                  <th className="p-2 font-semibold border-b text-sm">Date</th>
                  <th className="p-2 font-semibold border-b text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-4 text-center text-blue-600">Loading...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={8} className="p-4 text-center text-gray-400">No records found</td></tr>
                ) : history.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50 transition">
                    <td className="p-2 border-b text-sm">{row.ticketNumber}</td>
                    <td className="p-2 border-b text-sm">{row.part?.name || '-'}</td>
                    <td className="p-2 border-b text-sm">{row.quantity}</td>
                    <td className="p-2 border-b text-sm">{row.requestedBy?.name || '-'}</td>
                    <td className="p-2 border-b text-sm">{row.status === 'Approved' && row.approvedBy?.name ? row.approvedBy.name : '-'}</td>
                    <td className="p-2 border-b text-sm">{row.approvedBy?.name || '-'}</td>
                    <td className="p-2 border-b text-sm">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</td>
                    <td className="p-2 border-b text-sm">
                      {row.status === 'Approved' ? (
                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-700 border border-green-200">Approved</span>
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-700 border border-yellow-200">Requested</span>
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

export default PartUsedHistory;
