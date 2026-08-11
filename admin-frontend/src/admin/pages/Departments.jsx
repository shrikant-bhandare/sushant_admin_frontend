import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // Import the ThemeContext hook
import SalesOrders from "../../receptionist/SalesOrders"; // Import the SalesOrders component
import DiagnosticsListing from "../../diagnostic-technician/DiagnosticsListing";
import RepairOrders from "../../manager/RepairOrders";

const Departments = () => {
    const [activeTab, setActiveTab] = useState("Reception");
    const [activeSubTab, setActiveSubTab] = useState("Front Desk"); // State for active sub-department
    const { isDarkMode } = useTheme(); // Get the current theme mode

    const subDepartments = {
        Reception: [
            "Sale Order",
            "Customer Service",
            "Waiting Area",
            "Check-in",
        ],
        Diagnostic: [
            "Diagnostics",
            "Software Analysis",
            "Report Generation",
            "Issue Tracking",
        ],
        Manager: ["Repair Orders", "Reports", "Scheduling", "Budgeting"],
        Technician: ["Repairs", "Maintenance", "Tool Management", "Training"],
    };

    const renderContent = () => {
        let content;

        switch (activeSubTab) {
            case "Sale Order":
                content = (
                    <>
                        <SalesOrders />
                    </>
                );
                break;
            case "Customer Service":
                content =
                    "Customer Service handles all customer-related issues and feedback.";
                break;
            case "Waiting Area":
                content =
                    "The Waiting Area is where customers can relax while waiting for their turn.";
                break;
            case "Check-in":
                content =
                    "Check-in is where customers register their devices for service.";
                break;
            case "Diagnostics":
                content = <DiagnosticsListing />; // Assuming DiagnosticsListing is a component that handles hardware testing
                break;
            case "Software Analysis":
                content =
                    "Software Analysis focuses on identifying software-related problems.";
                break;
            case "Report Generation":
                content =
                    "Report Generation provides detailed diagnostics reports.";
                break;
            case "Issue Tracking":
                content = "Issue Tracking monitors and logs ongoing issues.";
                break;
            case "Repair Orders":
                content =
                    <RepairOrders/>;
                break;
            case "Reports":
                content =
                    "Reports include performance and operational summaries.";
                break;
            case "Scheduling":
                content =
                    "Scheduling manages appointments and task assignments.";
                break;
            case "Budgeting":
                content =
                    "Budgeting handles financial planning and resource allocation.";
                break;
            case "Repairs":
                content =
                    "Repairs involve fixing hardware and software issues.";
                break;
            case "Maintenance":
                content =
                    "Maintenance ensures devices are in optimal working condition.";
                break;
            case "Tool Management":
                content =
                    "Tool Management oversees tools and equipment used for repairs.";
                break;
            case "Training":
                content =
                    "Training focuses on upskilling technicians and staff.";
                break;
            default:
                content = "No information available for this sub-department.";
        }

        return <div>{content}</div>;
    };

    return (
        <div className="w-full mx-auto mt-8">
            {/* Tabs Container */}
            <div className="flex border-b border-gray-300 mx-[10px] bg-gray-100 dark:bg-gray-900">
                {Object.keys(subDepartments).map((tab) => (
                    <button
                        key={tab}
                        className={`flex-1 text-center py-3 font-medium text-lg transition-all duration-300 relative ${
                            activeTab === tab
                                ? isDarkMode
                                    ? "bg-gradient-to-t from-blue-900 to-blue-900 text-white"
                                    : "bg-gradient-to-t from-blue-600 to-blue-300 text-white"
                                : isDarkMode
                                ? "text-gray-400 hover:bg-gradient-to-t hover:from-gray-700 hover:to-gray-700 hover:text-white"
                                : "text-gray-600 hover:bg-gradient-to-t hover:from-blue-100 hover:to-blue-50 hover:text-blue-600"
                        }`}
                        onClick={() => {
                            setActiveTab(tab);
                            setActiveSubTab(subDepartments[tab][0]); // Reset sub-tab to the first sub-department
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Sub-Departments Tabs */}
            <div className="flex border-b border-gray-300 mx-[10px] bg-gray-50 dark:bg-gray-800 mt-2">
                {subDepartments[activeTab].map((subTab) => (
                    <button
                        key={subTab}
                        className={`flex-1 text-center py-2 font-medium text-md transition-all duration-300 relative ${
                            activeSubTab === subTab
                                ? isDarkMode
                                    ? "bg-gradient-to-t from-gray-700 to-gray-700 text-white"
                                    : "bg-gradient-to-t from-blue-200 to-blue-100 text-blue-800"
                                : isDarkMode
                                ? "text-gray-400 hover:bg-gradient-to-t hover:from-gray-700 hover:to-gray-700 hover:text-white"
                                : "text-gray-600 hover:bg-gradient-to-t hover:from-blue-100 hover:to-blue-50 hover:text-blue-600"
                        }`}
                        onClick={() => setActiveSubTab(subTab)}
                    >
                        {subTab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div
                className={`shadow-md rounded-b-lg mt-4 mx-[10px] p-4 transition-all duration-300 ${
                    isDarkMode
                        ? "bg-gray-800 text-gray-200"
                        : "bg-white text-gray-800"
                }`}
            >
                {renderContent()}
            </div>
        </div>
    );
};

export default Departments;
