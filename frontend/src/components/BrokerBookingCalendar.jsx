import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from "lucide-react";
import { api } from "../utils/api.endpoints";

const BrokerBookingCalendar = ({
  brokerId,
  theme,
  onViewBooking,
  onConfirmBooking,
  onRescheduleBooking,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    property_id: "",
    schedule_date: "",
    schedule_time: "",
    schedule_notes: "",
    client_name: "",
    client_phone: "",
    client_email: "",
  });

  // Fetch bookings from backend
  useEffect(() => {
    fetchBookings();
  }, [brokerId]);


  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
  ).getDate();

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getBookingsForDay = (day) => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.schedule_date);
      return (
        bookingDate.getDate() === day &&
        bookingDate.getMonth() === selectedDate.getMonth() &&
        bookingDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // You might need to create a GET_BROKER_BOOKINGS endpoint
      const response = await api.get("GET_APPOINTMENTS"); // Changed to GET_APPOINTMENTS

      if (response && Array.isArray(response)) {
        // Format appointments to bookings
        const bookingsData = response.map((appointment) => ({
          id: appointment.id,
          title: appointment.title || "Appointment",
          description: appointment.description || "",
          schedule_date:
            appointment.start_time?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          schedule_time:
            appointment.start_time?.split("T")[1]?.substring(0, 5) || "10:00",
          location: appointment.location || "Not specified",
          client_name: "Appointment Client", // You might need to fetch client info
          status: appointment.status || "pending",
          property_id: appointment.property_id || "",
        }));

        setBookings(bookingsData);
      } else if (response && response.data) {
        // Handle if response has data property
        setBookings(Array.isArray(response.data) ? response.data : []);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rescheduled":
        return "bg-blue-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-3 h-3" />;
      case "pending":
        return <AlertCircle className="w-3 h-3" />;
      case "rescheduled":
        return <Clock className="w-3 h-3" />;
      case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Bookings Calendar</h2>
          <p className="text-gray-500">
            Manage property viewings and appointments
          </p>
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
          <button
            onClick={() => setShowNewBookingModal(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div
        className={`rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white border border-gray-200"}`}
      >
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
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
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
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
              <div
                key={day}
                className="text-center font-medium text-gray-500 py-2"
              >
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
                    <span
                      className={`font-semibold ${isToday ? "text-amber-500" : ""}`}
                    >
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
                        onClick={() => onViewBooking && onViewBooking(booking)}
                        className={`p-2 rounded text-xs cursor-pointer ${
                          booking.status === "confirmed"
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                            : booking.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{booking.schedule_time}</span>
                          </div>
                          {getStatusIcon(booking.status)}
                        </div>
                        <div className="truncate font-medium">
                          {booking.client_name}
                        </div>
                        <div className="truncate text-gray-600 dark:text-gray-400">
                          {booking.title}
                        </div>
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
              <span className="text-sm">Rescheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings List */}
      <div
        className={`rounded-xl ${theme === "dark" ? "bg-gray-800" : "bg-white border border-gray-200"}`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Upcoming Viewings</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No upcoming viewings scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings
                .sort(
                  (a, b) =>
                    new Date(a.schedule_date) - new Date(b.schedule_date),
                )
                .slice(0, 5)
                .map((booking) => (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-lg border ${theme === "dark" ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)} text-white`}
                          >
                            {booking.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(
                              booking.schedule_date,
                            ).toLocaleDateString()}{" "}
                            at {booking.schedule_time}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{booking.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          with {booking.client_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span>{booking.location}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onViewBooking && onViewBooking(booking)}
                        className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* New Booking Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-xl max-w-md w-full ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Schedule New Viewing</h3>
                <button
                  onClick={() => setShowNewBookingModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Property ID/Reference
                  </label>
                  <input
                    type="text"
                    value={newBooking.property_id}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        property_id: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    placeholder="Enter property reference"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newBooking.schedule_date}
                      onChange={(e) =>
                        setNewBooking({
                          ...newBooking,
                          schedule_date: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newBooking.schedule_time}
                      onChange={(e) =>
                        setNewBooking({
                          ...newBooking,
                          schedule_time: e.target.value,
                        })
                      }
                      className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={newBooking.client_name}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        client_name: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    placeholder="Client name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <textarea
                    rows="3"
                    value={newBooking.schedule_notes}
                    onChange={(e) =>
                      setNewBooking({
                        ...newBooking,
                        schedule_notes: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 rounded-lg border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                    placeholder="Any special instructions or notes"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateBooking}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => setShowNewBookingModal(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 rounded-lg"
                  >
                    Cancel
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

export default BrokerBookingCalendar;
