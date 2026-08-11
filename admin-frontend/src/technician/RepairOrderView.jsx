import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import useLoader from '../customHooks/useLoader';
import { useTheme } from '../context/ThemeContext';
import { FaInfoCircle, FaTools, FaStickyNote, FaUser } from 'react-icons/fa'; // Import icons

const RepairOrders = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null); // Track selected task
  const [activeTab, setActiveTab] = useState('general'); // Track active tab
  const { Loader, showLoader, hideLoader } = useLoader();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchTasks = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const userid = decodedToken['id'];
          showLoader();
          const response = await axios.get(`${import.meta.env.VITE_APIURL}/api/task/list-tasks?technician=${userid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setTasks(response.data.data);
          hideLoader();
        } catch (error) {
          console.error('Error fetching tasks:', error);
          hideLoader();
        }
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className={`w-1/4 p-4 border-r ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black'}`}>
        <h2 className="text-xl font-bold mb-4">Repair Orders</h2>
        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task._id}
              className={`p-2 rounded cursor-pointer ${selectedTask?._id === task._id ? 'bg-purple-600 text-white' : 'hover:bg-gray-200'}`}
              onClick={() => setSelectedTask(task)}
            >
              {task.taskName}
            </li>
          ))}
        </ul>
      </div>

      {/* Details Section */}
      <div className="flex-1 p-6">
        {selectedTask ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">{selectedTask.taskName}</h2>
            <div className="tabs">
              <div className="tab-buttons flex border-b mb-4">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('general')}
                >
                  <FaInfoCircle className="inline-block mr-2" />
                  General Info
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'parts' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('parts')}
                >
                  <FaTools className="inline-block mr-2" />
                  Parts
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'notes' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('notes')}
                >
                  <FaStickyNote className="inline-block mr-2" />
                  Notes
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'details' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('details')}
                >
                  <FaUser className="inline-block mr-2" />
                  Details
                </button>
              </div>
              <div className="tab-content">
                {activeTab === 'general' && (
                  <div>
                    <p><strong>Ticket Number:</strong> {selectedTask.ticketNumber}</p>
                    <p><strong>Description:</strong> {selectedTask.taskDescription}</p>
                    <p><strong>Status:</strong> {selectedTask.status}</p>
                    <p><strong>Priority:</strong> {selectedTask.priorityLevel}</p>
                  </div>
                )}
                {activeTab === 'parts' && (
                  <div>
                    <h3 className="text-lg font-bold mt-4">Parts</h3>
                    {selectedTask.parts.map((part) => (
                      <div key={part._id} className="border p-2 rounded mb-2">
                        <p><strong>Device Type:</strong> {part.deviceType.name}</p>
                        <p><strong>Device Model:</strong> {part.deviceModel.name}</p>
                        <p><strong>Part:</strong> {part.partId.name} - {part.partType.type} - {part.quantity}</p>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'notes' && (
                  <div>
                    <h3 className="text-lg font-bold mt-4">Notes</h3>
                    <p>{selectedTask.note}</p>
                  </div>
                )}
                {activeTab === 'details' && (
                  <div>
                    <h3 className="text-lg font-bold mt-4">Details</h3>
                    <p><strong>Assigned Technician:</strong> {selectedTask.technicianName}</p>
                    <p><strong>Created At:</strong> {new Date(selectedTask.createdAt).toLocaleString()}</p>
                    <div className="flex space-x-4 mt-4">
                      <button className="px-4 py-2 bg-green-500 text-white rounded flex items-center space-x-2">
                        <FaStickyNote />
                        <span>View Notes</span>
                      </button>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded flex items-center space-x-2">
                        <FaInfoCircle />
                        <span>Download Summary</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">Select a repair order to view details.</p>
        )}
      </div>
    </div>
  );
};

export default RepairOrders;