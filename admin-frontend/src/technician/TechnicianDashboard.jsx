import React from 'react';
import { FaClipboardList, FaUserTie, FaBell, FaTasks, FaChartLine, FaComments, FaEnvelopeOpenText, FaQuestionCircle } from 'react-icons/fa';
import { useTheme, useRoleTheme } from '../context/ThemeContext';

const TechnicianDashboard = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme();

    const cards = [
        { title: 'Tasks', description: 'Manage your tasks.', icon: <FaTasks />, count: 120 },
        { title: 'Team', description: 'View and manage your team.', icon: <FaUserTie />, count: 15 },
        { title: 'Notifications', description: 'Check your notifications.', icon: <FaBell />, count: 30 },
        { title: 'Performance', description: 'Track team performance.', icon: <FaChartLine />, count: 8 },
        { title: 'Messages', description: 'View your messages.', icon: <FaComments />, count: 50 },
        { title: 'Emails', description: 'Check your emails.', icon: <FaEnvelopeOpenText />, count: 25 },
        { title: 'Help', description: 'Get help and support.', icon: <FaQuestionCircle />, count: 5 },
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

export default TechnicianDashboard;