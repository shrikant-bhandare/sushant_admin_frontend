import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext"; // Import ThemeContext
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa"; // Import icons

const alertStyles = {
  light: {
    success: "!bg-white border-green-400 text-green-700 bg-green-400",
    error: "!bg-white border-red-400 text-red-700 bg-red-400",
    warning: "!bg-white border-yellow-400 text-yellow-700 bg-yellow-400",
    info: "!bg-white border-blue-400 text-blue-700 bg-blue-400",
  },
  dark: {
    success: "!bg-gray-700 border-green-700 text-green-200 bg-green-700",
    error: "!bg-gray-700 border-red-700 text-red-200 bg-red-700",
    warning: "!bg-gray-700 border-yellow-700 text-yellow-200 bg-yellow-700",
    info: "!bg-gray-700 border-blue-700 text-blue-200 bg-blue-700",
  },
};

const iconMap = {
  success: <FaCheckCircle className="mr-2" />,
  error: <FaExclamationCircle className="mr-2" />,
  warning: <FaExclamationTriangle className="mr-2" />,
  info: <FaInfoCircle className="mr-2" />,
};

const CustomAlert = ({ type = "info", message, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { isDarkMode } = useTheme(); // Access the current theme

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 4000);

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  const theme = isDarkMode ? "dark" : "light";

  return (
    <div
      className={`fixed top-3 z-[999] flex items-center justify-between border-l-4 border mb-2 p-4 rounded-md ${alertStyles[theme][type]}`}
      role="alert"
    >
      <div className="flex items-center">
        {iconMap[type]} {/* Render the appropriate icon */}
        <span className="flex-1">{message}</span>
      </div>
      <button
        onClick={handleClose}
        className="ml-4 text-sm font-bold text-gray-700 hover:text-gray-900 focus:outline-none"
        aria-label="Close"
      >
        ✕
      </button>
      <div
        className={`absolute bottom-[-7px] rounded-b-[8px] left-0 h-[4px] ${alertStyles[theme][type].split(" ")[3]}`} // Use the border color from alertStyles
        style={{
          animation: "progress 4s linear",
          width: "100%",
        }}
      ></div>
    </div>
  );
};

CustomAlert.propTypes = {
  type: PropTypes.oneOf(["success", "error", "warning", "info"]),
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func,
};

export default CustomAlert;