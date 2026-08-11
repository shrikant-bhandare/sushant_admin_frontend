import React, { useState } from 'react';
import DeviceTypes from '../components/inventory/DeviceTypes';
import DeviceModels from '../components/inventory/DeviceModels';
import Parts from '../components/inventory/Parts';
import Inventory from "../components/inventory/Inventory"; 

const InventoryTabs = () => {
  const [activeTab, setActiveTab] = useState('device-types');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'device-types':
        return <DeviceTypes />;
      case 'device-models':
        return <DeviceModels />;
      case 'parts':
        return <Inventory />;
      default:
        return <Inventory />;
    }
  };

  return (
    <div>
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'device-types' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('device-types')}
        >
          Device Types
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'device-models' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('device-models')}
        >
          Device Models
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'parts' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('parts')}
        >
          Parts
        </button>
      </div>
      {renderActiveTab()}
    </div>
  );
};

export default InventoryTabs;
