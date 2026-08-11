import React, { useState } from "react";
import { updateInventoryItem } from "../../services/InventoryService";

const EditPopup = ({ item, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: item.name,
    device: item.device,
    deviceModel: item.deviceModel,
    partType: item.partType,
    stock: item.stock,
    price: item.price,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateInventoryItem(item._id, formData);
      onUpdate();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Edit Inventory Item
        </h2>
        <form onSubmit={handleSubmit}>
          {["name", "device", "deviceModel", "partType", "stock", "price"].map(
            (field) => (
              <div key={field} className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={
                    field === "price" || field === "stock" ? "number" : "text"
                  }
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            )
          )}
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPopup;
