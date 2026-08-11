import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { FaCheck, FaTimes, FaStethoscope, FaClipboardList, FaUser, FaDesktop, FaCalendarAlt, FaFileInvoice, FaExclamationTriangle, FaCheckCircle, FaClock, FaArrowLeft, FaTools, FaSave, FaBan, FaConciergeBell, FaMicrophone, FaBatteryFull, FaVolumeUp, FaCamera, FaFingerprint, FaMicrochip, FaQuoteRight } from 'react-icons/fa';
import useLoader from "../customHooks/useLoader"; // Import the useLoader hook
import useRole from "../customHooks/useRole";
import useUserId from "../customHooks/useUserid";

const Diagnose = ({serviceOrderId="",onNext}) => {
    const userRole = useRole();
    var { invoiceId } = useParams();
    if(!invoiceId){
        invoiceId = serviceOrderId;
    }
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [saleOrder, setSaleOrder] = useState(null);
    const userId = useUserId();

    const { Loader, showLoader, hideLoader } = useLoader(); // Destructure loader functions and component

    // Dynamic formData based on schema
    const [formData, setFormData] = useState({
        issuesDetected: [],
        hasCopyParts: false,
        serviceHistoryDetected: false,
        checks: {
            screen: { working: true, description: "" },
            battery: { working: true, description: "" },
            speakers: { working: true, description: "" },
            mic: { working: true, description: "" },
            chargingJack: { working: true, description: "" },
            bodyBackpanel: { working: true, description: "" },
            proximitySensor: { working: true, description: "" },
            camerasFlashlight: { working: true, description: "" },
            faceId: { working: true, description: "" },
            logicBoard: { working: true, description: "" },
            volumeButtons: { working: true, description: "" },
            fullQuotation: { working: true, description: "" },
        },
        description: "",
    });

    useEffect(() => {
        // Fetch sale order details
        axios
            .get(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            })
            .then((response) => {
                if (response.data.success) {
                    const saleOrderData = response.data.data;
                    setSaleOrder(saleOrderData);

                    // Fetch diagnostic report using diagnosticReportId
                    if (saleOrderData.diagnosticReportId) {
                        axios
                            .get(`${import.meta.env.VITE_APIURL}/api/diagnostics/${saleOrderData.diagnosticReportId}`, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                            })
                            .then((diagnosticResponse) => {
                                if (diagnosticResponse.data.success) {
                                    const diagnosticData = diagnosticResponse.data.data;
                                    setFormData((prev) => ({
                                        ...prev,
                                        ...diagnosticData, // Merge fetched diagnostic data into formData
                                    }));
                                }
                            })
                            .catch((error) => {
                                console.error("Error fetching diagnostic report:", error);
                            });
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching sale order:", error);
            });
    }, [invoiceId]);

    const handleCheckboxChange = (key, field, value) => {
        setFormData((prev) => ({
            ...prev,
            checks: {
                ...prev.checks,
                [key]: {
                    ...prev.checks[key],
                    [field]: value,
                },
            },
        }));
    };

    const handleSave = () => {
        const payload = {
            ticketId: invoiceId,
            issuesDetected: formData.issuesDetected,
            hasCopyParts: formData.hasCopyParts,
            serviceHistoryDetected: formData.serviceHistoryDetected,
            checks: formData.checks,
            description: formData.description,
            userId: userId,
        };

        axios
            .post(`${import.meta.env.VITE_APIURL}/api/diagnostics`, payload, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            })
            .then((response) => {
                if (response.data.success) {
                    console.log("Diagnostic data saved successfully:", response.data);
                    if(userRole === "receptionist"){
                        navigate(`/receptionist/saleorders/edit/${invoiceId}`,{replace: true});
                        onNext();
                    }else{
                        navigate("/diagnostic-technician/diagnostics");
                    }
                    
                } else {
                    console.error("Failed to save diagnostic data:", response.data.message);
                }
            })
            .catch((error) => {
                console.error("Error saving diagnostic data:", error);
            });
    };

    const handleCancel = () => {
        navigate(-1); // Navigate back to the previous page
    };

    const handleMarkAsComplete = async () => {
        if (!saleOrder) {
            alert("Sale order details are not loaded yet.");
            return;
        }

        showLoader(); // Show loader
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: "ConvertToSale" }),
                }
            );

            if (response.ok) {
                alert("Ticket marked as completed successfully!");
                setSaleOrder((prev) => ({ ...prev, status: "ConvertToSale" }));
                if(userRole === "receptionist"){
                    // navigate(`/receptionist/saleorders/edit/${invoiceId}`,{replace: true});
                    onNext();
                }
            } else {
                alert("Failed to mark ticket as completed.");
            }
        } catch (error) {
            console.error("Error marking ticket as complete:", error);
        } finally {
            hideLoader(); // Hide loader
        }
    };

    const handleMarkAsIncomplete = async () => {
        if (!saleOrder) {
            alert("Sale order details are not loaded yet.");
            return;
        }

        showLoader(); // Show loader
        try {
            const response = await fetch(
                `${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: "Incomplete" }),
                }
            );

            if (response.ok) {
                alert("Ticket marked as incomplete successfully!");
                setSaleOrder((prev) => ({ ...prev, status: "Incomplete" }));
            } else {
                alert("Failed to mark ticket as incomplete.");
            }
        } catch (error) {
            console.error("Error marking ticket as incomplete:", error);
        } finally {
            hideLoader(); // Hide loader
        }
    };

    if (!saleOrder) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                    <span className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading diagnostic data...</span>
                </div>
            </div>
        );
    }

    const getComponentIcon = (component) => {
        const iconMap = {
            screen: FaDesktop,
            battery: FaBatteryFull,
            speakers: FaVolumeUp,
            mic: FaMicrophone,
            chargingJack: FaConciergeBell,
            bodyBackpanel: FaTools,
            proximitySensor: FaExclamationTriangle,
            camerasFlashlight: FaCamera,
            faceId: FaFingerprint,
            logicBoard: FaMicrochip,
            volumeButtons: FaVolumeUp,
            fullQuotation: FaQuoteRight
        };
        return iconMap[component] || FaTools;
    };

    return (
        <div className={`min-h-screen p-4 sm:p-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
            <Loader />

            {/* Header with Back Button */}
            <div className={`mb-8 p-6 rounded-2xl ${isDarkMode ? 'bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-700' : 'bg-gradient-to-r from-white to-gray-50 border border-gray-200'} shadow-xl`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleCancel}
                            className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} shadow-md hover:shadow-lg transform hover:scale-105`}
                        >
                            <FaArrowLeft className="text-lg" />
                        </button>
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-blue-700 shadow-blue-500/25' : 'from-blue-100 to-blue-200 shadow-blue-200/50'} shadow-xl`}>
                            <FaStethoscope className={`text-2xl ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                        </div>
                        <div>
                            <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Device Diagnosis
                            </h1>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Comprehensive diagnostic assessment and checklist
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {saleOrder.status === "PostDiagnostic" && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleMarkAsComplete}
                                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5"
                            >
                                <FaCheckCircle className="mr-2" size={16} />
                                Convert to Sale
                            </button>
                            <button
                                onClick={handleMarkAsIncomplete}
                                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5"
                            >
                                <FaExclamationTriangle className="mr-2" size={16} />
                                Mark Incomplete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Main Content - Full Width */}
                <div className="space-y-6">
                    {/* Order Details with Actions & Status */}
                    <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-600/20' : 'bg-purple-100'}`}>
                                    <FaFileInvoice className={`text-lg ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                </div>
                                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Order Details
                                </h2>
                            </div>
                            
                            {/* Status Display */}
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <FaClock className={`text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status:</span>
                                </div>
                                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                                    saleOrder.status === 'open' 
                                        ? isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/40 text-blue-300 border-2 border-blue-600/50' : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-2 border-blue-300/60'
                                        : saleOrder.status === 'PostDiagnostic' 
                                            ? isDarkMode ? 'bg-gradient-to-r from-yellow-900/50 to-yellow-800/40 text-yellow-300 border-2 border-yellow-600/50' : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-2 border-yellow-300/60'
                                            : isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-green-800/40 text-green-300 border-2 border-green-600/50' : 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-2 border-green-300/60'
                                }`}>
                                    {saleOrder.status === 'open' && <FaClipboardList className="mr-2" size={14} />}
                                    {saleOrder.status === 'PostDiagnostic' && <FaClock className="mr-2" size={14} />}
                                    {saleOrder.status === 'Completed' && <FaCheckCircle className="mr-2" size={14} />}
                                    {saleOrder.status}
                                </span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                            <div className={`p-5 rounded-xl transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaFileInvoice className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Job ID</span>
                                </div>
                                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {saleOrder.ticketNumber}
                                </p>
                            </div>

                            <div className={`p-5 rounded-xl transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaCalendarAlt className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date</span>
                                </div>
                                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {saleOrder.createdAt.split("T")[0].replace(/-/g, "/").replace(/(\d{4})\/(\d{2})\/(\d{2})/, "$3/$2/$1")}
                                </p>
                            </div>

                            <div className={`p-5 rounded-xl transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaDesktop className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Device</span>
                                </div>
                                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {saleOrder.deviceBrand.name} {saleOrder.model.name}
                                </p>
                            </div>

                            <div className={`p-5 rounded-xl transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaUser className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Technician</span>
                                </div>
                                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {saleOrder.technicianName}
                                </p>
                            </div>

                            <div className={`p-5 rounded-xl transition-all duration-300 hover:shadow-md ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <FaTools className={`text-sm ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`} />
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Assets Received</span>
                                </div>
                                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {saleOrder.assetsReceived}
                                </p>
                            </div>
                        </div>

                        {/* Actions Section */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 mb-4">
                                <FaTools className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Available Actions</span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {(saleOrder?.status === "open" || saleOrder?.status === "postDiagnosed" || saleOrder?.status === "preDiagnosed") && saleOrder?.status !== "Completed" && (
                                    <button
                                        onClick={handleSave}
                                        className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-0.5"
                                    >
                                        <FaSave className="mr-2" size={16} />
                                        Save Diagnosis
                                    </button>
                                )}
                                
                                <button
                                    onClick={handleCancel}
                                    className={`inline-flex items-center justify-center px-6 py-3 font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 hover:-translate-y-0.5 ${
                                        isDarkMode 
                                            ? 'bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-gray-200' 
                                            : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800'
                                    }`}
                                >
                                    <FaBan className="mr-2" size={16} />
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Issues Section */}
                    <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-red-600/20' : 'bg-red-100'}`}>
                                <FaExclamationTriangle className={`text-lg ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                            </div>
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Reported Issues
                            </h2>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className={`w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <thead>
                                    <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                            #
                                        </th>
                                        <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                            Issue
                                        </th>
                                        <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                            Description
                                        </th>
                                        <th className={`text-left py-3 px-4 font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                            Priority
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {saleOrder.items.map((issue, index) => (
                                        <tr key={index} className={`border-b ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                                            <td className="py-4 px-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'}`}>
                                                    {index + 1}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <FaTools className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
                                                    <span className={`font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                                                        {issue.issue}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {issue.description}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    High
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            {saleOrder.items.length === 0 && (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <FaExclamationTriangle className="mx-auto mb-3 text-3xl opacity-50" />
                                    <p>No issues reported for this device</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Diagnostic Checklist */}
                    <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-xl`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                                <FaClipboardList className={`text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Diagnostic Checklist
                            </h2>
                        </div>

                        {/* Completion Notice */}
                        {saleOrder.status === 'Completed' && (
                            <div className={`mb-6 p-4 rounded-xl border-2 ${isDarkMode ? 'bg-green-900/20 border-green-600/50' : 'bg-green-50 border-green-300/60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-600/20' : 'bg-green-100'}`}>
                                        <FaCheckCircle className={`text-lg ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                                            Diagnosis Completed
                                        </h3>
                                        <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                            This diagnostic assessment has been completed and is now read-only.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {Object.keys(formData.checks).map((key) => {
                                const IconComponent = getComponentIcon(key);
                                const isWorking = formData.checks[key].working;
                                const isCompleted = saleOrder.status === 'Completed';
                                
                                return (
                                    <div
                                        key={key}
                                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                            !isCompleted ? 'hover:shadow-lg transform hover:-translate-y-1' : 'opacity-75 cursor-not-allowed'
                                        } ${
                                            isWorking
                                                ? isDarkMode 
                                                    ? `bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-600/50 ${!isCompleted ? 'hover:border-green-500/70' : ''}` 
                                                    : `bg-gradient-to-br from-green-50 to-green-100/50 border-green-300/60 ${!isCompleted ? 'hover:border-green-400/80' : ''}`
                                                : isDarkMode 
                                                    ? `bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-600/50 ${!isCompleted ? 'hover:border-red-500/70' : ''}` 
                                                    : `bg-gradient-to-br from-red-50 to-red-100/50 border-red-300/60 ${!isCompleted ? 'hover:border-red-400/80' : ''}`
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className={`p-2 rounded-lg transition-all duration-300 ${isWorking ? 'bg-green-100 shadow-green-200/50' : 'bg-red-100 shadow-red-200/50'} shadow-md`}>
                                                <IconComponent className={`text-sm ${isWorking ? 'text-green-600' : 'text-red-600'}`} />
                                            </div>
                                            <span className={`font-semibold text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                                            </span>
                                        </div>

                                        {/* Toggle Switch */}
                                        <div
                                            onClick={!isCompleted ? () => handleCheckboxChange(key, "working", !isWorking) : undefined}
                                            className={`relative w-12 h-6 flex items-center rounded-full transition-all duration-300 mb-3 shadow-inner ${
                                                !isCompleted ? 'cursor-pointer' : 'cursor-not-allowed'
                                            } ${
                                                isWorking ? "bg-gradient-to-r from-green-500 to-green-600 shadow-green-300/50" : "bg-gradient-to-r from-red-500 to-red-600 shadow-red-300/50"
                                            }`}
                                        >
                                            <div
                                                className={`absolute left-0.5 top-0.5 w-5 h-5 flex items-center justify-center bg-white rounded-full shadow-lg transition-all duration-300 transform ${
                                                    isWorking ? "translate-x-6" : "translate-x-0"
                                                }`}
                                            >
                                                {isWorking ? (
                                                    <FaCheck className="text-green-600 text-xs" />
                                                ) : (
                                                    <FaTimes className="text-red-600 text-xs" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Issue Description */}
                                        {!isWorking && (
                                            <textarea
                                                placeholder={isCompleted ? "Diagnosis completed" : `Issue details...`}
                                                className={`w-full p-2 rounded-lg border text-xs resize-none transition-all duration-300 ${
                                                    isCompleted 
                                                        ? isDarkMode 
                                                            ? 'bg-gray-800/50 border-gray-700/50 text-gray-400 cursor-not-allowed' 
                                                            : 'bg-gray-100/70 border-gray-300/50 text-gray-500 cursor-not-allowed'
                                                        : isDarkMode 
                                                            ? 'bg-gray-700/50 border-gray-600/50 text-gray-200 placeholder-gray-400 focus:border-red-400 focus:bg-gray-700/70' 
                                                            : 'bg-white/70 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:border-red-400 focus:bg-white'
                                                } ${!isCompleted ? 'focus:outline-none focus:ring-1 focus:ring-red-400/30' : ''} shadow-sm`}
                                                rows="2"
                                                value={formData.checks[key].description}
                                                onChange={!isCompleted ? (e) => handleCheckboxChange(key, "description", e.target.value) : undefined}
                                                disabled={isCompleted}
                                                readOnly={isCompleted}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Diagnose;