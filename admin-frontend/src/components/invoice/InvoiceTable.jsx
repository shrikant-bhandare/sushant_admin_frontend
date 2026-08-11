import React, { useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaEdit, FaTrash, FaEye, FaEllipsisV, FaFileInvoice, FaStethoscope, FaTools, FaChevronDown, FaTimes, FaUndo, FaCheck } from 'react-icons/fa';
import CustomTooltip from '../tooltips/CustomTooltip';
import ServiceOrderView from '../../receptionist/ServiceOrder'; // Import the ServiceOrderView component from the correct path
import ServiceOrderDetailsModal from '../ServiceOrderDetailsModal'; // Import the new modal component

const InvoiceTable = ({ invoices = [], pagination = {}, onPageChange, onPageSizeChange, onRefresh }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showServiceOrderModal, setShowServiceOrderModal] = useState(false);
  const [selectedServiceOrderId, setSelectedServiceOrderId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteNote, setDeleteNote] = useState('');
  const [showServiceOrderDetailsModal, setShowServiceOrderDetailsModal] = useState(false);
  const [selectedServiceOrderForDetails, setSelectedServiceOrderForDetails] = useState(null);
  
  const {
    currentPage = 1,
    pageSize = 10,
    totalPages = 1,
    totalRecords = 0,
  } = pagination;
  
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  console.log(invoices);
  console.log(`Pagination: ${pagination}`);
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageSizeChange = (event) => {
    onPageSizeChange(Number(event.target.value));
  };

  const handleEdit = (invoiceId, isFinalEdit = false) => {
    console.log('Edit invoice:', invoiceId, 'Final edit:', isFinalEdit);
    const url = isFinalEdit 
      ? `/receptionist/saleorders/edit/${invoiceId}?finalEdit=true`
      : `/receptionist/saleorders/edit/${invoiceId}`;
    window.location.href = url; // Navigate to the edit page
  };

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Paid'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Order marked as paid:', data);
        
        // Show success message
        alert('✅ Order marked as Paid successfully!');
        
        // Refresh the table
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to mark order as paid: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking order as paid:', error);
      alert('Error marking order as paid. Please try again.');
    }
  };

  const handleView = (invoiceId) => {
    console.log('View invoice:', invoiceId);
    window.location.href = `/receptionist/saleorders/invoice/${invoiceId}`; // Navigate to the invoice view page
  };

  const handleInvoice = (invoiceId) => {
    console.log('Generate invoice:', invoiceId);
    window.location.href = `/receptionist/saleorders/invoice/${invoiceId}`;
  };

  const handleDiagnosis = (invoiceId) => {
    console.log('View diagnosis:', invoiceId);
    window.location.href = `/diagnostic-technician/diagnose/${invoiceId}`;
  };

  const handleServiceOrder = (invoiceId) => {
    console.log('View service order:', invoiceId);
    setSelectedServiceOrderId(invoiceId);
    setShowServiceOrderModal(true);
    setOpenDropdown(null); // Close dropdown when opening modal
  };

  const closeServiceOrderModal = () => {
    setShowServiceOrderModal(false);
    setSelectedServiceOrderId(null);
  };

  const handleOpenServiceOrderDetails = (invoice) => {
    console.log('Opening service order details modal for:', invoice._id);
    setSelectedServiceOrderForDetails(invoice);
    setShowServiceOrderDetailsModal(true);
  };

  const closeServiceOrderDetailsModal = () => {
    setShowServiceOrderDetailsModal(false);
    setSelectedServiceOrderForDetails(null);
  };

  const handleDelete = (invoice) => {
    setSelectedInvoiceForDelete(invoice);
    setShowDeleteModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInvoiceForDelete || !deleteReason || !deleteNote.trim()) {
      alert('Please select a reason and provide a note for deletion.');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken'); // Get auth token
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${selectedInvoiceForDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Add authentication
        },
        body: JSON.stringify({
          reason: deleteReason,
          note: deleteNote,
          deletedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert('Sale order deleted successfully');
        setShowDeleteModal(false);
        setSelectedInvoiceForDelete(null);
        setDeleteReason('');
        setDeleteNote('');
        // Refresh the table by calling parent component's refresh function
        if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete sale order: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting sale order:', error);
      alert('Error deleting sale order. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setSelectedInvoiceForDelete(null);
    setDeleteReason('');
    setDeleteNote('');
  };

  const toggleDropdown = (invoiceId) => {
    setOpenDropdown(openDropdown === invoiceId ? null : invoiceId);
  };

  // Close dropdown when clicking outside
  const closeDropdown = () => {
    setOpenDropdown(null);
  };

//   const handlePrint = (invoiceId) => {
//     console.log('Print invoice:', invoiceId);
//     // Trigger print functionality
//   };

//   const handleDelete = (invoiceId) => {
//     console.log('Delete invoice:', invoiceId);
//     // Trigger delete functionality
//   };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      {/* <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Service Orders</h3>
      </div> */}
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto' }} className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Ticket No.</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Device</th>
                
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"></th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice, index) => (
                <tr 
                  key={invoice._id} 
                  onClick={(e) => {
                    // Prevent row click when clicking on buttons or dropdown
                    if (e.target.closest('button') || e.target.closest('.relative')) {
                      return;
                    }
                    // Allow navigation for all orders except deleted ones
                    // For completed/paid orders, open service order details modal
                    if (!(invoice.status === 'deleted' || invoice.is_delete)) {
                      if (invoice.status === "Completed" || invoice.status === "Paid") {
                        // Open service order details modal
                        handleOpenServiceOrderDetails(invoice);
                      } else {
                        // Open for editing
                        handleEdit(invoice._id);
                      }
                    }
                  }}
                  className={`transition-colors duration-150 ${
                  invoice.status === 'deleted' || invoice.is_delete
                    ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-75 cursor-not-allowed'
                    : `cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`
                }`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'deleted' || invoice.is_delete
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {invoice.ticketNumber.replace(/^TC-/, '')}
                      {(invoice.status === 'deleted' || invoice.is_delete) && (
                        <FaTrash className="ml-1" size={10} />
                      )}
                      {/* Return indicator */}
                      {invoice.returns && invoice.returns.length > 0 && (
                        <span className="ml-1 px-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                          R{invoice.returns.length}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-sm ${
                    invoice.status === 'deleted' || invoice.is_delete
                      ? 'text-red-700 dark:text-red-300 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    <div className="font-medium">
                      {invoice.customerName.toLowerCase()
                        .split(" ")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </div>
                    <div className={`text-xs ${
                      invoice.status === 'deleted' || invoice.is_delete
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {invoice.phone}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-sm ${
                    invoice.status === 'deleted' || invoice.is_delete
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {invoice.deviceBrand?.name && invoice.model?.name 
                      ? ` ${invoice.model.name}`
                      : invoice.model?.name 
                      ? invoice.model.name
                      : invoice.deviceBrand?.name 
                      ? invoice.deviceBrand.name
                      : 'Device info not available'}
                  </td>

                  <td className={`px-4 py-3 text-sm font-semibold ${
                    invoice.status === 'deleted' || invoice.is_delete
                      ? 'text-red-700 dark:text-red-300 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    ₹ {invoice.total ? parseFloat(invoice.total.toFixed(2)).toLocaleString() : '0.00'}
                  </td>
                  <td className={`px-4 py-3 text-sm ${
                    invoice.status === 'deleted' || invoice.is_delete
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    }) : 'Date not available'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'deleted' || invoice.is_delete
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : invoice.status === 'Paid' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : invoice.status === 'Completed' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : invoice.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {invoice.status === 'deleted' ? 'DELETED' : invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm ">
                    <div className="flex items-center center">
                      {/* Only show main action buttons if order is not deleted */}
                      {!(invoice.status === 'deleted' || invoice.is_delete) && (
                        <>
                          {/* For Paid orders - only show View Invoice */}
                          {invoice.status === "Paid" && (
                            <CustomTooltip id={`view-${invoice._id}`} content="View Invoice">
                              <button 
                                onClick={() => handleView(invoice._id)} 
                                className="inline-flex items-center justify-center  text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors duration-150"
                              >
                                view Invoice
                              </button>
                            </CustomTooltip>
                          )}
                          
                          {/* For Completed orders - show View and Paid button */}
                          {invoice.status === "Completed" && (
                            <>
                              {/* <CustomTooltip id={`view-${invoice._id}`} content="View Invoice">
                                <button 
                                  onClick={() => handleView(invoice._id)} 
                                  className="inline-flex items-center justify-center w-8 h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors duration-150"
                                >
                                  <FaEye size={14} /> 
                                </button>
                              </CustomTooltip> */}
                              
                              {/* make it as red */}
                              <CustomTooltip id={`paid-${invoice._id}`} content="Mark as Paid">
                                <button 
                                  onClick={() => handleMarkAsPaid(invoice._id)} 
                                  className="inline-flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors duration-150"
                                >
                                  Mark as Paid
                                </button>
                              </CustomTooltip>
                            </>
                          )}

                          {invoice.status !== "Completed" &&  invoice.status !== "Paid" && (
                            <>
                              {/* <CustomTooltip id={`edit-${invoice._id}`} content="Edit Sale Order">
                                <button 
                                  onClick={() => handleEdit(invoice._id)} 
                                  className="inline-flex items-center justify-center w-8 h-8 text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition-colors duration-150"
                                >
                                  <FaEdit size={14} />
                                </button>
                              </CustomTooltip> */}
                              
                              <CustomTooltip id={`final-edit-${invoice._id}`} content="Final Edit & Complete Order">
                                <button 
                                  onClick={() => handleEdit(invoice._id, true)} 
                                  className="inline-flex items-center justify-center  text-purple-600 hover:text-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900 rounded-lg transition-colors duration-150 border border-purple-200 p-2 dark:border-purple-700"
                                >
                                  {/* <FaEdit size={10} />
                                  <FaCheck size={8} className="ml-0.5" /> */}
                                  Convert To Sale
                                </button>
                              </CustomTooltip>
                            </>
                          )}
                        </>
                      )}

                      
                    </div>
                  </td>
                  <td className="p-4">
                  {/* Multi-Action Dropdown - Always show but with different content for deleted orders */}
                      <div className="relative">
                        <CustomTooltip 
                          id={`actions-${invoice._id}`} 
                          content={invoice.status === 'deleted' || invoice.is_delete ? "Deleted Order Options" : "More Actions"}
                        >
                          <button
                            onClick={() => toggleDropdown(invoice._id)}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 ${
                              invoice.status === 'deleted' || invoice.is_delete
                                ? 'text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                          >
                            <FaEllipsisV size={14} />
                          </button>
                        </CustomTooltip>

                        {/* Dropdown Menu */}
                        {openDropdown === invoice._id && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-[15]" 
                              onClick={closeDropdown}
                            ></div>
                            
                            {/* Dropdown Content */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[25]">
                              <div className="py-1">
                                {/* Show normal actions only for non-deleted orders */}
                                {!(invoice.status === 'deleted' || invoice.is_delete) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        handleInvoice(invoice._id);
                                        closeDropdown();
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150"
                                    >
                                      <FaFileInvoice className="mr-3 h-4 w-4" />
                                      View Invoice
                                    </button>
                                    
                                    {/* <button
                                      onClick={() => {
                                        handleDiagnosis(invoice._id);
                                        closeDropdown();
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-150"
                                    >
                                      <FaStethoscope className="mr-3 h-4 w-4" />
                                      Diagnosis Report
                                    </button> */}
                                    
                                    {/* <button
                                      onClick={() => {
                                        handleServiceOrder(invoice._id);
                                        closeDropdown();
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-150"
                                    >
                                      <FaTools className="mr-3 h-4 w-4" />
                                      Service Order
                                    </button> */}
                                    
                                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                                    
                                    <button
                                      onClick={() => {
                                        handleDelete(invoice);
                                        closeDropdown();
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-150"
                                    >
                                      <FaTrash className="mr-3 h-4 w-4" />
                                      Delete Order
                                    </button>
                                  </>
                                )}
                                
                                {/* Show deletion info and restore option for deleted orders */}
                                {(invoice.status === 'deleted' || invoice.is_delete) && (
                                  <>
                                    <div className="px-4 py-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">
                                      <div className="font-semibold flex items-center gap-2">
                                        <FaTrash size={12} />
                                        Order Deleted
                                      </div>
                                      {invoice.deleteReason && (
                                        <div className="mt-2">
                                          <span className="font-medium">Reason:</span> {invoice.deleteReason.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </div>
                                      )}
                                      {invoice.deleteNote && (
                                        <div className="mt-1">
                                          <span className="font-medium">Note:</span> {invoice.deleteNote}
                                        </div>
                                      )}
                                      {invoice.deletedAt && (
                                        <div className="mt-1">
                                          <span className="font-medium">Deleted:</span> {new Date(invoice.deletedAt).toLocaleDateString('en-IN')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="border-t border-gray-200 dark:border-gray-600"></div>
                                    
                                    {/* Optional: Add restore functionality */}
                                    {/* <button
                                      onClick={() => {
                                        // handleRestore(invoice._id); // You can implement this later
                                        console.log('Restore order:', invoice._id);
                                        closeDropdown();
                                      }}
                                      className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-300 transition-colors duration-150"
                                    >
                                      <FaUndo className="mr-3 h-4 w-4" />
                                      Restore Order
                                    </button> */}
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-150"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
              <span className="font-medium">{totalRecords}</span> results
            </span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                <FaArrowLeft className="w-3 h-3 mr-1" />
                Previous
              </button>
              
              <div className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border-t border-b border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300">
                {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-150"
              >
                Next
                <FaArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Service Order Modal */}
      {showServiceOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeServiceOrderModal}
          ></div>
          
          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Service Order Details
                </h2>
                <button
                  onClick={closeServiceOrderModal}
                  className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                {selectedServiceOrderId && (
                  <ServiceOrderView serviceOrderId={selectedServiceOrderId} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleDeleteCancel}
          ></div>
          
          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 flex items-center">
                  <FaTrash className="mr-2" />
                  Delete Sale Order
                </h2>
                <button
                  onClick={handleDeleteCancel}
                  className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-150"
                >
                  <FaTimes size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Are you sure you want to delete this sale order?
                  </p>
                  {selectedInvoiceForDelete && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                      <p className="text-sm"><strong>Ticket #:</strong> {selectedInvoiceForDelete.ticketNumber}</p>
                      <p className="text-sm"><strong>Customer:</strong> {selectedInvoiceForDelete.customerName}</p>
                      <p className="text-sm"><strong>Device:</strong> {selectedInvoiceForDelete.deviceBrand?.name} {selectedInvoiceForDelete.model?.name}</p>
                    </div>
                  )}
                </div>

                {/* Deletion Reason */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Deletion *
                  </label>
                  <select
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="quotation_failed">Quotation Failed</option>
                    <option value="repair_not_possible">Repair Not Possible</option>
                    <option value="customer_request">Customer Request</option>
                    <option value="duplicate_order">Duplicate Order</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Deletion Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes *
                  </label>
                  <textarea
                    value={deleteNote}
                    onChange={(e) => setDeleteNote(e.target.value)}
                    placeholder="Please provide additional details about the deletion..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    rows="3"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={!deleteReason || !deleteNote.trim()}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-150"
                  >
                    Delete Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Order Details Modal */}
      {showServiceOrderDetailsModal && selectedServiceOrderForDetails && (
        <ServiceOrderDetailsModal
          invoiceId={selectedServiceOrderForDetails._id}
          isOpen={showServiceOrderDetailsModal}
          onClose={closeServiceOrderDetailsModal}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
};

export default InvoiceTable;