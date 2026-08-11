import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';
import { FaStethoscope, FaClipboardList, FaUser, FaDesktop, FaCalendarAlt, FaFileInvoice, FaExclamationTriangle, FaCheckCircle, FaClock, FaArrowLeft, FaTools, FaPhoneAlt, FaMapMarkerAlt, FaMoneyBillWave, FaCog } from 'react-icons/fa';

const DiagnosisView = () => {
  const { id } = useParams(); // Get the diagnosis ID from the URL
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/diagnostics/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await response.json();
        if (data.success) {
          setDiagnosis(data.data);
          setError(null);
        } else {
          setError("Failed to fetch diagnosis: " + data.message);
          console.error("Failed to fetch diagnosis:", data.message);
        }
      } catch (error) {
        setError("Error fetching diagnosis data");
        console.error("Error fetching diagnosis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [id]);

  const getStatusConfig = (status) => {
    const statusConfigs = {
      'open': {
        bg: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100',
        text: isDarkMode ? 'text-blue-300' : 'text-blue-800',
        border: isDarkMode ? 'border-blue-700' : 'border-blue-300',
        icon: FaClipboardList
      },
      'PostDiagnostic': {
        bg: isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100',
        text: isDarkMode ? 'text-yellow-300' : 'text-yellow-800',
        border: isDarkMode ? 'border-yellow-700' : 'border-yellow-300',
        icon: FaClock
      },
      'Completed': {
        bg: isDarkMode ? 'bg-green-900/30' : 'bg-green-100',
        text: isDarkMode ? 'text-green-300' : 'text-green-800',
        border: isDarkMode ? 'border-green-700' : 'border-green-300',
        icon: FaCheckCircle
      }
    };
    
    return statusConfigs[status] || statusConfigs['open'];
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
          <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading diagnosis...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700' : 'bg-red-100 border border-red-300'}`}>
          <FaExclamationTriangle className={`inline mr-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
          <span className={`${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
        </div>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
        <div className={`p-12 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} shadow-lg text-center`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FaStethoscope className={`text-2xl ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No Diagnosis Found
          </h3>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The requested diagnosis could not be found.
          </p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(diagnosis.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {/* Header with Back Button */}
      <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} shadow-md hover:shadow-lg transform hover:scale-105`}
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700 shadow-blue-500/25' : 'from-blue-100 to-blue-200 shadow-blue-200/50'} shadow-xl`}>
            <FaStethoscope className={`text-2xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Diagnosis Details
            </h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive diagnostic assessment and findings
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                <FaFileInvoice className={`text-lg ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Ticket Information
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaFileInvoice className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ticket Number</span>
                </div>
                <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {diagnosis.ticketId || 'N/A'}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusIcon className={`text-sm ${statusConfig.text}`} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</span>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                  <StatusIcon className="mr-1" size={12} />
                  {diagnosis.status || 'Unknown'}
                </span>
              </div>

              {diagnosis.customerName && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaUser className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer</span>
                  </div>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {diagnosis.customerName}
                  </p>
                </div>
              )}

              {diagnosis.deviceModel && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FaDesktop className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Device Model</span>
                  </div>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {diagnosis.deviceModel}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Issues Detected */}
          {diagnosis.issuesDetected && diagnosis.issuesDetected.length > 0 && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <FaExclamationTriangle className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Issues Detected
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {diagnosis.issuesDetected.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${isDarkMode ? 'bg-red-900/20 border-red-600 border-l-red-500' : 'bg-red-50 border-red-200 border-l-red-500'}`}
                  >
                    <div className="flex items-center gap-2">
                      <FaTools className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                      <span className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                        {issue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnosis Description */}
          {diagnosis.description && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <FaClipboardList className={`text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Diagnosis Description
                </h2>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {diagnosis.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                <FaCog className={`text-lg ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              </div>
              <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </h2>
            </div>
            
            <div className="space-y-3">
              <button className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <FaStethoscope className="mr-2" size={14} />
                Update Diagnosis
              </button>
              
              <button className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <FaCheckCircle className="mr-2" size={14} />
                Mark Complete
              </button>
              
              <button className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                <FaTools className="mr-2" size={14} />
                Request Parts
              </button>
            </div>
          </div>

          {/* Additional Information */}
          {(diagnosis.createdAt || diagnosis.updatedAt) && (
            <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-indigo-600/20' : 'bg-indigo-100'}`}>
                  <FaCalendarAlt className={`text-lg ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Timeline
                </h2>
              </div>
              
              <div className="space-y-4">
                {diagnosis.createdAt && (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FaCalendarAlt className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created</span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(diagnosis.createdAt).toLocaleDateString()} at {new Date(diagnosis.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                
                {diagnosis.updatedAt && (
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FaCalendarAlt className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Last Updated</span>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {new Date(diagnosis.updatedAt).toLocaleDateString()} at {new Date(diagnosis.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiagnosisView;
