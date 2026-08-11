import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';

const ServiceOrderDetailsModal = ({ isOpen, onClose, invoiceId, onRefresh }) => {
    const [saleOrderData, setSaleOrderData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returnReason, setReturnReason] = useState('');
    const [returnNote, setReturnNote] = useState('');
    const [isProcessingReturn, setIsProcessingReturn] = useState(false);

    // Fetch sale order data when modal opens
    useEffect(() => {
        if (isOpen && invoiceId) {
            fetchSaleOrderData();
        }
    }, [isOpen, invoiceId]);

    const fetchSaleOrderData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setSaleOrderData(data.data);
                setTasks(data.data.tasks || []);
            } else {
                console.error('Failed to fetch sale order data');
            }
        } catch (error) {
            console.error('Error fetching sale order data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnOrder = async () => {
        if (!returnReason || !returnNote.trim()) {
            alert('Please provide both return reason and details');
            return;
        }

        setIsProcessingReturn(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}/return`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    returnReason,
                    returnNote,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('✅ Return processed successfully!');
                
                // Refresh the sale order data to show updated return history
                await fetchSaleOrderData();
                
                // Refresh the parent table if callback provided
                if (onRefresh) {
                    onRefresh();
                }
                
                // Close return modal
                setShowReturnModal(false);
                setReturnReason('');
                setReturnNote('');
            } else {
                const errorData = await response.json();
                alert(`Failed to process return: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error processing return:', error);
            alert('Error processing return. Please try again.');
        } finally {
            setIsProcessingReturn(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>
            
            {/* Modal */}
            <div className="flex items-start justify-center min-h-screen p-4 pt-16">
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                                📋 Service Order Details
                            </h2>
                            {saleOrderData?.status && (
                                <span className={`px-3 py-1 text-sm rounded-full ${
                                    saleOrderData.status === "Completed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : saleOrderData.status === "Paid"
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}>
                                    {saleOrderData.status}
                                </span>
                            )}
                            {saleOrderData?.returns && saleOrderData.returns.length > 0 && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                                    🔄 Returned ({saleOrderData.returns.length})
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Return Button */}
                            {saleOrderData && (saleOrderData.status === "Completed" || saleOrderData.status === "Paid") && (
                                <button
                                    className="bg-orange-500 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded flex items-center text-sm"
                                    onClick={() => setShowReturnModal(true)}
                                >
                                    🔄 Return
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                                <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
                            </div>
                        ) : saleOrderData ? (
                            <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📝 Order Info</h3>
                                        <p className="text-sm"><strong>Ticket #:</strong> {saleOrderData.ticketNumber}</p>
                                        <p className="text-sm"><strong>Customer:</strong> {saleOrderData.customerName}</p>
                                        <p className="text-sm"><strong>Phone:</strong> {saleOrderData.phone}</p>
                                        {saleOrderData.alternatePhone && (
                                            <p className="text-sm"><strong>Alt Phone:</strong> {saleOrderData.alternatePhone}</p>
                                        )}
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📱 Device Info</h3>
                                        <p className="text-sm"><strong>Device:</strong> {saleOrderData.deviceType?.name || 'N/A'}</p>
                                        <p className="text-sm"><strong>Model:</strong> {saleOrderData.model?.name || 'N/A'}</p>
                                        <p className="text-sm"><strong>IMEI:</strong> {saleOrderData.imeiNumber || 'N/A'}</p>
                                        <p className="text-sm"><strong>Serial:</strong> {saleOrderData.serialNumber || 'N/A'}</p>
                                        <p className="text-sm"><strong>Color:</strong> {saleOrderData.color || 'N/A'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💰 Financial</h3>
                                        {(() => {
                                            // Calculate items subtotal
                                            const itemsSubtotal = (saleOrderData.items || []).reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
                                            // Get discount percentage
                                            const discountPercentage = saleOrderData.discount || 0;
                                            // Calculate discount amount
                                            const discountAmount = discountPercentage > 0 ? (itemsSubtotal * discountPercentage) / 100 : 0;
                                            // Final total (from backend)
                                            const finalTotal = saleOrderData.total || 0;
                                            // Advanced payment
                                            const advancedPayment = saleOrderData.advance || 0;
                                            // Calculate balance
                                            const balance = finalTotal - advancedPayment;
                                            
                                            return (
                                                <div className="space-y-1">
                                                    <p className="text-sm"><strong>Items Subtotal:</strong> ₹{itemsSubtotal.toFixed(2)}</p>
                                                    <p className="text-sm"><strong>Discount:</strong> {discountPercentage}% (₹{discountAmount.toFixed(2)})</p>
                                                    <p className="text-sm"><strong>Final Total:</strong> ₹{finalTotal.toFixed(2)}</p>
                                                    <p className="text-sm"><strong>Advanced:</strong> ₹{advancedPayment.toFixed(2)}</p>
                                                    <p className="text-sm"><strong>Balance:</strong> ₹{balance.toFixed(2)}</p>
                                                    <p className="text-sm"><strong>Payment:</strong> {saleOrderData.paymentType || 'N/A'}</p>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Order Timeline */}
                                {(saleOrderData.completedAt || saleOrderData.paidAt) && (
                                    <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20">
                                        <h3 className="text-lg font-bold text-green-800 dark:text-green-200 mb-3">📅 Order Timeline</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm"><strong>Created:</strong></p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {new Date(saleOrderData.createdAt).toLocaleDateString()} at {new Date(saleOrderData.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                            {saleOrderData.completedAt && (
                                                <div>
                                                    <p className="text-sm"><strong>Completed:</strong></p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {new Date(saleOrderData.completedAt).toLocaleDateString()} at {new Date(saleOrderData.completedAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            )}
                                            {saleOrderData.paidAt && (
                                                <div>
                                                    <p className="text-sm"><strong>Paid:</strong></p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {new Date(saleOrderData.paidAt).toLocaleDateString()} at {new Date(saleOrderData.paidAt).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Return History */}
                                {saleOrderData.returns && saleOrderData.returns.length > 0 && (
                                    <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-3 flex items-center">
                                            🔄 Return History (Total Returns: {saleOrderData.returns.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {saleOrderData.returns.map((returnItem, index) => (
                                                <div key={index} className="border-l-4 border-orange-500 pl-4 py-2 bg-white dark:bg-gray-800 rounded-r-lg">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm"><strong>Return #{index + 1}:</strong> {new Date(returnItem.returnedAt).toLocaleDateString()} at {new Date(returnItem.returnedAt).toLocaleTimeString()}</p>
                                                            <p className="text-sm"><strong>Reason:</strong> {returnItem.returnReason}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm"><strong>Note:</strong> {returnItem.returnNote}</p>
                                                            {returnItem.returnHandledBy && (
                                                                <p className="text-sm"><strong>Handled By:</strong> {returnItem.returnHandledBy}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tasks */}
                                {tasks && tasks.length > 0 && (
                                    <CollapsibleSection
                                        title="🔧 Tasks Details"
                                        isOpenByDefault={true}
                                        tasks={tasks.map((task) => ({
                                            ...task,
                                            actions: (
                                                <span className="text-sm text-gray-500">View Only</span>
                                            ),
                                        }))}
                                    />
                                )}

                                {/* Items/Services */}
                                {saleOrderData.items && saleOrderData.items.length > 0 && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">🛠️ Services & Items</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                                                <thead>
                                                    <tr className="bg-gray-100 dark:bg-gray-600">
                                                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm">Issue</th>
                                                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm">Description</th>
                                                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm">Warranty</th>
                                                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm">Price</th>
                                                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm">Tax</th>
                                                        <th className="border border-gray-300 dark:border-gray-600 p-2 text-sm">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {saleOrderData.items.map((item, index) => (
                                                        <tr key={index}>
                                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">{item.issue || 'N/A'}</td>
                                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">{item.description || 'N/A'}</td>
                                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">{item.warranty || 'N/A'}</td>
                                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">₹{(item.pricePerUnit || 0).toFixed(2)}</td>
                                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">{item.tax || 0}%</td>
                                                            <td className="border border-gray-300 dark:border-gray-600 p-2 text-sm">₹{(item.amount || 0).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-300">No data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 z-60 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => setShowReturnModal(false)}
                    ></div>
                    
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="text-xl font-semibold text-orange-600 dark:text-orange-400 flex items-center">
                                    🔄 Return Service Order
                                </h2>
                                <button
                                    onClick={() => setShowReturnModal(false)}
                                    className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="mb-4">
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        Mark this service order as returned. This action will record the return details and notify the customer.
                                    </p>
                                    {saleOrderData && (
                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                                            <p className="text-sm"><strong>Ticket #:</strong> {saleOrderData.ticketNumber}</p>
                                            <p className="text-sm"><strong>Customer:</strong> {saleOrderData.customerName}</p>
                                            <p className="text-sm"><strong>Status:</strong> {saleOrderData.status}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Return Reason *
                                    </label>
                                    <select
                                        value={returnReason}
                                        onChange={(e) => setReturnReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        required
                                    >
                                        <option value="">Select a reason</option>
                                        <option value="device_not_working">Device Not Working Properly</option>
                                        <option value="customer_unsatisfied">Customer Unsatisfied</option>
                                        <option value="warranty_claim">Warranty Claim</option>
                                        <option value="incorrect_repair">Incorrect Repair</option>
                                        <option value="parts_issue">Parts Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Return Details *
                                    </label>
                                    <textarea
                                        value={returnNote}
                                        onChange={(e) => setReturnNote(e.target.value)}
                                        placeholder="Please provide detailed information about the return..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                        rows="4"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => setShowReturnModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors duration-150"
                                        disabled={isProcessingReturn}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReturnOrder}
                                        disabled={!returnReason || !returnNote.trim() || isProcessingReturn}
                                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150 flex items-center"
                                    >
                                        {isProcessingReturn ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                            </>
                                        ) : (
                                            '🔄 Process Return'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceOrderDetailsModal;