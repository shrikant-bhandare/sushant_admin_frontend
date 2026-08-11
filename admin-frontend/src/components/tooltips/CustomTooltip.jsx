// Tooltip.js
import React from 'react';
import { Tooltip } from 'react-tooltip';
import { useTheme } from '../../context/ThemeContext'; // Import the ThemeContext

const CustomTooltip = ({
  id,
  place = 'top',
  content,
  children,
  ...props
}) => {
  const { isDarkMode } = useTheme(); // Get the current theme

  // Define styles for dark and light modes
  const tooltipStyles = {
    backgroundColor: isDarkMode ? '#333' : '#fff',
    color: isDarkMode ? '#fff' : '#000',
    borderRadius: '4px',
    padding: '8px',
    fontSize: '14px',
    zIndex: 1050, // Increase z-index to ensure it appears above the table header
  };

  // Define border separately as a prop
  const borderStyle = `1px solid ${isDarkMode ? '#555' : '#ddd'}`;

  return (
    <>
      <span id={id}>
        {children}
      </span>
      <Tooltip
        anchorId={id}
        place={place}
        content={content}
        style={tooltipStyles} // Apply dynamic styles
        border={borderStyle} // Use border prop instead of style.border
        {...props}
      />
    </>
  );
};

export default CustomTooltip;

