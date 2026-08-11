import React, { useState } from "react";
import { sendSMS, sendWhatsApp } from "../services/MessageService";

const MessageSender = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendSMS = async () => {
    setIsSending(true);
    try {
      const response = await sendSMS(phoneNumber, message);
      alert(response.message);
    } catch (error) {
      alert("Failed to send SMS");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setIsSending(true);
    try {
      const response = await sendWhatsApp(phoneNumber, message);
      alert(response.message);
    } catch (error) {
      alert("Failed to send WhatsApp message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Send Message</h2>
      <div className="mb-4">
        <label className="block font-medium mb-2">Phone Number</label>
        <input
          type="text"
          className="p-2 border rounded w-full"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-2">Message</label>
        <textarea
          className="p-2 border rounded w-full"
          rows="4"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
      </div>
      <div className="flex gap-4">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleSendSMS}
          disabled={isSending}
        >
          Send SMS
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleSendWhatsApp}
          disabled={isSending}
        >
          Send WhatsApp
        </button>
      </div>
    </div>
  );
};

export default MessageSender;
