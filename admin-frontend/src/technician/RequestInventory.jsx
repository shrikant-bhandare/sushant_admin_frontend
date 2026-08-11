import React, { useState, useEffect } from "react";
import {
  getDeviceTypes,
  getDeviceModels,
  getPartTypes,
  fetchInventory,
} from "../services/InventoryService";

const RequestInventory = () => {
  const [formData, setFormData] = useState({
    ticketNo: "",
    retailerName: "",
    deviceType: "",
    deviceModel: "",
    partType: "",
    partId: "",
    quantity: "",
    description: "",
  });

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [partTypes, setPartTypes] = useState([]);
  const [parts, setParts] = useState([]);

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
    // Fetch device models when deviceType changes
    if (formData.deviceType) {
      getDeviceModels(formData.deviceType)
        .then((data) => {
          if (data?.data?.deviceModels) {
            setDeviceModels(data.data.deviceModels);
          }
        })
        .catch(() => setDeviceModels([]));
    }
  }, [formData.deviceType]);

  useEffect(() => {
    // Fetch part types when deviceModel changes
    if (formData.deviceModel) {
      getPartTypes()
        .then((data) => {
          if (data?.data) {
            setPartTypes(data.data);
          }
        })
        .catch(() => setPartTypes([]));
    }
  }, [formData.deviceModel]);

  useEffect(() => {
    // Fetch parts when partType changes
    if (formData.partType) {
      fetchInventory(1, 100) // Fetch all parts (adjust page size as needed)
        .then((data) => {
          if (data?.data?.parts) {
            const filteredParts = data.data.parts.filter(
              (part) =>
                part.deviceType?._id === formData.deviceType &&
                part.deviceModel?._id === formData.deviceModel &&
                part.partType?._id === formData.partType
            );
            setParts(filteredParts);
          }
        })
        .catch(() => setParts([]));
    }
  }, [formData.partType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    // Add logic to send formData to the backend or API
  };

  return (
    <div>
      <h1>Request Inventory</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Ticket No:
          <input
            type="text"
            name="ticketNo"
            value={formData.ticketNo}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Retailer Name:
          <input
            type="text"
            name="retailerName"
            value={formData.retailerName}
            onChange={handleChange}
          />
        </label>
        <br />
        <label>
          Select Device Type:
          <select
            name="deviceType"
            value={formData.deviceType}
            onChange={handleChange}
          >
            <option value="">Select Device Type</option>
            {deviceTypes.map((device) => (
              <option key={device._id} value={device._id}>
                {device.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Select Device Model:
          <select
            name="deviceModel"
            value={formData.deviceModel}
            onChange={handleChange}
          >
            <option value="">Select Device Model</option>
            {deviceModels.map((model) => (
              <option key={model._id} value={model._id}>
                {model.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Select Part Type:
          <select
            name="partType"
            value={formData.partType}
            onChange={handleChange}
          >
            <option value="">Select Part Type</option>
            {partTypes.map((part) => (
              <option key={part._id} value={part._id}>
                {part.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Select Part:
          <select
            name="partId"
            value={formData.partId}
            onChange={handleChange}
          >
            <option value="">Select Part</option>
            {parts.map((part) => (
              <option key={part._id} value={part._id}>
                {part.name}
              </option>
            ))}
          </select>
        </label>
        <br />
        <label>
          Quantity:
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
          />
        </label>
        <br />
        <label>
          Description:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </label>
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default RequestInventory;
