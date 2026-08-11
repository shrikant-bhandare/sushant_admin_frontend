// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext();

// Role-based color schemes
const roleThemes = {
  admin: {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-slate-800',
      cardBorder: 'border-indigo-200',
      primary: 'text-indigo-600',
      secondary: 'text-purple-600',
      accent: 'bg-indigo-500',
      hover: 'hover:bg-indigo-50',
      shadow: 'shadow-indigo-100',
      gradient: 'from-indigo-500 to-purple-600'
    },
    dark: {
      background: 'bg-slate-900',
      cardBg: 'bg-slate-800',
      cardText: 'text-white',
      cardBorder: 'border-purple-500',
      primary: 'text-purple-400',
      secondary: 'text-indigo-400',
      accent: 'bg-purple-600',
      hover: 'hover:bg-slate-700',
      shadow: 'shadow-purple-500/20',
      gradient: 'from-purple-600 to-indigo-600'
    }
  },
  manager: {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-pink-800',
      cardBorder: 'border-pink-200',
      primary: 'text-pink-600',
      secondary: 'text-rose-600',
      accent: 'bg-pink-500',
      hover: 'hover:bg-pink-50',
      shadow: 'shadow-pink-100',
      gradient: 'from-pink-500 to-rose-600'
    },
    dark: {
      background: 'bg-pink-900',
      cardBg: 'bg-pink-800',
      cardText: 'text-white',
      cardBorder: 'border-pink-400',
      primary: 'text-pink-300',
      secondary: 'text-rose-300',
      accent: 'bg-pink-600',
      hover: 'hover:bg-pink-700',
      shadow: 'shadow-pink-500/20',
      gradient: 'from-pink-600 to-rose-600'
    }
  },
  receptionist: {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-cyan-800',
      cardBorder: 'border-cyan-200',
      primary: 'text-cyan-600',
      secondary: 'text-sky-600',
      accent: 'bg-cyan-500',
      hover: 'hover:bg-cyan-50',
      shadow: 'shadow-cyan-100',
      gradient: 'from-cyan-500 to-sky-600'
    },
    dark: {
      background: 'bg-cyan-900',
      cardBg: 'bg-cyan-800',
      cardText: 'text-white',
      cardBorder: 'border-cyan-400',
      primary: 'text-cyan-300',
      secondary: 'text-sky-300',
      accent: 'bg-cyan-600',
      hover: 'hover:bg-cyan-700',
      shadow: 'shadow-cyan-500/20',
      gradient: 'from-cyan-600 to-sky-600'
    }
  },
  'diagnostic-technician': {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-emerald-800',
      cardBorder: 'border-emerald-200',
      primary: 'text-emerald-600',
      secondary: 'text-green-600',
      accent: 'bg-emerald-500',
      hover: 'hover:bg-emerald-50',
      shadow: 'shadow-emerald-100',
      gradient: 'from-emerald-500 to-green-600'
    },
    dark: {
      background: 'bg-emerald-900',
      cardBg: 'bg-emerald-800',
      cardText: 'text-white',
      cardBorder: 'border-emerald-400',
      primary: 'text-emerald-300',
      secondary: 'text-green-300',
      accent: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      shadow: 'shadow-emerald-500/20',
      gradient: 'from-emerald-600 to-green-600'
    }
  },
  technician: {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-amber-800',
      cardBorder: 'border-amber-200',
      primary: 'text-amber-600',
      secondary: 'text-orange-600',
      accent: 'bg-amber-500',
      hover: 'hover:bg-amber-50',
      shadow: 'shadow-amber-100',
      gradient: 'from-amber-500 to-orange-600'
    },
    dark: {
      background: 'bg-amber-900',
      cardBg: 'bg-amber-800',
      cardText: 'text-white',
      cardBorder: 'border-amber-400',
      primary: 'text-amber-300',
      secondary: 'text-orange-300',
      accent: 'bg-amber-600',
      hover: 'hover:bg-amber-700',
      shadow: 'shadow-amber-500/20',
      gradient: 'from-amber-600 to-orange-600'
    }
  },
  customer: {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-teal-800',
      cardBorder: 'border-teal-200',
      primary: 'text-teal-600',
      secondary: 'text-cyan-600',
      accent: 'bg-teal-500',
      hover: 'hover:bg-teal-50',
      shadow: 'shadow-teal-100',
      gradient: 'from-teal-500 to-cyan-600'
    },
    dark: {
      background: 'bg-teal-900',
      cardBg: 'bg-teal-800',
      cardText: 'text-white',
      cardBorder: 'border-teal-400',
      primary: 'text-teal-300',
      secondary: 'text-cyan-300',
      accent: 'bg-teal-600',
      hover: 'hover:bg-teal-700',
      shadow: 'shadow-teal-500/20',
      gradient: 'from-teal-600 to-cyan-600'
    }
  },
  'inventory-manager': {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-red-800',
      cardBorder: 'border-red-200',
      primary: 'text-red-600',
      secondary: 'text-rose-600',
      accent: 'bg-red-500',
      hover: 'hover:bg-red-50',
      shadow: 'shadow-red-100',
      gradient: 'from-red-500 to-rose-600'
    },
    dark: {
      background: 'bg-red-900',
      cardBg: 'bg-red-800',
      cardText: 'text-white',
      cardBorder: 'border-red-400',
      primary: 'text-red-300',
      secondary: 'text-rose-300',
      accent: 'bg-red-600',
      hover: 'hover:bg-red-700',
      shadow: 'shadow-red-500/20',
      gradient: 'from-red-600 to-rose-600'
    }
  },
  'sales-manager': {
    light: {
      background: 'bg-white',
      cardBg: 'bg-white',
      cardText: 'text-purple-800',
      cardBorder: 'border-purple-200',
      primary: 'text-purple-600',
      secondary: 'text-violet-600',
      accent: 'bg-purple-500',
      hover: 'hover:bg-purple-50',
      shadow: 'shadow-purple-100',
      gradient: 'from-purple-500 to-violet-600'
    },
    dark: {
      background: 'bg-purple-900',
      cardBg: 'bg-purple-800',
      cardText: 'text-white',
      cardBorder: 'border-purple-400',
      primary: 'text-purple-300',
      secondary: 'text-violet-300',
      accent: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      shadow: 'shadow-purple-500/20',
      gradient: 'from-purple-600 to-violet-600'
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentRole, setCurrentRole] = useState('admin');
  const location = useLocation();

  // Automatically detect role from URL
  useEffect(() => {
    const path = location.pathname;
    const roleFromPath = path.split('/')[1]; // Get first part of path after /
    
    if (roleThemes[roleFromPath]) {
      setCurrentRole(roleFromPath);
    }
  }, [location.pathname]);

  // Your existing dark mode logic
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      const dark = storedTheme === 'dark';
      setIsDarkMode(dark);
      updateDocumentClass(dark);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      updateDocumentClass(true);
    }
  }, []);

  const updateDocumentClass = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      updateDocumentClass(newMode);
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  // Get current theme based on role and dark mode
  const getTheme = () => {
    const roleTheme = roleThemes[currentRole] || roleThemes.admin;
    return isDarkMode ? roleTheme.dark : roleTheme.light;
  };

  const value = {
    isDarkMode,
    toggleDarkMode, // Keep your existing function name
    currentRole,
    theme: getTheme(),
    setCurrentRole
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useTheme = () => useContext(ThemeContext);

// Additional hook for role-specific theme utilities
export const useRoleTheme = () => {
  const { theme, isDarkMode, currentRole } = useTheme();
  
  const getCardClasses = () => {
    return `${theme.cardBg} ${theme.cardText} ${theme.cardBorder} ${theme.hover} ${theme.shadow} rounded-lg border transition-all duration-200`;
  };

  const getButtonClasses = (variant = 'primary') => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} ${theme.accent} text-white hover:opacity-90`;
      case 'secondary':
        return `${baseClasses} ${theme.cardBorder} ${theme.cardText} border hover:bg-opacity-10`;
      case 'gradient':
        return `${baseClasses} bg-gradient-to-r ${theme.gradient} text-white hover:opacity-90`;
      default:
        return baseClasses;
    }
  };

  const getIconClasses = () => {
    return theme.primary;
  };

  return {
    theme,
    isDarkMode,
    currentRole,
    getCardClasses,
    getButtonClasses,
    getIconClasses
  };
};

// Helper function to get role-specific classes (for backward compatibility)
export const getRoleCardClass = (role, isDarkMode) => {
  const roleTheme = roleThemes[role] || roleThemes.admin;
  const currentTheme = isDarkMode ? roleTheme.dark : roleTheme.light;
  
  return `${currentTheme.cardBg} ${currentTheme.cardText} ${currentTheme.cardBorder} ${currentTheme.hover}`;
};