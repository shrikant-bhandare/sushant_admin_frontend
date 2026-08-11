import React, { useEffect, useState } from "react";
import InventoryTable from "./InventoryTable";
import AddDevicePopup from "./AddPopup";
import { getDeviceTypes } from "../../services/InventoryService";

const DeviceModels = () => {
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [selectedDeviceModel, setSelectedDeviceModel] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const fetchDeviceModels = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APIURL}/api/inventory/all-device-models`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        const data = await response.json();
        if (data.success) {
          setDeviceModels(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching device models:", error);
      }
    };

    const fetchDeviceTypes = async () => {
      try {
        const data = await getDeviceTypes();
        if (data?.data?.deviceTypes) {
          setDeviceTypes(data.data.deviceTypes);
        }
      } catch (error) {
        console.error("Error fetching device types:", error);
      }
    };

    fetchDeviceModels();
    fetchDeviceTypes();
  }, []);

  const handleAddClick = () => {
    setSelectedDeviceModel(null); // Clear selected model for adding new
    setIsPopupOpen(true);
  };

  const handleEditClick = (deviceModel) => {
    setSelectedDeviceModel(deviceModel); // Set the selected model's data for editing
    setIsPopupOpen(true); // Open the modal
  };

  const handlePopupClose = async (updated) => {
    setIsPopupOpen(false);
    if (updated) {
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/inventory/all-device-models`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setDeviceModels(data.data || []);
      }
    }
  };

  const columns = [
    { key: "deviceType", label: "Device Type", render: (value) => value?.name },
    { key: "name", label: "Model Name" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
    
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Device Models
        </h2>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleAddClick}
        >
          Add Device Model
        </button>
      </div>
      <InventoryTable
        data={deviceModels}
        tableType="model"
        columns={columns}
      />
      {isPopupOpen && (
        <AddDevicePopup
          isOpen={isPopupOpen}
          onClose={handlePopupClose}
          type="model"
          editData={selectedDeviceModel} // Pass the selected model's data to pre-fill the modal
        />
      )}
    </div>
  );
};

export default DeviceModels;
