import React, { useState, useEffect } from 'react';

const DiagnosisHistory = () => {
  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
    itemsPerPage: 10,
    itemsInCurrentPage: 0
  });
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchDiagnostics = async (page = 1, limit = itemsPerPage) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/diagnostics?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setDiagnostics(result.data);
        setPagination(result.pagination);
        setCurrentPage(page);
      } else {
        setError('Failed to fetch diagnostic data');
      }
    } catch (err) {
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics(1, itemsPerPage);
  }, [itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchDiagnostics(page, itemsPerPage);
      setExpandedRow(null); // Close any expanded rows when changing pages
    }
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'not working':
        return 'bg-red-100 text-red-800';
      case 'flickering':
        return 'bg-yellow-100 text-yellow-800';
      case 'not found':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getComponentDisplayName = (key) => {
    const displayNames = {
      camera: 'Camera',
      battery: 'Battery',
      backGlass: 'Back Glass',
      modelModem: 'Model/Modem',
      frontCamera: 'Front Camera',
      mic: 'Microphone',
      sound: 'Sound',
      buttons: 'Buttons',
      display: 'Display',
      wifi: 'WiFi',
      faceId: 'Face ID',
      flashLight: 'Flash Light',
      backCamera: 'Back Camera',
      proximitySensor: 'Proximity Sensor',
      charging: 'Charging',
      panicReport: 'Panic Report'
    };
    return displayNames[key] || key;
  };

  const getIssueComponents = (checks) => {
    const issues = [];
    Object.entries(checks).forEach(([key, value]) => {
      if (value.status !== 'ok' && value.status !== 'not found') {
        issues.push({
          component: getComponentDisplayName(key),
          status: value.status,
          notes: value.notes
        });
      }
    });
    return issues;
  };

  const generatePageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const current = currentPage;
    
    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (current > 4) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, current - 1);
      const end = Math.min(totalPages - 1, current + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < totalPages - 3) {
        pages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const toggleRowExpansion = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Loading diagnosis history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Diagnosis History</h1>
      {/* Items per page selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
      {/* Pagination info */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalCount)} of {pagination.totalCount} records
      </div>

      <div className="space-y-4">
        {diagnostics.map((diagnostic) => {
          const issueComponents = getIssueComponents(diagnostic.checks);
          
          return (
            <div key={diagnostic._id} className="bg-white rounded-lg shadow">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRowExpansion(diagnostic._id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Diagnostic Report #{diagnostic._id.slice(-8)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        Ticket: {diagnostic?.ticketId?.ticketNumber}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Issues Detected</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {diagnostic.issuesDetected.map((issue, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Copy Parts</span>
                        <span className={`text-sm mt-1 ${diagnostic.hasCopyParts ? 'text-red-600' : 'text-green-600'}`}>
                          {diagnostic.hasCopyParts ? 'Detected' : 'Not Detected'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Service History</span>
                        <span className={`text-sm mt-1 ${diagnostic.serviceHistoryDetected ? 'text-yellow-600' : 'text-green-600'}`}>
                          {diagnostic.serviceHistoryDetected ? 'Detected' : 'Not Detected'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Problem Components</span>
                        <span className="text-sm mt-1 text-red-600 font-medium">
                          {issueComponents.length} issue{issueComponents.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-500">Description:</span>
                      <p className="text-gray-900 mt-1">{diagnostic.description}</p>
                    </div>
                    
                    {issueComponents.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Affected Components:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {issueComponents.map((issue, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(issue?.status)}`}>
                                {issue?.component}: {issue?.status}
                              </span>
                              {issue?.notes && (
                                <span className="text-xs text-gray-500">({issue?.notes})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg 
                        className={`w-5 h-5 transform transition-transform ${expandedRow === diagnostic._id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {expandedRow === diagnostic._id && (
                <div className="border-t border-gray-200 p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Complete Component Check Results</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(diagnostic?.checks).map(([key, value]) => (
                      <div key={key} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-gray-900">{getComponentDisplayName(key)}</h5>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(value?.status)}`}>
                            {value?.status}
                          </span>
                        </div>
                        {value?.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Notes:</span> {value?.notes}
                          </p>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          Working: {value.working ? 'Yes' : 'No'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {diagnostics.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No diagnostic records found
        </div>
      )}
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          {/* Previous button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Previous
          </button>
          
          {/* Page numbers */}
          {generatePageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
          
          {/* Next button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentPage === pagination.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      )}
      
      {diagnostics.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {diagnostics.length} diagnostic record{diagnostics.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default DiagnosisHistory;