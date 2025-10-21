import React, { useState, useEffect } from "react";
import { Calendar, CheckSquare, ClipboardList, GripVertical, Plus, Square, Trash2, Clock } from "lucide-react";
import CalendarPopup from "../components/CalendarPopup"; // Adjusted path

const TodoList = ({ theme, user, todoItems, setTodoItems, newTodo, setNewTodo, newTodoAssignee, setNewTodoAssignee, newTodoDueDate, setNewTodoDueDate, showCalendar, setShowCalendar, calendarRef }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    // Fetch todos on component mount
    useEffect(() => {
        const fetchTodos = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5003/api/todos', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const todosData = await response.json();
                    setTodoItems(todosData);
                } else {
                    console.error('Failed to fetch todos');
                }
            } catch (error) {
                console.error('Error fetching todos:', error);
            }
        };
        fetchTodos();
    }, [setTodoItems]);

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id.toString());
        setTimeout(() => {
            e.target.classList.add('opacity-50');
        }, 0);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e, targetIndex) => {
        e.preventDefault();
        if (!draggedItem) return;
        const draggedIndex = todoItems.findIndex(item => item.id === draggedItem.id);
        if (draggedIndex === targetIndex) return;
        const newItems = [...todoItems];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, removed);
        setTodoItems(newItems);
        setDraggedItem(null);

        // Update order in the database
        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:5003/api/todos/reorder', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ todos: newItems }),
            });
        } catch (error) {
            console.error('Error updating todo order:', error);
        }
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('opacity-50');
        setDraggedItem(null);
    };

    const addTodo = async () => {
        if (newTodo.trim()) {
            const newItem = {
                title: newTodo.trim(),
                description: "",
                category: "other",
                priority: "medium",
                dueDate: newTodoDueDate,
                assignedTo: newTodoAssignee,
                department: "administration"
            };

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5003/api/todos', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newItem),
                });
                if (response.ok) {
                    const savedTodo = await response.json();
                    setTodoItems([...todoItems, savedTodo]);
                    setNewTodo('');
                    setNewTodoDueDate('');
                    setNewTodoAssignee('Support Team');
                } else {
                    console.error('Failed to save todo');
                const errorData = await response.json();
                    console.error('Error details:', errorData);
                }
            } catch (error) {
                console.error('Error saving todo:', error);
            }
        }
    };

    const handleAddTodo = () => {
        if (newTodo.trim()) {
            setIsAdding(true);
            setTimeout(() => {
                addTodo();
                setIsAdding(false);
            }, 300);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddTodo();
        }
    };

    const toggleTodo = async (id) => {
        const todo = todoItems.find(item => item.id === id);
        const completed = !todo.completed;
        
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5003/api/todos/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed }),
            });
            setTodoItems(todoItems.map(item =>
                item.id === id ? { ...item, completed, status: completed ? 'completed' : 'pending' } : item
            ));
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    };

    const deleteTodo = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`http://localhost:5003/api/todos/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            setTodoItems(todoItems.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error deleting todo:', error);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Check if a task is overdue
    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    // Get assignee display name
    const getAssigneeDisplay = (assignedTo) => {
        if (!assignedTo) return 'Unassigned';
        
        // Map user IDs to display names (you might want to fetch this from your users API)
        const assigneeMap = {
            1: 'Yokabd Admin',
            2: 'Saron Admin',
            3: 'Beza Broker',
            4: 'Birtukan Support',
            // Add more mappings as needed
        };
        
        return assigneeMap[assignedTo] || `User ${assignedTo}`;
    };

    // Get creator display name
    const getCreatorDisplay = (createdBy) => {
        if (!createdBy) return 'Unknown';
        
        const creatorMap = {
            1: 'Yokabd Admin',
            2: 'Saron Admin',
            3: 'Beza Broker',
            4: 'Birtukan Support',
            // Add more mappings as needed
        };
        
        return creatorMap[createdBy] || `User ${createdBy}`;
    };

    // Get priority badge color
    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-100 text-red-800 border-red-200',
            high: 'bg-orange-100 text-orange-800 border-orange-200',
            medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            low: 'bg-blue-100 text-blue-800 border-blue-200'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Get category badge color
    const getCategoryColor = (category) => {
        const colors = {
            user_management: 'bg-purple-100 text-purple-800 border-purple-200',
            content_moderation: 'bg-pink-100 text-pink-800 border-pink-200',
            system_maintenance: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            security_review: 'bg-red-100 text-red-800 border-red-200',
            support_tickets: 'bg-green-100 text-green-800 border-green-200',
            knowledge_base: 'bg-teal-100 text-teal-800 border-teal-200',
            flagged_content: 'bg-amber-100 text-amber-800 border-amber-200',
            financial_review: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            property_verification: 'bg-cyan-100 text-cyan-800 border-cyan-200',
            report_generation: 'bg-blue-100 text-blue-800 border-blue-200',
            team_coordination: 'bg-violet-100 text-violet-800 border-violet-200',
            training_development: 'bg-lime-100 text-lime-800 border-lime-200',
            meeting_preparation: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
            policy_update: 'bg-rose-100 text-rose-800 border-rose-200',
            performance_review: 'bg-sky-100 text-sky-800 border-sky-200',
            other: 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className={`p-6 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-gray-200 shadow-md'}`}>
            <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Team Tasks</h3>
            <div className="space-y-3 mb-6 transition-all duration-300">
                {todoItems.map((item, index) => (
                    <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.02] cursor-grab active:cursor-grabbing ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:border-amber-400' : 'bg-gray-50 border-gray-200 hover:border-amber-300'} ${item.completed ? 'opacity-70' : ''}`}
                    >
                        <button
                            onClick={() => toggleTodo(item.id)}
                            className="mr-4 transition-transform duration-200 hover:scale-110"
                        >
                            {item.status === 'completed' ? (
                                <CheckSquare className="w-5 h-5 text-green-500" />
                            ) : (
                                <Square className="w-5 h-5 text-gray-400 hover:text-amber-400" />
                            )}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium transition-all duration-300 ${item.status === 'completed' ? 'line-through text-gray-500' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {item.title}
                            </p>
                            {item.description && (
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {item.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}>
                                    {item.priority}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(item.category)}`}>
                                    {item.category?.replace('_', ' ') || 'other'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                    👤 {getAssigneeDisplay(item.assigned_to)}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                    🧑‍💼 {getCreatorDisplay(item.created_by)}
                                </span>
                                {item.due_date && (
                                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isOverdue(item.due_date) && item.status !== 'completed' ? 'bg-red-100 text-red-800 border border-red-200' : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(item.due_date)}
                                        {isOverdue(item.due_date) && item.status !== 'completed' && ' ⚠️'}
                                    </span>
                                )}
                                {item.estimated_hours && (
                                    <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                        ⏱️ {item.estimated_hours}h
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <GripVertical className="w-4 h-4 text-gray-400 cursor-move hover:text-amber-400 transition-colors duration-200" />
                            <button
                                onClick={() => deleteTodo(item.id)}
                                className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200 hover:scale-110"
                                title="Delete task"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className={`p-4 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter task title..."
                            className={`w-full px-4 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                        />
                    </div>
                    <select
                        value={newTodoAssignee}
                        onChange={(e) => setNewTodoAssignee(e.target.value)}
                        className={`px-4 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    >
                        <option value="1">Yokabd Admin</option>
                        <option value="2">Saron Admin</option>
                        <option value="3">Beza Broker</option>
                        <option value="4">Birtukan Support</option>
                    </select>
                    <div className="relative">
                        <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} w-4 h-4`} />
                        <input
                            type="text"
                            value={newTodoDueDate}
                            onChange={(e) => setNewTodoDueDate(e.target.value)}
                            onFocus={() => setShowCalendar(true)}
                            placeholder="YYYY-MM-DD"
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                        />
                        {showCalendar && (
                            <CalendarPopup
                                selectedDate={newTodoDueDate ? new Date(newTodoDueDate) : null}
                                onDateSelect={(date) => {
                                    setNewTodoDueDate(date);
                                    setShowCalendar(false);
                                }}
                                onClose={() => setShowCalendar(false)}
                                theme={theme}
                                calendarRef={calendarRef}
                            />
                        )}
                    </div>
                </div>
                <button
                    onClick={handleAddTodo}
                    disabled={!newTodo.trim()}
                    className={`w-full py-3 rounded-lg border-2 transition-all duration-300 transform ${isAdding ? 'scale-95' : 'hover:scale-[1.02]'} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${theme === 'dark' ? 'border-amber-400/50 hover:border-amber-400' : 'border-amber-300/50 hover:border-amber-400'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${theme === 'dark' ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-amber-300 to-amber-400'}`}>
                            <Plus className="w-4 h-4 text-white" />
                        </div>
                        <span className={`font-medium ${theme === 'dark' ? 'text-amber-100' : 'text-amber-700'}`}>
                            Add Task
                        </span>
                    </div>
                </button>
            </div>
            {todoItems.length === 0 && (
                <div className={`text-center py-8 rounded-xl border-2 border-dashed transition-all duration-300 ${theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No tasks yet. Add your first task above!</p>
                </div>
            )}
        </div>
    );
};

export default TodoList;