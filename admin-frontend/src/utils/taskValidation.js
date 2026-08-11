// Frontend validation utilities for tasks

/**
 * Validates task creation data
 * @param {Object} taskData - The task data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateTaskData = (taskData) => {
  const errors = [];

  // Required fields validation
  if (!taskData.taskName || taskData.taskName.trim().length === 0) {
    errors.push("Task name is required");
  } else if (taskData.taskName.trim().length < 3) {
    errors.push("Task name must be at least 3 characters long");
  } else if (taskData.taskName.trim().length > 100) {
    errors.push("Task name cannot exceed 100 characters");
  }

  if (!taskData.taskDescription || taskData.taskDescription.trim().length === 0) {
    errors.push("Task description is required");
  } else if (taskData.taskDescription.trim().length < 10) {
    errors.push("Task description must be at least 10 characters long");
  } else if (taskData.taskDescription.trim().length > 500) {
    errors.push("Task description cannot exceed 500 characters");
  }

  if (!taskData.technician || taskData.technician.trim().length === 0) {
    errors.push("Technician selection is required");
  }

  if (!taskData.priorityLevel || taskData.priorityLevel.trim().length === 0) {
    errors.push("Priority level is required");
  } else if (!["Low", "Medium", "High"].includes(taskData.priorityLevel)) {
    errors.push("Priority level must be Low, Medium, or High");
  }

  if (!taskData.ticketNumber || taskData.ticketNumber.trim().length === 0) {
    errors.push("Ticket number is required");
  }

  if (!taskData.saleOrderId || taskData.saleOrderId.trim().length === 0) {
    errors.push("Sale Order ID is required");
  }

  // Optional fields validation
  if (taskData.note && taskData.note.length > 300) {
    errors.push("Note cannot exceed 300 characters");
  }

  if (taskData.status && !["Pending", "InProgress", "Completed"].includes(taskData.status)) {
    errors.push("Status must be Pending, InProgress, or Completed");
  }

  // Parts validation
  if (taskData.parts && Array.isArray(taskData.parts)) {
    taskData.parts.forEach((part, index) => {
      if (part.quantity && (!Number.isInteger(part.quantity) || part.quantity < 1)) {
        errors.push(`Part ${index + 1}: Quantity must be a positive integer`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Validates technician data for display
 * @param {Object} technician - The technician object
 * @returns {string} - Display name for technician
 */
export const getValidTechnicianName = (technician) => {
  if (!technician) return 'Not Assigned';
  
  // Check for name field first, then username, then fallback
  if (technician.name && technician.name.trim()) {
    return technician.name.trim();
  }
  
  if (technician.username && technician.username.trim()) {
    return technician.username.trim();
  }
  
  if (technician.email && technician.email.trim()) {
    return technician.email.trim();
  }
  
  return 'Unknown Technician';
};

/**
 * Validates task status transitions
 * @param {string} currentStatus - Current task status
 * @param {string} newStatus - New status to transition to
 * @returns {Object} - Validation result
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    'Pending': ['InProgress', 'Completed'],
    'InProgress': ['Completed', 'Pending'],
    'Completed': [] // Usually completed tasks shouldn't be changed
  };

  const isValid = validTransitions[currentStatus]?.includes(newStatus) || false;
  
  return {
    isValid,
    message: isValid 
      ? 'Valid status transition' 
      : `Cannot change status from ${currentStatus} to ${newStatus}`
  };
};

/**
 * Sanitizes task input data
 * @param {Object} taskData - Raw task data
 * @returns {Object} - Sanitized task data
 */
export const sanitizeTaskData = (taskData) => {
  return {
    ...taskData,
    taskName: taskData.taskName?.trim() || '',
    taskDescription: taskData.taskDescription?.trim() || '',
    note: taskData.note?.trim() || '',
    ticketNumber: taskData.ticketNumber?.trim() || '',
    technician: taskData.technician?.trim() || '',
    priorityLevel: taskData.priorityLevel?.trim() || '',
    status: taskData.status?.trim() || 'Pending',
    saleOrderId: taskData.saleOrderId?.trim() || ''
  };
};

/**
 * Validates MongoDB ObjectId format
 * @param {string} id - The ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
export const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validates part data
 * @param {Object} part - Part data to validate
 * @returns {Object} - Validation result
 */
export const validatePartData = (part) => {
  const errors = [];

  if (part.quantity && (!Number.isInteger(part.quantity) || part.quantity < 1)) {
    errors.push("Quantity must be a positive integer");
  }

  if (part.orderStatus && !["Pending", "Ordered", "Available", "Out of Stock"].includes(part.orderStatus)) {
    errors.push("Order status must be Pending, Ordered, Available, or Out of Stock");
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};
