import React, { useState, useEffect } from "react";
import { Calendar, CheckSquare, GripVertical, Plus, Square, Trash2, Clock, User, Users, Target, FileText, ChevronRight } from "lucide-react";
import CalendarPopup from "../components/CalendarPopup";

const TodoList = ({ theme, user, todoItems, setTodoItems, newTodo, setNewTodo, newTodoAssignee, setNewTodoAssignee, newTodoDueDate, setNewTodoDueDate, showCalendar, setShowCalendar, calendarRef }) => {
    const [draggedItem, setDraggedItem] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTodoCategory, setNewTodoCategory] = useState("other");
    const [newTodoPriority, setNewTodoPriority] = useState("medium");
    const [newTodoDuration, setNewTodoDuration] = useState(2);
    const [newTodoDepartment, setNewTodoDepartment] = useState("administration");

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

    // Time duration options
    const timeDurations = [
        { value: 0.5, label: "30 min" },
        { value: 1, label: "1 hour" },
        { value: 2, label: "2 hours" },
        { value: 4, label: "4 hours" },
        { value: 8, label: "1 day" },
        { value: 16, label: "2 days" },
        { value: 24, label: "3 days" },
        { value: 40, label: "1 week" },
    ];

    // Category options
    const categoryOptions = [
        { value: "user_management", label: "User Management" },
        { value: "content_moderation", label: "Content Moderation" },
        { value: "system_maintenance", label: "System Maintenance" },
        { value: "security_review", label: "Security Review" },
        { value: "support_tickets", label: "Support Tickets" },
        { value: "knowledge_base", label: "Knowledge Base" },
        { value: "flagged_content", label: "Flagged Content" },
        { value: "financial_review", label: "Financial Review" },
        { value: "property_verification", label: "Property Verification" },
        { value: "report_generation", label: "Report Generation" },
        { value: "team_coordination", label: "Team Coordination" },
        { value: "training_development", label: "Training & Development" },
        { value: "meeting_preparation", label: "Meeting Preparation" },
        { value: "policy_update", label: "Policy Update" },
        { value: "performance_review", label: "Performance Review" },
        { value: "other", label: "Other" },
    ];

    // Department options
    const departmentOptions = [
        { value: "administration", label: "Administration" },
        { value: "support", label: "Support" },
        { value: "moderation", label: "Moderation" },
        { value: "technical", label: "Technical" },
        { value: "financial", label: "Financial" },
    ];

    // Priority options
    const priorityOptions = [
        { value: "low", label: "Low", color: "bg-blue-100 text-blue-800 border-blue-200" },
        { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
        { value: "high", label: "High", color: "bg-orange-100 text-orange-800 border-orange-200" },
        { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800 border-red-200" },
    ];

    // Team members
    const teamMembers = [
        { id: 1, name: "Yokabd Admin", role: "Super Admin", avatar: "YA" },
        { id: 2, name: "Saron Admin", role: "Admin", avatar: "SA" },
        { id: 3, name: "Beza Broker", role: "Internal Broker", avatar: "BB" },
        { id: 4, name: "Birtukan Support", role: "Support Agent", avatar: "BS" },
        { id: 6, name: "Mikias Admin", role: "Admin", avatar: "MA" },
        { id: 7, name: "Hana Lead", role: "Support Lead", avatar: "HL" },
        { id: 8, name: "Daniel Support", role: "Support Admin", avatar: "DS" },
    ];

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
                category: newTodoCategory,
                priority: newTodoPriority,
                dueDate: newTodoDueDate,
                assignedTo: newTodoAssignee,
                department: newTodoDepartment,
                estimatedHours: newTodoDuration,
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
                    setNewTodoAssignee('1');
                    setNewTodoCategory('other');
                    setNewTodoPriority('medium');
                    setNewTodoDuration(2);
                    setNewTodoDepartment('administration');
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

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
    };

    const getAssigneeInfo = (assignedToId) => {
        if (!assignedToId) return { name: 'Unassigned', avatar: 'UA', role: '' };
        const member = teamMembers.find(m => m.id.toString() === assignedToId.toString());
        return member || { name: `User ${assignedToId}`, avatar: 'U' + assignedToId.toString().slice(-2), role: '' };
    };

    const getCreatorInfo = (createdById) => {
        if (!createdById) return { name: 'System', avatar: 'SYS' };
        const member = teamMembers.find(m => m.id === createdById);
        return member || { name: `User ${createdById}`, avatar: 'U' + createdById.toString().slice(-2), role: '' };
    };

    const getPriorityColor = (priority) => {
        const option = priorityOptions.find(p => p.value === priority);
        return option ? option.color : 'bg-gray-100 text-gray-800 border-gray-200';
    };

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
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Team Tasks Dashboard
                </h3>
                <div className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {todoItems.length} tasks
                </div>
            </div>

            {/* SCROLLABLE TASKS SECTION */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h4 className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        Task List (Drag to reorder)
                    </h4>
                    <div className="flex gap-4">
                        <div className={`text-xs ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                            {todoItems.filter(t => t.status === 'completed').length} completed
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                            {todoItems.filter(t => t.status !== 'completed').length} pending
                        </div>
                    </div>
                </div>
                
                {/* Scrollable container */}
                <div className={`max-h-[400px] overflow-y-auto pr-2 scrollbar-thin ${theme === 'dark' ? 'scrollbar-thumb-gray-600 scrollbar-track-gray-800' : 'scrollbar-thumb-gray-300 scrollbar-track-gray-100'}`}>
                    <div className="space-y-3">
                        {todoItems.map((item, index) => {
                            const assigneeInfo = getAssigneeInfo(item.assigned_to);
                            const creatorInfo = getCreatorInfo(item.created_by);
                            
                            return (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-start p-4 rounded-xl border transition-all duration-300 cursor-grab active:cursor-grabbing ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:border-amber-400' : 'bg-gray-50 border-gray-200 hover:border-amber-300'} ${item.completed ? 'opacity-70' : ''}`}
                                >
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleTodo(item.id)}
                                        className="mr-3 mt-1 transition-transform duration-200 hover:scale-110"
                                    >
                                        {item.status === 'completed' ? (
                                            <CheckSquare className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Square className="w-5 h-5 text-gray-400 hover:text-amber-400" />
                                        )}
                                    </button>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium transition-all duration-300 ${item.status === 'completed' ? 'line-through text-gray-500' : theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.title}
                                                </p>
                                                {item.description && (
                                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Drag handle */}
                                            <div className="ml-2 flex items-center">
                                                <GripVertical className="w-4 h-4 text-gray-400 cursor-move hover:text-amber-400 transition-colors duration-200" />
                                            </div>
                                        </div>

                                        {/* Task Metadata - Compact Layout */}
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            {/* Priority Badge */}
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(item.priority)}`}>
                                                {item.priority}
                                            </span>
                                            
                                            {/* Category Badge */}
                                            <span className={`text-xs px-2 py-1 rounded-full border ${getCategoryColor(item.category)}`}>
                                                {categoryOptions.find(c => c.value === item.category)?.label || item.category}
                                            </span>

                                            {/* Time Duration */}
                                            {item.estimated_hours && (
                                                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                    <Clock className="w-3 h-3" />
                                                    <span>{item.estimated_hours}h</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Assignment Section - Clear Labels */}
                                        <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}">
                                            {/* ASSIGNED TO Section */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 min-w-[120px]">
                                                    <User className="w-3 h-3 text-gray-400" />
                                                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Assigned to:
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                        {assigneeInfo.avatar}
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                            {assigneeInfo.name}
                                                        </div>
                                                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {assigneeInfo.role}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ASSIGNED BY Section */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 min-w-[120px]">
                                                    <Users className="w-3 h-3 text-gray-400" />
                                                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Assigned by:
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                        {creatorInfo.avatar}
                                                    </div>
                                                    <div>
                                                        <div className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                            {creatorInfo.name}
                                                        </div>
                                                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {creatorInfo.role}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Due Date Section */}
                                            {item.due_date && (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 min-w-[100px]">
                                                        <Calendar className="w-3 h-3 text-gray-400" />
                                                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Due:
                                                        </span>
                                                    </div>
                                                    <div className={`text-xs px-2 py-1 rounded-full ${isOverdue(item.due_date) && item.status !== 'completed' ? 'bg-red-100 text-red-800' : theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                        {formatDate(item.due_date)}
                                                        {isOverdue(item.due_date) && item.status !== 'completed' && ' ⚠️'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => deleteTodo(item.id)}
                                        className="ml-4 p-1 text-red-400 hover:text-red-600 transition-colors duration-200 hover:scale-110"
                                        title="Delete task"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {todoItems.length === 0 && (
                        <div className={`text-center py-12 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-500'}`}>
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                No tasks created yet
                            </h4>
                            <p className="text-sm mb-4">Add your first task using the form below</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD NEW TASK SECTION - FIXED AT BOTTOM */}
            <div className={`p-4 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Add New Task
                </h4>
                
                {/* Compact Form Layout */}
                <div className="space-y-3">
                    {/* Task Title */}
                    <input
                        type="text"
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter task title..."
                        className={`w-full px-4 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                    />

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Category */}
                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Category
                            </label>
                            <select
                                value={newTodoCategory}
                                onChange={(e) => setNewTodoCategory(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                {categoryOptions.map(category => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Priority
                            </label>
                            <select
                                value={newTodoPriority}
                                onChange={(e) => setNewTodoPriority(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                {priorityOptions.map(priority => (
                                    <option key={priority.value} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Time Duration */}
                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Time Estimate
                            </label>
                            <div className="flex items-center gap-2">
                                <Clock className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} />
                                <select
                                    value={newTodoDuration}
                                    onChange={(e) => setNewTodoDuration(parseFloat(e.target.value))}
                                    className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                >
                                    {timeDurations.map(duration => (
                                        <option key={duration.value} value={duration.value}>
                                            {duration.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Assign to
                            </label>
                            <select
                                value={newTodoAssignee}
                                onChange={(e) => setNewTodoAssignee(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                <option value="">Select team member</option>
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Second Row of Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Department */}
                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Department
                            </label>
                            <select
                                value={newTodoDepartment}
                                onChange={(e) => setNewTodoDepartment(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark' ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            >
                                {departmentOptions.map(dept => (
                                    <option key={dept.value} value={dept.value}>
                                        {dept.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className={`block text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Due Date
                            </label>
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
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAddTodo}
                        disabled={!newTodo.trim()}
                        className={`w-full py-3 rounded-lg transition-all duration-300 transform ${isAdding ? 'scale-95' : 'hover:scale-[1.02]'} disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${theme === 'dark' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-amber-400 hover:bg-amber-500 text-white'}`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">
                                {isAdding ? 'Adding...' : 'Add New Task'}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TodoList;