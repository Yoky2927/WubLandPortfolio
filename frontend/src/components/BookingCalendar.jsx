import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, X } from "lucide-react";

const BookingCalendar = ({ bookings = [], theme, onBookingClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("month"); // "month" or "week"

  // Sample calendar data - in a real app you'd generate this from bookings
  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Get bookings for a specific day
  const getBookingsForDay = (day) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.scheduled_date);
      return (
        bookingDate.getDate() === day &&
        bookingDate.getMonth() === selectedDate.getMonth() &&
        bookingDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={`rounded-xl ${
      theme === "dark" ? "bg-gray-800" : "bg-white border border-gray-200"
    }`}>
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold">Bookings Calendar</h3>
            <p className="text-sm text-gray-500">View and manage your scheduled viewings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView("month")}
              className={`px-4 py-2 rounded-lg ${
                view === "month"
                  ? "bg-amber-500 text-white"
                  : theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-lg ${
                view === "week"
                  ? "bg-amber-500 text-white"
                  : theme === "dark"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Week View
            </button>
          </div>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => {
              const prevMonth = new Date(selectedDate);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              setSelectedDate(prevMonth);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            ← Previous
          </button>
          <div className="text-lg font-semibold">
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <button
            onClick={() => {
              const nextMonth = new Date(selectedDate);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              setSelectedDate(nextMonth);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = 
              day === new Date().getDate() &&
              selectedDate.getMonth() === new Date().getMonth() &&
              selectedDate.getFullYear() === new Date().getFullYear();
            
            return (
              <div
                key={day}
                className={`min-h-32 p-2 rounded-lg border ${
                  isToday
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/10"
                    : theme === "dark"
                    ? "border-gray-700"
                    : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-semibold ${
                    isToday ? "text-amber-500" : ""
                  }`}>
                    {day}
                  </span>
                  {dayBookings.length > 0 && (
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                      {dayBookings.length}
                    </span>
                  )}
                </div>
                
                {/* Bookings for this day */}
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {dayBookings.slice(0, 2).map((booking) => (
                    <div
                      key={booking.id}
                      onClick={() => onBookingClick && onBookingClick(booking)}
                      className={`p-2 rounded text-xs cursor-pointer ${
                        booking.status === "confirmed"
                          ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                          : booking.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{booking.start_time}</span>
                      </div>
                      <div className="truncate font-medium">{booking.property_title}</div>
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;