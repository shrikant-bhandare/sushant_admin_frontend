import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaBell,
  FaEnvelope,
  FaChartBar,
  FaQuestionCircle,
  FaCreditCard,
  FaFileInvoice,
  FaTools,
  FaClipboardList,
  FaBoxOpen,
  FaVrCardboard,
  FaCogs,
  FaCog,
  FaInstagram,
  FaTasks,
  FaDiagnoses,
  FaUsers,
  FaWhatsapp,
  FaClock,
  FaUserClock,
  FaFingerprint,
  FaMobile,
} from "react-icons/fa"; // Import additional icons
import { useTheme } from "../context/ThemeContext"; // Import the useTheme hook
import { useNavigate, useLocation } from "react-router-dom"; // Import useNavigate and useLocation
import { jwtDecode } from "jwt-decode"; // Import jwt-decode

interface SidebarProps {
  toggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSidebar }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>("dashboard");
  const { isDarkMode } = useTheme(); // Get the current theme mode
  const navigate = useNavigate(); // Initialize useNavigate
  const location = useLocation(); // Get current location

  // Sync active button with current route on mount and route changes
  useEffect(() => {
    const pathSegments = location.pathname.split('/');
    const currentPage = pathSegments[pathSegments.length - 1]; // Get the last segment
    
    // If we're at root or just role path, default to dashboard
    if (!currentPage || pathSegments.length <= 2) {
      setActiveButton("dashboard");
    } else {
      setActiveButton(currentPage);
    }
  }, [location.pathname]);

  const handleButtonClick = (id: string) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const role = decodedToken["role"]; // Get the role from the decoded token
      setActiveButton(id);
      navigate(`/${role}/${id}`);
      if (window.innerWidth < 767 && typeof toggleSidebar === "function") {
        toggleSidebar();
      }
    } else {
      console.error("No access token found");
    }
  };

  const renderButton = (icon: React.ReactElement, text: string, id: string) => {
    const isActive = activeButton === id;

    return (
      <div className="flex justify-center items-center mx-auto w-full">
        <div
          onClick={() => handleButtonClick(id)}
          style={{
            color: isActive ? "#fff" : isDarkMode ? "#ccc" : "#333",
            width: "100%",
            marginBottom: "20px",
            cursor: "pointer",
            background: isActive
              ? "linear-gradient(135deg, #6e8efb, #a777e3)"
              : isDarkMode
              ? "linear-gradient(135deg, #444, #555)"
              : "white",
            transition: "all 0.3s ease",
          }}
          className="rounded-[10px] min-w-[40px] border border-gray-100 mx-[25px] flex items-center justify-center w-full py-[10px]"
        >
          <div className="px-3">{icon}</div>
          <div
            style={{ opacity: "75%" }}
            className="font-medium text-black w-full text-[14px] leading-[27px] text-left ml-2"
          >
            {text}
          </div>
        </div>
      </div>
    );
  };

  const getMenuForRole = (role: string) => {
    switch (role) {
      case "admin":
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          // { icon: <FaCreditCard />, text: "Billing", id: "billing" },
          { icon: <FaEnvelope />, text: "Repair History", id: "repair_history" },
          { icon: <FaChartBar />, text: "Paid Sales Report", id: "todays-sales" },
          { icon: <FaClipboardList />, text: "GST R1 Report", id: "gstr1-report" },
          // { icon: <FaFileInvoice />, text: "Service Orders", id: "service-orders" },
          { icon: <FaEnvelope />, text: "Technician History", id: "technician-work-history" },
          { icon: <FaEnvelope />, text: "Parts Used History", id: "parts-used-history" },
          // { icon: <FaClipboardList />, text: "Departments", id: "departments" }, // New menu item
          { icon: <FaBoxOpen />, text: "Inventory", id: "inventory" },
          { icon: <FaUsers />, text: "User Management", id: "users" },
          { icon: <FaFingerprint />, text: "Biometric Users", id: "biometric-users" },
          { icon: <FaMobile />, text: "Device Management", id: "biometric-devices" },
          // { icon: <FaClock />, text: "Attendance Management", id: "attendance" }, // Hidden for all roles
          { icon: <FaBoxOpen />, text: "Device Inventory", id: "device-inventory" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
          { icon: <FaWhatsapp />, text: "WhatsApp Messaging", id: "whatsapp-settings" },
          // { icon: <FaEnvelope />, text: "Messages", id: "messages" },
          
          // { icon: <FaEnvelope />, text: "Diagnosis History", id: "diagnosis-history" },
          
          
        ];
      case "manager":
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          { icon: <FaClipboardList />, text: "Repair Orders", id: "RepairOrders" },
          { icon: <FaClipboardList />, text: "Tasks", id: "tasks" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
          { icon: <FaBoxOpen />, text: "Team", id: "team" },
        ];
      case "technician":
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          { icon: <FaTools />, text: "Repairs", id: "repairs" },
          { icon: <FaBoxOpen />, text: "Inventory Listing", id: "inventory-listing" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
        ];
      case "receptionist":
        return [
            { icon: <FaHome />, text: "Home", id: "dashboard" },
          // { icon: <FaTools />, text: "Orders", id: "alldepartments" },
          // { icon: <FaClipboardList />, text: "Sales Orders", id: "saleorders" },
          { icon: <FaVrCardboard />, text: "Customer Profile", id: "customer-list" },
          { icon: <FaClipboardList />, text: "Service Orders", id: "saleorders" },
          // { icon: <FaDiagnoses />, text: "Diagnostics Reports", id: "diagnostics" },
          { icon: <FaClipboardList />, text: "Repair Orders", id: "repair-orders" },
          // { icon: <FaClipboardList />, text: "Attendance", id: "attendance" }, // New tab
          // { icon: <FaTools />, text: "Repairs", id: "repairs" },
          { icon: <FaTasks />, text: "Tasks", id: "tasks" }, 
          { icon: <FaTools />, text: "Requested Parts", id: "requestedParts" }, 
          // { icon: <FaUserClock />, text: "Quick Attendance", id: "quick-attendance" }, // Hidden for all roles
          { icon: <FaBoxOpen />, text: "Inventory", id: "inventory" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
          // { icon: <FaInstagram />, text: "Social Media", id: "social-media" },
           // Add Tasks tab
        ];
      case "diagnostic-technician": // New role
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          { icon: <FaTools />, text: "Diagnostics", id: "diagnostics" },
          { icon: <FaTasks />, text: "Tasks Assigned", id: "tasks-assigned" }, // New tab
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
          { icon: <FaClipboardList />, text: "Reports", id: "reports" },
        ];
      case "customer": // New role
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          { icon: <FaVrCardboard />, text: "Profile", id: "profile" }, // New menu item for profile />, text: "Home", id: "dashboard" },
          { icon: <FaClipboardList />, text: "Orders", id: "orders" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
          { icon: <FaEnvelope />, text: "Address", id: "address" },
        ];
      case "inventory-manager": // New role
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          { icon: <FaBoxOpen />, text: "Inventory", id: "inventory" },
          { icon: <FaCog />, text: "Part Requests", id: "PartRequests" },
          { icon: <FaClipboardList />, text: "Stock Reports", id: "stock-reports" },
          { icon: <FaTools />, text: "Manage Tools", id: "manage-tools" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
        ];
      case "sales-manager": // New role
        return [
          { icon: <FaHome />, text: "Home", id: "dashboard" },
          { icon: <FaMobile />, text: "Sell Device Requests", id: "sell-devices" },
          { icon: <FaBoxOpen />, text: "Device Inventory", id: "device-inventory" },
          { icon: <FaClipboardList />, text: "Order List", id: "orders" },
          { icon: <FaChartBar />, text: "Sales Analytics", id: "analytics" },
          { icon: <FaBell />, text: "Notifications", id: "notifications" },
        ];
      default:
        return [];
    }
  };

  const token = localStorage.getItem("accessToken");
  const role = token ? (jwtDecode(token) as any)["role"] : "guest";
  const menuItems = getMenuForRole(role);

  return (
    <div
      className={`shadow-xl sticky mt-[75px] md:mt-[10px] md:top-0 left-0 z-20 h-[calc(100vh-80px)] md:h-[calc(100vh-20px)] m-1 md:m-2 rounded-lg pt-4 transition-transform duration-300 md:translate-x-0 w-[240px] ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex w-full justify-center mb-4">
        <img src="/logo.png" width={140} height={140} alt="Logo" />
      </div>
      <div className="overflow-y-auto h-[calc(100vh-240px)] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {menuItems.map((item) => (
          <div key={item.id}>
            {renderButton(item.icon, item.text, item.id)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
