// Welcome message template for new customers
const storeName = "Sushant Computerized Mobile Repaire Center";
export const getWelcomeMessage = (customerName) => 
    `Hello ${customerName},
    Thank you for choosing ${storeName}!
    We’ve received your repair request and our expert team is already on it.
    You’ll receive timely updates as we work to bring your device back to life.
    ${storeName} – Repairing with trust, serving with heart.`;

// Service order creation message template
export const getServiceOrderMessage = (customerName, ticketNumber) => 
    `Hello ${customerName}, your service order has been created successfully. Ticket Number: ${ticketNumber}. Thank you for choosing us!`;

// Status update message template
export const getStatusUpdateMessage = (customerName, ticketNumber, status) => 
    `Hello ${customerName}, the status of your ticket (Ticket Number: ${ticketNumber}) has been updated to "${status}". Thank you for choosing us!`;
// export const getStatusUpdateMessageWithLink = (customerName, ticketNumber, status, link) =>
//     `Hello ${customerName}, the status of your ticket (Ticket Number: ${ticketNumber}) has been updated to "${status}". You can check the details here: ${link}. Thank you for choosing us!`;

export const getFinalInvoiceMessage = (customerName, ticketNumber, amount) =>
    `Hello ${customerName}, your final invoice for Ticket Number: ${ticketNumber} is ready. The total amount is ${amount}. Thank you for choosing us!`;
