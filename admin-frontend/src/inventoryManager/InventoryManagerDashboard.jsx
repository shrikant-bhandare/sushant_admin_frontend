import React from 'react';
import { FaShoppingCart, FaClipboardList, FaBell, FaChartPie, FaComments, FaEnvelopeOpenText, FaQuestionCircle } from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';

const InventoryManagerDashboard = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();

    const cards = [
        { title: 'Orders', description: 'View and manage your orders.', icon: <FaShoppingCart />, count: 12 },
        { title: 'Order History', description: 'Check your past orders.', icon: <FaClipboardList />, count: 45 },
        { title: 'Notifications', description: 'Stay updated with notifications.', icon: <FaBell />, count: 8 },
        { title: 'Analytics', description: 'Track your spending and trends.', icon: <FaChartPie />, count: 3 },
        { title: 'Messages', description: 'Communicate with support.', icon: <FaComments />, count: 10 },
        { title: 'Emails', description: 'Check your emails.', icon: <FaEnvelopeOpenText />, count: 5 },
        { title: 'Help', description: 'Get help and support.', icon: <FaQuestionCircle />, count: 2 },
    ];

    return (
        <div className={`rounded-md p-4 ${theme.background}`}>
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
    );
};

export default InventoryManagerDashboard;