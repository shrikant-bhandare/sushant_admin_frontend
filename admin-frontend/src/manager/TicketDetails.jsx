import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import useLoader from "../customHooks/useLoader";
import AddTaskModal from "../components/modals/AddTaskModal";
import RequestPartModal from "../components/modals/RequestPartModal"; // Import the modal
// At the top of your file
import ServiceOrderView from "../receptionist/ServiceOrder"; // Adjust the path if needed
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
const TicketDetails = ({ serviceOrderId = "" ,onNext}) => {
    var { orderId } = useParams();
    if (!orderId) {
        orderId = serviceOrderId;
    }
    // const orderId=  "681631a5e933ebfd2b339377"
    console.log("Order ID:", orderId);
    // const { orderId: orderId } = useParams();
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const { Loader, showLoader, hideLoader } = useLoader();
    const [showServiceOrderModal, setShowServiceOrderModal] = useState(false);
    const [saleOrder, setSaleOrder] = useState(null);
    const [diagnosticReport, setDiagnosticReport] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [tasks, setTasks] = useState([]); // State to store tasks
    const [selectedTechnician, setSelectedTechnician] = useState("");
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskPartAssigned, setTaskPartAssigned] = useState("");
    const [note, setNote] = useState("");
    const [priorityLevel, setPriorityLevel] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRequestPartModalOpen, setIsRequestPartModalOpen] = useState(false);
    const [requestPartTask, setRequestPartTask] = useState(null);
    const [showTaskButton, setShowTaskButton] = useState(true);

    useEffect(() => {
        const fetchSaleOrder = async () => {
            showLoader();
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_APIURL}/api/sale-orders/${orderId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }
                    }
                );
                const data = await response.json();
                if (data.success) {
                    setSaleOrder(data.data);
                    if (data.data.ticketNumber) {
                        fetchTasks(data.data.ticketNumber);
                    }
                }
            } catch (error) {
                console.error("Error fetching sale order:", error);
            } finally {
                hideLoader();
            }
        };

        const fetchTasks = async (ticketNumber) => {
            try {
                const response = await fetch(
                    `${
                        import.meta.env.VITE_APIURL
                    }/api/task/get-tasks-by-ticket-number?ticketNumber=${ticketNumber}`,
                    {
                        headers: {
                            accept: "application/json",
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        },
                    }
                );
                const data = await response.json();
                if (data.status === "Success") {
                    setTasks(data.data);
                } else {
                    console.error("Failed to fetch tasks:", data.message);
                }
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };

        fetchSaleOrder();
    }, [orderId]);

    const fetchTasks = async (ticketNumber) => {
        try {
            const response = await fetch(
                `${
                    import.meta.env.VITE_APIURL
                }/api/task/get-tasks-by-ticket-number?ticketNumber=${ticketNumber}`,
                {
                    headers: {
                        accept: "application/json",
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                }
            );
            const data = await response.json();
            if (data.status === "Success") {
                setTasks(data.data);
            } else {
                console.error("Failed to fetch tasks:", data.message);
            }
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };
    useEffect(() => {
        const hasPendingTasks = tasks.some(
            (task) => task.status !== "Completed"
        );
        setShowTaskButton(!hasPendingTasks);
    }, [tasks]);

    useEffect(() => {
        const fetchTechnicians = async () => {
            showLoader();
            try {
                const response = await fetch(
                    `${
                        import.meta.env.VITE_APIURL
                    }/api/user/list-users?role=technician`,
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
                } else {
                    console.error("Failed to fetch technicians:", data.message);
                }
            } catch (error) {
                console.error("Error fetching technicians:", error);
            } finally {
                hideLoader();
            }
        };

        fetchTechnicians();
    }, []);

    const handleAssignTechnician = async () => {
        if (!selectedTechnician) {
            alert("Please select a technician.");
            return;
        }

        showLoader();
        try {
            const response = await fetch(
                `${
                    import.meta.env.VITE_APIURL
                }/api/orders/${orderId}/assign-technician`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ technicianId: selectedTechnician }),
                }
            );

            if (response.ok) {
                alert("Technician assigned successfully!");
                setIsModalOpen(false);
            } else {
                alert("Failed to assign technician.");
            }
        } catch (error) {
            console.error("Error assigning technician:", error);
        } finally {
            hideLoader();
        }
    };

    const handleMarkAsPostDiagnostic = async () => {
        if (!saleOrder) {
            alert("Sale order details are not loaded yet.");
            return;
        }

        showLoader();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APIURL}/api/sale-orders/${orderId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ status: "PostDiagnostic" }),
                }
            );

            if (response.ok) {
                alert("Ticket marked as PostDiagnostic successfully!");
                setSaleOrder((prev) => ({ ...prev, status: "PostDiagnostic" }));
                // /receptionist/alldepartments/diagnostic-technician/6814f59ea563f1cb98058f18
                if (
                    location.pathname.includes(
                        "/receptionist/alldepartments/diagnostic-technician/"
                    ) 
                ) {
                    navigate(
                        `/receptionist/alldepartments/postdiagnostic/${orderId}`
                    );
                }
                if (
                    location.pathname.includes(
                        "/receptionist/saleorders/edit/"
                    )
                ) {
                    onNext();
                }
            } else {
                alert("Failed to mark ticket as PostDiagnostic.");
            }
        } catch (error) {
            console.error("Error marking ticket as complete:", error);
        } finally {
            hideLoader();
        }
    };

    const     handleClose = () => {
        setIsModalOpen(false);
        fetchTasks(saleOrder?.ticketNumber);
    };
    

    return (
        <div
            className={`min-h-[calc(100vh-96px)] p-4 flex  justify-center ${
                isDarkMode
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-800"
            }`}
        >
            <div>
                <Loader />
                <div
                    className={`p-6  w-full rounded-lg shadow-md ${
                        isDarkMode
                            ? "bg-gray-800 text-white"
                            : "bg-white text-gray-800"
                    }`}
                >
                    <div className="flex justify-between items-center ">
                        <button
                            onClick={() => navigate(-1)} // Navigate to the previous page
                            className="bg-gray-500 hidden text-white py-2 px-4 rounded-md hover:bg-gray-600"
                        >
                            Back
                        </button>
                        <h1 className="text-3xl font-bold text-center">
                            Ticket Details
                        </h1>
                        <div className="mt-6 flex mx-2 justify-center gap-4">
                            <button
                        
                                onClick={() => setIsModalOpen(true)}
                                className="bg-blue-500 text-white py-1 px-2 md:py-2 md:px-6 rounded-md hover:bg-blue-600"
                            >
                                Create Task
                            </button>
                            <button
                                style={showTaskButton && tasks.length > 0 ? {} : { display: "none" }}
                                onClick={handleMarkAsPostDiagnostic}
                                className="bg-green-500 text-white py-1 px-2 md:py-2 md:px-6 rounded-md hover:bg-green-600"
                            >
                                Move to Post diagnostic
                            </button>
                            <button
                            onClick={() => setShowServiceOrderModal(true)}
                            className="bg-purple-600 text-white py-2 px-6 rounded-md hover:bg-purple-700"
                            >
                            View Service Order
                            </button>
                        </div>
                    </div>
                    {saleOrder ? (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
                                    Tasks
                                </h2>
                                {tasks.length > 0 ? (
                                    <div className="space-y-4">
                                        {tasks.map((task) => (
                                            <div
                                                key={task._id}
                                                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300"
                                            >
                                                {/* Task Header */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                                                            {task.taskName}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {task.taskDescription}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                            task.priorityLevel === "High"
                                                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-300 dark:border-red-700"
                                                                : task.priorityLevel === "Medium"
                                                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700"
                                                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700"
                                                        }`}>
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                task.priorityLevel === "High" ? "bg-red-500" 
                                                                : task.priorityLevel === "Medium" ? "bg-yellow-500" 
                                                                : "bg-green-500"
                                                            }`}></div>
                                                            {task.priorityLevel} Priority
                                                        </span>
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                                            task.status === "Completed"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-300 dark:border-green-700"
                                                                : task.status === "InProgress"
                                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                                                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-700"
                                                        }`}>
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${
                                                                task.status === "Completed" ? "bg-green-500" 
                                                                : task.status === "InProgress" ? "bg-blue-500" 
                                                                : "bg-gray-500"
                                                            }`}></div>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Technician Info */}
                                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                Assigned Technician
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {task?.technician?.name || task?.technician?.username || 'Not Assigned'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Parts Section */}
                                                {task.parts && task.parts.length > 0 && (
                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Required Parts ({task.parts.length})
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {task.parts.map((part) => (
                                                                <div
                                                                    key={part.partId._id}
                                                                    className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                                                                >
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between items-start">
                                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Part Name</span>
                                                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                                                part.orderStatus === "Available" 
                                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                                                    : part.orderStatus === "Ordered"
                                                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                                                            }`}>
                                                                                {part.orderStatus}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                            {part.partId.name}
                                                                        </p>
                                                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                                            <span>Type: {part.partType.type}</span>
                                                                            <span>Qty: {part.quantity}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Button */}
                                                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
                                                    <button
                                                        onClick={() => {
                                                            setRequestPartTask({
                                                                taskId: task._id,
                                                                ticketId: task.ticketNumber,
                                                                parts: task.parts,
                                                            });
                                                            setIsRequestPartModalOpen(true);
                                                        }}
                                                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                        </svg>
                                                        Assign Parts
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Tasks Available</h3>
                                        <p className="text-gray-600 dark:text-gray-400">No tasks have been created for this ticket yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center">
                            Loading sale order details...
                        </p>
                    )}
                </div>
                {isModalOpen && (
                    <AddTaskModal
                        isDarkMode={isDarkMode}
                        technicians={technicians}
                        selectedTechnician={selectedTechnician}
                        setSelectedTechnician={setSelectedTechnician}
                        taskName={taskName}
                        ticketNumber={saleOrder?.ticketNumber}
                        saleOrderId={saleOrder?._id || ""}
                        setTaskName={setTaskName}
                        taskDescription={taskDescription}
                        setTaskDescription={setTaskDescription}
                        taskPartAssigned={taskPartAssigned}
                        setTaskPartAssigned={setTaskPartAssigned}
                        priorityLevel={priorityLevel}
                        setPriorityLevel={setPriorityLevel}
                        note={note}
                        setNote={setNote}
                        onClose={handleClose}
                        onCreate={handleAssignTechnician}
                    />
                )}
                {isRequestPartModalOpen && requestPartTask && (
                    <RequestPartModal
                        isOpen={isRequestPartModalOpen}
                        onClose={() => 
                            {
                                setIsRequestPartModalOpen(false);
                                fetchTasks(saleOrder?.ticketNumber);
                            }
                        }
                        taskId={requestPartTask.taskId}
                        ticketId={requestPartTask.ticketId}
                        parts={requestPartTask.parts}
                    />
                )}
            </div>
            <Modal
                open={showServiceOrderModal}
                onClose={() => setShowServiceOrderModal(false)}
                aria-labelledby="service-order-modal-title"
                aria-describedby="service-order-modal-description"
                >
                <Box
                    sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "90vw",
                    maxWidth: 900,
                    bgcolor: "background.paper",
                    boxShadow: 24,
                    p: 2,
                    maxHeight: "95vh",
                    overflowY: "auto",
                    borderRadius: 2,
                    }}
                >
                    <div className="flex justify-between items-center mb-4">
                    <h2 id="service-order-modal-title" className="text-xl font-bold">
                        Service Order
                    </h2>
                    <button
                        onClick={() => setShowServiceOrderModal(false)}
                        className="text-gray-600 hover:text-red-600 text-lg font-bold"
                    >
                        ✕
                    </button>
                    </div>
                    {/* Use your existing component here */}
                    <ServiceOrderView serviceOrderId={saleOrder?._id || ""} />
                </Box>
                </Modal>
        </div>
    );
};

export default TicketDetails;
