import React, { useEffect, useState } from 'react';
import { useTheme, useRoleTheme } from '../../context/ThemeContext';
import { FaChartLine, FaUserFriends, FaDollarSign, FaRegLightbulb, FaCog, FaShieldAlt, FaBell, FaEnvelope, FaChartBar, FaQuestionCircle, FaPlus, FaCouch, FaTicketAlt } from 'react-icons/fa';
import AddUserModal from '../../components/users/AddUserModal';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { isDarkMode } = useTheme();
    const { theme, getCardClasses, getIconClasses } = useRoleTheme(); // New role-based theme
    const navigate = useNavigate();
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [highlights, setHighlights] = useState([]);
    const [cards1, setCards1] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [completedTicketsData, setCompletedTicketsData] = useState([]);
    const [dashboardData, setDashboardData] = useState({});
    // const cardClass = isDarkMode
    //     ? 'bg-gray-800 text-white'
    //     : 'bg-white text-gray-800';

    const handleCardClick = (cardTitle) => {
        if (cardTitle === 'Add Users') {
            setIsAddUserModalOpen(true);
        } else if (cardTitle === 'Users') {
            navigate('/admin/users'); // Add navigation to users page
        }
    };

    const handleCloseModal = () => {
        setIsAddUserModalOpen(false);
    };

    // Fetch data dynamically
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_APIURL}/api/dashboard/dashboard-data`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setHighlights(data.highlights || []);
                    setCards1(data.cards1 || []);
                    setRevenueData(data.graphs.revenueData || []);
                    setCompletedTicketsData(data.graphs.completedTicketsData || []);
                    setDashboardData(data);
                } else {
                    console.error("Failed to fetch dashboard data:", data.message);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        fetchDashboardData();
    }, []);

    const cards = [
        { title: 'Performance', description: 'View your performance metrics.', icon: <FaChartLine />, count: 342332 },
        { title: 'Users', description: 'Manage your user base.', icon: <FaUserFriends />, count: 12345 },
        { title: 'Revenue', description: 'Track your revenue streams.', icon: <FaDollarSign />, count: 98765 },
        { title: 'Ideas', description: 'Explore new ideas and innovations.', icon: <FaRegLightbulb />, count: 4567 },
        { title: 'Ideas', description: 'Explore new ideas and innovations.', icon: <FaRegLightbulb />, count: 4567 },
        { title: 'Settings', description: 'Adjust your preferences.', icon: <FaCog />, count: 234 },
        { title: 'Security', description: 'Manage your security settings.', icon: <FaShieldAlt />, count: 678 },
        { title: 'Notifications', description: 'View your notifications.', icon: <FaBell />, count: 89 },
        { title: 'Notifications', description: 'View your notifications.', icon: <FaBell />, count: 89 },
        { title: 'Notifications', description: 'View your notifications.', icon: <FaBell />, count: 89 },
        { title: 'Messages', description: 'Check your messages.', icon: <FaEnvelope />, count: 45 },
        { title: 'Messages', description: 'Check your messages.', icon: <FaEnvelope />, count: 45 },
        { title: 'Analytics', description: 'Analyze your data.', icon: <FaChartBar />, count: 1234 },
        { title: 'Analytics', description: 'Analyze your data.', icon: <FaChartBar />, count: 1234 },
        { title: 'Help', description: 'Get help and support.', icon: <FaQuestionCircle />, count: 12 },
        { title: 'Add Users', description: 'Add users to manage your work', icon: <FaPlus />, count: 12 },
        { title: 'Total Tickets', description: 'Todays total ticket count', icon: <FaTicketAlt />, count: dashboardData?.highlights?.[0]?.value || 0 },
        { title: 'Completed Tickets', description: 'Todays completed ticket count', icon: <FaTicketAlt />, count: dashboardData?.highlights?.[2]?.value || 0 },
        { title: 'Open Tickets', description: 'Open ticket count', icon: <FaTicketAlt />, count: dashboardData?.highlights?.[3]?.value || 0 },
        { title: 'Todays Tickets', description: 'Todays ticket count', icon: <FaTicketAlt />, count: dashboardData?.highlights?.[7]?.value || 0 },
        { title: 'Total Users', description: 'Total Users count', icon: <FaTicketAlt />, count: dashboardData?.highlights?.[6]?.value || 0 },
        { title: 'Total Customers', description: 'Total Customers count', icon: <FaTicketAlt />, count: dashboardData?.highlights?.[7]?.value || 0 },
    ];

    return (
        <div className={`rounded-md p-4 ${theme.background}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className={`p-6 rounded-lg shadow-md cursor-pointer transition-transform hover:scale-105 ${getCardClasses()}`}
                        onClick={() => handleCardClick(card.title)}
                    >
                        <div className="flex items-center mb-4">
                            <div className={`text-3xl mr-4 ${getCardClasses()}`}>{card.icon}</div>
                            <div>
                                <h2 className="text-xl font-semibold">{card.title}</h2>
                                <p className={`text-sm ${theme.secondary}`}>{card.count.toLocaleString()} views</p>
                            </div>
                        </div>
                        <p className={theme.cardText}>{card.description}</p>
                    </div>
                ))}
            </div>

            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <AddUserModal
                    isOpen={isAddUserModalOpen}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default Dashboard;