import React, { useState, useEffect, use } from "react";
import {
  getDeviceTypes,
  getDeviceModels,
  getPartTypes,
  fetchInventory,
  createTask,
  updateStock,
} from "../../services/InventoryService";
import useUserId from "../../customHooks/useUserid";

const AddTaskModal = ({
  isDarkMode,
  technicians,
  selectedTechnician,
  setSelectedTechnician,
  taskName,
  setTaskName,
  taskDescription,
  setTaskDescription,
  priorityLevel,
  setPriorityLevel,
  note,
  setNote,
  onClose,
  onSuccess,
  ticketNumber,
  saleOrderId
}) => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const userId = useUserId();
  const [deviceModels, setDeviceModels] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState("");
  const [selectedDeviceModel, setSelectedDeviceModel] = useState("");
  const [selectedPartType, setSelectedPartType] = useState("");

  const [partRows, setPartRows] = useState([
    { deviceType: "", deviceModel: "", partType: "", partId: "", quantity: 1 },
  ]);

  useEffect(() => {
    // Fetch device types
    getDeviceTypes()
      .then((data) => {
        if (data?.data?.deviceTypes) {
          setDeviceTypes(data.data.deviceTypes);
        }
      })
      .catch(() => setDeviceTypes([]));
  }, []);



  useEffect(() => {
    // Fetch part types when a device model is selected
    console.log({selectedDeviceModel})
    if (selectedDeviceModel && selectedDeviceModel !== "") {
      getPartTypes()
        .then((data) => {
          if (data?.data) {
            setPartTypes(data.data);
          }
        })
        .catch(() => setPartTypes([]));
    }
  }, [selectedDeviceModel]);

  useEffect(() => {
    // Fetch parts when a part type is selected
    if (selectedPartType) {
      fetchInventory(1, 100) // Fetch all parts (adjust page size as needed)
        .then((data) => {
          if (data?.data?.parts) {
            const filteredParts = data.data.parts.filter(
              (part) =>
                part.deviceType?._id === selectedDeviceType &&
                part.deviceModel?._id === selectedDeviceModel &&
                part.partType?._id === selectedPartType
            );
            setParts(filteredParts);
          }
        })
        .catch(() => setParts([]));
    }
  }, [selectedPartType]);





  const handleAddRow = () => {
    setPartRows([
      ...partRows,
      { deviceType: "", deviceModel: "", partType: "", partId: "", quantity: 1 },
    ]);
  };

  const handleRemoveRow = (index) => {
    setPartRows(partRows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updatedRows = [...partRows];
    updatedRows[index][field] = value;

    // If the deviceType is changed, update selectedDeviceType and fetch device models
    if (field === "deviceType") {
      setSelectedDeviceType(value); // Update selectedDeviceType
      updatedRows[index]["deviceModel"] = ""; // Reset deviceModel
      updatedRows[index]["partType"] = ""; // Reset partType
      updatedRows[index]["partId"] = ""; // Reset partId

      getDeviceModels(value)
        .then((data) => {
          if (data?.data?.deviceModels) {
            const updatedDeviceModels = [...deviceModels];
            updatedDeviceModels[index] = data.data.deviceModels;
            setDeviceModels(updatedDeviceModels);
          }
        })
        .catch(() => {
          const updatedDeviceModels = [...deviceModels];
          updatedDeviceModels[index] = [];
          setDeviceModels(updatedDeviceModels);
        });
    }

    // If the partType is changed, update selectedPartType
    if (field === "partType") {
      setSelectedPartType(value); // Update selectedPartType
    }

    // If the deviceModel is changed, update selectedDeviceModel
    if (field === "deviceModel") {
      setSelectedDeviceModel(value); // Update selectedDeviceModel
    }

    setPartRows(updatedRows);
  };

  const handleCreateTask = async () => {
    const taskPayload = {
      taskName,
      taskDescription,
      technician: selectedTechnician,
      priorityLevel,
      note,
      ticketNumber,
      userId: userId,
      saleOrder: saleOrderId,
      status: "Pending",
      parts: [],
    };

    try {
      // Call the create task API
      const createTaskResponse = await createTask(taskPayload);

      if (createTaskResponse.status === "Success") {
        console.log("Task created successfully:", createTaskResponse);

        // Update stock for each part
        for (const part of taskPayload.parts) {
          try {
            const updateStockResponse = await updateStock(part.partId, part.quantity);
            console.log(`Stock updated successfully for part ${part.partId}:`, updateStockResponse);
          } catch (error) {
            console.error(`Error updating stock for part ${part.partId}:`, error);
          }
        }

        // Call success callback first (for status update)
        if (onSuccess) {
          onSuccess(createTaskResponse);
        }

        // Close the modal after successful task creation
        onClose();
      } else {
        console.error("Failed to create task:", createTaskResponse);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-3xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden ${
          isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
      >
        {/* Modern Header */}
        <div className={`p-6 border-b ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create New Task</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assign a task to a technician with details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Task Details Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              Task Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Assigned Technician
                </label>
                <div className="relative">
                  <select
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className={`w-full p-3 pr-10 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none ${
                      isDarkMode
                        ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                        : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <option value="">Select a technician...</option>
                    {(technicians || []).map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  Task Name
                </label>
                <input
                  type="text"
                  placeholder="Enter task name..."
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                      : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Task Description */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
              </svg>
              Task Description
            </label>
            <textarea
              placeholder="Describe the task in detail..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className={`w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
                isDarkMode
                  ? "bg-gray-700 text-white border-gray-600 hover:border-gray-500"
                  : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
              }`}
              rows="4"
            />
          </div>
          {/* <div className="mb-6">
            <label className="block font-medium mb-2">Assign Parts</label>
            {partRows.map((row, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 mb-4">
                <select
                  value={row.deviceType}
                  onChange={(e) => handleRowChange(index, "deviceType", e.target.value)}
                  className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Device Type</option>
                  {deviceTypes.map((device) => (
                    <option key={device._id} value={device._id}>
                      {device.name}
                    </option>
                  ))}
                </select>
                <select
                  value={row.deviceModel}
                  onChange={(e) => handleRowChange(index, "deviceModel", e.target.value)}
                  className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Device Model</option>
                  {( Array.isArray(deviceModels[index]) && deviceModels[index]  || []).map((model) => (
                    <option key={model._id} value={model._id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <select
                  value={row.partType}
                  onChange={(e) => handleRowChange(index, "partType", e.target.value)}
                  className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Part Type</option>
                  {partTypes.map((part) => (
                    <option key={part._id} value={part._id}>
                      {part.name}
                    </option>
                  ))}
                </select>
                <select
                  value={row.partId}
                  onChange={(e) => handleRowChange(index, "partId", e.target.value)}
                  className="w-full p-3 border rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Part</option>
                  {parts.map((part) => (
                    <option key={part._id} value={part._id}>
                      {part.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantity"
                  min="1"
                  value={row.quantity}
                  onChange={(e) =>
                    handleRowChange(index, "quantity", parseInt(e.target.value, 10))
                  }
                  className="w-24 p-3 border rounded dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={() => handleRemoveRow(index)}
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={handleAddRow}
              className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Add Row
            </button>
          </div> */}
          {/* Priority Level */}
          {/* <div className="mb-8">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Low', 'Medium', 'High'].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => setPriorityLevel(priority)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                    priorityLevel === priority
                      ? priority === 'High'
                        ? 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400'
                        : priority === 'Medium'
                        ? 'bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-400'
                        : 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400'
                      : isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    priorityLevel === priority
                      ? priority === 'High' ? 'bg-red-500'
                        : priority === 'Medium' ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium">{priority}</span>
                </button>
              ))}
            </div>
          </div> */}
        </div>

        {/* Modern Footer */}
        <div className={`p-6 border-t ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!selectedTechnician || !taskName }
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;