import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import PartsTable from "./partsTable";
import useRole from "../../customHooks/useRole";
import {
  fetchInventory,
  deleteInventoryItem,
  searchInventory,
  filterInventory,
} from "../../services/InventoryService";
import SearchBar from "./SearchBar";
import DeletePopup from "../../pages/DeletePopup";
import AddDevicePopup from "./AddPopup";

const Inventory = () => {
  const { isDarkMode } = useTheme();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalRecords: 0,
  });
  const useRoleValue = useRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteItem, setDeleteItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [popupState, setPopupState] = useState({ isOpen: false, type: "" });

  const loadInventory = async (page = 1, size = 10) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchInventory(page, size, searchQuery);
      if (response.statusCode === 200 && response.data?.parts) {
        setInventoryItems(response.data.parts); // Update to use partNames
        setPagination({
          currentPage: response.data.pagination.currentPage,
          pageSize: response.data.pagination.pageSize,
          totalPages: response.data.pagination.totalPages,
          totalRecords: response.data.pagination.totalDocuments, // Update to use totalDocuments
        });
      } else {
        setError(response.message || "Failed to fetch inventory.");
      }
    } catch (error) {
      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handlePageChange = (newPage) => {
    loadInventory(newPage, pagination.pageSize);
  };

  const handlePageSizeChange = (newSize) => {
    loadInventory(1, newSize);
  };

  const handleUpdateItem = () => {
    loadInventory(pagination.currentPage, pagination.pageSize);
  };

  const handleDeleteItem = async () => {
    if (deleteItem) {
      try {
        await deleteInventoryItem(deleteItem._id);
        loadInventory(pagination.currentPage, pagination.pageSize);
        setDeleteItem(null);
      } catch (error) {
        setError("Failed to delete item");
      }
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setLoading(true);

    try {
      if (!query) {
        // If search is cleared, reload full inventory
        await loadInventory(1, pagination.pageSize);
        return;
      }

      // const results = await searchInventory(query);
      const results = await filterInventory(1, pagination.pageSize, query);
      console.log("Search results:", results);
      if (results.statusCode !== 200) {
        setError("Failed to fetch search results.");
        setInventoryItems([]);
        setPagination((prev) => ({
          ...prev,
          totalRecords: 0,
          totalPages: 1,
          currentPage: 1,
        }));
        return;
      }
      setInventoryItems(results.data.parts);
      // Update pagination if available
      if (results.data.pagination) {
        setPagination({
          currentPage: results.data.pagination.currentPage,
          pageSize: results.data.pagination.pageSize,
          totalPages: results.data.pagination.totalPages,
          totalRecords: results.data.pagination.totalDocuments,
        });
      }
    } catch (error) {
      setError("Error searching inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      }  p-6 border rounded-lg shadow-md min-h-screen mb-4`}
    >
      <div className="flex flex-col-reverse gap-4 md:flex-row md:justify-between items-center mb-4">
        <SearchBar onSearch={handleSearch} />
        {useRoleValue !== "technician" && (<>
        {/* Buttons to open popup */}
        <div className="flex space-x-4">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              setPopupType("device");
              setShowPopup(true);
            }}
          >
            Add New Device Type
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={() => {
              setPopupType("model");
              setShowPopup(true);
            }}
          >
            Add New Device Model
          </button>
          <button
            onClick={() => setPopupState({ isOpen: true, type: "part" })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add New Part
          </button>
        </div>
        </>)}
      </div>

      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && (
        <PartsTable
          inventoryItems={inventoryItems}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onUpdate={handleUpdateItem}
          onDelete={setDeleteItem}
        />
      )}

      {/* Delete Confirmation Popup */}
      <DeletePopup
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDeleteItem}
        message={`Are you sure you want to delete ${deleteItem?.name}?`}
      />

      {/* Add Device Type / Model Popup */}
      <AddDevicePopup
        isOpen={showPopup}
        onClose={(refresh) => {
          setShowPopup(false);
          if (refresh) loadInventory();
        }}
        type={popupType}
      />

      <AddDevicePopup
        isOpen={popupState.isOpen}
        onClose={(success) => {
          setPopupState({ isOpen: false, type: "" });
          if (success) {
            // Refresh data or show success message
          }
        }}
        type={popupState.type}
      />
    </div>
  );
};

export default Inventory;
