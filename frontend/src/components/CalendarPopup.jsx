import React, {useState} from "react";
import {ChevronDown, ChevronUp} from "lucide-react";

const CalendarPopup = ({ selectedDate, onDateSelect, onClose, theme, calendarRef }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selected, setSelected] = useState(selectedDate || new Date());

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const handleDateSelect = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelected(newDate);
        onDateSelect(newDate.toISOString().split('T')[0]);
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    return (
        <div
          ref={calendarRef}
          className={`absolute bottom-full left-0 mb-4 p-6 rounded-xl shadow-2xl z-50 backdrop-blur-sm min-w-[300px] ${
          theme === 'dark' 
            ? 'bg-gray-800/95 border-gray-600 backdrop-brightness-110' 
            : 'bg-white/95 border-gray-200 backdrop-brightness-105'
             } border transition-all duration-300`}
        >
            {/* Header with month navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={goToPreviousMonth}
                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                        theme === 'dark' 
                            ? 'hover:bg-gray-700 text-amber-300' 
                            : 'hover:bg-amber-100 text-amber-600'
                    }`}
                >
                    <ChevronDown className="w-5 h-5" />
                </button>
                
                <h3 className={`font-semibold text-lg ${
                    theme === 'dark' ? 'text-amber-300' : 'text-amber-600'
                }`}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                
                <button
                    onClick={goToNextMonth}
                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                        theme === 'dark' 
                            ? 'hover:bg-gray-700 text-amber-300' 
                            : 'hover:bg-amber-100 text-amber-600'
                    }`}
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
            </div>

            {/* Day names header */}
            <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(day => (
                    <div
                        key={day}
                        className={`text-center text-sm font-semibold p-1 ${
                            theme === 'dark' ? 'text-amber-200' : 'text-amber-600'
                        }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before the first day of month */}
                {Array.from({ length: firstDay }, (_, i) => (
                    <div key={`empty-${i}`} className="h-10"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const isSelected =
                        selected.getDate() === day &&
                        selected.getMonth() === currentDate.getMonth() &&
                        selected.getFullYear() === currentDate.getFullYear();
                    const isToday = new Date().getDate() === day && 
                                   new Date().getMonth() === currentDate.getMonth() && 
                                   new Date().getFullYear() === currentDate.getFullYear();
                    
                    return (
                        <button
                            key={day}
                            onClick={() => handleDateSelect(day)}
                            className={`h-10 w-10 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                                ${isSelected 
                                    ? 'bg-amber-500 text-white shadow-lg transform scale-105' 
                                    : isToday 
                                        ? theme === 'dark' 
                                            ? 'border-2 border-amber-400 text-amber-300' 
                                            : 'border-2 border-amber-500 text-amber-600'
                                        : theme === 'dark' 
                                            ? 'hover:bg-gray-700 text-white hover:scale-105' 
                                            : 'hover:bg-amber-100 text-gray-900 hover:scale-105'
                                }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between mt-6 space-x-3">
                <button
                    onClick={() => {
                        const today = new Date();
                        setSelected(today);
                        setCurrentDate(today);
                        onDateSelect(today.toISOString().split('T')[0]);
                    }}
                    className={`px-4 py-2 text-sm  transition-all duration-200 hover:scale-105 ${
                        theme === 'dark' 
                            ? 'bg-amber-600 text-white hover:bg-amber-500' 
                            : 'bg-amber-500 text-white hover:bg-amber-400'
                    }`}
                >
                    Today
                </button>
                <button
                    onClick={onClose}
                    className={`px-4 py-2 text-sm  transition-all duration-200 hover:scale-105 ${
                        theme === 'dark' 
                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    }`}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default CalendarPopup;