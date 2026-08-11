import React, { useState } from "react";
import { FaEdit, FaTrash, FaPlus, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import FieldsPopup from "./FieldsPopup";
import DeletePopup from "../../pages/DeletePopup";
import useRole from '../../customHooks/useRole';
import {
  deleteInventoryItem,

} from "../../services/InventoryService";



const PartsTable = ({
  inventoryItems,
  pagination,
  onPageChange,
  onPageSizeChange,
  onUpdate,
}) => {
  const { currentPage, pageSize, totalPages, totalRecords } = pagination;
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowFormPopup(true);
  };
  const headerList =["Item Name","Device","Model","Type","Stock"];
  const useRoleValue = useRole();
  if (useRoleValue !== 'technician') {
    headerList.push("Price");
    headerList.push("Actions");
  }
 console.log("inventoryItems", inventoryItems);

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    await deleteInventoryItem(deletingItem._id);
    onUpdate();
    setDeletingItem(null);
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 shadow-md rounded-lg border p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Inventory
        </h2>

      </div>
        <div className="overflow-x-auto md:overflow-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm uppercase tracking-wide">
          <tr>
            {headerList.map((header) => (
              <th key={header} className="py-3 px-5 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inventoryItems.map((item) => (
            <tr
              key={item._id}
              className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <td className="py-4 px-5">{item.name}</td>
              <td className="py-4 px-5">{item.deviceType?.name || "N/A"}</td>
              <td className="py-4 px-5">{item.deviceModel?.name || "N/A"}</td>
              <td className="py-4 px-5">{item.partType?.type || "N/A"}</td>
              <td className="py-4 px-5">{item.stock}</td>
              {useRoleValue !== 'technician' && (<>
              <td className="py-4 px-5">₹{item.price.toFixed(2)}</td>
              <td className="py-4 px-5 flex space-x-3">
                <button
                  className="text-green-500 hover:text-green-700"
                  onClick={() => handleEdit(item)}
                >
                  <FaEdit size={18} />
                </button>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteClick(item)}
                >
                  <FaTrash size={18} />
                </button>
              </td>
              </>)}
            </tr>
          ))}
        </tbody>
      </table>
</div>
      {/* Pagination Controls */}
      <div className="mt-4 gap-4 flex flex-col sm:flex-row justify-between items-center">
        <div className="flex w-full items-center justify-between md:justify-start">
          <label
            htmlFor="pageSize"
            className="mr-2 text-gray-600 dark:text-gray-300"
          >
            Rows per page:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="p-2 border rounded bg-white dark:bg-gray-700 text-black dark:text-white"
          >
            {[5, 10, 15].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border rounded flex items-center disabled:opacity-50"
          >
            <FaArrowLeft className="mr-2" />
          </button>
          <span className="mx-2 text-gray-600 dark:text-gray-300">
            Page {currentPage} of {totalPages} ({totalRecords} records)
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 border rounded flex items-center disabled:opacity-50"
          >
            <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
      {showFormPopup && (
        <FieldsPopup
          initialData={selectedItem}
          onClose={() => setShowFormPopup(false)}
          onUpdate={onUpdate}
        />
      )}
      {deletingItem && (
        <DeletePopup
          isOpen={true}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
          itemName={deletingItem.name}
        />
      )}
    </div>
  );
};

export default PartsTable;
