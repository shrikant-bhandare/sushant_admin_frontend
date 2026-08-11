import React, { useState, useEffect, useRef } from "react";
import { FaTrash, FaPlus, FaMapMarkerAlt, FaSearch, FaEdit } from "react-icons/fa"; // Add at the top
import { useTheme } from "../context/ThemeContext";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getDeviceTypes, getDeviceModels } from "../services/InventoryService";
import debounce from "lodash.debounce"; // Import debounce for better API performance
import { toast } from "react-toastify";
import CollapsibleSection from "../components/CollapsibleSection"; // Import the CollapsibleSection component
import axios from "axios"; // Import axios for API calls
import { getWelcomeMessage, getStatusUpdateMessage } from "../services/messageTemplates";
import useUserId from "../customHooks/useUserid";
import TicketDetails from "../manager/TicketDetails";
import AddTaskModal from "../components/modals/AddTaskModal";
import RequestPartModal from "../components/modals/RequestPartModal"; // Import the RequestPartModal


// Function to generate a unique ID starting from 10000
const generateUniqueId = async () => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
        try {
            
            // Call API to get the next ticket number
            const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/next-ticket-number`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.ticketNumber) {
                const ticketNumber = `TC-${data.ticketNumber}`;
                return ticketNumber;
            } else {
                throw new Error(data.message || 'API returned unsuccessful response');
            }
        } catch (error) {
            retryCount++;
            
            if (retryCount < maxRetries) {
                // Wait before retrying with exponential backoff
                const delay = 1000 * Math.pow(2, retryCount - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // Final fallback: Use timestamp-based approach but start from 10000
    const timestamp = Date.now();
    const lastFourDigits = timestamp.toString().slice(-4);
    const fallbackNumber = 10000 + parseInt(lastFourDigits);
    return `TC-${fallbackNumber}`;
};

const NewSaleOrder = () => {
    const { invoiceId } = useParams(); // Get invoiceId from URL
    const [searchParams] = useSearchParams(); // Get URL search parameters
    const isFinalEdit = searchParams.get('finalEdit') === 'true'; // Check if this is a final edit
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();
    const [ticketNumber, setTicketNumber] = useState(""); // State to store ticket number
    const [items, setItems] = useState([
        { id: 1,  price: "", qty: 0, discount: 0, tax: 0, amount: 0, serialNumber: "", issue: "", description: "", unit: "pcs", warranty: "", pricePerUnit: "" }
    ]);
    const [serviceOrderId, setServiceOrderId] = useState("");
    const [saleOrderData, setSaleOrderData] = useState(null);
    const [total, setTotal] = useState(0);
    const [deviceType, setDeviceType] = useState("");
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [models, setModels] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [saleOrderStatus, setSaleOrderStatus] = useState("New");
    const [reload, setReload] = useState(false);
    const userId = useUserId();
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    // Task creation modal state variables
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState("");
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [note, setNote] = useState("");
    const [priorityLevel, setPriorityLevel] = useState("");
    
    // Request Part modal state variables
    const [isRequestPartModalOpen, setIsRequestPartModalOpen] = useState(false);
    const [requestPartTask, setRequestPartTask] = useState(null);

    // Flag to prevent duplicate API calls
    const ticketGeneratedRef = useRef(false);

    // State to manage all inputs
    const [formData, setFormData] = useState({
        customerName: "",
        phone: "",
        alternatePhone: "",
        model: "",
        imeiNumber: "",
        serialNumber: "",
        referenceNumber: "", // Will be set asynchronously
        ticketNumber: "", // Will be set asynchronously
        assetsReceived: "",
        paymentType: "",
        technicianName: "",
        color: "",
        gstNumber: "",
        address: "",
        discountPercentage: 0,
        discountAmount: 0,
        advanced: 0,
        balance: 0
    });

    // State for managing the address popup
    const [isAddressPopupOpen, setIsAddressPopupOpen] = useState(false);
    const [address, setAddress] = useState("");
    
    // State for final edit confirmation
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

    const handleAddressSubmit = () => {
        // Handle address submission logic
        setIsAddressPopupOpen(false);
        alert("Address saved successfully!");
    };

    // Generate ticket number on component mount for new orders
    useEffect(() => {
        // Debug: Check if token exists on component mount
        const token = localStorage.getItem('accessToken');
        const initializeTicketNumber = async () => {
            if (!invoiceId && !ticketGeneratedRef.current) { // Only generate for new orders and if not already generated
                ticketGeneratedRef.current = true; // Set flag to prevent duplicate calls
                
                // Don't show ticket number on frontend - hide it completely
                setFormData(prev => ({
                    ...prev,
                    referenceNumber: "", // Keep empty for new orders
                    ticketNumber: "" // Keep empty for new orders
                }));
            }
        };
        
        initializeTicketNumber();
    }, [invoiceId]);

    useEffect(() => {
        // Check if invoiceId is a valid MongoDB ObjectId (24 hex characters)
        const isValidObjectId = invoiceId && /^[0-9a-fA-F]{24}$/.test(invoiceId);
        
        if (invoiceId && isValidObjectId) {
            setServiceOrderId(invoiceId); // Ensure serviceOrderId is set correctly

            const fetchSaleOrder = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        const saleOrder = data.data;
                        setSaleOrderData(saleOrder);
                        setFormData({
                            ticketNumber: saleOrder.ticketNumber,
                            customerName: saleOrder.customerName,
                            phone: saleOrder.phone,
                            alternatePhone: saleOrder.alternatePhone || "",
                            model: saleOrder.model._id || "",
                            imeiNumber: saleOrder.imeiNumber,
                            serialNumber: saleOrder.serialNumber || "",
                            referenceNumber: saleOrder.referenceNumber,
                            assetsReceived: saleOrder.assetsReceived,
                            paymentType: saleOrder.paymentType,
                            technicianName: saleOrder.technicianName,
                            color: saleOrder.color,
                            gstNumber: saleOrder.gstNumber || "",
                            address: saleOrder.address || "",
                        });
                        setDeviceType(saleOrder.deviceBrand._id || "");
                        setItems(
                          (saleOrder.items || []).map((item) => {
                            // Check if the issue matches any ISSUE_OPTIONS value
                            const isPredefined = ISSUE_OPTIONS.some(opt => opt.value === item.issue);
                            // If not matching, keep as custom (string), else keep as is
                            return {
                              ...item,
                              issue: isPredefined ? item.issue : (item.issue || ""),
                            };
                          })
                        );
                        setFormData(prev => ({ 
                            ...prev, 
                            discountPercentage: saleOrder.discount || 0,
                            discountAmount: saleOrder.discountAmount || 0,
                            advanced: saleOrder.advanced || 0,
                            balance: saleOrder.balance || 0
                        }));
                        setTotal(saleOrder.total || 0);
                        setTicketNumber(saleOrder.ticketNumber);
                        setSaleOrderStatus(saleOrder.status || "New");
                        // Set service order ID if editing existing order
                        if (invoiceId) {
                            setServiceOrderId(invoiceId);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching sale order:", error);
                }
            };

            fetchSaleOrder();
        } 
    }, [invoiceId,reload]);

    useEffect(() => {
        // Fetch device types on component mount
        const fetchDeviceTypes = async () => {
          try {
            const response = await getDeviceTypes();
            if (response.statusCode === 200 && response.data?.deviceTypes) {
              setDeviceTypes(response.data.deviceTypes);
            }
          } catch (error) {
            console.error("Error fetching device types:", error);
          }
        };
    
        fetchDeviceTypes();
      }, []);
    
      useEffect(() => {
        const fetchDeviceModels = async () => {
          if (deviceType) {
            try {
              const response = await getDeviceModels(deviceType); // Pass the correct deviceTypeId
              if (response.statusCode === 200 && response.data?.deviceModels) {
                setModels(response.data.deviceModels);
              }
            } catch (error) {
              console.error("Error fetching device models:", error);
            }
          } else {
            setModels([]);
          }
        };
    
        fetchDeviceModels();
      }, [deviceType]);

      // Fetch technicians for task assignment
      useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APIURL}/api/user/list-users?role=technician`,
                    {
                        headers: {
                            accept: "application/json",
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        },
                    }
                );
                const data = await response.json();
                if (data.status === "Success") {
                    setTechnicians(
                        data.data.map((tech) => ({
                            id: tech._id,
                            name: tech.name,
                        }))
                    );
                } 
            } catch (error) {
                console.error("Error fetching technicians:", error);
            }
        };

        fetchTechnicians();
    }, []);

      const inputClass = `p-2 border rounded w-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm ${
        isDarkMode
          ? "bg-gray-700 border-gray-600 text-white"
          : "bg-white border-gray-300 text-black"
      }`;
      const selectClass = `p-2 border rounded w-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm ${
        isDarkMode
          ? "bg-gray-700 border-gray-600 text-white"
          : "bg-white border-gray-300 text-black"
      }`;
      
    // Task creation handlers
    const handleTaskCreationSuccess = async (createTaskResponse) => {

        // Update status to "In Progress" if this is the first task
        await updateSaleOrderStatusAfterTaskCreation();
        
        // Refresh tasks
        if (saleOrderData?.ticketNumber) {
            fetchTasks(saleOrderData.ticketNumber);
        }
        
        // Trigger a reload to ensure fresh data
        setReload(prev => !prev);
    };

    const handleTaskModalClose = () => {
        setIsTaskModalOpen(false);
        // Reset form fields
        setTaskName("");
        setTaskDescription("");
        setSelectedTechnician("");
        setPriorityLevel("");
        setNote("");
        // Refresh tasks if we have a ticket number (but don't update status here)
        if (saleOrderData?.ticketNumber) {
            fetchTasks(saleOrderData.ticketNumber);
        }
    };

    const fetchTasks = async (ticketNumber) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(
                `${import.meta.env.VITE_APIURL}/api/task/get-tasks-by-ticket-number?ticketNumber=${ticketNumber}`,
                {
                    headers: {
                        "accept": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );
            const data = await response.json();
            if (data.status === "Success") {
                setTasks(data.data);
            } 
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    // Function to update sale order status after task creation
    const updateSaleOrderStatusAfterTaskCreation = async () => {
        try {
            // Only update if current status is "New" and we have a valid sale order
            if (saleOrderData && saleOrderData.status === "New" && saleOrderData._id) {
                console.log("Updating sale order status to 'In Progress' after first task creation");
                
                const token = localStorage.getItem('accessToken');
                const response = await fetch(
                    `${import.meta.env.VITE_APIURL}/api/sale-orders/${saleOrderData._id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            ...saleOrderData,
                            status: "In Progress"
                        }),
                    }
                );

                if (response.ok) {
                    const updatedData = await response.json();
                    
                    // Update local state
                    setSaleOrderData(prev => ({
                        ...prev,
                        status: "In Progress"
                    }));
                    setSaleOrderStatus("In Progress");

                    // Show success notification
                    toast.success("🚀 Sale order status updated to 'In Progress'!", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                    });

                    // Send WhatsApp status update message
                    try {
                        const statusMessage = getStatusUpdateMessage(
                            saleOrderData.customerName || formData.customerName,
                            saleOrderData.ticketNumber || formData.ticketNumber,
                            "In Progress"
                        );
                        
                        await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                            },
                            body: JSON.stringify({
                                phoneNumber: saleOrderData.phone || formData.phone,
                                message: statusMessage,
                            }),
                        });
                    } catch (err) {
                        console.error("Failed to send status update WhatsApp message", err);
                    }
                } else {
                    const errorData = await response.text();
                    toast.error("Failed to update sale order status", {
                        position: "top-right",
                        autoClose: 3000,
                    });
                }
            } 
        } catch (error) {
            toast.error("Error updating sale order status: " + error.message, {
                position: "top-right",
                autoClose: 5000,
            });
        }
    };

    // Edit task handlers
    const handleEditTask = (task) => {
        setEditingTask(task);
        setTaskName(task.taskName || "");
        setTaskDescription(task.taskDescription || "");
        setSelectedTechnician(task.technician?._id || "");
        setPriorityLevel(task.priorityLevel || "");
        setNote(task.note || "");
        setIsEditTaskModalOpen(true);
    };

    const handleEditTaskModalClose = () => {
        setIsEditTaskModalOpen(false);
        setEditingTask(null);
        // Reset form fields
        setTaskName("");
        setTaskDescription("");
        setSelectedTechnician("");
        setPriorityLevel("");
        setNote("");
        // Refresh tasks if we have a ticket number
        if (saleOrderData?.ticketNumber) {
            fetchTasks(saleOrderData.ticketNumber);
        }
    };

    const handleUpdateTask = async () => {
        if (!editingTask) return;

        try {
            const token = localStorage.getItem('accessToken');
            
            // Check if token exists
            if (!token) {
                alert("Authentication required. Please login again.");
                return;
            }

            const updateData = {
                taskName,
                taskDescription,
                technician: selectedTechnician,
                priorityLevel,
                note,
                updatedAt: new Date().toISOString()
            };

            const response = await axios.put(
                `${import.meta.env.VITE_APIURL}/api/task/update-task/${editingTask._id || editingTask.id}`,
                updateData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );



            if (response.status === 200) {
                alert("Task updated successfully!");
                handleEditTaskModalClose();
                // Refresh tasks after successful update
                if (saleOrderData?.ticketNumber) {
                    fetchTasks(saleOrderData.ticketNumber);
                }
            }
        } catch (error) {
            console.error("Error updating task:", error);

            if (error.response?.status === 401) {
                // Handle unauthorized access
                alert("Session expired. Please login again.");
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            } else {
                const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
                alert(`Failed to update task: ${errorMessage}`);
            }
        }
    };

    // Delete task handler
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            
            // Check if token exists
            if (!token) {
                alert("Authentication required. Please login again.");
                return;
            }

            const response = await axios.delete(
                `${import.meta.env.VITE_APIURL}/api/task/delete-task/${taskId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                }
            );


            if (response.status === 200) {
                alert("Task deleted successfully!");
                // Update local state by removing the deleted task instead of refetching
                setTasks(prevTasks => prevTasks.filter(task => (task._id || task.id) !== taskId));
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            
            if (error.response?.status === 401) {
                // Handle unauthorized access
                alert("Session expired. Please login again.");
                localStorage.removeItem('accessToken');
                window.location.href = '/login';
            } else {
                const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
                alert(`Failed to delete task: ${errorMessage}`);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        let processedValue = value;
        
        // For number inputs, remove leading zeros
        if (type === 'number' && value !== '') {
            // Remove leading zeros but preserve decimal values and single zero
            if (value !== '0' && !value.startsWith('0.')) {
                processedValue = value.replace(/^0+/, '') || '0';
            }
        }
        
        setFormData((prev) => ({
            ...prev,
            [name]: processedValue,
        }));
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                id: items.length + 1,
                qty: 0,
                price: 0,
                discount: 0,
                tax: 0,
                amount: 0,
            },
        ]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        calculateTotal(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        
        // Handle numeric fields and remove leading zeros
        if (["qty", "price", "discount", "tax", "amount", "pricePerUnit"].includes(field)) {
            // Convert value to string to ensure string methods work, handle null/undefined
            const stringValue = value !== null && value !== undefined ? String(value) : '';
            if (stringValue === "" || /^[0-9]*\.?[0-9]*$/.test(stringValue)) {
                // Remove leading zeros but preserve decimal values and single zero
                let processedValue = stringValue;
                if (stringValue !== '' && stringValue !== '0' && !stringValue.startsWith('0.')) {
                    processedValue = stringValue.replace(/^0+/, '') || '0';
                }
                newItems[index][field] = processedValue;
            }
        } else {
            newItems[index][field] = value;
        }

        // Two-way calculation logic
        let parsedItem = {
            ...newItems[index],
            qty: parseFloat(newItems[index].qty) || 0,
            price: parseFloat(newItems[index].price) || 0,
            discount: parseFloat(newItems[index].discount) || 0,
            tax: parseFloat(newItems[index].tax) || 0,
            amount: parseFloat(newItems[index].amount) || 0,
        };

        if (field === "price" || field === "tax") {
            // Calculate amount from price and tax
            newItems[index].amount = calculateAmount(parsedItem);
        } else if (field === "amount") {
            // Calculate price from amount and tax
            newItems[index].price = calculatePriceFromAmount(parsedItem.amount, parsedItem.tax);
            newItems[index].pricePerUnit = newItems[index].price;
        }
        if (field === "price") {
            newItems[index].pricePerUnit = value;
        }

        setItems(newItems);
        calculateTotal(newItems);
    };

    const calculateAmount = (item) => {
        const taxAmount = (item.price * item.tax) / 100;
        return item.price + taxAmount;
    };

    // Helper to calculate price from amount and tax
    const calculatePriceFromAmount = (amount, tax) => {
        // price = amount / (1 + tax/100)
        if (tax === 0) return amount;
        return +(amount / (1 + tax / 100)).toFixed(2);
    };

    const calculateTotal = (items) => {
        // Calculate subtotal from items
        const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
        
        // Calculate discount based on current form data
        const discountPercentage = parseFloat(formData.discountPercentage) || 0;
        const discountAmount = parseFloat(formData.discountAmount) || 0;
        
        let finalDiscountAmount = 0;
        
        // Use percentage if it exists, otherwise use amount
        if (discountPercentage > 0) {
            finalDiscountAmount = parseFloat(((subtotal * discountPercentage) / 100).toFixed(2));
        } else if (discountAmount > 0) {
            finalDiscountAmount = discountAmount;
        }
        
        // Calculate final total and balance
        const finalTotal = subtotal - finalDiscountAmount;
        const advanced = parseFloat(formData.advanced) || 0;
        const balance = parseFloat((finalTotal - advanced).toFixed(2));
        
        // Update all related fields together to avoid circular updates
        setTotal(balance);
        setFormData(prev => ({
            ...prev,
            discountAmount: finalDiscountAmount,
            balance: balance
        }));
    };

    useEffect(() => {
        calculateTotal(items);
    }, [formData.discountPercentage, formData.discountAmount, formData.advanced, items]);




    const handleDeviceTypeChange = (value) => {
        setDeviceType(value);
        setFormData((prev) => ({ ...prev, model: "" })); // Reset model when device type changes
    };
    // Modify `handleSaveOrder` to save the order
    const handleSaveOrder = async () => {
      // Show confirmation dialog for final edit
      if (isFinalEdit) {
        setShowCompletionConfirm(true);
        return;
      }
      
      // For regular saves, proceed directly
      await performSaveOrder();
    };

    // Separate function to perform the actual save operation
    const performSaveOrder = async () => {
      // For new orders, don't show ticket number to user - generate it in backend
      let currentTicketNumber = formData.ticketNumber;
      
      // Validation checks (don't require ticket number for new orders)
      if (!formData.customerName || !formData.phone || !deviceType || !formData.model) {
        alert("Please fill in all required fields.");
        return;
      }

      try {
        // Check if the customer exists
        const customerCheckResponse = await fetch(
          `${import.meta.env.VITE_APIURL}/api/customers/search-matching?name=${formData.customerName}&phoneNumber=${formData.phone}&alternativePhoneNumber=${formData.alternatePhone}`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }
        );
        const customerCheckData = await customerCheckResponse.json();

        let customerId;
        if (customerCheckData.success && customerCheckData.data.length > 0) {
          // Existing customer found
          customerId = customerCheckData.data[0]._id;
        } else {
          // New customer, create an entry
          const newCustomerResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/customers/create-or-update`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              name: formData.customerName,
              phoneNumber: formData.phone,
            //   email: formData.email || "",
              alternativePhoneNumber: formData.alternatePhone,
              address: formData.address || "",
              gstNumber: formData.gstNumber || "", 
              devices: [
                {
                  imei: formData.imeiNumber,
                  serialNumber: formData.serialNumber,
                  deviceType: deviceType,
                  deviceModel: formData.model,
                },
              ],
            }),
          });

          const newCustomerData = await newCustomerResponse.json();
          if (newCustomerResponse.ok) {
            customerId = newCustomerData.data._id;
            // send welcome whatsAppMessage api call
            const welcomeMessageResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    phoneNumber: formData.phone,
                    message: getWelcomeMessage(formData.customerName),
                }),
            });
            if (welcomeMessageResponse.ok) {
                console.log("Welcome message sent successfully");
            } else {
                console.error("Failed to send welcome message");
            }
          } else {
            alert("Failed to create new customer: " + newCustomerData.message);
            return;
          }
        }

        // Prepare the payload for the sale order
        const payload = {
          ...formData,
          // Don't include ticketNumber for new orders - let backend generate it serially
          ...(invoiceId ? { ticketNumber: currentTicketNumber } : {}),
          date: new Date().toISOString().split("T")[0],
          deviceBrand: deviceType,
          discount: parseFloat(formData.discountPercentage) || 0,
          advanced: parseFloat(formData.advanced) || 0,
          balance: parseFloat(formData.balance) || 0,
          tax: 0,
          userId: userId,
          total: total,
          department: "Reception",
          customerId: customerId, // Link the customer ID
          gstNumber: formData.gstNumber || "", // Include GST number in sale order
          address: formData.address || "",
          // Set status to "Completed" if this is a final edit
          status: isFinalEdit ? "Completed" : (formData.status || "New"),
          items: items.map((item) => ({
            serialNumber: item.serialNumber,
            issue: item.issue,
            description: item.description,
            quantity: item.qty,
            unit: item.unit,
            warranty: item.warranty,
            pricePerUnit: item.price || item.pricePerUnit,
            discount: item.discount,
            tax: item.tax,
            amount: item.amount,
          })),
  
        };

        // Check if invoiceId is a valid MongoDB ObjectId
        const isValidObjectId = invoiceId && /^[0-9a-fA-F]{24}$/.test(invoiceId);

        // Send the payload to the server
        const response = await fetch(
          (invoiceId && isValidObjectId)
            ? `${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}` // Update existing sale order
            : `${import.meta.env.VITE_APIURL}/api/sale-orders`, // Create new sale order
          {
            method: (invoiceId && isValidObjectId) ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Update the UI with the generated ticket number from backend
          if (data.data.ticketNumber) {
            setFormData(prev => ({
              ...prev,
              ticketNumber: data.data.ticketNumber,
              referenceNumber: data.data.ticketNumber
            }));
          }
          
          setTicketNumber(data.data.ticketNumber);
          setServiceOrderId(data.data._id);
          setSaleOrderStatus(data.data.status);
          

          // Send WhatsApp message on status change
          if (saleOrderData && saleOrderData.status !== data.data.status) {
            try {
              const statusMessage = getStatusUpdateMessage(
                data.data.customerName || formData.customerName,
                data.data.ticketNumber || formData.ticketNumber,
                data.data.status
              );
              await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                  phoneNumber: data.data.phone || formData.phone,
                  message: statusMessage,
                }),
              });
            } catch (err) {
              console.error("Failed to send status update WhatsApp message", err);
            }
          }
          setSaleOrderData(data.data);
          const successMessage = isFinalEdit 
            ? `Sale order completed successfully! ✅ Ticket Number: ${data.data.ticketNumber} - Status: Completed`
            : `Sale order saved successfully! 🎯 Ticket Number: ${data.data.ticketNumber}`;
          alert(successMessage);
          
          // Redirect to sales orders list after successful save
          setTimeout(() => {
            navigate('/receptionist/saleorders');
          }, 2000);
          // Sale order saved successfully
        } else {
          const error = await response.json();
          alert("Failed to save sale order: " + error.message);
        }
      } catch (error) {
        console.error("Error saving sale order:", error);
        alert("An error occurred while saving the sale order.");
      }
  };

    const [searchQuery, setSearchQuery] = useState(""); // State for search input
    const [searchResults, setSearchResults] = useState([]); // State for search results
    const [isSearching, setIsSearching] = useState(false); // State to show loading indicator

    // Function to handle search input change
    const handleSearchChange = debounce(async (query) => {
        if (!query) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        // Determine if the query is numeric (phone number) or text (name)
        const isPhoneNumber = /^\d+$/.test(query); // Check if the query contains only digits
        const searchParam = isPhoneNumber ? `phoneNumber=${query}` : `name=${query}`;

        try {
            const response = await fetch(
                `${import.meta.env.VITE_APIURL}/api/customers/search?${searchParam}`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }
            );
            const data = await response.json();
            if (data.statusCode === 200) {
                setSearchResults(data.data);
            } else {
                console.error("Failed to fetch search results:", data.message);
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        } finally {
            setIsSearching(false);
        }
    }, 500); // Debounce to limit API calls

    const handleCustomerSelect = async (customer) => {
        setFormData((prev) => ({
            ...prev,
            customerName: customer.name,
            phone: customer.phoneNumber,
            alternatePhone: customer.alternativePhoneNumber || "",
            gstNumber: customer.gstNumber || "",
            address: customer.address || "",
        }));

        // Fetch the devices of the selected customer
        const devices = customer.devices || [];
        if (devices.length > 0) {
            const firstDevice = devices[0]; // Assuming you want to auto-select the first device
            setFormData((prev) => ({
                ...prev,
                imeiNumber: firstDevice.imei || "",
                serialNumber: firstDevice.serialNumber || "",
            }));
            setDeviceType(firstDevice.deviceType || "");

            // Fetch and set device models for the selected device type
            try {
                const response = await getDeviceModels(firstDevice.deviceType);
                const fetchedModels = response.data.deviceModels || [];
                setModels(fetchedModels);

                // Set the device model if it exists
                setFormData((prev) => ({
                    ...prev,
                    model: firstDevice.deviceModel || "",
                }));
            } catch (error) {
                console.error("Error fetching device models:", error);
            }
        }

        setSearchResults([]); // Clear search results
        setSearchQuery(""); // Clear search input
    };

    
      useEffect(() => {
        const fetchTasks = async () => {
            // Don't fetch tasks if ticket number is empty or undefined
            if (!formData.ticketNumber || formData.ticketNumber.trim() === '') {
                setTasks([]);
                return;
            }
        
            try {
              const token = localStorage.getItem('accessToken');
              const response = await axios.get(
                `${import.meta.env.VITE_APIURL}/api/task/get-tasks-by-ticket-number?ticketNumber=${formData.ticketNumber}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              if (response.data.statusCode === 200) {
                setTasks(response.data.data);
              } else {
                setTasks([]); // Clear tasks on error
              }
            } catch (error) {
              console.error("Error fetching tasks:", error);
              if (error.response) {
                if (error.response.status === 404) {
                  setTasks([]); // Set empty array for 404 (no tasks found)
                } else if (error.response.status === 401) {
                  setTasks([]);
                } else {
                  console.error("Server error:", error.response.status);
                  setTasks([]);
                }
              } else {
                console.error("Network error or server unavailable");
                setTasks([]); // Clear tasks on any other error
              }
            }
          
        };
    
        fetchTasks();
      }, [formData.ticketNumber,reload]); // Fetch tasks whenever the ticket number changes

    const handleAddIssue = (taskName) => {
        setItems((prevItems) => [
          ...prevItems,
          {
            id: prevItems.length + 1,
            issue: taskName,
            description: "",
            qty: 1,
            price: 0,
            discount: 0,
            tax: 0,
            amount: 0,
          },
        ]);
      };

    // Add this above your component or inside the component
    const ISSUE_OPTIONS = [
        { value: "water_damage", label: "Water Damage" },
        { value: "physical_damage", label: "Physical Damage" },
        { value: "display_replacement", label: "Display Replacement" },
        { value: "battery_change", label: "Battery Change" },
        { value: "wifi_network_issue", label: "WiFi/Network Issue" },
        { value: "storage_upgrade", label: "Storage Upgrade" },
        { value: "dead", label: "Dead" },
        { value: "restart_issue", label: "Restart Issue" },
        { value: "charging_issue", label: "Charging Issue" }
    ];

    const COLOR_OPTIONS = [
        { value: "black", label: "Black" },
        { value: "white", label: "White" },
        { value: "blue", label: "Blue" },
        { value: "green", label: "Green" },
        { value: "yellow", label: "Yellow" },
        { value: "pink", label: "Pink" },
        { value: "purple", label: "Purple" },
        { value: "red", label: "Product(RED)" },
        { value: "gold", label: "Gold" },
        { value: "silver", label: "Silver" },
        { value: "space_gray", label: "Space Gray" },
        { value: "midnight", label: "Midnight" },
        { value: "starlight", label: "Starlight" },
        { value: "deep_purple", label: "Deep Purple" },
        { value: "graphite", label: "Graphite" },
        { value: "pacific_blue", label: "Pacific Blue" },
        { value: "sierra_blue", label: "Sierra Blue" },
        { value: "alpine_green", label: "Alpine Green" },
        { value: "natural_titanium", label: "Natural Titanium" },
        { value: "blue_titanium", label: "Blue Titanium" },
        { value: "white_titanium", label: "White Titanium" },
        { value: "black_titanium", label: "Black Titanium" },
        { value: "coral", label: "Coral" },
        { value: "rose_gold", label: "Rose Gold" },
        { value: "jet_black", label: "Jet Black" },
        { value: "slate", label: "Slate" }
    ];
    // Update issueSearchInputs when items change (add/remove)
    useEffect(() => {
        setIssueSearchInputs(items.map((item, idx) => issueSearchInputs[idx] || ""));
        // eslint-disable-next-line
    }, [items.length]);

    const [issueSearchInputs, setIssueSearchInputs] = useState(items.map(() => "")); // for each item

    return (
        <>
        {/* Main Container with proper height management */}
        <div className="min-h-screen flex flex-col">
            {/* Content Area - takes available space but allows natural scrolling */}
            <div className="flex-1 pb-20">
                <div
                    className={`text-sm mx-auto p-4 rounded-lg shadow-lg border ${
                        isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"
                    }`}
                >
            <div className="w-full flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <h1 className="text-base font-semibold mb-2">
                            {invoiceId ? "Edit Service Order" : "New Service Order"}
                            {isFinalEdit && (
                                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                    Final Edit Mode
                                </span>
                            )}
                            {/* Status Indicator */}
                            {invoiceId && saleOrderStatus && (
                                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    saleOrderStatus === "New" 
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : saleOrderStatus === "In Progress"
                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                        : saleOrderStatus === "Completed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                    {saleOrderStatus}
                                </span>
                            )}
                        </h1>
                        {isFinalEdit && (
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                                This order will be marked as completed when saved.
                            </p>
                        )}
                        {/* Status Change Info */}
                        {invoiceId && saleOrderStatus === "New" && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                                💡 Status will change to "In Progress" when first task is created.
                            </p>
                        )}
                    </div>

                    <button
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-1 px-3 rounded flex items-center text-sm"
                        onClick={() => window.history.back()}
                    >
                        ← Back
                    </button>
                </div>

        {/* Content - Sale Order (Always Displayed) */}
            <div>
            
                {/* Search Section */}
                <div className="mb-4">
                    <label className="font-medium block mb-1 text-sm" htmlFor="customerSearch">
                        Search Customer
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="customerSearch"
                            placeholder="Search by name or phone number"
                            className={`${inputClass} pr-10`}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                handleSearchChange(e.target.value);
                            }}
                        />
                        <FaSearch className="absolute right-3 top-3 text-gray-500" />
                    </div>
                    {isSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
                    {searchResults.length > 0 && (
                        <ul className="border rounded mt-1 bg-white shadow-lg max-h-32 overflow-y-auto">
                            {searchResults.map((customer) => (
                                <li
                                    key={customer._id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                    onClick={() => handleCustomerSelect(customer)}
                                >
                                    Name : {customer.name}  Phone : {customer.phoneNumber},  {customer.alternativePhoneNumber}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                {/* Customer Info Section - Ticket number hidden for new orders */}
                {invoiceId && (
                    <div className="grid grid-cols-8 mb-4">
                        <label className="font-medium col-span-2 col-end-2 text-sm" htmlFor="ticketNumber">Ticket No</label>
                        <input
                            type="text"
                            name="ticketNumber"
                            id="ticketNumber"
                            placeholder="Ticket No"
                            className={`${inputClass} col-span-2 col-end-3 bg-gray-200 cursor-not-allowed`}
                            value={formData.ticketNumber}
                            onChange={handleInputChange}
                            disabled
                        />
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="customerName">Consumer Name</label>
                        <input
                            type="text"
                            name="customerName"
                            id="customerName"
                            placeholder="Consumer Name"
                            className={inputClass}
                            value={formData.customerName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="phone">Phone No.</label>
                        <input
                            type="text"
                            name="phone"
                            id="phone"
                            placeholder="Phone No."
                            className={inputClass}
                            value={formData.phone}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="alternatePhone">Alternate Phone No.</label>
                        <input
                            type="text"
                            name="alternatePhone"
                            id="alternatePhone"
                            placeholder="Alternate Phone No."
                            className={inputClass}
                            value={formData.alternatePhone}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="deviceType">Device Type</label>
                        <select
                            id="deviceType"
                            className={selectClass}
                            value={deviceType}
                            onChange={(e) => handleDeviceTypeChange(e.target.value)}
                        >
                            <option value="">Select Device Type</option>
                            {deviceTypes.map((type) => (
                                <option key={type._id} value={type._id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="model">Model</label>
                        <select
                            name="model"
                            id="model"
                            className={selectClass}
                            value={formData.model}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Model</option>
                            {models.map((model) => (
                                <option key={model._id} value={model._id}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="imeiNumber">IMEI No.</label>
                        <input
                            type="text"
                            name="imeiNumber"
                            id="imeiNumber"
                            placeholder="IMEI No."
                            className={inputClass}
                            value={formData.imeiNumber}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="serialNumber">Serial No.</label>
                        <input
                            type="text"
                            name="serialNumber"
                            id="serialNumber"
                            placeholder="Serial No."
                            className={inputClass}
                            value={formData.serialNumber}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="gstNumber">GST No.</label>
                        <input
                            type="text"
                            name="gstNumber"
                            id="gstNumber"
                            placeholder="GST No."
                            className={inputClass}
                            value={formData.gstNumber}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="address">Address</label>
                        <input
                            type="text"
                            name="address"
                            id="address"
                            placeholder="Address"
                            className={inputClass}
                            value={formData.address}
                            onChange={handleInputChange}
                        />
                    </div>
                    
                </div>

                {/* <div className="pb-4">
                    <h2 className="text-base font-semibold mb-2">Address</h2>
                    <div className="flex space-x-2 items-center">
                    <button
                        className="bg-purple-600 hover:bg-purple-700 flex items-center gap-4  text-white font-medium py-2 px-6 rounded shadow"
                        onClick={() => setIsAddressPopupOpen(true)}
                    >
                        {Object.values(address).some((value) => value) ? (
                            <>
                                View Address <FaMapMarkerAlt />
                            </>
                        ) : (
                            <>
                                Add Address <FaPlus />
                            </>
                        )}
                    </button>
                    </div>
                </div> */}

                {/* Add Item Button */}
            

                {/* Items Table */}
                <div
                className={`text-sm mb-4 mx-auto p-4 overflow-auto rounded-lg shadow-lg border ${
                    isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-black"
                }`}
                >
                    <table className=" border rounded-lg">
                        <thead
                            className={` ${isDarkMode ? "bg-purple-400" : "bg-purple-400 test-white"}`}
                        >
                            <tr>
                                <th className="border p-1 text-sm">Item</th>
                                <th className="border p-1 text-sm">Issue</th>
                                <th className="border p-1 text-sm">Description</th>
                                <th className="border p-1 text-sm">Warranty</th>
                                <th className="border p-1 text-sm">Price/Unit</th>
                                <th className="border p-1 text-sm">Tax</th>
                                <th className="border p-1 text-sm">Amount</th>
                                <th className="border p-1 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id}>
                                    <td className="border p-1 text-sm">{index + 1}</td>
                                    <td className="border p-1">
                                        <input
                                            type="text"
                                            className={inputClass}
                                            placeholder="Type or select issue"
                                            value={
                                                // Show label if value matches an option, else show the custom value
                                                (() => {
                                                    const matched = ISSUE_OPTIONS.find(opt => opt.value === item.issue);
                                                    return matched ? matched.label : (item.issue || "");
                                                })()
                                            }
                                            onChange={e => {
                                                const val = e.target.value;
                                                setIssueSearchInputs(inputs => {
                                                    const arr = [...inputs];
                                                    arr[index] = val;
                                                    return arr;
                                                });
                                                // Don't update item.issue yet, wait for selection or blur
                                                handleItemChange(index, "issue", val);
                                            }}
                                            onBlur={e => {
                                                const val = e.target.value;
                                                // If matches a label, save the value, else save as custom
                                                const matched = ISSUE_OPTIONS.find(opt => opt.label.toLowerCase() === val.toLowerCase());
                                                if (matched) {
                                                    handleItemChange(index, "issue", matched.value);
                                                } else {
                                                    handleItemChange(index, "issue", val);
                                                }
                                            }}
                                            list={`issue-options-${index}`}
                                            autoComplete="off"
                                        />
                                        <datalist id={`issue-options-${index}`}>
                                            {issueSearchInputs[index]
                                                ? ISSUE_OPTIONS.filter(opt =>
                                                    opt.label.toLowerCase().includes(issueSearchInputs[index].toLowerCase())
                                                ).map(opt => (
                                                    <option key={opt.value} value={opt.label} />
                                                ))
                                                : null}
                                        </datalist>
                                    </td>
                                    <td className="border p-1">
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={item.description || ""}
                                            onChange={(e) =>
                                                handleItemChange(index, "description", e.target.value)
                                            }
                                        />
                                    </td>
                                    <td className="border p-2">
                                        <select
                                            className={inputClass}
                                            value={item.warranty || ""}
                                            onChange={(e) =>
                                                handleItemChange(index, "warranty", e.target.value)
                                            }
                                        >
                                            <option value="N/A">Select Warranty</option>
                                            <option value="1_month">1 Month</option>
                                            <option value="3_months">3 Months</option>
                                            <option value="6_months">6 Months</option>
                                            <option value="12_months">12 Months</option>
                                        </select>
                                    </td>
                                    <td className="border p-2" style={{ width: "10%" }}>
                                        <input
                                            style={{ maxWidth: "100%" }}
                                            type="number"
                                            className={inputClass}
                                            value={item.pricePerUnit}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "price",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="border p-2">
                                        <select
                                            className={inputClass}
                                            value={item.tax}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "tax",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value={0}>Select</option>
                                            <option value={9}>9%</option>
                                            <option value={12}>12%</option>
                                            <option value={18}>18%</option>
                                        </select>
                                    </td>
                                    <td className="border p-2">
                                        
                                        <input
                                            style={{ maxWidth: "100%" }}
                                            type="number"
                                            className={inputClass}
                                            value={item.amount}
                                            onChange={(e) =>
                                                handleItemChange(
                                                    index,
                                                    "amount",
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="border p-2">
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="bg-red-500 text-white px-2 py-1 rounded"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-4 w-full flex justify-end">
                    <button
                        onClick={addItem}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded"
                    >
                        Add Item
                    </button>
                </div>
                </div>

                {/* Additional Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <input
                        type="text"
                        name="assetsReceived"
                        placeholder="Assets Received With The Device"
                        className={inputClass}
                        value={formData.assetsReceived}
                        onChange={handleInputChange}
                    />
                    <select
                        name="paymentType"
                        className={selectClass}
                        value={formData.paymentType}
                        onChange={handleInputChange}
                    >
                        <option value="">Select Payment Type</option>
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Cash + UPI">Cash + UPI</option>
                        <option value="Paytm">Paytm</option>
                        <option value="GPay">GPay</option>
                        <option value="Card">Card</option>
                    </select>
                   
                    <input
                        type="text"
                        name="technicianName"
                        placeholder="Diagonostic Technitian"
                        className={inputClass}
                        value={formData.technicianName}
                        onChange={handleInputChange}
                    />
                    <input
                        type="text"
                        name="color"
                        placeholder="Type or select color"
                        className={inputClass}
                        value={
                            (() => {
                                const matched = COLOR_OPTIONS.find(opt => opt.value === formData.color);
                                return matched ? matched.label : (formData.color || "");
                            })()
                        }
                        onChange={e => {
                            const val = e.target.value;
                            // Don't update formData.color yet, wait for selection or blur
                            setFormData(prev => ({ ...prev, color: val }));
                        }}
                        onBlur={e => {
                            const val = e.target.value;
                            // If matches a label, save the value, else save as custom
                            const matched = COLOR_OPTIONS.find(opt => opt.label.toLowerCase() === val.toLowerCase());
                            if (matched) {
                                setFormData(prev => ({ ...prev, color: matched.value }));
                            } else {
                                setFormData(prev => ({ ...prev, color: val }));
                            }
                        }}
                        list="color-options"
                        autoComplete="off"
                    />
                    <datalist id="color-options">
                        {formData.color
                            ? COLOR_OPTIONS.filter(opt =>
                                opt.label.toLowerCase().includes(formData.color.toLowerCase())
                            ).map(opt => (
                                <option key={opt.value} value={opt.label} />
                            ))
                            : COLOR_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.label} />
                            ))}
                    </datalist>
                </div>

                {/* Financial Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="discountPercentage">Discount %</label>
                        <input
                            type="number"
                            step="0.01"
                            name="discountPercentage"
                            id="discountPercentage"
                            placeholder="Discount %"
                            className={inputClass}
                            value={formData.discountPercentage === 0 ? '' : formData.discountPercentage}
                            onChange={(e) => {
                                let value = e.target.value;
                                // Remove leading zeros but preserve decimal values and single zero
                                if (value !== '' && value !== '0' && !value.startsWith('0.')) {
                                    value = value.replace(/^0+/, '') || '0';
                                }
                                setFormData(prev => ({
                                    ...prev,
                                    discountPercentage: value,
                                    discountAmount: 0 // Reset amount when percentage changes
                                }));
                            }}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="discountAmount">Discount Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            name="discountAmount"
                            id="discountAmount"
                            placeholder="Discount Amount"
                            className={inputClass}
                            value={formData.discountAmount === 0 ? '' : formData.discountAmount}
                            onChange={(e) => {
                                let value = e.target.value;
                                // Remove leading zeros but preserve decimal values and single zero
                                if (value !== '' && value !== '0' && !value.startsWith('0.')) {
                                    value = value.replace(/^0+/, '') || '0';
                                }
                                setFormData(prev => ({
                                    ...prev,
                                    discountAmount: value,
                                    discountPercentage: 0 // Reset percentage when amount changes
                                }));
                            }}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="advanced">Advanced</label>
                        <input
                            type="number"
                            step="0.01"
                            name="advanced"
                            id="advanced"
                            placeholder="Advanced Payment"
                            className={inputClass}
                            value={formData.advanced === 0 ? '' : formData.advanced}
                            onChange={(e) => {
                                let value = e.target.value;
                                // Remove leading zeros but preserve decimal values and single zero
                                if (value !== '' && value !== '0' && !value.startsWith('0.')) {
                                    value = value.replace(/^0+/, '') || '0';
                                }
                                setFormData(prev => ({
                                    ...prev,
                                    advanced: value
                                }));
                            }}
                        />
                    </div>
                    <div>
                        <label className="font-medium block mb-1 text-sm" htmlFor="balance">Balance</label>
                        <input
                            type="number"
                            step="0.01"
                            name="balance"
                            id="balance"
                            placeholder="Balance"
                            className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                            value={formData.balance || 0}
                            readOnly
                        />
                    </div>
                </div>

                {/* Footer Section */}
                <div className="flex justify-end items-center mt-6">
                    <div className="flex items-center">
                        <div className="text-right">
                            <div className="text-sm text-gray-600">Subtotal: {(total || 0).toFixed(2)}</div>
                            <div className="text-sm text-gray-600">Discount: {(parseFloat(formData.discountAmount) || 0).toFixed(2)}</div>
                            <div className="text-sm text-gray-600">Advanced: {(parseFloat(formData.advanced) || 0).toFixed(2)}</div>
                            <div className="font-bold">Balance: {(formData.balance || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Task Details Section */}
                <div className="mb-4 mt-6">
                    {invoiceId && (
                        <CollapsibleSection
                            title="Task Details"
                            headerAction={
                                <button
                                    onClick={() => setIsTaskModalOpen(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm"
                                >
                                    <FaPlus />
                                    Create Task
                                </button>
                            }
                            tasks={tasks.map((task) => {
                                
                                return {
                                    ...task,
                                    actions: (
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => {
                                                    handleEditTask(task);
                                                }}
                                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
                                                title="Edit Task"
                                            >
                                                <FaEdit size={12} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleDeleteTask(task._id || task.id);
                                                }}
                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
                                                title="Delete Task"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRequestPartTask({
                                                        taskId: task._id || task.id,
                                                        ticketId: task.ticketNumber,
                                                        parts: task.parts || [],
                                                    });
                                                    setIsRequestPartModalOpen(true);
                                                }}
                                                className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-sm flex items-center gap-1"
                                                title="Request Parts"
                                            >
                                                <FaPlus size={12} />
                                            </button>
                                        </div>
                                    ),
                                action: (
                                    <button
                                        onClick={() => handleAddIssue(task.name)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                                    >
                                        Add Issue
                                    </button>
                                ),
                                };
                            })}
                        />
                    )}
                </div>
                
                {/* Add bottom padding to prevent content from being hidden behind fixed footer */}
              
            

                {/* Address Popup */}
                {isAddressPopupOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                        <div
                            className={`p-6 rounded shadow-lg ${
                                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
                            }`}
                            style={{ width: "400px" }}
                        >
                            <h2 className="text-xl font-semibold mb-4">Add Address</h2>
                            <div className="grid grid-cols-2 gap-4">
                            <input
                                    type="text"
                                    placeholder="Address Line 1"
                                    className={`p-2 border col-span-2 rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.addressLine1 || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, addressLine1: e.target.value }))
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Address Line 2"
                                    className={`p-2 border col-span-2 rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.addressLine2 || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, addressLine2: e.target.value }))
                                    }
                                />
                            
                                <input
                                    type="text"
                                    placeholder="Apartment"
                                    className={`p-2 border col-span-2 rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.apartment || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, apartment: e.target.value }))
                                    }
                                />
                            
                                <input
                                    type="text"
                                    placeholder="Street/Area"
                                    className={`p-2 border col-span-2 rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.area || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, area: e.target.value }))
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="City"
                                    className={`p-2 border rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.city || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, city: e.target.value }))
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="State"
                                    className={`p-2 border rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.state || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, state: e.target.value }))
                                    }
                                />
                                <input
                                    type="text"
                                    placeholder="Pincode"
                                    className={`p-2 border rounded ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={address.pincode || ""}
                                    onChange={(e) =>
                                        setAddress((prev) => ({ ...prev, pincode: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    className="bg-red-500 text-white font-medium py-2 px-6 rounded shadow"
                                    onClick={() => setIsAddressPopupOpen(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded shadow"
                                    onClick={handleAddressSubmit}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        {/* Add Task Modal */}
        {isTaskModalOpen && (
            <AddTaskModal
                isDarkMode={isDarkMode}
                technicians={technicians}
                selectedTechnician={selectedTechnician}
                setSelectedTechnician={setSelectedTechnician}
                taskName={taskName}
                ticketNumber={saleOrderData?.ticketNumber}
                saleOrderId={serviceOrderId}
                setTaskName={setTaskName}
                taskDescription={taskDescription}
                setTaskDescription={setTaskDescription}
                priorityLevel={priorityLevel}
                setPriorityLevel={setPriorityLevel}
                note={note}
                setNote={setNote}
                onClose={handleTaskModalClose}
                onSuccess={handleTaskCreationSuccess}
            />
        )}

        {/* Edit Task Modal */}
        {isEditTaskModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-lg ${
                    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                }`}>
                    <h2 className="text-xl font-bold mb-4">Edit Task</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Task Name</label>
                            <input
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                className={`w-full p-2 border rounded ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-black'
                                }`}
                                placeholder="Enter task name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) => setTaskDescription(e.target.value)}
                                className={`w-full p-2 border rounded ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-black'
                                }`}
                                placeholder="Enter task description"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Assigned To</label>
                            <select
                                value={selectedTechnician}
                                onChange={(e) => setSelectedTechnician(e.target.value)}
                                className={`w-full p-2 border rounded ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-black'
                                }`}
                            >
                                <option value="">Select Technician</option>
                                {technicians.map((tech) => (
                                    <option key={tech.id} value={tech.id}>
                                        {tech.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Priority Level</label>
                            <select
                                value={priorityLevel}
                                onChange={(e) => setPriorityLevel(e.target.value)}
                                className={`w-full p-2 border rounded ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-black'
                                }`}
                            >
                                <option value="">Select Priority</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Note</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className={`w-full p-2 border rounded ${
                                    isDarkMode 
                                        ? 'bg-gray-700 border-gray-600 text-white' 
                                        : 'bg-white border-gray-300 text-black'
                                }`}
                                placeholder="Enter additional notes"
                                rows={2}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleUpdateTask}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                        >
                            Update Task
                        </button>
                        <button
                            onClick={handleEditTaskModalClose}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Request Part Modal */}
        {isRequestPartModalOpen && requestPartTask && (
            <RequestPartModal
                isOpen={isRequestPartModalOpen}
                onClose={() => {
                    setIsRequestPartModalOpen(false);
                    // Refresh tasks after closing modal
                    if (saleOrderData?.ticketNumber) {
                        fetchTasks(saleOrderData.ticketNumber);
                    }
                }}
                taskId={requestPartTask.taskId}
                ticketId={requestPartTask.ticketId}
                parts={requestPartTask.parts}
            />
        )}
        
                </div>
            </div>
            
            {/* Sticky Footer - respects layout flow */}
            <div className={` fixed bottom-0  border-t shadow-lg z-50 mt-auto] mr-2 ${
                isDarkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300 text-black"
            }`} style={{ width: '-webkit-fill-available'}}>
                <div className=" p-4 flex justify-end items-center">
                    <button
                        onClick={handleSaveOrder}
                        className={`font-medium py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 ${
                            isFinalEdit 
                                ? "bg-purple-600 hover:bg-purple-700 text-white"
                                : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                    >
                        {isFinalEdit ? "Complete Sale Order" : "Save and Next"}
                    </button>
                </div>
            </div>
        </div>

        {/* Completion Confirmation Popup */}
        {showCompletionConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`max-w-md w-full mx-4 p-6 rounded-lg shadow-lg ${
                    isDarkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400">Complete Sale Order</h2>
                    </div>
                    
                    <div className="mb-6">
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            You are about to complete this sale order. This action will:
                        </p>
                        <ul className={`text-sm space-y-2 mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                Change the order status to "Completed"
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                Lock the order from further edits
                            </li>
                            <li className="flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                Send completion notification to customer
                            </li>
                        </ul>
                        <div className={`p-3 rounded-lg border-l-4 border-orange-500 ${
                            isDarkMode ? 'bg-orange-900/20 text-orange-200' : 'bg-orange-50 text-orange-800'
                        }`}>
                            <p className="text-sm font-medium">
                                ⚠️ Warning: This action cannot be undone!
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCompletionConfirm(false)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                                isDarkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-gray-300'
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                setShowCompletionConfirm(false);
                                await performSaveOrder();
                            }}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                        >
                            Complete Order
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default NewSaleOrder;
