import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import CustomTooltip from "../components/tooltips/CustomTooltip";
import { FaTrash, FaArrowLeft, FaPrint, FaWhatsapp } from "react-icons/fa"; // Import icons
import jsPDF from "jspdf"; // Import jsPDF
import html2canvas from "html2canvas"; // Import html2canvas
import { toast } from "react-toastify";

const ServiceOrderView = ({ serviceOrderId = "" }) => {
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
  const customerData = { diagnostics: [] };
  const [diagnostics, setDiagnostics] = useState([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnNote, setReturnNote] = useState("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

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
    const interval = setInterval(checkWhatsAppStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await response.json();
        if (data.success) {
          setInvoice(data.data);
          // If the invoice has a diagnostic report, fetch it
          if (data.data.diagnosticReportId) {
            const diagnosticResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/diagnostics/${data.data.diagnosticReportId}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            });
            if (!diagnosticResponse.ok) {
              throw new Error("Failed to fetch diagnostic report");
            }
            const diagnosticData = await diagnosticResponse.json();
            if (diagnosticData.success) {
              setDiagnostics(Object.entries(diagnosticData.data.checks).map(([key, value]) => [key, value.working ? '✅' : '❌']));
            } else {
              console.error("Failed to fetch diagnostic report:", diagnosticData.message);
            }
          }
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

  // const downloadInvoice = async () => {
  //   const invoiceElement = document.getElementById("invoice-content");
  //   const canvas = await html2canvas(invoiceElement, {
  //     scale: 2, // Increase scale for better quality
  //     useCORS: true, // Enable cross-origin for external assets like logos
  //   });
  //   const imgData = canvas.toDataURL("image/png");
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  //   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  //   // Save PDF locally
  //   pdf.save(`Invoice_${invoice.invoiceId || "Unknown"}.pdf`);

  //   // Prepare folder path and filename for server storage
  //   const now = new Date();
  //   const year = now.getFullYear();
  //   const month = String(now.getMonth() + 1).padStart(2, "0");
  //   const day = String(now.getDate()).padStart(2, "0");
  //   const ticketNo = invoice.ticketNumber || "Unknown";
  //   const filename = `${ticketNo}.pdf`;
  //   const folderPath = `public/invoices/${year}/${month}/${day}/`;

  //   // Convert PDF to Blob
  //   const pdfBlob = pdf.output("blob");

  //   // Upload PDF to server
  //   const formData = new FormData();
  //   formData.append("file", pdfBlob, filename);
  //   formData.append("folderPath", folderPath);

  //   let fileUrl = "";
  //   try {
  //     const uploadResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/invoices/upload`, {
  //       method: "POST",
  //       body: formData,
  //     });
  //     const uploadData = await uploadResponse.json();
  //     console.log({uploadData});
  //     if (uploadResponse.ok && uploadData.success && uploadData.url) {
  //       fileUrl = uploadData.url; // The backend should return the accessible URL of the uploaded file
  //       alert("Invoice saved to server successfully!");
  //     } else {
  //       alert("Failed to save invoice to server: " + (uploadData.message || "Unknown error"));
  //     }
  //   } catch (err) {
  //     console.error("Error uploading invoice:", err);
  //   }
  //   console.log("File URL:", fileUrl);
  //   // Send WhatsApp message with invoice to the customer's phone number
  //   if (fileUrl && invoice.phone) {
  //     const message = `Hello ${invoice.customerName},\n\nYour invoice is ready. Please find it attached.\n\nThank you!`;
  //     const media = {
  //       name: filename,
  //       mime: "application/pdf",
  //       url: fileUrl,
  //     };
  //     try {
  //       fileUrl = fileUrl.replace("/public", ""); // Adjust the URL if needed
  //       fileUrl = `${import.meta.env.VITE_APIURL}` + fileUrl;
  //       console.log("Sending WhatsApp message with media:", fileUrl);
  //       const response = await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           accept: "*/*",
  //         },
  //         body: JSON.stringify({
  //           phoneNumber: invoice.phone, // Use the customer's phone number from the invoice
  //           message: message,
  //           media: [fileUrl],
  //         }),
  //       });
  //       const data = await response.json();
  //       if (data.success) {
  //         alert("WhatsApp message sent successfully!");
  //       } else {
  //         console.error("Failed to send WhatsApp message:", data.message);
  //         alert("Failed to send WhatsApp message. Please try again.");
  //       }
  //     } catch (err) {
  //       console.error("Error sending WhatsApp message:", err);
  //       alert("Failed to send WhatsApp message. Please try again.");
  //     }
  //   }
  // };


  // Updated download function
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

      // Server upload logic (same as before)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const serverFilename = `${invoice.ticketNumber || Date.now()}.pdf`;
      const folderPath = `public/invoices/${year}/${month}/${day}/`;

      const pdfBlob = pdf.output("blob");
      const formData = new FormData();
      formData.append("file", pdfBlob, serverFilename);
      formData.append("folderPath", folderPath);

      let fileUrl = "";
      try {
        const uploadResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/invoices/upload`, {
          method: "POST",
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success && uploadData.url) {
          fileUrl = uploadData.url;
          toast.success("Invoice downloaded and saved to server successfully!");
        } else {
          toast.error("Invoice downloaded locally. Server upload failed: " + (uploadData.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error uploading invoice:", err);
        toast.error("Invoice downloaded locally with smart page breaks. Server upload failed.");
      }

      // Send WhatsApp message if file was uploaded successfully
      if (fileUrl && invoice.phone) {
        await sendWhatsAppInvoice(invoice, fileUrl, serverFilename);
      }

    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      toast.error("Error generating invoice. Please try again.");

      // Remove loading indicator if it exists
      const loadingDiv = document.querySelector('div');
      if (loadingDiv && loadingDiv.innerHTML.includes('Generating PDF')) {
        document.body.removeChild(loadingDiv);
      }
    }
  };


  // Send Service Order to WhatsApp function
  const sendServiceOrderToWhatsApp = async () => {
    try {
      // Show loading indicator
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                    background: rgba(0,0,0,0.8); z-index: 9999; display: flex; 
                    justify-content: center; align-items: center;">
          <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="font-size: 18px; margin-bottom: 15px;">📤 Sending Service Order...</div>
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
      const filename = `ServiceOrder_${ticketNo}.pdf`;
      const folderPath = `public/service-orders/${year}/${month}/${day}/`;

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
        throw new Error(uploadData.message || "Failed to upload service order to server");
      }

      const fileUrl = uploadData.url;
      const serverFilePath = uploadData.filePath; // Get the server file path

      updateProgress(80);

      // Get authentication token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Send service order via WhatsApp using backend notification service
      const whatsappResponse = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/send-service-order`, {
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
          serviceOrderPdfPath: serverFilePath, // Use server file path
          fileUrl: fileUrl
        }),
      });

      const whatsappData = await whatsappResponse.json();
      updateProgress(100);

      // Remove loading indicator
      document.body.removeChild(loadingDiv);

      if (whatsappData.success) {
        alert("✅ Service Order sent to customer's WhatsApp successfully!");
      } else {
        throw new Error(whatsappData.message || "Failed to send service order via WhatsApp");
      }

    } catch (error) {
      console.error("Error sending service order to WhatsApp:", error);
      
      // Remove loading indicator if it exists
      const loadingDiv = document.querySelector('div[style*="position: fixed"]');
      if (loadingDiv && loadingDiv.parentNode) {
        loadingDiv.parentNode.removeChild(loadingDiv);
      }
      
      alert(`❌ Failed to send service order: ${error.message}`);
    }
  };

  // WhatsApp sending function
  const sendWhatsAppInvoice = async (invoice, fileUrl, filename) => {
    const message = `Hello ${invoice.customerName || 'Valued Customer'},

Your service order/invoice is ready. Please find it attached.

Invoice #: ${invoice.invoiceId || invoice.ticketNumber || 'N/A'}
Date: ${new Date().toLocaleDateString()}
${invoice.phone ? `Phone: ${invoice.phone}` : ''}

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
        toast.error(`Invoice downloaded successfully. WhatsApp sending failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error sending WhatsApp message:", err);
      toast.error("Invoice downloaded successfully. WhatsApp sending failed.");
    }
  };


  // Send Service Order Link via WhatsApp (lightweight message with clickable link)
  const sendServiceOrderLinkViaWhatsApp = async () => {
    if (!whatsappConnected) {
      toast.error('WhatsApp is not connected. Please connect WhatsApp first from Settings.');
      return;
    }

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
      const filename = `ServiceOrder_${ticketNo}.pdf`;
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
        throw new Error(uploadData.message || "Failed to upload service order to server");
      }

      // Build the public URL
      let publicFileUrl = uploadData.url;
      if (publicFileUrl.startsWith('/public')) {
        publicFileUrl = publicFileUrl.replace('/public', '');
      }
      if (!publicFileUrl.startsWith('/')) {
        publicFileUrl = '/' + publicFileUrl;
      }
      const baseUrl = import.meta.env.VITE_APIURL || 'http://localhost:3000';
      const invoiceUrl = `${baseUrl}${publicFileUrl}`;

      // Get auth token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Send the service order link via WhatsApp
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/notifications/send-invoice-link`, {
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
          invoiceUrl: invoiceUrl,
          totalAmount: invoice.total,
          type: 'service_order'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('\u2705 Service order link sent to customer\'s WhatsApp!');
      } else {
        throw new Error(data.message || 'Failed to send service order link');
      }

    } catch (error) {
      console.error('Error sending service order link via WhatsApp:', error);
      toast.error(`\u274c Failed to send service order link: ${error.message}`);
    } finally {
      setSendingLink(false);
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

  // const printInvoice = async () => {
  //   const invoiceElement = document.getElementById("invoice-content");
  //   const canvas = await html2canvas(invoiceElement, {
  //     scale: 2, // Increase scale for better quality
  //     useCORS: true, // Enable cross-origin for external assets like logos
  //   });
  //   const imgData = canvas.toDataURL("image/png");
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   const pdfWidth = pdf.internal.pageSize.getWidth();
  //   const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  //   pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

  //   // Open the PDF in a new tab for printing
  //   const pdfBlob = pdf.output("blob");
  //   const pdfUrl = URL.createObjectURL(pdfBlob);
  //   const printWindow = window.open(pdfUrl, "_blank");
  //   printWindow.onload = () => {
  //     printWindow.print();
  //     // printWindow.close();
  //   };
  // };

  // Updated print function
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
      toast.error("Error printing invoice. Please try again.");
    }
  };

  // Return order handler
  const handleReturnOrder = async () => {
    if (!returnReason.trim() || !returnNote.trim()) {
      alert("Please provide both reason and note for the return.");
      return;
    }

    setIsProcessingReturn(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_APIURL}/api/sale-orders/${invoiceId}/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          returnReason,
          returnNote,
          returnedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setInvoice(updatedOrder.data);
        setShowReturnModal(false);
        setReturnReason("");
        setReturnNote("");
        toast.success("Order marked as returned successfully!");
        
        // Send WhatsApp notification about return
        try {
          await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
            },
            body: JSON.stringify({
              phoneNumber: invoice.phone,
              message: `Hello ${invoice.customerName},\n\nYour device has been returned for service order ${invoice.ticketNumber}.\n\nReason: ${returnReason}\n\nThank you for choosing our services!`,
            }),
          });
        } catch (err) {
          console.error("Failed to send return WhatsApp message", err);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to process return: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error processing return:", error);
      alert("Error processing return. Please try again.");
    } finally {
      setIsProcessingReturn(false);
    }
  };
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

    // Add header only on first page
    if (isFirstPage) {
      // addPDFHeader(pdf, invoice, margins, pageWidth);
    }

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

    // Add footer only on last page
    // if (isLastPage) {
    //   addPDFFooter(pdf, invoice, margins, pageWidth, pageHeight);
    // }

    // Add page number on all pages (optional)
    addPageNumber(pdf, i + 1, pageBreaks.length, pageWidth, pageHeight, margins);
  }

  return pdf;
};

// Function to add header to PDF (only on first page)
const addPDFHeader = (pdf, invoice, margins, pageWidth) => {
  const headerY = margins.top;
  
  // Set font for header
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  
  // Company name
  pdf.text("Sushant Computerized Mobile Repaire Center", margins.left, headerY + 5);
  
  // Set smaller font for details
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  
  // Company details - left side
  const leftColumnX = margins.left;
  pdf.text("The Iphone Technician", leftColumnX, headerY + 10);
  pdf.text("Shop no.10, Mount Unique Residency, Pashan - Sus Rd,", leftColumnX, headerY + 14);
  pdf.text("Near Pratham Wine, Mohan Nagar Co-Op Society,", leftColumnX, headerY + 18);
  pdf.text("Baner, Pune, Maharashtra 411045", leftColumnX, headerY + 22);
  
  // Order details - right side
  const rightColumnX = pageWidth - 70;
  pdf.text(`Order No: ${invoice.ticketNumber}`, rightColumnX, headerY + 5);
  pdf.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, rightColumnX, headerY + 9);
  pdf.text(`Time: ${new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, rightColumnX, headerY + 13);
  pdf.text("Phone: 9307025605", rightColumnX, headerY + 17);
  pdf.text("GSTIN: -", rightColumnX, headerY + 21);
  
  // Add a line separator
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margins.left, headerY + 25, pageWidth - margins.right, headerY + 25);
};

// Function to add footer to PDF (only on last page)
const addPDFFooter = (pdf, invoice, margins, pageWidth, pageHeight) => {
  const footerY = pageHeight - margins.bottom - 20;
  
  // Add a line separator above footer
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margins.left, footerY - 5, pageWidth - margins.right, footerY - 5);
  
  // Set footer background color (optional)
  pdf.setFillColor(34, 197, 94); // Green color
  pdf.rect(margins.left, footerY, pageWidth - margins.left - margins.right, 20, 'F');
  
  // Set font for footer
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  
  // Center the footer text
  const centerX = pageWidth / 2;
  pdf.text("Thank you for your business!", centerX, footerY + 7, { align: 'center' });
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("For any queries, contact us at sushantnangrepatil@gmail.com or call 9307025605", centerX, footerY + 12, { align: 'center' });
  
  // Reset text color
  pdf.setTextColor(0, 0, 0);
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

  if (!invoice) {
    return <div className="text-center mt-10">Loading invoice...</div>;
  }
  console.log({ invoice });
  return (
    <div
      className={`p-6 min-h-screen ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
        }`}
      style={{ maxWidth: "calc(100vw - 120px)" }}
    >
      <div className="w-full flex justify-between items-center mb-4">

        <div className="flex gap-4">
          {/* {invoice.status !== "preDiagnosed"  &&  */}
          <>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={downloadInvoice}
            >
              Download Service Order
            </button>
            <button
              className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded flex items-center"
              onClick={sendServiceOrderToWhatsApp}
            >
              📤 Send Service Order
            </button>
            <button
              className={`text-white font-bold py-2 px-4 rounded flex items-center ${
                whatsappConnected
                  ? 'bg-green-600 hover:bg-green-800'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={sendServiceOrderLinkViaWhatsApp}
              disabled={!whatsappConnected || sendingLink}
              title={whatsappConnected ? 'Send service order link via WhatsApp' : 'WhatsApp is not connected'}
            >
              {sendingLink ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <FaWhatsapp className="mr-2" />
                  {whatsappConnected ? 'Send Link via WhatsApp' : 'WhatsApp Offline'}
                </>
              )}
            </button>
            <button
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center ${printerConnected ? "" : "opacity-50 cursor-not-allowed"
                }`}
              onClick={printInvoice}
              disabled={!printerConnected}
            >
              <FaPrint className="mr-2" /> Print Service Order
            </button>
            
            {/* Return Button - Only show for Completed and Paid orders */}
            {(invoice.status === "Completed" || invoice.status === "Paid") && (
              <button
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded flex items-center"
                onClick={() => setShowReturnModal(true)}
              >
                🔄 Return
              </button>
            )}
          </>
          {/* } */}

        </div>
      </div>

      <div
        className={`a4-view ${isDarkMode ? "text-white" : "text-black"}`}
        id="invoice-content"
        style={{ fontFamily: "Arial, sans-serif" }}
      >

        {/* Header Section */}
        <div className="flex justify-center items-center mt-4 mb-4">
          {/* <div
                className="bg-green-600 text-white p-8 py-2 "
              > */}
          <h1 className="text-xl font-bold tracking-wide">Service Order</h1>
          {/* </div> */}
        </div>
        <div className="flex justify-between items-center mt-8 mb-8 p-4 bg-white rounded shadow-md border border-gray-200">

          <div className="flex items-center ">
            <img
              src="/logo.png" // Replace with the actual logo path
              alt="Company Logo"
              className="w-20 h-20 object-contain mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold">Sushant Computerized Mobile Repaire Center</h1>
              <p className="text-sm text-gray-600">The Iphone Technician</p>
              <p className="text-sm text-gray-600">Shop no.10, Mount Unique Residency, Pashan - Sus Rd,</p>
              <p className="text-sm text-gray-600">Near Pratham Wine, Mohan Nagar Co-Op Society,</p>
              <p className="text-sm text-gray-600">Baner, Pune, Maharashtra 411045</p>
              <p className="text-sm font-bold text-gray-600">(Open Time : 11AM to 11PM MONDAY CLOSED !!)</p>
            </div>
          </div>
          <div className="relative ">
            <p className="text-sm text-gray-600"><span className="font-bold">Order No:</span> <span>{invoice.ticketNumber}</span></p>
            <p className="text-sm text-gray-600"><span className="font-bold">Date:</span> <span>{new Date(invoice.createdAt).toLocaleDateString()}</span> <span className="font-bold">Time : </span> <span>{new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></p>
            <p className="text-sm text-gray-600"><span className="font-bold">Phone:</span> <span> 9579682717</span></p>
            <p className="text-sm text-gray-600"><span className="font-bold">Email:</span><span> sushantnangrepatil@gmail.com </span></p>
            <p className="text-sm text-gray-600"><span className="font-bold">GSTIN:</span> <span> -</span></p>
          </div>
        </div>

        {/* Billing and Device Details */}
        <div className="grid w-full gap-6">
          {/* <h2 className="text-lg font-bold text-gray-900">Service Order To:</h2> */}
          {/* Service Order To: Side by Side Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {/* Customer Info */}
            <div className="p-2 rounded border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Customer Info:</h2>
              <p className="text-sm"><strong>Name:</strong> {invoice.customerName
                .toLowerCase()
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}</p>
              <p className="text-sm"><strong>Phone:</strong> {invoice.phone}</p>
              <p className="text-sm"><strong>Alternate Phone:</strong> {invoice.alternatePhone || " - "}</p>
              <p className="text-sm"><strong>Address:</strong> {invoice?.address || ""} </p>
            </div>
            {/* Device Info */}
            <div className="p-2 rounded border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Device Info:</h2>
              <p className="text-sm"><strong>Device Brand:</strong> {invoice.deviceBrand.name}</p>
              <p className="text-sm"><strong>Model:</strong> {invoice.model.name}</p>
              <p className="text-sm"><strong>Color:</strong> {invoice.color || " - "}</p>
              <p className="text-sm"><strong>IMEI:</strong> {invoice.imeiNumber || " - "}</p>
              {/* <p className="text-sm"><strong>Assets Received:</strong> {invoice.assetsReceived || " - "}</p>
              
              <p className="text-sm"><strong>Serial No:</strong> {invoice.serialNumber || " - "}</p>
              <p className="text-sm"><strong>Order Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p className="text-sm"><strong>Order Time:</strong> {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p> */}
            </div>
          </div>

          {/* Return Status Information */}
          {invoice.returns && invoice.returns.length > 0 && (
            <div className="p-4 rounded border border-orange-200 bg-orange-50 dark:bg-orange-900/20">
              <h2 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-2 flex items-center">
                🔄 Return History (Total Returns: {invoice.returns.length})
              </h2>
              <div className="space-y-3">
                {invoice.returns.map((returnItem, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4">
                    <p className="text-sm"><strong>Return #{index + 1}:</strong> {new Date(returnItem.returnedAt).toLocaleDateString()} at {new Date(returnItem.returnedAt).toLocaleTimeString()}</p>
                    <p className="text-sm"><strong>Reason:</strong> {returnItem.returnReason}</p>
                    <p className="text-sm"><strong>Note:</strong> {returnItem.returnNote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Status Timeline */}
          {(invoice.completedAt || invoice.paidAt) && (
            <div className="p-4 rounded border border-green-200 bg-green-50 dark:bg-green-900/20">
              <h2 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">📅 Order Timeline</h2>
              <div className="space-y-2">
                <p className="text-sm"><strong>Created:</strong> {new Date(invoice.createdAt).toLocaleDateString()} at {new Date(invoice.createdAt).toLocaleTimeString()}</p>
                {invoice.completedAt && (
                  <p className="text-sm"><strong>Completed:</strong> {new Date(invoice.completedAt).toLocaleDateString()} at {new Date(invoice.completedAt).toLocaleTimeString()}</p>
                )}
                {invoice.paidAt && (
                  <p className="text-sm"><strong>Paid:</strong> {new Date(invoice.paidAt).toLocaleDateString()} at {new Date(invoice.paidAt).toLocaleTimeString()}</p>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Device Diagnostics 
        <div className="mb-2 rounded border border-gray-200 p-2">
          <h2 className="text-lg font-bold text-gray-700 mb-2">Device Diagnostics Report:</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs ">
            {diagnostics.map(([component, status], idx) => (
              <React.Fragment key={idx}>
                <div className="font-semibold  py-1 bg-gray-50">
                  <span> {status}</span>
                  <span>{component?.replace(/([A-Z])/g, ' $1')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase())
                    .trim()}</span>
                  
                </div>
                {/* <div className="border border-gray-300 px-2 py-1 text-center">
                    {status === "✅" ? (
                      <span className="text-green-600 font-bold">✅ Working</span>
                    ) : (
                      <span className="text-red-600 font-bold">❌ Not Working</span>
                    )}
                  </div>
              </React.Fragment>
            ))}
            If odd number, fill last cell for alignment 
            {diagnostics.length % 2 !== 0 && <div></div>}
          </div>
        </div>
         */}

        {/* Items Table */}
        <div className="mb-2 ">
          <h2 className="text-lg font-bold text-gray-700 p-2">Estimated Cost:</h2>
          <table className="w-full border-collapse border border-gray-300 mb-2 text-sm p-2">
            <thead className=" text-black">
              <tr>
                <th className="border border-gray-300 px-2 py-2 text-left">SR.No.</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Reported Issue</th>
                {/* <th className="border border-gray-300 px-4 py-2 text-left">Item Description</th> */}
                <th className="border border-gray-300 px-4 py-2 text-left">Remark</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Price</th>
                <th className="border border-gray-300 px-4 py-2 text-right">GST</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2">{item.issue?.replace(/_/g, " ").toUpperCase() || "N/A"}</td>
                  {/* <td className="border border-gray-300 px-4 py-2">{item.description.replace(/_/g," ").toUpperCase() || "N/A"}</td> */}
                  {/* <td className="border border-gray-300 px-4 py-2">{item.warranty.replace(/_/g," ").toUpperCase() || "N/A"}</td> */}
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.descriptions || " - "}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₹{(item.pricePerUnit || 0).toFixed(2)}</td>
                  {item.tax ? (
                    <td className="border border-gray-300 px-4 py-2 text-right">GST@{item.tax}% :  ₹{calculateGST(item.pricePerUnit || 0, item.tax || 0).toFixed(2)}</td>
                  ) : (
                    <td className="border border-gray-300 px-4 py-2 text-right"> - </td>
                  )}
                  <td className="border border-gray-300 px-4 py-2 text-right">₹{(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          {/* Payment Info and Totals Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Information */}
            <div className="p-2 rounded border border-gray-200">
              {/* <h2 className="text-lg font-bold text-gray-700 mb-2">Payment Info:</h2>
              <p className="text-sm">Account #: 205 2565 2445</p>
              <p className="text-sm">Bank Name: XYZ Bank</p>
              <p className="text-sm">Branch: Pune</p> */}
            </div>
            {/* Totals Section */}
            <div className="p-2 rounded border border-gray-200 text-right">
              {/* <h2 className="text-lg font-bold text-gray-700 mb-2">Totals</h2> */}
              <p className="text-lg"><strong>Sub Total:</strong> ₹{(invoice.total || 0).toFixed(2)}</p>
              {/* <p className="text-lg"><strong>GST@{invoice.tax}%:</strong> ₹{calculateGST(invoice.total || 0, invoice.tax || 0).toFixed(2)}</p> */}
              <p className="text-lg"><strong>Advance:</strong> ₹{(invoice.advance || 0).toFixed(2)}</p>
              <p className="text-lg font-bold text-green-600"><strong>Total:</strong> ₹{((invoice.total || 0) + calculateGST(invoice.total || 0, invoice.tax || 0)).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-700">Terms & Conditions:</h2>
          <ul className="list-disc pl-6 text-sm">
            <li>1.	Data Backup: Customer is responsible for backing up all data. We are not liable for any data loss.</li>
            <li>2.	Repair Approval: Repair commences only after customer approval of estimated costs.</li>
            <li>3.	Warranty: 90-day limited warranty on repaired parts and labor only. Voided by physical damage, liquid contact, or unauthorized tampering.</li>
            <li>4.	No Full Restoration: Full device functionality is not guaranteed, especially for severely damaged items.</li>
            <li>Water Damage (Specific):
              <ul className="list-disc pl-6 text-sm">
                <li>No guarantee of full recovery or data.</li>
                <li>Increased risk of further damage during repair.</li>
                <li>Warranty is severely limited or void due to ongoing corrosion.</li>
                <li>Diagnostic fee may apply regardless of repair success.</li>
              </ul>
            </li>
            <li>Unclaimed Devices: Devices not collected within 45 days will be considered abandoned and may be disposed of.</li>
            <li>Liability: Our liability is limited to the cost of the repair service.</li>
          </ul>
        </div>
                {/* Footer */}
        <div className="text-center mt-8 bg-green-600 text-white py-4 rounded">
          <p className="text-sm font-bold">Thank you for your business!</p>
          <p className="text-sm">For any queries, contact us at sushantnangrepatil@gmail.com or call 9579682717.</p>
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowReturnModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
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

              {/* Modal Body */}
              <div className="p-6">
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Mark this service order as returned. This action will record the return details and notify the customer.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg mb-4">
                    <p className="text-sm"><strong>Ticket #:</strong> {invoice.ticketNumber}</p>
                    <p className="text-sm"><strong>Customer:</strong> {invoice.customerName}</p>
                    <p className="text-sm"><strong>Status:</strong> {invoice.status}</p>
                  </div>
                </div>

                {/* Return Reason */}
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

                {/* Return Note */}
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

                {/* Action Buttons */}
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

export default ServiceOrderView;
