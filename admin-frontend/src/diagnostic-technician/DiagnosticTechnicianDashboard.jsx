import React from 'react';
import { FaTools, FaClipboardCheck, FaLaptopMedical, FaCogs, FaBell, FaQuestionCircle } from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';

const DiagnosticTechnicianDashboard = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();

    const cards = [
        { title: 'Diagnostics', description: 'Perform and manage diagnostics.', icon: <FaTools />, count: 50 },
        { title: 'Repairs', description: 'Track ongoing repairs.', icon: <FaClipboardCheck />, count: 20 },
        { title: 'Devices', description: 'Manage device inventory.', icon: <FaLaptopMedical />, count: 15 },
        { title: 'Settings', description: 'Adjust system settings.', icon: <FaCogs />, count: 8 },
        { title: 'Notifications', description: 'View your notifications.', icon: <FaBell />, count: 12 },
        { title: 'Help', description: 'Get help and support.', icon: <FaQuestionCircle />, count: 3 },
    ];

    return (
        <div className={`rounded-md p-4${theme.background}`}>
            <div className="">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card, index) => (
                        <div key={index} className={`p-6 rounded-lg shadow-md ${getCardClasses()}`}>
                            <div className="flex items-center mb-4">
                                <div className={`text-3xl mr-4 ${getIconClasses()}`}>{card.icon}</div>
                                <div>
                                    <h2 className={`text-xl font-semibold ${theme.cardText}`}>{card.title}</h2>
                                    <p className={`text-sm ${theme.secondary}`}>{card.count.toLocaleString()} views</p>
                                </div>
                            </div>
                            <p className={theme.cardText}>{card.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiagnosticTechnicianDashboard;