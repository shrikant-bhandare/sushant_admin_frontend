import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";

const localizer = momentLocalizer(moment);

const Attendance = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with your Google API Key
  const CALENDAR_ID = "YOUR_CALENDAR_ID"; // Replace with your Google Calendar ID

  useEffect(() => {
    const fetchGoogleCalendarEvents = async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}`
        );
        const data = await response.json();

        const calendarEvents = data.items.map((event) => ({
          title: event.summary,
          start: new Date(event.start.dateTime || event.start.date),
          end: new Date(event.end.dateTime || event.end.date),
        }));

        setEvents(calendarEvents);
      } catch (error) {
        console.error("Error fetching Google Calendar events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoogleCalendarEvents();
  }, []);

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: "#3b82f6", // Customize event background color
        color: "white",
        borderRadius: "5px",
        padding: "5px",
      },
    };
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Attendance Info</h1>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Avg. Work Hrs</h2>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">-</p>
        </div>
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">Avg. Actual Work Hrs</h2>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">-</p>
        </div>
        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Penalty Days</h2>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">0</p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="grid grid-cols-1">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Attendance Calendar</h2>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            eventPropGetter={eventStyleGetter}
          />
        </div>
      </div>

      {/* Legends */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Legends</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span className="text-gray-800 dark:text-gray-200">Present</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
            <span className="text-gray-800 dark:text-gray-200">Absent</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></span>
            <span className="text-gray-800 dark:text-gray-200">On Duty</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
            <span className="text-gray-800 dark:text-gray-200">Leave</span>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Session Details</h2>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
          <p className="text-gray-800 dark:text-gray-200">Session 1: 10:00 - 14:00</p>
          <p className="text-gray-800 dark:text-gray-200">Session 2: 14:01 - 19:00</p>
        </div>
      </div>

      {/* Status Details */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Status Details</h2>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
          <p className="text-gray-800 dark:text-gray-200">Status: -</p>
          <p className="text-gray-800 dark:text-gray-200">Remarks: -</p>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
