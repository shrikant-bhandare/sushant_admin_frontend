import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Sidebar from '../Sidebar';
import Header from '../Header';

const AuthoRisedLayout = ({ children }) => {
  const { isDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

  return (
    <div
      className={`flex min-h-screen flex-col z-0  ${
        isDarkMode ? 'bg-gray-600' : 'bg-[#E4E8EE]'
      }`}
    >
      {/* Pass toggleSidebar to Header */}
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex w-full">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`fixed top-0 left-0 z-30 min-h-full transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
        >
          <Sidebar toggleSidebar={toggleSidebar} />
        </div>

        {/* Main Content */}
        <main
          className={`flex-grow mt-1 md:mt-[20px] overflow-scroll  mr-0 md:mr-[10px] ${
            isSidebarOpen ? 'ml-[0px]' : 'ml-0'
          } md:ml-[260px]`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AuthoRisedLayout;