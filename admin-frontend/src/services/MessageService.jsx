import { getAuthHeader } from '../utils/authUtils';

export const sendSMS = async (phoneNumber, message) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-sms`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ phoneNumber, message }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
};

export const sendWhatsApp = async (phoneNumber, message) => {
  try {
    const token = getAuthHeader();
    const response = await fetch(`${import.meta.env.VITE_APIURL}/api/messages/send-whatsapp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token,
      },
      body: JSON.stringify({ phoneNumber, message }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
};
