import React, { useEffect, useState } from "react";
import InventoryTable from "./InventoryTable";
import AddDevicePopup from "./AddPopup";
import { FaEdit, FaTrash } from "react-icons/fa";
import { updateDeviceType, addDeviceType } from "../../services/InventoryService";

const DeviceTypes = () => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_APIURL}/api/inventory/device-types`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );
        
        const data = await response.json();
        console.log({data});
        if (data.status == "Success") {
          setDeviceTypes(data.data.deviceTypes || []);
        }
      } catch (error) {
        console.error("Error fetching device types:", error);
      }
    };

    fetchDeviceTypes();
  }, []);

  const handleAddClick = () => {
    setSelectedDeviceType(null);
    setIsPopupOpen(true);
  };

  const handleEditClick = (deviceType) => {
    setSelectedDeviceType(deviceType);
    setIsPopupOpen(true);
  };

  const handlePopupClose = async (updated) => {
    setIsPopupOpen(false);
    if (updated) {
      // Refresh the device types list
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/inventory/device-types`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        setDeviceTypes(data.data);
      }
    }
  };

  const columns = [
    { key: "name", label: "Device Type" },
    { key: "createdAt", label: "Created At" },
    { key: "updatedAt", label: "Updated At" },
    
  ];

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Device Types
        </h2>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleAddClick}
        >
          Add Device Type
        </button>
      </div>
      <InventoryTable data={deviceTypes} columns={columns} tableType="device" />
      {isPopupOpen && (
        <AddDevicePopup
          isOpen={isPopupOpen}
          onClose={handlePopupClose}
          type="device"
          editData={selectedDeviceType}
        />
      )}
    </div>
  );
};

export default DeviceTypes;
