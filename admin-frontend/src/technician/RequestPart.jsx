import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getDeviceTypes,
  getDeviceModels,
  getPartTypes,
  fetchInventory,
} from "../services/InventoryService";
import { useTheme } from "../context/ThemeContext";
import { jwtDecode } from "jwt-decode"; // Ensure you have jwt-decode installed
import CustomAlert from "../components/alert/CustomAlert"; // Import CustomAlert

const RequestPart = ({ modalMode = false, taskId: propTaskId, ticketId: propTicketId, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  // Use props if provided (modal), else fallback to location.state
  const { taskId, ticketId } = modalMode
    ? { taskId: propTaskId, ticketId: propTicketId }
    : (location.state || {});
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [parts, setParts] = useState([]);
  const [partRequests, setPartRequests] = useState([
    { deviceType: "", deviceModel: "", partType: "", partId: "", quantity: 1 },
  ]);
  const [alert, setAlert] = useState({ isVisible: false, type: "error", message: "" }); // State for alert

  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await getDeviceTypes();
        setDeviceTypes(response.data.deviceTypes || []);
      } catch (error) {
        console.error("Error fetching device types:", error);
      }
    };
    fetchDeviceTypes();
  }, []);

  useEffect(() => {
    const fetchDeviceModels = async () => {
      const selectedDeviceType = partRequests[0]?.deviceType;
      if (selectedDeviceType) {
        try {
          const response = await getDeviceModels(selectedDeviceType);
          setDeviceModels(response.data.deviceModels || []);
        } catch (error) {
          console.error("Error fetching device models:", error);
        }
      }
    };
    fetchDeviceModels();
  }, [partRequests]);

  useEffect(() => {
    const fetchPartTypes = async () => {
      const selectedDeviceModel = partRequests[0]?.deviceModel;
      if (selectedDeviceModel) {
        try {
          const response = await getPartTypes();
          setPartTypes(response.data || []);
        } catch (error) {
          console.error("Error fetching part types:", error);
        }
      }
    };
    fetchPartTypes();
  }, [partRequests]);

  useEffect(() => {
    const fetchParts = async () => {
      const selectedDeviceType = partRequests[0]?.deviceType;
      const selectedDeviceModel = partRequests[0]?.deviceModel;
      const selectedPartType = partRequests[0]?.partType;
      if (selectedPartType && selectedDeviceType && selectedDeviceModel) {
        try {
          const response = await fetchInventory(1, 1000); // Fetch more to ensure all matches
          // Filter parts by selected deviceType, deviceModel, and partType
          const filteredParts = response.data.parts.filter(
            (part) =>
              part.partType?._id === selectedPartType &&
              part.deviceType?._id === selectedDeviceType &&
              part.deviceModel?._id === selectedDeviceModel
          );
          setParts(filteredParts || []);
        } catch (error) {
          console.error("Error fetching parts:", error);
        }
      } else {
        setParts([]); // Clear parts if not all filters are selected
      }
    };
    fetchParts();
  }, [partRequests]);

  const handleAddRow = () => {
    setPartRequests([
      ...partRequests,
      { deviceType: "", deviceModel: "", partType: "", partId: "", quantity: 1 },
    ]);
  };

  const handleRemoveRow = (index) => {
    setPartRequests(partRequests.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updatedRequests = [...partRequests];
    updatedRequests[index][field] = value;
    setPartRequests(updatedRequests);
  };

  const handleSubmitRequests = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      let userId = null;

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          userId = decodedToken["id"];
        } catch (error) {
          console.error("Error decoding token:", error);
          setAlert({ isVisible: true, type: "error", message: "Invalid token. Please log in again." });
          return;
        }
      }

      const requests = partRequests.map((request) => ({
        part: request.partId,
        quantity: request.quantity,
        taskId,
        ticketNumber: ticketId,
      }));

      const body = {
        parts: requests,
        requestedBy: userId,
      };

      if (modalMode) {
        body.orderStatus = "Pending";
      }


      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/part-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setAlert({ isVisible: true, type: "success", message: "Part requests created successfully!" });
        setTimeout(() => {
          if (modalMode && onClose) {
            onClose();
          } else {
            navigate(-1);
          }
        }, 2000);
      } else {
        const errorData = await response.json();
        setAlert({ isVisible: true, type: "error", message: errorData.message || "Failed to create part requests" });
      }
    } catch (error) {
      console.error("Error creating part requests:", error);
      setAlert({ isVisible: true, type: "error", message: "Failed to create part requests." });
    }
  };

  return (
    <div className={`p-6 ${modalMode ? '' : 'max-w-6xl mx-auto rounded-2xl shadow-lg'} ${
      isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
    }`}>
      {alert.isVisible && (
        <CustomAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, isVisible: false })}
        />
      )}
      
      {!modalMode && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Request Parts</h1>
          <p className="text-center text-gray-600 dark:text-gray-400">Select and request parts for your task</p>
        </div>
      )}

      {/* Parts List */}
      <div className="space-y-6">
        {partRequests.map((request, index) => (
          <div
            key={index}
            className={`rounded-xl shadow-lg border p-6 ${
              isDarkMode 
                ? "bg-gray-800 border-gray-700" 
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                  {index + 1}
                </div>
                Part Request
              </h3>
              {partRequests.length > 1 && (
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                  title="Remove this part request"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Device Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Device Type</label>
                <select
                  value={request.deviceType}
                  onChange={(e) => handleRowChange(index, "deviceType", e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <option value="">Select Device Type</option>
                  {deviceTypes.map((device) => (
                    <option key={device._id} value={device._id}>
                      {device.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Device Model */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Device Model</label>
                <select
                  value={request.deviceModel}
                  onChange={(e) => handleRowChange(index, "deviceModel", e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={!request.deviceType}
                >
                  <option value="">Select Device Model</option>
                  {deviceModels.map((model) => (
                    <option key={model._id} value={model._id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Part Type */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Part Type</label>
                <select
                  value={request.partType}
                  onChange={(e) => handleRowChange(index, "partType", e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={!request.deviceModel}
                >
                  <option value="">Select Part Type</option>
                  {partTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Part Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Part Name</label>
                <select
                  value={request.partId}
                  onChange={(e) => handleRowChange(index, "partId", e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                  disabled={!request.partType}
                >
                  <option value="">Select Part</option>
                  {parts.map((part) => (
                    <option key={part._id} value={part._id}>
                      {part.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={request.quantity}
                  onChange={(e) => handleRowChange(index, "quantity", e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
        <button
          onClick={handleAddRow}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Another Part
        </button>
        
        <button
          onClick={handleSubmitRequests}
          disabled={partRequests.some(req => !req.deviceType || !req.deviceModel || !req.partType || !req.partId)}
          className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Submit Part Requests
        </button>
      </div>
    </div>
  );
};

export default RequestPart;