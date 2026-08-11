import React, { useState } from "react";
import { Modal, Box } from "@mui/material";
import TicketDetails from "./TicketDetails";

const TicketDetailsModal = ({ isOpen, onClose, serviceOrderId, onNext }) => {
  const [key, setKey] = useState(0); // Used to force re-render TicketDetails when reopened

  const handleClose = () => {
    onClose();
    setTimeout(() => setKey((prev) => prev + 1), 300); // reset TicketDetails state after closing
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="ticket-details-modal-title"
      aria-describedby="ticket-details-modal-description"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90vw",
          maxWidth: 1100,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 2,
          maxHeight: "95vh",
          overflowY: "auto",
          borderRadius: 2,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Ticket Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-red-600 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Render your existing TicketDetails inside modal */}
        <TicketDetails
          key={key} // resets the component on reopen
          serviceOrderId={serviceOrderId}
          onNext={onNext}
        />
      </Box>
    </Modal>
  );
};

export default TicketDetailsModal;
