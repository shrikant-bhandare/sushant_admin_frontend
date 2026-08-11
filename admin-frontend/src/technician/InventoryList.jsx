import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const InventoryList = () => {
  const navigate = useNavigate();

  const [inventoryData, setInventoryData] = useState([
    {
      id: 1,
      ticketNo: "T123",
      retailerName: "Retailer A",
      device: "iPhone",
      model: "12 Pro",
      partType: "Screen",
      part: "OLED Screen",
      quantity: 2,
      description: "Urgent replacement needed",
      status: "Pending",
    },
    {
      id: 2,
      ticketNo: "T124",
      retailerName: "Retailer B",
      device: "iPad",
      model: "Air 4",
      partType: "Battery",
      part: "Li-ion Battery",
      quantity: 1,
      description: "Battery replacement",
      status: "Approved",
    },
  ]);

  const handleEdit = (item) => {
    navigate("/request-inventory", { state: { ...item } });
  };

  return (
    <div>
      <h1>Inventory List</h1>
      <table border="1" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Ticket No</th>
            <th>Retailer Name</th>
            <th>Device</th>
            <th>Model</th>
            <th>Part Type</th>
            <th>Part</th>
            <th>Quantity</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventoryData.map((item) => (
            <tr key={item.id}>
              <td>{item.ticketNo}</td>
              <td>{item.retailerName}</td>
              <td>{item.device}</td>
              <td>{item.model}</td>
              <td>{item.partType}</td>
              <td>{item.part}</td>
              <td>{item.quantity}</td>
              <td>{item.description}</td>
              <td>{item.status}</td>
              <td>
                <button onClick={() => handleEdit(item)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryList;
