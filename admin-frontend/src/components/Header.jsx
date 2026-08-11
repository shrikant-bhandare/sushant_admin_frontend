import React, { useState } from 'react';
import { FaUser, FaSignOutAlt, FaSun, FaMoon, FaBars } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import useRole from '../customHooks/useRole';
import CustomTooltip from './tooltips/CustomTooltip';
import EnhancedNotificationBell from './EnhancedNotificationBell';

const Header = ({ toggleSidebar }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const role = useRole();
  const navigate = useNavigate();
  const [hoveredButton, setHoveredButton] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const renderButton = (icon, onClick, id, tooltipContent) => {
    const isHovered = hoveredButton === id;
    return (
      <CustomTooltip id={`tooltip-${id}`} content={tooltipContent}>
        <button
          onClick={onClick}
          onMouseEnter={() => setHoveredButton(id)}
          onMouseLeave={() => setHoveredButton(null)}
          style={{
            background: isHovered
              ? 'linear-gradient(135deg, #6e8efb, #a777e3)'
              : isDarkMode
              ? 'linear-gradient(135deg, #444, #555)'
              : 'white',
            color: isHovered ? '#fff' : isDarkMode ? '#ccc' : '#333',
            transition: 'all 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
          className="text-white border border-gray-200 font-bold py-2 px-3 rounded"
        >
          {icon}
        </button>
      </CustomTooltip>
    );
  };

  return (
    <header
      className={`bg-white z-[50] sticky top-0 md:top-2 right-8  md:ml-[260px] w-full md:w-[calc(100%-280px)] rounded-lg h-[70px] dark:bg-gray-800 text-black dark:text-white shadow-md`}
    >
      <div className="container mx-auto flex justify-between items-center p-4">
        {/* Hamburger Menu for Mobile */}
        <button
          className="md:hidden text-xl"
          onClick={toggleSidebar} // Ensure this calls toggleSidebar
          aria-label="Toggle Sidebar"
        >
          <FaBars />
        </button>

        <div className="flex items-center space-x-4">
          <div className="text-md font-medium capitalize">
            <span>{role}</span> 
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* <EnhancedNotificationBell /> */}
          {renderButton(
            isDarkMode ? <FaSun /> : <FaMoon />,
            toggleDarkMode,
            'darkMode',
            'Toggle Dark Mode'
          )}
          {renderButton(<FaUser />, null, 'user', 'User Profile')}
          {renderButton(
            <FaSignOutAlt />,
            handleLogout,
            'logout',
            'Logout'
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
