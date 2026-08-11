import React, { useState } from "react";

const CollapsibleSection = ({ title, tasks, headerAction, content, isOpenByDefault = true }) => {
  const [isOpen, setIsOpen] = useState(isOpenByDefault);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border  rounded-lg shadow-md mb-4">
      {/* Section Header */}
      <div
        className={`p-4 cursor-pointer  w-full flex justify-between items-center ${
          isOpen ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        <div className="flex items-center gap-2" onClick={toggleSection}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <span>{isOpen ? "▲" : "▼"}</span>
        </div>
        {headerAction && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerAction}
          </div>
        )}
      </div>

      {/* Section Content */}
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-700 overflow-auto text-gray-800 dark:text-gray-200">
          {/* If content prop is provided, render it directly */}
          {content ? (
            content
          ) : (
            /* Otherwise render tasks table */
            tasks && tasks.length > 0 ? (
              <table className="w-full border-collapse border text-center border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Task Name</th>
                    <th className="border p-2">Descriptions</th>
                    <th className="border p-2">Assigned To</th>
                    <th className="border p-2">Status</th>
                    <th className="border p-2">Requested Parts</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={index} className="hover:bg-gray-100">
                      <td className="border p-2">{task.taskName || task.name || 'N/A'}</td>
                      <td className="border p-2">{task.taskDescription || task.description || 'N/A'}</td>
                      <td className="border p-2">{task.technician?.name || task.assignedTo || 'N/A'}</td>
                      <td className="border p-2">{task.status || 'N/A'}</td>
                      <td className="border p-2">
                        {task.parts && task.parts.length > 0 ? (
                          <div className="text-left">
                            {task.parts.map((part, partIndex) => {
                              // Debug log to check part structure
                              console.log('Part structure:', part);
                              return (
                                <div key={partIndex} className="mb-1 text-xs">
                                  <span className="font-medium">
                                    {part.partName || part.name || part.partId?.name || part.part?.name || 'Unknown Part'}
                                  </span>
                                  {part.quantity && (
                                    <span className="text-gray-600"> (Qty: {part.quantity})</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">No parts requested</span>
                        )}
                      </td>
                      <td className="border p-2">
                        {task.actions && (
                          <div className="flex gap-2 justify-center">
                            {task.actions}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No tasks available.</p>
                <p className="text-sm text-gray-500">Click "Create Task" to add a new task.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
