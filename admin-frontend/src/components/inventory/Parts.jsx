import React, { useEffect, useState } from 'react';
import InventoryTable from './InventoryTable';

const Parts = () => {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/inventory/parts`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await response.json();
        if (data.success) {
          setParts(data.data);
        }
      } catch (error) {
        console.error('Error fetching parts:', error);
      }
    };

    fetchParts();
  }, []);

  const columns = [
    { key: 'name', label: 'Part Name' },
    { key: 'deviceType', label: 'Device Type', render: (value) => value?.name },
    { key: 'deviceModel', label: 'Device Model', render: (value) => value?.name },
    { key: 'partType', label: 'Part Type', render: (value) => value?.type },
    { key: 'stock', label: 'Stock' },
    { key: 'price', label: 'Price', render: (value) => `₹${value}` },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Parts</h2>
      <InventoryTable data={parts} columns={columns} />
    </div>
  );
};

export default Parts;
