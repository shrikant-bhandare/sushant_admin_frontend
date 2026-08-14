import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import CustomTooltip from "../components/tooltips/CustomTooltip";
import { FaTrash, FaArrowLeft, FaPrint, FaWhatsapp } from "react-icons/fa"; // Import icons
import jsPDF from "jspdf"; // Import jsPDF
import html2canvas from "html2canvas"; // Import html2canvas
import { toast } from "react-toastify";
import { replace } from "lodash";
import QRCode from "react-qr-code";


const InvoiceView = ({serviceOrderId=""}) => {
  var { invoiceId } = useParams();
  if (!invoiceId) {
    invoiceId = serviceOrderId;
  }
  const [invoice, setInvoice] = useState(null);
  const { isDarkMode } = useTheme();
  const navigate = useNavigate(); // Initialize navigate
  const [printerConnected, setPrinterConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  // Check WhatsApp connection status
  const checkWhatsAppStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/whatsapp/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setWhatsappConnected(data.isReady || false);
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappConnected(false);
    }
  };

  useEffect(() => {
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 30000); // Recheck every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log({data});
        if (data.success) {
          setInvoice(data.data);
        } else {
          console.error("Failed to fetch invoice:", data.message);
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const calculateGST = (amount, taxRate) => (amount || 0) * (taxRate || 0) / 100;

  // Updated download function with enhanced PDF generation
  const downloadInvoice = async () => {
    try {
      // Add CSS for better table detection
      addTableDetectionCSS();

      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        Generating PDF with intelligent page breaks...
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
      loadingDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:20px;border:2px solid #3498db;border-radius:8px;z-index:9999;box-shadow:0 4px 6px rgba(0,0,0,0.1);';
      document.body.appendChild(loadingDiv);

      const pdf = await generateInvoicePDF(invoice);

      // Remove loading indicator
      document.body.removeChild(loadingDiv);

      // Save PDF locally
      const filename = `Invoice_${invoice.invoiceId || invoice.ticketNumber || Date.now()}.pdf`;
      pdf.save(filename);

      // Server upload logic
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const serverFilename = `${invoice._id}.pdf`;
      const folderPath = `public/invoices/${year}/${month}/${day}/`;

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append("file", pdfBlob, serverFilename);
      formData.append("folderPath", folderPath);

      let fileUrl = "";
      try {
        const token = localStorage.getItem('accessToken');
        const uploadResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/invoices/upload`, {
          method: "POST",
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success && uploadData.url) {
          fileUrl = uploadData.url;
          toast.success("Invoice downloaded and saved to server successfully!");
        } else {
          console.log("Invoice downloaded locally. Server upload failed: " + (uploadData.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error uploading invoice:", err);
        console.log("Invoice downloaded locally with smart page breaks. Server upload failed.");
      }

      // Send WhatsApp message if file was uploaded successfully
      if (fileUrl && invoice.phone) {
        await sendWhatsAppInvoice(invoice, fileUrl, serverFilename);
      }

    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      // toast.error("Error generating invoice. Please try again.");

      // Remove loading indicator if it exists
      const loadingDiv = document.querySelector('div');
      if (loadingDiv && loadingDiv.innerHTML.includes('Generating PDF')) {
        document.body.removeChild(loadingDiv);
      }
    }
  };

  // Send Invoice to WhatsApp function
  const sendInvoiceToWhatsApp = async () => {
    try {
      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.8); z-index: 9999; display: flex; 
                    justify-content: center; align-items: center;">
          <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="font-size: 18px; margin-bottom: 15px;">📤 Sending Invoice...</div>
            <div style="font-size: 14px; color: #666;">Generating PDF and sending to customer's WhatsApp</div>
            <div style="margin-top: 15px;">
              <div style="width: 200px; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                <div id="progress-bar" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(loadingDiv);

      // Update progress
      const updateProgress = (percentage) => {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
          progressBar.style.width = `${percentage}%`;
        }
      };

      updateProgress(10);

      // Add CSS for better table detection
      addTableDetectionCSS();
      updateProgress(20);

      // Generate PDF
      const pdf = await generateInvoicePDF(invoice, "invoice-content");
      updateProgress(40);

      // Prepare file details
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const ticketNo = invoice.ticketNumber || "Unknown";
      const filename = `${invoice._id}.pdf`;
      const folderPath = `public/invoices/${year}/${month}/${day}/`;

      updateProgress(50);

      // Convert PDF to Blob
      const pdfBlob = pdf.output("blob");

      // Upload PDF to server
      const formData = new FormData();
      formData.append("file", pdfBlob, filename);
      formData.append("folderPath", folderPath);

      updateProgress(60);

      const uploadResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/invoices/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      updateProgress(70);

      if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
        throw new Error(uploadData.message || "Failed to upload invoice to server");
      }

      const fileUrl = uploadData.url;
      const serverFilePath = uploadData.filePath; // Get the server file path

      updateProgress(80);

      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Send invoice via WhatsApp using backend notification service
      const whatsappResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/send-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: invoice._id,
          ticketNumber: invoice.ticketNumber,
          customerName: invoice.customerName,
          customerPhone: invoice.phone,
          deviceModel: `${invoice.deviceBrand?.name || 'Device'} ${invoice.model?.name || 'Model'}`,
          invoicePdfPath: serverFilePath, // Use server file path
          fileUrl: fileUrl
        }),
      });

      const whatsappData = await whatsappResponse.json();
      updateProgress(100);

      // Remove loading indicator
      document.body.removeChild(loadingDiv);

      if (whatsappData.success) {
        toast.success("✅ Invoice sent to customer's WhatsApp successfully!");
      } else {
        throw new Error(whatsappData.message || "Failed to send invoice via WhatsApp");
      }

    } catch (error) {
      console.error("Error sending invoice to WhatsApp:", error);
      
      // Remove loading indicator if it exists
      const loadingDiv = document.querySelector('div[style*="position: fixed"]');
      if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
      
      // toast.error(`❌ Failed to send invoice: ${error.message}`);
    }
  };

  // WhatsApp sending function (legacy, kept for compatibility)
  const sendWhatsAppInvoice = async (invoice, fileUrl, filename) => {
    const message = `Hello ${invoice.customerName || 'Valued Customer'},

Your invoice is ready. Please find it attached.

Invoice #: ${invoice.invoiceId || invoice.ticketNumber || 'N/A'}
Date: ${new Date().toLocaleDateString()}
${invoice.phone ? `Phone: ${invoice.phone}` : ''}

Store Details:
Address: Bramhanpuri, Near Swami Samarth Mandir, Urun Ishwarpur, Maharashtra 415409
Phone: 9763636381
Timings: 8.30 am to 8.00 pm

Thank you for choosing our services!

Best regards,
Your Service Team`;

    try {
      console.log("Original file URL from server:", fileUrl);

      // Create the full publicly accessible URL
      let publicFileUrl = fileUrl;

      // Remove /public prefix if it exists
      if (publicFileUrl.startsWith('/public')) {
        publicFileUrl = publicFileUrl.replace('/public', '');
      }

      // Ensure it starts with /
      if (!publicFileUrl.startsWith('/')) {
        publicFileUrl = '/' + publicFileUrl;
      }

      // Create full URL - Use your actual domain in production
      const baseUrl = import.meta.env.VITE_APIURL || 'http://localhost:3000';
      publicFileUrl = `${baseUrl}${publicFileUrl}`;

      console.log("Sending WhatsApp message with media URL:", publicFileUrl);

      // Get authentication token
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "*/*",
          ...(token && { "Authorization": `Bearer ${token}` }) // Add auth header if token exists
        },
        body: JSON.stringify({
          phoneNumber: invoice.phone,
          message: message,
          media: [publicFileUrl], // Send as array with single URL
        }),
      });

      const data = await response.json();
      console.log("WhatsApp API response:", data);

      if (data.success) {
        toast.success("Invoice downloaded and WhatsApp message sent successfully!");
      } else {
        console.error("Failed to send WhatsApp message:", data.message);
        // toast.error(`Invoice downloaded successfully. WhatsApp sending failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error sending WhatsApp message:", err);
      // toast.error("Invoice downloaded successfully. WhatsApp sending failed.");
    }
  };

  // Send Invoice Link via WhatsApp (using wa.me redirect - no backend WhatsApp connection needed)
  const sendInvoiceLinkViaWhatsApp = async () => {
    if (!invoice.phone) {
      toast.error('Customer phone number is not available.');
      return;
    }

    try {
      setSendingLink(true);

      // Add CSS for better table detection
      addTableDetectionCSS();

      // Generate PDF
      const pdf = await generateInvoicePDF(invoice, "invoice-content");

      // Prepare file details
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const ticketNo = invoice.ticketNumber || "Unknown";
      const filename = `${invoice._id}.pdf`;
      const folderPath = `public/invoices/${year}/${month}/${day}/`;

      // Convert PDF to Blob and upload
      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append("file", pdfBlob, filename);
      formData.append("folderPath", folderPath);

      const uploadResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/invoices/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
        throw new Error(uploadData.message || "Failed to upload invoice to server");
      }

      // Build the dynamic redirect URL (branded invoice view page)
      const baseUrl = import.meta.env.VITE_APIURL || 'http://localhost:3000';

      // Create a secure short URL via API (hides ticket number from URL)
      const shortUrlResponse = await fetch(`${baseUrl}/api/invoices/short-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ticketNumber: invoice.ticketNumber || ticketNo,
          orderId: invoice._id,
          type: "invoice",
        }),
      });
      const shortUrlData = await shortUrlResponse.json();

      let invoiceUrl;
      if (shortUrlResponse.ok && shortUrlData.success && shortUrlData.shortUrl) {
        invoiceUrl = shortUrlData.shortUrl;
      } else {
        // Fallback to direct URL if short URL creation fails
        invoiceUrl = `${baseUrl}/api/invoices/view/${encodeURIComponent(invoice.ticketNumber || ticketNo)}`;
      }

      // Format phone number for wa.me (needs country code, no + sign)
      let phone = invoice.phone.toString().trim().replace(/[^0-9]/g, '');
      if (phone.startsWith('0')) {
        phone = '91' + phone.substring(1);
      } else if (phone.length === 10) {
        phone = '91' + phone;
      }

      // Format total amount
      const formattedAmount = invoice.total
        ? `\u20b9${Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '';

      // Build the WhatsApp message
      // const deviceModel = `${invoice.deviceBrand?.name || 'Device'} ${invoice.model?.name || 'Model'}`;
      const deviceModel = `${invoice.model?.name || 'Model'}`;
      const message = `*Invoice - ${ticketNo}*\n\nHi ${invoice.customerName || 'Valued Customer'}!\n\nYour invoice is ready.\n${formattedAmount ? `\n*Total Amount:* ${formattedAmount}\n` : ''}\n*Invoice Details:*\n- Invoice Number: ${ticketNo}\n- Device: ${deviceModel}\n- Date: ${new Date().toLocaleDateString('en-IN')}\n\nTap below to view and download your invoice:\n${invoiceUrl}\n\n*Store Details:*\n- Address: Bramhanpuri, Near Swami Samarth Mandir, Urun Ishwarpur, Maharashtra 415409\n- Phone: 9763636381\n- Timings: 8.30 am to 8.00 pm\n\nThank you for choosing Sushant Computerized Mobile Repaire Center!\n\n_Sushant Computerized Mobile Repaire Center Team_`;

      // Open WhatsApp Web/App with pre-filled message using wa.me redirect
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');

      toast.success('\u2705 WhatsApp opened with invoice link!');

    } catch (error) {
      console.error('Error preparing invoice link for WhatsApp:', error);
      toast.error(`\u274c Failed to prepare invoice link: ${error.message}`);
    } finally {
      setSendingLink(false);
    }
  };

  // Send Invoice to Email function
  const sendInvoiceToEmail = async () => {
    // Check if customer email exists
    if (!invoice.customerEmail && !invoice.email) {
      // Prompt user to enter email
      const email = prompt("Please enter customer email address:");
      if (!email) {
        toast.warning("Email is required to send invoice via email.");
        return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      invoice.customerEmail = email;
    }

    try {
      // // Show background process toast
      // const toastId = toast.info("📧 Generating and sending invoice via email...", {
      //   autoClose: false,
      //   closeOnClick: false,
      //   draggable: false,
      //   closeButton: false,
      //   isLoading: true,
      // });

      // Add CSS for better table detection
      addTableDetectionCSS();

      // Generate PDF
      const pdf = await generateInvoicePDF(invoice, "invoice-content");

      // Prepare file details
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const ticketNo = invoice.ticketNumber || "Unknown";
      const filename = `${invoice._id}.pdf`;
      const folderPath = `public/invoices/${year}/${month}/${day}/`;

      // Convert PDF to Blob
      const pdfBlob = pdf.output("blob");

      // Upload PDF to server
      const formData = new FormData();
      formData.append("file", pdfBlob, filename);
      formData.append("folderPath", folderPath);

      const uploadResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/invoices/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: formData,
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success || !uploadData.url) {
        throw new Error(uploadData.message || "Failed to upload invoice to server");
      }

      const fileUrl = uploadData.url;
      const serverFilePath = uploadData.filePath;

      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Send invoice via Email using backend notification service
      const emailResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/send-invoice-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: invoice._id,
          ticketNumber: invoice.ticketNumber,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail || invoice.email,
          deviceModel: `${invoice.model?.name || 'Model'}`,
          totalAmount: invoice.total,
          invoicePdfPath: serverFilePath,
          fileUrl: fileUrl
        }),
      });

      const emailData = await emailResponse.json();

      if (emailData.success) {
        // toast.update(toastId, {
        //   render: "✅ Invoice sent to customer's email successfully!",
        //   type: "success",
        //   isLoading: false,
        //   autoClose: 4000,
        //   closeOnClick: true,
        //   closeButton: true,
        // });
        console.log("✅ Invoice sent to customer's email successfully!")
      } else {
        throw new Error(emailData.message || "Failed to send invoice via email");
      }

    } catch (error) {
      console.error("Error sending invoice to email:", error);
      // toast.error(`❌ Failed to send invoice: ${error.message}`);
    }
  };

  const raiseTicket = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          accept: "*/*",
        },
        body: JSON.stringify({ status: "ticketRaised" }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Ticket raised successfully!");
        navigate(-1); // Navigate back
      } else {
        console.error("Failed to raise ticket:", data.message);
        alert("Failed to raise ticket. Please try again.");
      }
    } catch (error) {
      console.error("Error raising ticket:", error);
      alert("An error occurred while raising the ticket.");
    }
  };

  const checkPrinterConnection = async () => {
    try {
      // Simulate printer connection check
      const isConnected = await navigator.print?.(); // Check if the browser supports printing
      setPrinterConnected(!!isConnected);
      setPrinterConnected(true);
    } catch (error) {
      console.error("Error checking printer connection:", error);
      setPrinterConnected(false);
    }
  };

  const printInvoice = async () => {
    if (!printerConnected) {
      toast.info("Printer not connected. Please check your printer connection.");
      return;
    }

    try {
      const pdf = await generateInvoicePDF(invoice);

      // Open the PDF in a new tab for printing
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, "_blank");

      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
            // Clean up the object URL after printing
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl);
            }, 2000);
          }, 500);
        };
      } else {
        toast.info("Please allow popups to print the invoice.");
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      // toast.error("Error printing invoice. Please try again.");
    }
  };

  // Enhanced PDF generation with proper page handling and header/footer
const generateInvoicePDF = async (invoice, elementId = "invoice-content") => {
  const invoiceElement = document.getElementById(elementId);

  if (!invoiceElement) {
    throw new Error("Invoice element not found");
  }

  // Find all tables and their positions before canvas generation
  const tableElements = invoiceElement.querySelectorAll('table, .table, .payment-section, .total-section, .items-table');
  const tablePositions = [];

  // Get table positions relative to the invoice element
  tableElements.forEach((table, index) => {
    const rect = table.getBoundingClientRect();
    const parentRect = invoiceElement.getBoundingClientRect();
    tablePositions.push({
      index,
      element: table,
      startY: rect.top - parentRect.top,
      endY: rect.bottom - parentRect.top,
      height: rect.height,
      className: table.className,
      tagName: table.tagName
    });
  });

  console.log('Detected tables:', tablePositions);

  // Create high-quality canvas
  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    removeContainer: false,
    imageTimeout: 15000,
    logging: false
  });

  const imgData = canvas.toDataURL("image/png", 1.0);

  // Standard A4 dimensions in mm
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Reserved spaces for header and footer
  const headerHeight = 0; // Space reserved for header
  const footerHeight = 0; // Space reserved for footer
  const margins = {
    top: 10,
    bottom: 10,
    left: 15,
    right: 15
  };

  // Available content area
  const contentStartY = margins.top + headerHeight;
  const contentEndY = pageHeight - margins.bottom - footerHeight;
  const availableContentHeight = contentEndY - contentStartY;
  const contentWidth = pageWidth - margins.left - margins.right;

  // Calculate image dimensions
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Convert table positions to PDF coordinates
  const pdfTablePositions = tablePositions.map(table => ({
    ...table,
    startY: (table.startY / invoiceElement.offsetHeight) * imgHeight,
    endY: (table.endY / invoiceElement.offsetHeight) * imgHeight,
    height: (table.height / invoiceElement.offsetHeight) * imgHeight
  }));

  console.log('PDF table positions:', pdfTablePositions);

  // Calculate intelligent page breaks
  const pageBreaks = calculateIntelligentPageBreaks(
    imgHeight,
    availableContentHeight,
    pdfTablePositions
  );

  console.log('Calculated page breaks:', pageBreaks);

  // Generate pages based on intelligent breaks
  for (let i = 0; i < pageBreaks.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    const pageBreak = pageBreaks[i];
    const isFirstPage = i === 0;
    const isLastPage = i === pageBreaks.length - 1;

    // Calculate content slice for this page
    const sliceHeight = pageBreak.endY - pageBreak.startY;
    const canvasStartY = (pageBreak.startY * canvas.height) / imgHeight;
    const canvasSliceHeight = (sliceHeight * canvas.height) / imgHeight;

    // Create temporary canvas for this page slice
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = Math.round(canvasSliceHeight);
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the slice
    tempCtx.drawImage(
      canvas,
      0, Math.round(canvasStartY),
      canvas.width, Math.round(canvasSliceHeight),
      0, 0,
      canvas.width, Math.round(canvasSliceHeight)
    );

    const sliceImgData = tempCanvas.toDataURL("image/png", 1.0);

    // Add content to PDF
    pdf.addImage(
      sliceImgData,
      "PNG",
      margins.left,
      contentStartY,
      imgWidth,
      sliceHeight
    );

    // Add page number on all pages (optional)
    addPageNumber(pdf, i + 1, pageBreaks.length, pageWidth, pageHeight, margins);
  }

  return pdf;
};

// Function to add page numbers (optional)
const addPageNumber = (pdf, currentPage, totalPages, pageWidth, pageHeight, margins) => {
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(128, 128, 128); // Gray color
  
  const pageText = `Page ${currentPage} of ${totalPages}`;
  pdf.text(pageText, pageWidth - margins.right, pageHeight - 5, { align: 'right' });
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
};

// Intelligent page break calculation that respects table boundaries
const calculateIntelligentPageBreaks = (totalHeight = 25, pageHeight, tablePositions) => {
  const pageBreaks = [];
  let currentY = 0;
  let pageNumber = 1;

  while (currentY < totalHeight) {
    const idealEndY = currentY + pageHeight;
    let actualEndY = idealEndY;

    // If this is the last bit of content, just take it all
    if (idealEndY >= totalHeight) {
      pageBreaks.push({
        pageNumber,
        startY: currentY,
        endY: totalHeight,
        reason: 'last-page'
      });
      break;
    }

    // Check if the ideal break point intersects with any table
    const conflictingTable = findTableAtPosition(idealEndY, tablePositions);

    if (conflictingTable) {
      console.log(`Page ${pageNumber}: Table conflict detected`, conflictingTable);

      // Check if we can fit the entire table on this page
      const tableStartOnPage = Math.max(conflictingTable.startY, currentY);
      const spaceNeededForTable = conflictingTable.endY - tableStartOnPage;
      const availableSpace = pageHeight - (tableStartOnPage - currentY);

      if (spaceNeededForTable <= availableSpace && conflictingTable.startY >= currentY) {
        // Table fits on current page, extend page to include entire table
        actualEndY = conflictingTable.endY;
        console.log(`Page ${pageNumber}: Extended to include table, endY: ${actualEndY}`);
      } else {
        // Table doesn't fit, break before the table starts
        actualEndY = conflictingTable.startY;
        console.log(`Page ${pageNumber}: Breaking before table, endY: ${actualEndY}`);

        // Ensure we're not creating an empty page or making no progress
        if (actualEndY <= currentY) {
          // Force break at ideal position to avoid infinite loop
          actualEndY = idealEndY;
          console.log(`Page ${pageNumber}: Forced break to avoid empty page`);
        }
      }
    }

    // Ensure minimum content per page (avoid very small pages)
    const minPageContent = pageHeight * 0.3; // At least 30% of page height
    if (actualEndY - currentY < minPageContent && currentY + minPageContent < totalHeight) {
      actualEndY = Math.min(currentY + minPageContent, totalHeight);
      console.log(`Page ${pageNumber}: Applied minimum content rule, endY: ${actualEndY}`);
    }

    pageBreaks.push({
      pageNumber,
      startY: currentY,
      endY: actualEndY,
      reason: conflictingTable ? 'table-aware' : 'normal'
    });

    currentY = actualEndY;
    pageNumber++;

    // Safety check to prevent infinite loops
    if (pageNumber > 50) {
      console.error('Too many pages generated, breaking to prevent infinite loop');
      break;
    }
  }

  return pageBreaks;
};

// Find table that intersects with the given Y position
const findTableAtPosition = (yPosition, tablePositions) => {
  return tablePositions.find(table => {
    // Check if the break position falls within a table
    const marginBuffer = 5; // Small buffer to avoid breaking too close to table edges
    return yPosition > (table.startY - marginBuffer) && yPosition < (table.endY + marginBuffer);
  });
};

  // CSS helper to improve table detection (add this to your invoice component)
  const addTableDetectionCSS = () => {
    const style = document.createElement('style');
    style.textContent = `
    /* Add classes to help identify table sections */
    .payment-summary, .payment-table, .total-section, .items-table {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Ensure tables are properly identified */
    table, .table {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Add some spacing around critical sections */
    .payment-section::before, .total-section::before {
      content: "";
      display: block;
      height: 10px;
    }
  `;
    document.head.appendChild(style);
  };

  useEffect(() => {
    checkPrinterConnection();
  }, []);

  // Helper function to convert number to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    const convertHundreds = (n) => {
      let str = '';
      if (n >= 100) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += ones[n] + ' ';
      }
      return str;
    };
    
    const numInt = Math.floor(num);
    const decimal = Math.round((num - numInt) * 100);
    
    let result = '';
    
    if (numInt >= 10000000) {
      result += convertHundreds(Math.floor(numInt / 10000000)) + 'Crore ';
    }
    if (numInt >= 100000) {
      result += convertHundreds(Math.floor((numInt % 10000000) / 100000)) + 'Lakh ';
    }
    if (numInt >= 1000) {
      result += convertHundreds(Math.floor((numInt % 100000) / 1000)) + 'Thousand ';
    }
    if (numInt >= 100) {
      result += convertHundreds(Math.floor((numInt % 1000) / 100)) + 'Hundred ';
    }
    if (numInt % 100 > 0) {
      result += convertHundreds(numInt % 100);
    }
    
    result = result.trim() + ' Rupees';
    
    if (decimal > 0) {
      result += ' and ' + convertHundreds(decimal).trim() + ' Paise';
    }
    
    return result + ' Only';
  };

  // Calculate totals for GST
  const calculateTotals = () => {
    const subtotal = (invoice?.items || []).reduce((acc, item) => acc + (parseFloat(item.pricePerUnit) || 0), 0);
    // Calculate actual GST from items (Amount - PricePerUnit = GST included)
    const totalGst = (invoice?.items || []).reduce((acc, item) => {
      const amount = parseFloat(item.amount) || 0;
      const pricePerUnit = parseFloat(item.pricePerUnit) || 0;
      return acc + (amount - pricePerUnit);
    }, 0);
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const grandTotal = subtotal + totalGst;
    const discount = (invoice?.items || []).reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0) - (invoice?.total || 0);
    
    return { subtotal, cgst, sgst, cgstRate: 9, sgstRate: 9, grandTotal, discount };
  };

  if (!invoice) {
    return <div className="text-center mt-10">Loading invoice...</div>;
  }
  
  console.log({invoice});
  const totals = calculateTotals();
  
  return (
    <div
      className={`p-6 min-h-screen ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
      }`}
      style={{ maxWidth: "calc(100vw - 120px)" }}
    >
      {/* Action Buttons - Hidden on Print */}
      <div className="w-full flex justify-between items-center mb-4 print:hidden">
        <div className="flex gap-4">
          {invoice.status !== "preDiagnosed" && (
            <>
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                onClick={downloadInvoice}
              >
                Download Invoice
              </button>
              {/* <button
                className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center"
                onClick={sendInvoiceToWhatsApp}
              >
                📤 Send Invoice
              </button> */}
              <button
                className={`text-white font-bold py-2 px-4 rounded flex items-center bg-green-600 hover:bg-green-800`}
                onClick={sendInvoiceLinkViaWhatsApp}
                disabled={sendingLink}
                title="Send invoice link via WhatsApp"
              >
                {sendingLink ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Preparing...
                  </>
                ) : (
                  <>
                    <FaWhatsapp className="mr-2" />
                    Send Link via WhatsApp
                  </>
                )}
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-800 text-white font-bold py-2 px-4 rounded flex items-center"
                onClick={sendInvoiceToEmail}
              >
                📧 Send to Email
              </button>
              <button
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center ${
                  printerConnected ? "" : "opacity-50 cursor-not-allowed"
                }`}
                onClick={printInvoice}
                disabled={!printerConnected}
              >
                <FaPrint className="mr-2" /> Print Invoice
              </button>
            </>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 8mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              font-family: Arial, Helvetica, sans-serif !important;
              box-sizing: border-box !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              font-family: Arial, Helvetica, sans-serif !important;
              color: #000000 !important;
              line-height: 1.4 !important;
              font-size: 12px !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            #invoice-content {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 15px !important;
              padding-bottom: 15px !important;
              box-shadow: none !important;
              font-family: Arial, Helvetica, sans-serif !important;
              color: #000000 !important;
              font-size: 10px !important;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              table-layout: fixed !important;
              margin-bottom: 4px !important;
            }
            td, th {
              vertical-align: top !important;
              color: #000000 !important;
              padding: 4px !important;
              font-size: 10px !important;
            }
            p {
              margin: 0 0 2px 0 !important;
              line-height: 1.3 !important;
            }
            img {
              display: block !important;
            }
            h1 {
              font-size: 18px !important;
              margin-bottom: 8px !important;
            }
          }
        `}
      </style>

      <div className="overflow-auto">
        <div
          id="invoice-content"
          className="relative max-w-4xl w-[210mm] mx-auto bg-white text-black shadow-lg"
          style={{ fontFamily: "Arial, Helvetica, sans-serif", padding: "15px 20px", paddingBottom: "15px", fontSize: "11px", color: "#000000", border: "2px solid #000000" }}
        >
          {/* Tax Invoice Title */}
          <h1 style={{ 
            textAlign: "center", 
            fontSize: "18px", 
            fontWeight: "bold", 
            color: "#000000", 
            margin: "0 0 8px 0",
            borderBottom: "2px solid #000000",
            paddingBottom: "5px"
          }}>
            Tax Invoice
          </h1>

          {/* Header Section - Company Info Left, Invoice Details Right */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px", border: "1px solid #000000" }}>
            <tbody>
              <tr>
                {/* Left Side - Logo and Company Details */}
                <td style={{ verticalAlign: "top", width: "60%", paddingRight: "8px", borderRight: "1px solid #000000", padding: "6px" }}>
                  <table style={{ borderCollapse: "collapse" }}>
                    <tbody>
                      <tr>
                        <td style={{ verticalAlign: "top", paddingRight: "8px", width: "100px" }}>
                          <img
                            src="/logo.png"
                            alt="Sushant Computerized Mobile Repaire Center Logo"
                            style={{ width: "100px", height: "100px", objectFit: "contain" }}
                          />
                        </td>
                        <td style={{ verticalAlign: "top" }}>
                          <p style={{ fontSize: "13px", fontWeight: "bold", color: "#000000", margin: "0 0 2px 0" }}>
                            Sushant Computerized Mobile Repaire Center
                          </p>
                          <p style={{ margin: "1px 0", fontSize: "10px", color: "#000000" }}>
                            Bramhanpuri, Near Swami Samarth Mandir, Urun Ishwarpur, Maharashtra 415409
                          </p>
                          <p style={{ margin: "1px 0", fontSize: "10px", color: "#000000" }}>
                            Phone no.: 9763636381
                          </p>
                          <p style={{ margin: "1px 0", fontSize: "10px", color: "#000000" }}>
                            Timings: 8.30 am to 8.00 pm
                          </p>
                          <p style={{ margin: "1px 0", fontSize: "10px", color: "#000000" }}>
                            Email: sushantnangrepatil@gmail.com
                          </p>
                          <p style={{ margin: "2px 0", fontSize: "11px", color: "#000000" }}>
                            GSTIN: -
                          </p>
                          <p style={{ margin: "2px 0", fontSize: "11px", color: "#000000" }}>
                            State: 27-Maharashtra
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                {/* Right Side - Invoice Details Table */}
                <td style={{ verticalAlign: "top", width: "40%", padding: "10px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000000", fontSize: "10px" }}>
                    <tbody>
                      <tr>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", color: "#000000" }}>
                          <strong>Invoice No.</strong><br/>{invoice.ticketNumber ? replace(invoice.ticketNumber, "TC-", "") : invoice._id?.slice(-6) || "N/A"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", color: "#000000" }}>
                          <strong>Date</strong><br/>{new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", color: "#000000" }}>
                          <strong>Device & Brand</strong><br/>{invoice.deviceBrand?.name || "Device"}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", color: "#000000" }}>
                          <strong>Model</strong><br/>{invoice.model?.name || "N/A"}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", color: "#000000" }}>
                          <strong>Technician Name</strong><br/>{ " - "}
                           {/* invoice.technician?.name || invoice.assignedTechnician?.name || */}
                        </td>
                        <td style={{ border: "1px solid #000000", padding: "4px 6px", color: "#000000" }}>
                          <strong>Deadline of Job</strong><br/>{invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : (invoice.deadline ? new Date(invoice.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bill To Section */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px", border: "1px solid #000000" }}>
            <tbody>
              <tr>
                <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "1px solid #000000", backgroundColor: "#f0f0f0" }}>
                  <span style={{ fontWeight: "bold", color: "#000000" }}>Bill To</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 8px" }}>
                  <p style={{ margin: "0 0 2px 0", fontSize: "11px", fontWeight: "bold", color: "#000000" }}>
                    {invoice.customerName?.toUpperCase() || "CUSTOMER"}
                  </p>
                  {invoice.customerAddress && (
                    <p style={{ margin: "0 0 2px 0", fontSize: "10px", color: "#000000" }}>
                      Address: {invoice.customerAddress}
                    </p>
                  )}
                  {(invoice.customerGstin || invoice.gstNumber) && (
                    <p style={{ margin: "0 0 2px 0", fontSize: "10px", color: "#000000" }}>
                      GSTIN NO : {invoice.customerGstin || invoice.gstNumber || "-"}
                    </p>
                  )}
                  <p style={{ margin: "0", fontSize: "10px", color: "#000000" }}>
                    Contact No. : {invoice.phone || "N/A"}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Items Table */}
          <table className="invoice-table" style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            marginBottom: "6px",
            fontSize: "10px",
            border: "1px solid #000000"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", width: "5%", fontWeight: "bold", color: "#000000" }}>#</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", width: "30%", fontWeight: "bold", color: "#000000" }}>Item name</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", width: "12%", fontWeight: "bold", color: "#000000" }}>HSN/ SAC</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", width: "10%", fontWeight: "bold", color: "#000000" }}>Quantity</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "13%", fontWeight: "bold", color: "#000000" }}>Price/ Unit</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "15%", fontWeight: "bold", color: "#000000" }}>GST</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", width: "15%", fontWeight: "bold", color: "#000000" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice?.items.map((item, index) => {
                const itemAmount = parseFloat(item?.amount) || 0;
                const pricePerUnit = parseFloat(item?.pricePerUnit) || 0;
                const gstAmount = itemAmount - pricePerUnit; // GST = Amount - Base Price
                const taxRate = item?.tax || 0;
                return (
                  <tr key={index}>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", color: "#000000" }}>{index + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "left", color: "#000000" }}>
                      <strong>{item?.issue?.replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") || "Service"}</strong>
                      {item?.warranty && <div style={{ fontSize: "8px", color: "#000000" }}>({item.warranty.replace(/_/g, " ")})</div>}
                    </td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", color: "#000000" }}></td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", color: "#000000" }}>1</td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "right", color: "#000000" }}>₹{pricePerUnit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "right", color: "#000000" }}>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({taxRate}%)</td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "right", color: "#000000" }}>₹ {itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
              {/* Total Row */}
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <td colSpan="3" style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "left", fontWeight: "bold", color: "#000000", fontSize: "10px" }}>Total</td>
                <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "center", fontWeight: "bold", color: "#000000", fontSize: "10px" }}>{invoice?.items?.length || 0}</td>
                <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", color: "#000000" }}></td>
                <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: "bold", color: "#000000", fontSize: "10px" }}>₹ {(totals.cgst + totals.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style={{ border: "1px solid #000000", padding: "5px 4px", textAlign: "right", fontWeight: "bold", color: "#000000", fontSize: "10px" }}>₹ {((invoice?.items || []).reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>

          {/* Invoice Amount in Words and Payment Summary */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5px", border: "1px solid #000000" }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: "top", width: "100%", padding: "4px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: "1px 0", fontWeight: "bold", color: "#000000", fontSize: "10px" }}>Invoice Amount in Words</td>
                        <td style={{ padding: "1px 0", fontWeight: "bold", color: "#000000", fontSize: "10px" }}>Amounts</td>
                      </tr>
                      <tr>
                        <td style={{ padding: "1px 0", color: "#000000", fontWeight: "500" }}>{numberToWords(invoice.total || 0)}</td>
                        <td style={{ padding: "1px 0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: "1px 0" }}>Sub Total</td>
                                <td style={{ padding: "1px 0", textAlign: "right" }}>₹ {((invoice?.items || []).reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "1px 0" }}>
                          <span style={{ fontWeight: "bold" }}>Payment mode</span>
                        </td>
                        <td style={{ padding: "1px 0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: "1px 0", fontWeight: "bold", color: "#000000" }}>Total</td>
                                <td style={{ padding: "1px 0", textAlign: "right", fontWeight: "bold", color: "#000000" }}>₹ {(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "1px 0", color: "#000000", fontWeight: "bold" }}>
                          {(() => {
                            const method = (invoice.paymentType || invoice.paymentType || '').toLowerCase();
                            if (method === 'cash') return 'CASH';
                            if (method === 'card') return 'CARD';
                            if (method === 'upi') return 'UPI';
                            if (method === 'paytm') return 'PAYTM';
                            if (method === 'online') return 'ONLINE';
                            if (method) return method.toUpperCase();
                            return 'N/A';
                          })()}
                        </td>
                        <td style={{ padding: "1px 0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: "1px 0", color: "#000000" }}>Received</td>
                                <td style={{ padding: "1px 0", textAlign: "right", color: "#000000" }}>₹ {(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "1px 0" }}></td>
                        <td style={{ padding: "1px 0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: "1px 0", fontWeight: "bold", color: "#000000" }}>Balance</td>
                                <td style={{ padding: "1px 0", textAlign: "right", fontWeight: "bold", color: "#000000" }}>₹ 0.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Terms and Conditions with Signature */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "5px", border: "1px solid #000000" }}>
            <tbody>
              <tr>
                <td style={{ verticalAlign: "top", padding: "6px", fontSize: "9px", color: "#000000", lineHeight: "1.4", width: "70%", borderRight: "1px solid #000000" }}>
                  <p style={{ margin: "0 0 3px 0", fontWeight: "bold", color: "#000000", fontSize: "11px" }}>Terms and conditions</p>
                  <p style={{ margin: "0 0 2px 0", fontWeight: "bold" }}>Terms and Conditions for Electronic Device Repair at Sushant Computerized Mobile Repaire Center .</p>
                  <p style={{ margin: "0 0 1px 0", fontStyle: "italic" }}>Service Description:</p>
                  <p style={{ margin: "0 0 1px 0" }}>a. Our services encompass diagnostic assessments, repair, replacement of parts, software upgrades, and related services as deemed necessary by our technicians.</p>
                  <p style={{ margin: "0 0 1px 0" }}>b. We aim to restore the functionality of your device to the best of our abilities, but we cannot guarantee complete restoration in all cases.</p>
                  <p style={{ margin: "0 0 1px 0", fontStyle: "italic" }}>Customer Responsibilities:</p>
                  <p style={{ margin: "0 0 1px 0" }}>a. You are responsible for backing up your data before submitting your device for repair(if Device is in working condition). We shall not be liable for any loss of data during the repair process.</p>
                  <p style={{ margin: "0 0 1px 0" }}>b. You are responsible for providing accurate and complete information about the device and its issues to the best of your knowledge.</p>
                  <p style={{ margin: "0 0 1px 0" }}>c. You shall promptly inform us of any changes in contact information or any other relevant details.</p>
                  <p style={{ margin: "0 0 1px 0" }}>d. You agree to remove any personal or confidential data from the device before submitting it for repair. We shall not be responsible for any loss or unauthorized access to such data.</p>
                  <p style={{ margin: "0 0 1px 0", fontStyle: "italic" }}>Repair Process:</p>
                  <p style={{ margin: "0 0 1px 0" }}>a. Once you submit your device for repair, we will perform a diagnostic assessment to identify the issue(s) and provide you with a repair estimate.</p>
                  <p style={{ margin: "0 0 1px 0" }}>b. Repair estimates provided are approximate and subject to change upon further evaluation of the device.</p>
                  <p style={{ margin: "0 0 1px 0" }}>c. We will commence repair only after receiving your explicit approval of the repair estimate and any associated charges.</p>
                  <p style={{ margin: "0 0 1px 0" }}>d. We aim to complete the repairs within the estimated time frame, but unforeseen circumstances may cause delays. We shall not be liable for any such delays.</p>
                  <p style={{ margin: "0 0 1px 0" }}>e. During the repair process of Physical Damage or Liquid Damage device,it may go dead or can have other issues due to impact of accident.Customer shall provide consent on the same to go ahead and repair the device.</p>
                  <p style={{ margin: "0 0 1px 0", fontStyle: "italic" }}>Warranty:</p>
                  <p style={{ margin: "0 0 1px 0" }}>a. We offer a limited warranty of 90 Days on the repairs performed, covering the replaced parts and the workmanship for a specified period.</p>
                  <p style={{ margin: "0 0 1px 0" }}>b. The warranty shall be void if any repairs are attempted by unauthorized personnel or if the device is damaged due to mishandling, accidents, misuse, or any actions beyond our control.</p>
                  <p style={{ margin: "0 0 1px 0" }}>c. The warranty covers only the repaired/replaced parts and does not extend to any pre-existing or subsequent issues with the device.</p>
                  <p style={{ margin: "0 0 1px 0", fontStyle: "italic" }}>Limitation of Liability:</p>
                  <p style={{ margin: "0 0 1px 0" }}>a. Our liability shall be limited to the cost of repair services provided by us.</p>
                  <p style={{ margin: "0 0 1px 0" }}>b. We shall not be liable for any indirect, incidental, consequential, or punitive damages arising out of the use or inability to use the repaired device.</p>
                  <p style={{ margin: "0 0 1px 0", fontStyle: "italic" }}>Confidentiality and Privacy:</p>
                  <p style={{ margin: "0 0 1px 0" }}>a. We shall handle your personal and device information in accordance with applicable data protection laws and our privacy policy.</p>
                  <p style={{ margin: "0 0 1px 0" }}>b. We may collect, store, and process your personal information for the purpose of providing repair services and maintaining customer records.</p>
                </td>
                {/* Signature Column */}
                <td style={{ verticalAlign: "top", width: "30%", padding: "6px", textAlign: "center" }}>
                  <p style={{ margin: "0 0 3px 0", fontSize: "9px", color: "#000000" }}>
                    <span>For : </span>
                    <strong>Sushant Computerized Mobile Repaire Center</strong>
                  </p>
                  <img
                    src="/assets/images/signature1.png"
                    alt="Stamp"
                    style={{ width: "60px", height: "60px", objectFit: "contain", display: "inline-block", margin: "5px 0" }}
                  />
                  <p style={{ margin: "3px 0 0 0", fontSize: "9px", color: "#000000", fontWeight: "bold" }}>Authorized Signatory</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
