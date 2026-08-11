import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { getDeviceTypes, getDeviceModels, deleteDeviceType, deleteDeviceModel } from "../../services/InventoryService";

console.log({getDeviceTypes, getDeviceModels});
const DeviceListing = () => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchDeviceTypes();
    fetchDeviceModels();
  }, []);

  const fetchDeviceTypes = async () => {
    setIsLoading(true);
    try {
      const response = await getDeviceTypes();
      if (response?.data?.deviceTypes) {
        setDeviceTypes(response.data.deviceTypes);
      }
    } catch (error) {
      console.error("Error fetching device types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeviceModels = async () => {
    setIsLoading(true);
    try {
      const response = await getDeviceModels();
      if (response?.data?.deviceModels) {
        setDeviceModels(response.data.deviceModels);
      }
    } catch (error) {
      console.error("Error fetching device models:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDeviceType = async (id) => {
    if (window.confirm("Are you sure you want to delete this device type?")) {
      try {
        await deleteDeviceType(id);
        alert("Device type deleted successfully.");
        fetchDeviceTypes();
      } catch (error) {
        console.error("Error deleting device type:", error);
      }
    }
  };

  const handleDeleteDeviceModel = async (id) => {
    if (window.confirm("Are you sure you want to delete this device model?")) {
      try {
        await deleteDeviceModel(id);
        alert("Device model deleted successfully.");
        fetchDeviceModels();
      } catch (error) {
        console.error("Error deleting device model:", error);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Device Listing</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Device Types Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Device Types</h2>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deviceTypes.map((type) => (
                  <tr key={type._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{type.name}</td>
                    <td className="py-2 px-4 border-b flex space-x-4">
                      <button
                        className="text-green-500 hover:text-green-700"
                        onClick={() => alert(`Edit Device Type: ${type.name}`)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteDeviceType(type._id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Device Models Table */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Device Models</h2>
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Name</th>
                  <th className="py-2 px-4 border-b text-left">Device Type</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deviceModels.map((model) => (
                  <tr key={model._id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{model.name}</td>
                    <td className="py-2 px-4 border-b">{model.deviceType?.name || "N/A"}</td>
                    <td className="py-2 px-4 border-b flex space-x-4">
                      <button
                        className="text-green-500 hover:text-green-700"
                        onClick={() => alert(`Edit Device Model: ${model.name}`)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteDeviceModel(model._id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceListing;
