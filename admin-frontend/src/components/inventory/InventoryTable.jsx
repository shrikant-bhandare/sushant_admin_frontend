import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import DeletePopup from "../../pages/DeletePopup";
import FieldsPopup from "./FieldsPopup";
import AddPopup from "./AddPopup";
import { deleteInventoryItem } from "../../services/InventoryService";



const InventoryTable = ({
  inventory = [],
  pagination = {},
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  data,
  columns,
  tableType="",
}) => {
  const {
    currentPage = 1,
    pageSize = 10,
    totalPages = 1,
    totalRecords = 0,
  } = pagination;
//   const { currentPage, pageSize, totalPages, totalRecords } = pagination;
  const [type, setType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showFormPopup, setShowFormPopup] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  useEffect(() => {
    setType(tableType); // Update type only when tableType changes
  }, [tableType]);

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageSizeChange = (event) => {
    onPageSizeChange(Number(event.target.value));
  };


  const handleEdit = (item) => {
    setSelectedItem(item);
    console.log("item", item);
    setShowFormPopup(true);
  };

 console.log("inventoryItems", inventory);

  const handleDeleteClick = (item) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    await deleteInventoryItem(deletingItem._id);
    onUpdate();
    setDeletingItem(null);
  };

  return (
    <div className="">
      <div className="overflow-x-auto">
        <table className="min-w-full  bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-sm uppercase tracking-wide">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="py-2 px-4 border-b text-left">
                {col.label}
                </th>
            ))}
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
              {columns.map((col) => (
                <td key={col.key} className="py-2 px-4 border-b">
                  {col.render ? col.render(item[col.key], item) : item[col.key]}
                </td>
              ))}
                <td className="py-2 px-4 border-b">
                <button
                  className="text-green-500 hover:text-green-700"
                  onClick={() => handleEdit(item)}
                >
                  <FaEdit size={18} />
                </button>
                {/* <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteClick(item)}
                >
                  <FaTrash size={18} />
                </button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 gap-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex w-full items-center justify-between md:justify-start">
            <label htmlFor="pageSize" className="mr-2 text-gray-600 dark:text-gray-300">
              Rows per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end w-full">
            <button
              onClick={handlePrevious}
              className="p-2 border rounded flex items-center"
              disabled={currentPage === 1}
            >
              <FaArrowLeft className="mr-2" />
            </button>
            <span className="mx-2 text-gray-600 dark:text-gray-300">
              Page {currentPage} of {totalPages} ({totalRecords} records)
            </span>
            <button
              onClick={handleNext}
              className="p-2 border rounded flex items-center"
              disabled={currentPage === totalPages}
            >
              <FaArrowRight className="ml-2" />
            </button>
          </div>
        </div>

        {showFormPopup && (
            <AddPopup
                
                isOpen={showFormPopup}
                onClose={() => setShowFormPopup(false)}
                type={type}
                onSubmit={onEdit}
                editData={selectedItem}
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

export default InventoryTable;
