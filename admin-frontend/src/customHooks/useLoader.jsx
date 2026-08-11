import { useState } from "react";
import { createPortal } from "react-dom";
import SyncLoader from "react-spinners/SyncLoader";
import { useTheme } from "../context/ThemeContext"; // Import ThemeContext

const useLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme(); // Access theme context

  const showLoader = () => setIsLoading(true);
  const hideLoader = () => setIsLoading(false);

  const Loader = () => {
    if (!isLoading) return null;

    const loaderStyles = {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)", // Dynamic background color
    };

    return createPortal(
      <div style={loaderStyles}>
        <div className="p-5 bg-white rounded-2xl" style={{ backgroundColor: isDarkMode ? "#333" : "#fff" }}>
          <SyncLoader color={isDarkMode ? "#ffffff" : "#36d7b7"} /> {/* Dynamic loader color */}
        </div>
      </div>,
      document.body
    );
  };

  return { Loader, showLoader, hideLoader };
};

export default useLoader;