import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GSTR1Report = () => {
  const [orders, setOrders] = useState([]);
  const [taxableFilter, setTaxableFilter] = useState('taxable');
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [status, setStatus] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('custom');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [totalValue, setTotalValue] = useState(0);
  
  const getDateRange = (filterType) => {
    const today = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (filterType) {
      case 'today':
        return { 
          start: today.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };

      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: startDate.toISOString().split('T')[0] 
        };

      case 'weekly':
        startDate.setDate(today.getDate() - 7);
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };

      case 'thisMonth':
        startDate.setDate(1);
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: today.toISOString().split('T')[0] 
        };

      case 'previousMonth':
        startDate.setMonth(today.getMonth() - 1);
        startDate.setDate(1);
        endDate.setDate(0); // Last day of previous month
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'quarterly':
        startDate.setMonth(Math.floor(today.getMonth() / 3) * 3);
        startDate.setDate(1);
        endDate.setMonth(Math.floor(today.getMonth() / 3) * 3 + 2);
        endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'halfYear':
        startDate.setMonth(Math.floor(today.getMonth() / 6) * 6);
        startDate.setDate(1);
        endDate.setMonth(Math.floor(today.getMonth() / 6) * 6 + 5);
        endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      case 'financialYear':
        const month = today.getMonth();
        if (month < 3) { // Jan to March
          startDate.setFullYear(today.getFullYear() - 1);
          startDate.setMonth(3);
          startDate.setDate(1);
          endDate.setMonth(2);
          endDate.setDate(31);
        } else { // April to Dec
          startDate.setMonth(3);
          startDate.setDate(1);
          endDate.setFullYear(today.getFullYear() + 1);
          endDate.setMonth(2);
          endDate.setDate(31);
        }
        return { 
          start: startDate.toISOString().split('T')[0], 
          end: endDate.toISOString().split('T')[0] 
        };

      default:
        return { start: '', end: '' };
    }
  };

  // Initialize default date range (This Month) when component mounts
  useEffect(() => {
    const range = getDateRange('thisMonth');
    setFromDate(range.start);
    setToDate(range.end);
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchCompletedSaleOrders();
    }
  }, [taxableFilter, fromDate, toDate]);

  // Fetch data when date filter changes (non-custom filters)
  useEffect(() => {
    if (dateFilter !== 'custom') {
      fetchCompletedSaleOrders();
    }
  }, [dateFilter]);

  // Fetch data when custom dates change (with debounce for better performance)
  useEffect(() => {
    if (dateFilter === 'custom' && fromDate && toDate) {
      const timeoutId = setTimeout(() => {
        fetchCompletedSaleOrders();
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timeoutId);
    }
  }, [fromDate, toDate]);

  // Handle date filter change
  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      const range = getDateRange(filter);
      setFromDate(range.start);
      setToDate(range.end);
    }
    // Will trigger fetch in useEffect when dateFilter changes
  };

  // Handle custom date changes
  const handleFromDateChange = (date) => {
    setFromDate(date);
    setDateFilter('custom');
  };

  const handleToDateChange = (date) => {
    setToDate(date);
    setDateFilter('custom');
  };

  const fetchCompletedSaleOrders = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_APIURL || '';
      const response = await axios.get(`${API_BASE}/api/sale-orders/taxable`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        params: {
          from: fromDate,
          to: toDate,
          status: status === 'all' ? undefined : status,
          page: 1,
          limit: 5000,
          paidFrom: fromDate,
          paidTo: toDate
        }
      });
      console.log('API Response:', response.data);
      if (response.data.success) {
        let filtered = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Filtered Orders:', filtered);
        setOrders(filtered);
        if (filtered.length > 0) {
          let total = filtered.reduce((sum, order) => sum + (order.total || 0), 0);
          let totalTaxable = filtered.reduce((sum, order) => {
            let taxable =0.0;
              (order.items).forEach(item => {
                    // console.log({item});
                    if (item.tax && item.tax > 0)
                    {
                      taxable = taxable + item.pricePerUnit;
                    }
                });
            return sum + taxable;
          }, 0);
          const totalCgst = filtered.reduce((sum, order) => {
            let cgst =0.0;
            (order.items).forEach(item => {
              if (item.tax && item.tax > 0)
              {
                cgst = cgst + (item.amount - item.pricePerUnit) / 2;
              }
            });
            return sum + cgst;
          }, 0);
          const totalSgst = filtered.reduce((sum, order) => {
            let sgst = 0.0;
            (order.items).forEach(item => {
              if (item.tax && item.tax > 0)
              {
                sgst = sgst + (item.amount - item.pricePerUnit) / 2;
              }
            });
            return sum + sgst;
          }, 0);
          let allValue = {
            total: total.toFixed(2) || 0,
            totalTaxable: totalTaxable.toFixed(2) || 0,
            totalCgst: totalCgst.toFixed(2) || 0,
            totalSgst: totalSgst.toFixed(2) || 0
          }
          setTotalValue(allValue);
          console.log('Total Values:', allValue);
        } else {
          console.error("API Error:", response.data.message);
          setOrders([]);
          setTotalValue({
            total: 0,
            totalTaxable: 0,
            totalCgst: 0,
            totalSgst: 0
          });
        }
      }
    } catch (error) {
      console.error("Error fetching GSTR1 data:", error);
      setOrders([]);
    }
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    let from = new Date(fromDate);
    let to = new Date(toDate);

    let fromYear = from.getFullYear();
    let fromMonth = from.getMonth() + 1; // getMonth() returns 0-11

    let toYear = to.getFullYear();
    let toMonth = to.getMonth() + 1;

    // Load logo image
    const logoImg = new window.Image();
    logoImg.src = '/logo.png';
    logoImg.onload = function() {
      doc.addImage(logoImg, 'PNG', 10, 10, 30, 30); // x, y, width, height
      // Header
      doc.setFontSize(12);
      doc.text('Sushant Computerized Mobile Repaire Center', 45, 15,);
      doc.setFontSize(10);
      doc.text('shop no 10 Mount Unique Residency, Pashan-sus Rd,', 45, 22);
      doc.text('Near pratham WINE', 45, 27);
      doc.text('Phone no.: 9307025605 Email: sushantnangrepatil@gmail.com', 45, 32);
      doc.text('GSTIN: 27AIJPL3296J1ZR, State: 27-Maharashtra', 45, 37);

      // Report Title
      doc.setFontSize(18);
      doc.setFont("times", "bold");
      const textReport = "GSTR 1 Report";
      const pageWidthReport = doc.internal.pageSize.getWidth(); // total page width
      const textWidthReport = doc.getTextWidth(textReport); // width of the text
      const xReport = (pageWidthReport - textWidthReport) / 2; // center position

      // doc.text(textReport, xReport, doc.lastAutoTable.finalY + 10);
      doc.text('GSTR 1 Report', xReport, 47);
      
      // Period Table
      autoTable(doc, {
        startY: 52,
        head: [["From Year", "To Year", "From Month", "To Month"]],
        body: [[fromYear, toYear, monthName(fromMonth), monthName(toMonth)]],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [220, 220, 220] },
      });

      // GSTIN and Company Info Table
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 2,
        body: [
          ["1.GSTIN:", "27AIJPL3296J1ZR"],
          ["2.(a)Legal name of the registered person:", "Sushant Computerized Mobile Repaire Center"],
          ["(b)Trade name, if any", ""],
          ["3.(a)Aggregate Turnover in the preceding Financial Year:", ""],
          ["(b)Aggregate Turnover - April to June, 2017:", ""],
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 80 } },
      });

      // Sale Table
      doc.setFontSize(12);
      const text = "Sale";
      const pageWidth = doc.internal.pageSize.getWidth(); // total page width
      const textWidth = doc.getTextWidth(text); // width of the text
      const x = (pageWidth - textWidth) / 2; // center position

      doc.text(text, x, doc.lastAutoTable.finalY + 10);

       const columns = [
          "GSTIN/UIN No.", "Invoice No.", "Date", "Value", "Rate", "CESS Rate", "Taxable Value", "Integrated Tax", "Central Tax", "State/UT Tax", "CESS", "Place Of Supply"
        ];
      const body = (Array.isArray(orders) ? orders : []).map(order => {
        let taxable =0.0;
          let totalTaxAmount =0.0;
          let cgst = 0.0;
          let sgst = 0.0;

          if (order.items.length>0)
          {
            (order.items).forEach(item => {
                console.log({item});
                if (item.tax && item.tax > 0)
                {
                  taxable = taxable + item.pricePerUnit;
                  totalTaxAmount = totalTaxAmount + (item.amount - item.pricePerUnit);
                }
            });
            cgst = totalTaxAmount/2;
            sgst = totalTaxAmount/2;
          }

         return [
        order.gstNumber || '-',
        order.ticketNumber.split('-')[1] || '-',
        order.date ? new Date(order.date).toLocaleDateString('en-GB').replaceAll('/', '-') : '-',
        order.total || '0.0',
        order.total ? order.items[0].tax || '0.0' : '0.0',
        order.cessRate || '0.0',
        taxable.toFixed(2) || '0.0',
        order.tax || '0.0',
        cgst.toFixed(2) || '0.0',
        sgst.toFixed(2) || '0.0',
        order.cess || '0.0',
        order.placeOfSupply || ''
      ]});

      // Calculate totals for numeric columns
      const totals = [
        'Total', // GSTIN empty
        '', // Ticket No empty
        '', // Label
        body.reduce((sum, row) => sum + parseFloat(row[3] || 0), 0).toFixed(2), // total of column 3
        '',
        '', // Cess Rate, can leave empty
        body.reduce((sum, row) => sum + parseFloat(row[6] || 0), 0).toFixed(2),
        body.reduce((sum, row) => sum + parseFloat(row[7] || 0), 0).toFixed(2),
        body.reduce((sum, row) => sum + parseFloat(row[8] || 0), 0).toFixed(2),
        body.reduce((sum, row) => sum + parseFloat(row[9] || 0), 0).toFixed(2),
        body.reduce((sum, row) => sum + parseFloat(row[10] || 0), 0).toFixed(2),
        '' // Place of Supply empty
      ];
      body.push(totals);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [columns],
        body: body,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 220, 220] },
      });
      // autoTable(doc, {
      //   startY: doc.lastAutoTable.finalY + 5,
      //   body: [totals],
      //   styles: { fillColor: [220, 220, 220] },
      //   didParseCell: (data) => {
      //     if (data.row.index === 0 && data.column.index === 2) {
      //       data.cell.colSpan = 1; // only spans the "Total" label column
      //       data.cell.styles.halign = 'right';
      //     }
      //     if (data.row.index === 0 && [0,1,5,11].includes(data.column.index)) {
      //       data.cell.text = ''; // clear empty cells that we don't want repeated
      //     }
      //   }
      // });
      // i want  make different small table to show totals

      // const totals = [
      //   "-",
      //   "-",
      //   orders.reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2),
      //   "-",
      //   orders.reduce((sum, order) => sum + (order.cessRate || 0), 0).toFixed(2),
      //   orders.reduce((sum, order) => sum + (order.items[0]?.pricePerUnit || 0), 0).toFixed(2),
      //   "-",
      //   ((orders.reduce((sum, order) => sum + (order.total || 0), 0) - orders.reduce((sum, order) => sum + (order.items[0]?.pricePerUnit || 0), 0)) / 2).toFixed(2) || '0.0',
      //   ((orders.reduce((sum, order) => sum + (order.total || 0), 0) - orders.reduce((sum, order) => sum + (order.items[0]?.pricePerUnit || 0), 0)) / 2).toFixed(2) || '0.0',
      //   orders.reduce((sum, order) => sum + (order.cess || 0), 0).toFixed(2),
      //   orders.reduce((sum, order) => sum + (order.placeOfSupply || 0), 0).toFixed(2),
      // ];

      // autoTable(doc, {
      //   startY: doc.lastAutoTable.finalY,
      //   body: [
      //     ['Total', ...totals]
      //   ],
      //   styles: { fillColor: [220, 220, 220] },

      // });
      doc.save(`GSTR1_Report_${year}_${month}.pdf`);
    };
  };

  function monthName(month) {
    return new Date(2000, parseInt(month, 10) - 1).toLocaleString('default', { month: 'long' }).toUpperCase();
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">GST R1 Report</h1>
          <div className="flex items-center mt-2 text-sm text-gray-600">
            <span className="mr-2">📅 Filter:</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
              {dateFilter === 'custom' ? 'Custom Range' : 
               dateFilter === 'today' ? 'Today' :
               dateFilter === 'yesterday' ? 'Yesterday' :
               dateFilter === 'weekly' ? 'Last 7 Days' :
               dateFilter === 'thisMonth' ? 'This Month' :
               dateFilter === 'previousMonth' ? 'Previous Month' :
               dateFilter === 'quarterly' ? 'Quarterly' :
               dateFilter === 'halfYear' ? 'Half Year' :
               dateFilter === 'financialYear' ? 'Financial Year' : 'Unknown'}
            </span>
            {fromDate && toDate && (
              <span className="ml-2 text-gray-500">
                ({fromDate} to {toDate})
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setTaxableFilter('taxable');
              handleDownloadPDF();
            }}
          >
            Download Taxable Report
          </button>
          {/* <button
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setTaxableFilter('nontaxable');
              handleDownloadPDF();
            }}
          >
            Generate Non-Taxable Report
          </button> */}
        </div>
      </div>
    
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        {/* <div>
          <label className="block text-sm text-gray-600 mb-1">Status</label>
          <select 
            className="w-full p-2 border rounded"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div> */}
        
        <div>
          <label className="block text-sm text-gray-600 mb-1">Date Filter</label>
          <select 
            className="w-full p-2 border rounded"
            value={dateFilter}
            onChange={(e) => handleDateFilterChange(e.target.value)}
          >
            <option value="custom">Custom Range</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="weekly">Last 7 Days</option>
            <option value="thisMonth">This Month</option>
            <option value="previousMonth">Previous Month</option>
            <option value="quarterly">Quarterly</option>
            <option value="halfYear">Half Year</option>
            <option value="financialYear">Financial Year</option>
          </select>
        </div>

        <div className={`${dateFilter === 'custom' ? 'block' : 'hidden'}`}>
          <label className="block text-sm text-gray-600 mb-1">From Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
          />
        </div>

        <div className={`${dateFilter === 'custom' ? 'block' : 'hidden'}`}>
          <label className="block text-sm text-gray-600 mb-1">To Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
          />
        </div>

        {dateFilter !== 'custom' && (
          <div className="col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Selected Date Range</label>
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <span className="text-blue-800 font-medium">
                {fromDate} to {toDate}
              </span>
              {loading && (
                <span className="ml-2 text-blue-600 text-sm">
                  🔄 Loading...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={fetchCompletedSaleOrders}
        >
          Apply
        </button>
        {/* <button 
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          onClick={() => {
            // setDepartment('');
            setStatus('all');
            setCurrentPage(1);
            fetchCompletedSaleOrders();
          }}
        >
          Clear
        </button> */}
      </div>
      {/* cards highlighting total values with different colors in one line responsive */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 mb-4 bg-gray-100 rounded">
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600">Total Value</div>
          <div className="text-2xl font-bold">{totalValue?.total || 0}</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600">Total Taxable</div>
          <div className="text-2xl font-bold">{totalValue?.totalTaxable || 0}</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600">Total CGST</div>
          <div className="text-2xl font-bold">{totalValue?.totalCgst || 0}</div>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <div className="text-gray-600">Total SGST</div>
          <div className="text-2xl font-bold">{totalValue?.totalSgst || 0}</div>
        </div>
      </div>
      {/* <div className="flex justify-between items-center mb-4">
        <div>
          Showing {orders.length > 0 ? 1 : 0} to {Math.min(10, orders.length)} of {orders.length} records
        </div>
        <div className="flex items-center gap-2">
          <span>Show:</span>
          <select 
            className="border rounded p-1"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
              fetchCompletedSaleOrders();
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>
      </div> */}

      {/* <div className="flex justify-center space-x-2 mt-4 mb-4">
        <button
          className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => {
            setCurrentPage(prev => prev - 1);
            fetchCompletedSaleOrders();
          }}
        >
          Previous
        </button>
        <button
          className="px-4 py-2 border rounded hover:bg-gray-100"
          onClick={() => {
            setCurrentPage(prev => prev + 1);
            fetchCompletedSaleOrders();
          }}
        >
          Next
        </button>
      </div> */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSTIN/UIN No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CESS Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Integrated Tax</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Central Tax</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State/UT Tax</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CESS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Place Of Supply</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(Array.isArray(orders) ? orders : []).map(order => {
                let taxable =0.0;
                let totalTaxAmount =0.0;
                let cgst = 0.0;
                let sgst = 0.0;
                let tax = 0.0;

                if (order.items.length>0)
                {
                  (order.items).forEach(item => {
                      console.log({item});
                      if (item.tax && item.tax > 0)
                      {
                        taxable = taxable + item.pricePerUnit;
                        totalTaxAmount = totalTaxAmount + (item.amount - item.pricePerUnit);
                        tax = item.tax;
                      }
                  });
                  cgst = totalTaxAmount/2;
                  sgst = totalTaxAmount/2;
                }
    
                return (
                <tr key={order._id} className="hover:bg-gray-50">
                  
                   <td className="px-4 py-2 text-sm border">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-500">{order.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.gstNumber || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.ticketNumber.split('-')[1] || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.date ? new Date(order.date).toLocaleDateString('en-GB').replaceAll('/', '-') : '-'}</td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.total || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tax}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.cessRate || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ taxable || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.tax || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(cgst).toFixed(2) || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(sgst).toFixed(2) || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.cess || '0.0'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.placeOfSupply || ''}</td>
                </tr>
                )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GSTR1Report;
