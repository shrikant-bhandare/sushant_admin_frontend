import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

import {
  getDeviceTypes,
  getDeviceModels,
  getPartTypes,
  addDeviceType,
  addDeviceModel,
  addPartName,
  updateDeviceType,
  updateDeviceModel,
} from "../../services/InventoryService";

const AddDevicePopup = ({ isOpen, onClose, type, editData }) => {
  // console.log({ type });
  
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [selectedDeviceType, setSelectedDeviceType] = useState("");
  const [selectedDeviceModel, setSelectedDeviceModel] = useState("");
  const [selectedPartType, setSelectedPartType] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [price, setPrice] = useState(""); // New state for price
  const [stock, setStock] = useState(""); // New state for stock
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setInputValue(editData.name || ""); // Pre-fill name
        setSelectedDeviceType(editData.deviceType?._id || ""); // Pre-fill device type
        setSelectedDeviceModel(editData.deviceModel || ""); // Pre-fill device model
        setSelectedPartType(editData.partType || ""); // Pre-fill part type
        setPrice(editData.price ? editData.price.toString() : ""); // Pre-fill price
        setStock(editData.stock ? editData.stock.toString() : ""); // Pre-fill stock
      } else {
        // Clear fields for adding new
        setInputValue("");
        setSelectedDeviceType("");
        setSelectedDeviceModel("");
        setSelectedPartType("");
        setPrice("");
        setStock("");
      }
      setError("");

      if (type === "model" || type === "part") {
        getDeviceTypes()
          .then((data) => {
            if (data?.data?.deviceTypes && Array.isArray(data.data.deviceTypes)) {
              setDeviceTypes(data.data.deviceTypes);
            } else {
              setDeviceTypes([]);
              setError("Failed to load device types");
            }
          })
          .catch(() => {
            setDeviceTypes([]);
            setError("Failed to load device types");
          });
      }

      if (type === "part") {
        getPartTypes()
          .then((data) => {
            if (data.data && Array.isArray(data["data"])) {
              console.log({data:data.data});
              setPartTypes(data.data);
            } else {
              setPartTypes([]);
              setError("Failed to load part types");
            }
          })
          .catch(() => {
            setPartTypes([]);
            setError("Failed to load part types");
          });
      }
    }
  }, [isOpen, editData, type]);

  useEffect(() => {
    if (type === "part" && selectedDeviceType) {
      getDeviceModels(selectedDeviceType)
        .then((data) => {
          if (data?.data?.deviceModels && Array.isArray(data.data.deviceModels)) {
            setDeviceModels(data.data.deviceModels);
          } else {
            setDeviceModels([]);
            setError("Failed to load device models");
          }
        })
        .catch(() => {
          setDeviceModels([]);
          setError("Failed to load device models");
        });
    }
  }, [selectedDeviceType, type]);

  const handleSave = async () => {
    if (
      !inputValue.trim() ||
      (type === "model" && !selectedDeviceType) ||
      (type === "part" &&
        (!selectedDeviceType || !selectedDeviceModel || !selectedPartType || !price || !stock))
    ) {
      setError("All fields are required.");
      return;
    }

    try {
      if (editData) {
        if (type === "device") {
          await updateDeviceType(editData._id, { name: inputValue }).then((response) => {
            console.log({ response });
            if (response?.success) {
              console.log("Device type updated successfully!");
              toast.success("Device type updated successfully!");
            } 
          });
        } else if (type === "model") {

          await updateDeviceModel(editData._id, {
            deviceType: selectedDeviceType,
            name: inputValue,
          });
          
        } else if (type === "part") {
          await addPartName({
            name: inputValue,
            deviceType: selectedDeviceType,
            deviceModel: selectedDeviceModel,
            partType: selectedPartType,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
          });
        }
      } else {
        if (type === "device") {
          await addDeviceType({ name: inputValue });
        } else if (type === "model") {
          await addDeviceModel({
            deviceType: selectedDeviceType,
            name: inputValue,
          });
        } else if (type === "part") {
          await addPartName({
            name: inputValue,
            deviceType: selectedDeviceType,
            deviceModel: selectedDeviceModel,
            partType: selectedPartType,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
          });
        }
      }
      onClose(true);
    } catch (err) {
      setError("Failed to save data.");
    }
  };

  return (
    isOpen && (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {type === "device"
              ? "Add New Device Type"
              : type === "model"
              ? "Add New Device Model"
              : "Add New Part"}
          </h2>

          {(type === "model" || type === "part") && (
            <select
              value={selectedDeviceType}
              onChange={(e) => setSelectedDeviceType(e.target.value)}
              className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select Device Type</option>
              {deviceTypes.map((device) => (
                <option key={device._id} value={device._id}>
                  {device.name}
                </option>
              ))}
            </select>
          )}

          {type === "part" && (
            <>
              <select
                value={selectedDeviceModel}
                onChange={(e) => setSelectedDeviceModel(e.target.value)}
                className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Device Model</option>
                {deviceModels.map((model) => (
                  <option key={model._id} value={model._id}>
                    {model.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedPartType}
                onChange={(e) => setSelectedPartType(e.target.value)}
                className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Part Type</option>
                {partTypes.map((part) => (
                  <option key={part._id} value={part._id}>
                    {part.type}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Enter Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
              />

              <input
                type="number"
                placeholder="Enter Stock"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
              />
            </>
          )}

          <input
            type="text"
            placeholder={
              type === "device"
                ? "Enter Device Type"
                : type === "model"
                ? "Enter Model Name"
                : "Enter Part Name"
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              className="px-4 py-2 bg-gray-400 text-white rounded"
              onClick={() => onClose(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default AddDevicePopup;
