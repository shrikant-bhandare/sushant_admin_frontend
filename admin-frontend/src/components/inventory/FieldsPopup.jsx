/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  updateInventoryItem,
  addInventoryItem,
  getDeviceTypes,
  getDeviceModels,
  getPartTypes,
} from "../../services/InventoryService";

const FieldsPopup = ({ initialData, onClose, onUpdate }) => {
  const isEditMode = Boolean(initialData);
  console.log({initialData})

  const [formData, setFormData] = useState({
    name: "",
    device: "",
    deviceModel: "",
    partType: "",
    stock: "",
    price: "",
  });

  const [deviceOptions, setDeviceOptions] = useState([]);
  const [deviceModelOptions, setDeviceModelOptions] = useState([]);
  const [partTypeOptions, setPartTypeOptions] = useState([]); // New state for part types
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch Device Types
    getDeviceTypes()
      .then((res) => {
        if (res?.data?.deviceTypes) {
          setDeviceOptions(res.data.deviceTypes);
          if (!isEditMode && res.data.deviceTypes.length > 0) {
            setFormData((prev) => ({
              ...prev,
              device: res.data.deviceTypes[0]._id,
            }));
          }
        } else {
          setError("Failed to load device types");
        }
      })
      .catch(() => setError("Failed to load device types"));
  }, [isEditMode]);

  useEffect(() => {
    if (isEditMode && initialData) {
      const { _id, __v, ...cleanData } = initialData;

      // Fetch device models based on the device type
      const fetchDeviceModels = getDeviceModels(cleanData.deviceType._id).then((res) => {
        if (res?.data?.deviceModels) {
          setDeviceModelOptions(res.data.deviceModels);
        } else {
          setDeviceModelOptions([]);
        }
      });

      // Fetch part types
      const fetchPartTypes = getPartTypes().then((res) => {
        if (res?.data) {
          setPartTypeOptions(res.data);
        } else {
          setPartTypeOptions([]);
        }
      });

      // Wait for all options to be fetched before setting formData
      Promise.all([fetchDeviceModels, fetchPartTypes]).then(() => {
        setFormData({
          name: cleanData.name,
          device: cleanData.deviceType._id,
          deviceModel: cleanData.deviceModel._id,
          partType: cleanData.partType._id,
          stock: cleanData.stock,
          price: cleanData.price,
        });
      });
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    if (formData.device) {
      getDeviceModels(formData.device)
        .then((res) => {
          if (res?.data?.deviceModels) {
            setDeviceModelOptions(res.data.deviceModels);
            // Only set default if NOT editing
            if (!isEditMode && res.data.deviceModels.length > 0) {
              setFormData((prev) => ({
                ...prev,
                deviceModel: res.data.deviceModels[0]._id,
              }));
            }
          } else {
            setDeviceModelOptions([]);
          }
        })
        .catch(() => setDeviceModelOptions([]));
    } else {
      setDeviceModelOptions([]);
    }
  }, [formData.device, isEditMode]);

  // Fetch Part Types
  useEffect(() => {
    getPartTypes()
      .then((res) => {
        if (res?.data) {
          setPartTypeOptions(res.data);
          if (!isEditMode && res.data.length > 0) {
            setFormData((prev) => ({
              ...prev,
              partType: res.data[0]._id,
            }));
          }
        } else {
          setError("Failed to load part types");
        }
      })
      .catch(() => setError("Failed to load part types"));
  }, [isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if ((name === "price" || name === "stock") && value < 0) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const uiFields = [
      "name",
      "device",
      "deviceModel",
      "partType",
      "stock",
      "price",
    ];
    const emptyFields = uiFields.filter((field) => !formData[field]);

    if (emptyFields.length > 0) {
      alert(
        `Please fill in the following fields: ${emptyFields
          .map((field) => field.charAt(0).toUpperCase() + field.slice(1))
          .join(", ")}`
      );
      return;
    }

    try {
      if (isEditMode) {
        await updateInventoryItem(initialData._id, formData);
      } else {
        await addInventoryItem(formData);
      }
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item. Please try again.");
    }
  };

  useEffect(() => {
    console.log({formData});
  }, [formData])
  

  return (
    <div  style={{zIndex:999}} className="fixed inset-0  flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white   dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md sm:w-96 mx-4">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {isEditMode ? "Edit Inventory Item" : "Add New Inventory Item"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
              placeholder="Enter name"
            />
          </div>

          {/* Device Type Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Device Type
            </label>
            <select
              name="device"
              value={formData.device}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  device: e.target.value,
                  deviceModel: "",
                });
              }}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select Device Type</option>
              {deviceOptions.map((device) => (
                <option key={device._id} value={device._id}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device Model Dropdown (Dynamic) */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Device Model
            </label>
            <select
              name="deviceModel"
              value={formData.deviceModel}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
              disabled={!formData.device}
            >
              <option value="">Select Device Model</option>
              {deviceModelOptions.map((model) => (
                <option key={model._id} value={model._id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Part Type Dropdown */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Part Type
            </label>
            <select
              name="partType"
              value={formData.partType}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
            >
              <option value="">Select Part Type</option>
              {partTypeOptions.map((part) => (
                <option key={part._id} value={part._id}>
                  {part.type}
                </option>
              ))}
            </select>
          </div>

          {/* Stock */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Stock
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
              placeholder="Enter stock quantity"
              min="0"
            />
          </div>

          {/* Price */}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              required
              placeholder="Price per unit"
              min="0"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
            >
              {isEditMode ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldsPopup;
