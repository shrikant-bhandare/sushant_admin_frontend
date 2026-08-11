import { getAuthHeader, authenticatedFetch } from '../utils/authUtils';

export const fetchInventory = async (page = 1, pageSize = 10,query="") => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/part?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`,
      { headers: { 'Authorization': token } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch inventory data");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const filterInventory = async (page = 1, pageSize = 10, query) => {
  try {
    console.log("Fetching inventory with query:", query);
    console.log("Page:", page, "Page Size:", pageSize);
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/part?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`,
      { headers: { 'Authorization': token } }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch inventory data");
    }
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const updateInventoryItem = async (itemId, updatedData) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-part/${itemId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) {
      console.log(response);
      throw new Error("Failed to update inventory item");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const deleteInventoryItem = async (itemId) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-part/${itemId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      throw new Error("Failed to delete inventory item");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

export const addInventoryItem = async (updatedData) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-part/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(updatedData),
      }
    );

    if (!response.ok) {
      console.log(response);
      throw new Error("Failed to update inventory item");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const getDeviceTypes = async () => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-types`,
      { headers: { 'Authorization': token } }
    );
    if (!response.ok) throw new Error("Failed to fetch device types");
    return await response.json();
  } catch (error) {
    console.error("Error fetching device types:", error);
    return { data: { deviceTypes: [] } };
  }
};

export const getDeviceModels = async (deviceTypeId) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-models/${deviceTypeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch device models");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching device models:", error);
    throw error;
  }
};

export const searchInventory = async (query) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/search?q=${encodeURIComponent(
        query
      )}`,
      { headers: { 'Authorization': token } }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch search results.");
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Search API Error:", error);
    return [];
  }
};

export const addDeviceType = async (data) => {
  const token = getAuthHeader();
  const response = await fetch(
    `${import.meta.env.VITE_APIURL}/api/inventory/add-device-type`,
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const addDeviceModel = async (data) => {
  const token = getAuthHeader();
  const response = await fetch(
    `${import.meta.env.VITE_APIURL}/api/inventory/device-model`,
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify(data),
    }
  );
  return response.json();
};

export const getPartTypes = async () => {
    try {
      const token = getAuthHeader();
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/inventory/part-types`,
        {
          method: "GET",
          headers: {
            "Accept": "*/*",
            "Authorization": token,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to fetch part types");
      }
  
      return await response.json();
    } catch (error) {
      console.error("Error fetching part types:", error);
      return { data: { partTypes: [] } };
    }
  };

export const addPartName = async (data) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/part`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add part");
    }

    return await response.json();
  } catch (error) {
    console.error("Error adding part name:", error);
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await authenticatedFetch(
      `${import.meta.env.VITE_APIURL}/api/task/create-task`,
      {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        body: JSON.stringify(taskData),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create task: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

export const updateStock = async (partId, stock) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/part/${partId}/stock`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token,
          Accept: "*/*",
        },
        body: JSON.stringify({ stock }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update stock");
    }

    return await response.json();
  } catch (error) {
    console.error(`Error updating stock for part ${partId}:`, error);
    throw error;
  }
};

export const updateDeviceType = async (id, data) => {
  try {
    console.log({ id, data });
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-type/${id}`,
      {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update device type");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating device type:", error);
    throw error;
  }
};

export const updateDeviceModel = async (id, data) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/device-model/${id}`,
      {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update device model");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating device model:", error);
    throw error;
  }
};

// Check stock availability for parts
export const checkStockAvailability = async (partRequests) => {
  try {
    const stockWarnings = [];
    
    for (const request of partRequests) {
      if (!request.partId || !request.quantity) continue;
      
      // Fetch current part information including stock
      const token = getAuthHeader();
      const response = await fetch(
        `${import.meta.env.VITE_APIURL}/api/inventory/part/${request.partId}`,
        { headers: { 'Authorization': token } }
      );
      
      if (!response.ok) continue;
      
      const partData = await response.json();
      const part = partData.data || partData;
      
      if (part.stock < request.quantity) {
        stockWarnings.push({
          partId: request.partId,
          partName: part.name,
          deviceType: part.deviceType?.name || 'Unknown',
          deviceModel: part.deviceModel?.name || 'Unknown', 
          partType: part.partType?.name || 'Unknown',
          availableStock: part.stock,
          requestedQuantity: request.quantity,
          shortfall: request.quantity - part.stock
        });
      }
    }
    
    return {
      hasStockIssues: stockWarnings.length > 0,
      warnings: stockWarnings
    };
  } catch (error) {
    console.error("Error checking stock availability:", error);
    return {
      hasStockIssues: false,
      warnings: []
    };
  }
};

// Get part details by ID
export const getPartById = async (partId) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(
      `${import.meta.env.VITE_APIURL}/api/inventory/part/${partId}`,
      { headers: { 'Authorization': token } }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch part details");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching part details:", error);
    throw error;
  }
};
