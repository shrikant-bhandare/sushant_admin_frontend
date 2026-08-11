import React, { useState, useEffect } from "react";
import {  useLocation } from "react-router-dom";
import SalesOrders from "./SalesOrders"; // Receptionist orders
import DiagnosticsListing from "../diagnostic-technician/DiagnosticsListing"; // Diagnostic orders
import RepairOrders from "../manager/RepairOrders"; // Manager orders
import DiagnosticTable from "../components/tables/DiagnosticTable";
import NewSaleOrder from "./NewSaleOrder";
import Diagnose from "../diagnostic-technician/Diagnose";
import TicketDetails from "../manager/TicketDetails";

const AllOrders = () => {
    const [activeTab, setActiveTab] = useState("Sales Order");
    // const { invoiceId } = useParams();
    const location = useLocation();

    const tabs = ["Sales Order", "Diagnostics", "Assign Tasks", "Post Diagnostic", "Close Order"];

    useEffect(() => {
        if (location.pathname.includes("/diagnostic/")) {
            setActiveTab("Diagnostics");
        }else if (location.pathname.includes("/diagnostic-technician/")) {
            setActiveTab("Assign Tasks");
        }
    }, [location]);

    const renderContent = () => {
        switch (activeTab) {
            case "Sales Order":
                return <NewSaleOrder />;
            case "Diagnostics":
                return <Diagnose />;
            case "Assign Tasks":
                return <TicketDetails />;
            case "Assign Inventory":
                return <RepairOrders />;
            case "Post Diagnostic":
                return <DiagnosticsListing />;
            case "Close Order":
                return <RepairOrders />;
            default:
                return <div>No orders available.</div>;
        }
    };

    return (
        <div className="w-full mx-auto mt-8">
            {/* Tabs */}
            <div className="flex border-b border-gray-300 bg-gray-100 dark:bg-gray-900">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`flex-1 text-center py-3 font-medium text-lg transition-all duration-300 ${
                            activeTab === tab
                                ? "bg-blue-600 text-white"
                                : "text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                        }`}
                        // onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-b-lg">
                {renderContent()}
            </div>
        </div>
    );
};

export default AllOrders;