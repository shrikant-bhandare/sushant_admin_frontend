import React from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

const RepairOrdersTable = ({ invoices = [], pagination = {}, onPageChange, onclick, onPageSizeChange, buttonText = "Diagnose" }) => {
  const {
    currentPage = 1,
    pageSize = 10,
    totalPages = 1,
    totalRecords = 0,
  } = pagination;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePageSizeChange = (event) => {
    onPageSizeChange(Number(event.target.value));
  };

  const handleDiagnose = (invoiceId) => {
    onclick(invoiceId);
  };

  return (
    <div className="overflow-x-auto">
      <div style={{ maxHeight: 'calc(100vh - 245px)', overflowY: 'auto' }}>
        <table className="min-w-full bg-white dark:bg-gray-800">
          <thead className="sticky top-0 bg-white dark:bg-gray-800 z-[10]">
            <tr>
              <th className="py-2 px-4 border-b text-left">Invoice Number</th>
              <th className="py-2 px-4 border-b text-left">Customer Name</th>
              <th className="py-2 px-4 border-b text-left">Device Model</th>
              <th className="py-2 px-4 border-b text-left">Repair Status</th>
              <th className="py-2 px-4 border-b text-left">Amount</th>
              <th className="py-2 px-4 border-b text-left">Date</th>
              <th className="py-2 px-4 border-b text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="py-2 px-4 border-b">{invoice.ticketNumber}</td>
                <td className="py-2 px-4 border-b">{invoice.customerName
                    .toLowerCase()
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}</td>
                <td className="py-2 px-4 border-b">{invoice.model.name}</td>
                <td className="py-2 px-4 border-b">{invoice.status}</td>
                <td className="py-2 px-4 border-b">${invoice.total}</td>
                <td className="py-2 px-4 border-b">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleDiagnose(invoice._id)}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {buttonText}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div>
          <label htmlFor="pageSize" className="mr-2">Rows per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="p-2 border rounded bg-white dark:bg-gray-800 text-black dark:text-white"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
        <div className="flex items-center">
          <button
            onClick={handlePrevious}
            className="p-2 border rounded flex items-center"
            disabled={currentPage === 1}
          >
            <FaArrowLeft className="mr-2" /> Previous
          </button>
          <span className="mx-2">
            Page {currentPage} of {totalPages} ({totalRecords} records)
          </span>
          <button
            onClick={handleNext}
            className="p-2 border rounded flex items-center"
            disabled={currentPage === totalPages}
          >
            Next <FaArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepairOrdersTable;