import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const TicketNumberAnalytics = () => {
    const { isDarkMode } = useTheme();
    const [stats, setStats] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTicketAnalytics();
    }, []);

    const fetchTicketAnalytics = async () => {
        try {
            setLoading(true);
            
            // Fetch both stats and analysis
            const [statsResponse, analysisResponse] = await Promise.all([
                fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/ticket-stats`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                }),
                fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/ticket-analysis`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
                })
            ]);

            if (statsResponse.ok && analysisResponse.ok) {
                const statsData = await statsResponse.json();
                const analysisData = await analysisResponse.json();
                
                setStats(statsData.data);
                setAnalysis(analysisData.data);
            } else {
                throw new Error('Failed to fetch ticket analytics');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching ticket analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                <div className="animate-pulse">Loading ticket analytics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                <div className="text-red-500">Error: {error}</div>
                <button 
                    onClick={fetchTicketAnalytics}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
            <h2 className="text-2xl font-bold mb-6">Ticket Number Analytics</h2>
            
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Current Counter</h3>
                        <p className="text-2xl font-bold">{stats.currentCounter}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Total Generated</h3>
                        <p className="text-2xl font-bold">{stats.totalGenerated}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Total Used</h3>
                        <p className="text-2xl font-bold text-green-500">{stats.totalUsed}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Total Wasted</h3>
                        <p className="text-2xl font-bold text-red-500">{stats.totalWasted}</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Efficiency</h3>
                        <p className="text-2xl font-bold">{stats.efficiency}%</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Waste Percentage</h3>
                        <p className="text-2xl font-bold">{stats.wastedPercentage}%</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <h3 className="font-semibold text-sm text-gray-500">Next Available</h3>
                        <p className="text-2xl font-bold">TC-{stats.nextAvailable}</p>
                    </div>
                </div>
            )}
            
            {stats && stats.wastedNumbers && stats.wastedNumbers.length > 0 && (
                <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className="font-semibold mb-2">Sample Wasted Numbers</h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.wastedNumbers.map(num => (
                            <span 
                                key={num}
                                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                            >
                                TC-{num}
                            </span>
                        ))}
                        {stats.totalWasted > stats.wastedNumbers.length && (
                            <span className="px-2 py-1 bg-gray-500 text-white rounded text-sm">
                                +{stats.totalWasted - stats.wastedNumbers.length} more...
                            </span>
                        )}
                    </div>
                </div>
            )}
            
            {analysis && analysis.recommendations && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`}>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Should implement recovery: {analysis.recommendations.shouldImplementRecovery ? 'Yes' : 'No'}</li>
                        <li>Potential savings: {analysis.recommendations.potentialSavings} ticket numbers</li>
                        <li>Next action: {analysis.recommendations.nextRecommendedAction}</li>
                    </ul>
                </div>
            )}
            
            <div className="mt-4 text-center">
                <button 
                    onClick={fetchTicketAnalytics}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                    Refresh Analytics
                </button>
            </div>
        </div>
    );
};

export default TicketNumberAnalytics;
