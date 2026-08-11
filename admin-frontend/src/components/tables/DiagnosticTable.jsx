import React from 'react';
import { FaArrowLeft, FaArrowRight, FaStethoscope, FaUser, FaDesktop, FaCalendarAlt, FaMoneyBillWave, FaFileInvoice, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';


const DiagnosticTable = ({ invoices = [], pagination = {}, onPageChange, onclick, onPageSizeChange }) => {
  const { isDarkMode } = useTheme();
  const {
    currentPage = 1,
    pageSize = 10,
    totalPages = 1,
    totalRecords = 0,
  } = pagination;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageSizeChange = (event) => {
    onPageSizeChange(Number(event.target.value));
  };

  const handleDiagnose = (invoiceId) => {
    onclick(invoiceId);
  };

  const getStatusConfig = (status) => {
    const statusConfigs = {
      'Pending': {
        bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
        text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800',
        border: isDarkMode ? 'border-yellow-700' : 'border-yellow-300',
        icon: FaClock
      },
      'In Progress': {
        bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
        text: isDarkMode ? 'text-blue-300' : 'text-blue-800',
        border: isDarkMode ? 'border-blue-700' : 'border-blue-300',
        icon: FaClock
      },
      'Completed': {
        bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
        text: isDarkMode ? 'text-green-300' : 'text-green-800',
        border: isDarkMode ? 'border-green-700' : 'border-green-300',
        icon: FaCheckCircle
      },
      'On Hold': {
        bg: isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100',
        text: isDarkMode ? 'text-orange-300' : 'text-orange-800',
        border: isDarkMode ? 'border-orange-700' : 'border-orange-300',
        icon: FaExclamationTriangle
      }
    };
    
    return statusConfigs[status] || statusConfigs['Pending'];
  };

  return (
    <div className={`rounded-2xl shadow-xl overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      {/* Table Container */}
      <div className="overflow-x-auto">
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          <table className="w-full">
            <thead className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} sticky top-0 z-10`}>
              <tr>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  <div className="flex items-center gap-2">
                    <FaFileInvoice className="text-sm" />
                    Invoice Number
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  <div className="flex items-center gap-2">
                    <FaUser className="text-sm" />
                    Customer
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  <div className="flex items-center gap-2">
                    <FaDesktop className="text-sm" />
                    Device Model
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  Status
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  <div className="flex items-center gap-2">
                    <FaMoneyBillWave className="text-sm" />
                    Amount
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-sm" />
                    Date
                  </div>
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-300 border-gray-600' : 'text-gray-600 border-gray-200'} border-b`}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className={`flex flex-col items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FaStethoscope className="text-2xl" />
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        No Diagnostic Records
                      </h3>
                      <p>No invoices available for diagnosis at the moment.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, index) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <tr 
                      key={invoice._id} 
                      className={`${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors duration-200 ${index % 2 === 0 ? (isDarkMode ? 'bg-gray-800' : 'bg-white') : (isDarkMode ? 'bg-gray-750' : 'bg-gray-50/50')}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                            <FaFileInvoice className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {invoice.ticketNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-full ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                            <FaUser className={`text-xs ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                          </div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {invoice.customerName
                              .toLowerCase()
                              .split(" ")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(" ")}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                            <FaDesktop className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          </div>
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {invoice.model.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          <StatusIcon className="mr-1" size={12} />
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaMoneyBillWave className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            ₹{invoice.total.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {new Date(invoice.date).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDiagnose(invoice._id)}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          <FaStethoscope className="mr-2" size={14} />
                          Diagnose
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modern Pagination */}
      <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Page Size Selector */}
          <div className="flex items-center gap-3">
            <label htmlFor="pageSize" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Rows per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
              } focus:outline-none`}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Pagination Info and Controls */}
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} results
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentPage === 1
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                } shadow-sm hover:shadow-md transform hover:scale-105`}
              >
                <FaArrowLeft className="mr-2" size={12} />
                Previous
              </button>

              <div className="flex items-center gap-1">
                <span className={`px-3 py-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentPage === totalPages
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                } shadow-sm hover:shadow-md transform hover:scale-105`}
              >
                Next
                <FaArrowRight className="ml-2" size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTable;

