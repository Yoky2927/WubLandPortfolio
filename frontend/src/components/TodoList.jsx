// components/TodoList.jsx - CORRECTED VERSION
import React, { useState, useEffect } from "react";
import {
  Calendar, CheckSquare, GripVertical, Plus, Trash2, Clock, User, Users,
  Target, FileText, ChevronRight, Tag, Layers, Building, FileSignature,
  CalendarCheck, AlertCircle, Briefcase, Package, Link, Home, DollarSign,
  MessageCircle, Paperclip, MoreVertical, Edit2, Download, Eye, Filter,
  Search, SortAsc, CheckCircle, XCircle, Star, RefreshCw, BarChart,
  TrendingUp, Archive, Copy, X
} from "lucide-react";

const TodoList = ({
  theme,
  user,
  todoItems = [],
  setTodoItems,
  showCalendar,
  setShowCalendar,
  calendarRef,
  onAddTodo,
  onUpdateTodoStatus,
  onDeleteTodo,
  teamMembers = []
}) => {
  const [newTodo, setNewTodo] = useState({
    title: "", description: "", todo_type: "general", category: "other",
    priority: "medium", due_date: "", assigned_to: "", estimated_hours: 2,
    department: "administration", tags: [], related_property_id: "",
    related_transaction_id: "", related_user_id: "", reminder_date: ""
  });
  const [isAdding, setIsAdding] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [showCompleted, setShowCompleted] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    overdue: 0,
    urgent: 0,
    efficiency: 0
  });

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-gray-100 text-gray-800", dot: "bg-gray-400", dark: "bg-gray-700 text-gray-300" },
    { value: "medium", label: "Medium", color: "bg-amber-50 text-amber-800 border border-amber-200", dot: "bg-amber-400", dark: "bg-amber-900/30 text-amber-300 border border-amber-700" },
    { value: "high", label: "High", color: "bg-orange-50 text-orange-800 border border-orange-200", dot: "bg-orange-500", dark: "bg-orange-900/30 text-orange-300 border border-orange-700" },
    { value: "urgent", label: "Urgent", color: "bg-red-50 text-red-800 border border-red-200", dot: "bg-red-500", dark: "bg-red-900/30 text-red-300 border border-red-700" }
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-50 text-yellow-800", dot: "bg-yellow-500", dark: "bg-yellow-900/30 text-yellow-300" },
    { value: "in_progress", label: "In Progress", color: "bg-blue-50 text-blue-800", dot: "bg-blue-500", dark: "bg-blue-900/30 text-blue-300" },
    { value: "completed", label: "Completed", color: "bg-green-50 text-green-800", dot: "bg-green-500", dark: "bg-green-900/30 text-green-300" },
    { value: "cancelled", label: "Cancelled", color: "bg-gray-50 text-gray-800", dot: "bg-gray-500", dark: "bg-gray-700 text-gray-300" },
    { value: "deferred", label: "Deferred", color: "bg-purple-50 text-purple-800", dot: "bg-purple-500", dark: "bg-purple-900/30 text-purple-300" }
  ];

  const typeOptions = [
    { value: "general", label: "General", icon: <FileText className="w-4 h-4" />, color: "bg-gray-100 text-gray-800", dark: "bg-gray-700 text-gray-300" },
    { value: "property", label: "Property", icon: <Home className="w-4 h-4" />, color: "bg-blue-100 text-blue-800", dark: "bg-blue-900/30 text-blue-300" },
    { value: "transaction", label: "Transaction", icon: <DollarSign className="w-4 h-4" />, color: "bg-green-100 text-green-800", dark: "bg-green-900/30 text-green-300" },
    { value: "client", label: "Client", icon: <User className="w-4 h-4" />, color: "bg-purple-100 text-purple-800", dark: "bg-purple-900/30 text-purple-300" },
    { value: "marketing", label: "Marketing", icon: <Target className="w-4 h-4" />, color: "bg-pink-100 text-pink-800", dark: "bg-pink-900/30 text-pink-300" },
    { value: "admin", label: "Admin", icon: <Briefcase className="w-4 h-4" />, color: "bg-amber-100 text-amber-800", dark: "bg-amber-900/30 text-amber-300" },
    { value: "maintenance", label: "Maintenance", icon: <Package className="w-4 h-4" />, color: "bg-orange-100 text-orange-800", dark: "bg-orange-900/30 text-orange-300" }
  ];

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
    { value: "other", label: "Other" }
  ];

  const departmentOptions = [
    { value: "administration", label: "Administration" },
    { value: "support", label: "Support" },
    { value: "brokerage", label: "Brokerage" },
    { value: "technical", label: "Technical" },
    { value: "financial", label: "Financial" },
    { value: "sales", label: "Sales" },
    { value: "marketing", label: "Marketing" }
  ];

  const timeOptions = [
    { value: 0.5, label: "30 min" }, { value: 1, label: "1 hour" },
    { value: 2, label: "2 hours" }, { value: 4, label: "4 hours" },
    { value: 8, label: "1 day" }, { value: 16, label: "2 days" },
    { value: 24, label: "3 days" }, { value: 40, label: "1 week" }
  ];

  // Calculate stats whenever todoItems change
  useEffect(() => {
    calculateStats();
  }, [todoItems]);

  const calculateStats = () => {
    const items = filteredTodos();
    const total = items.length;
    const pending = items.filter(t => t.status === 'pending').length;
    const in_progress = items.filter(t => t.status === 'in_progress').length;
    const completed = items.filter(t => t.status === 'completed').length;
    const overdue = items.filter(t => t.due_date && t.status !== 'completed' && new Date(t.due_date) < new Date()).length;
    const urgent = items.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
    const efficiency = items.length > 0 ? items.reduce((sum, t) => sum + (t.analytics_metadata?.efficiency_score || 0.5), 0) / items.length : 0;
    setStats({ total, pending, in_progress, completed, overdue, urgent, efficiency });
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const tags = [...newTodo.tags, tagInput.trim()];
      setNewTodo({ ...newTodo, tags: tags.slice(0, 5) });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setNewTodo({ ...newTodo, tags: newTodo.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) {
      console.log('Todo title is required');
      return;
    }

    setIsAdding(true);
    try {
      // Prepare todo data with proper null values for empty fields
      const todoData = {
        ...newTodo,
        // Convert empty strings to null for foreign key fields
        related_property_id: newTodo.related_property_id?.trim() || null,
        related_transaction_id: newTodo.related_transaction_id?.trim() || null,
        related_user_id: newTodo.related_user_id?.trim() || null,
        // Ensure user_id is included (from current user)
        user_id: user?.id || 1, // Fallback to admin user if needed
        // Ensure assigned_to is a number or null
        assigned_to: newTodo.assigned_to ? parseInt(newTodo.assigned_to) : null,
        // Convert date to proper format
        due_date: newTodo.due_date || null,
        reminder_date: newTodo.reminder_date || null
      };

      if (onAddTodo) {
        await onAddTodo(todoData);
        // Reset form after successful add
        setNewTodo({
          title: "", description: "", todo_type: "general", category: "other",
          priority: "medium", due_date: "", assigned_to: "", estimated_hours: 2,
          department: "administration", tags: [], related_property_id: "",
          related_transaction_id: "", related_user_id: "", reminder_date: ""
        });
        setTagInput("");
      } else {
        console.error('onAddTodo handler not provided');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      const todo = todoItems.find(t => t.id === id);
      if (!todo) {
        console.error('Todo not found:', id);
        return;
      }

      const status = todo.status === 'completed' ? 'pending' : 'completed';
      if (onUpdateTodoStatus) {
        await onUpdateTodoStatus(id, status);
      } else {
        console.error('onUpdateTodoStatus handler not provided');
      }
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const updateTodoStatus = async (id, status) => {
    try {
      if (onUpdateTodoStatus) {
        await onUpdateTodoStatus(id, status);
      } else {
        console.error('onUpdateTodoStatus handler not provided');
      }
    } catch (error) {
      console.error('Error updating todo status:', error);
    }
  };

  const handleDeleteTodo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      if (onDeleteTodo) {
        await onDeleteTodo(id);
      } else {
        console.error('onDeleteTodo handler not provided');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const getMemberInfo = (id) => {
    if (!id || id === "") {
      return {
        name: 'Unassigned',
        avatar: 'UA',
        color: 'bg-gray-500',
        role: 'Unassigned'
      };
    }

    const member = teamMembers.find(m => m.id == id); // Use == for loose comparison
    if (!member) {
      return {
        name: `User ${id}`,
        avatar: id.toString().slice(0, 2).toUpperCase(),
        color: 'bg-gray-500',
        role: 'Unknown'
      };
    }

    const firstName = member.first_name || '';
    const lastName = member.last_name || '';
    const avatar = `${firstName.charAt(0)}${lastName.charAt(0)}` ||
      (member.email ? member.email.charAt(0).toUpperCase() :
        id.toString().slice(0, 2).toUpperCase());

    return {
      name: `${firstName} ${lastName}`.trim() || member.email || `User ${id}`,
      avatar: avatar,
      color: 'bg-amber-500',
      role: member.role || 'User'
    };
  };

  const filteredTodos = () => {
    let filtered = [...todoItems];

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(todo =>
        todo.title?.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query) ||
        (Array.isArray(todo.tags) && todo.tags.some(tag =>
          tag.toLowerCase().includes(query)))
      );
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter(todo => todo.priority === filterPriority);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(todo => todo.status === filterStatus);
    }

    if (filterDepartment !== "all") {
      filtered = filtered.filter(todo => todo.department === filterDepartment);
    }

    if (filterType !== "all") {
      filtered = filtered.filter(todo => todo.todo_type === filterType);
    }

    if (!showCompleted) {
      filtered = filtered.filter(todo => todo.status !== 'completed');
    }

    // Sort todos
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "due_date":
          aVal = a.due_date ? new Date(a.due_date) : new Date(9999, 11, 31);
          bVal = b.due_date ? new Date(b.due_date) : new Date(9999, 11, 31);
          break;
        case "priority":
          const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
          aVal = priorityOrder[a.priority] || 4;
          bVal = priorityOrder[b.priority] || 4;
          break;
        case "created_at":
          aVal = new Date(a.created_at || a.createdAt || Date.now());
          bVal = new Date(b.created_at || b.createdAt || Date.now());
          break;
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        default:
          aVal = a[sortBy];
          bVal = b[sortBy];
      }

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    try {
      const date = new Date(dateString);
      const options = {
        month: 'short',
        day: 'numeric'
      };

      if (date.getFullYear() !== new Date().getFullYear()) {
        options.year = 'numeric';
      }

      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return "Invalid date";
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'completed') return false;
    try {
      return new Date(dueDate) < new Date();
    } catch (error) {
      return false;
    }
  };

  const parseJSONField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        // If it's not valid JSON, try to split by comma
        if (field.includes(',')) {
          return field.split(',').map(item => item.trim());
        }
        return [field];
      }
    }
    return [];
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(p => p.value === priority);
    return option ? (theme === 'dark' ? option.dark : option.color) :
      (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option ? (theme === 'dark' ? option.dark : option.color) :
      (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  const getTypeColor = (type) => {
    const option = typeOptions.find(t => t.value === type);
    return option ? (theme === 'dark' ? option.dark : option.color) :
      (theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800');
  };

  const getEfficiencyColor = (score) => {
    if (score >= 0.9) return "text-green-500 dark:text-green-400";
    if (score >= 0.7) return "text-amber-500 dark:text-amber-400";
    return "text-red-500 dark:text-red-400";
  };

  const handleDragStart = (e, id) => {
    setDraggingId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;

    const draggedIndex = todoItems.findIndex(t => t.id == draggingId);
    const targetIndex = todoItems.findIndex(t => t.id == targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...todoItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    if (setTodoItems) {
      setTodoItems(newItems);
    }

    setDraggingId(null);
  };

  const handleDragEnd = () => setDraggingId(null);

  const renderTodoItem = (todo) => {
    // Parse JSON fields safely
    const tags = parseJSONField(todo.tags);
    const comments = parseJSONField(todo.comments);
    const metadata = todo.metadata ?
      (typeof todo.metadata === 'string' ?
        JSON.parse(todo.metadata) : todo.metadata) : {};

    const analytics_metadata = todo.analytics_metadata ?
      (typeof todo.analytics_metadata === 'string' ?
        JSON.parse(todo.analytics_metadata) : todo.analytics_metadata) : {};

    const member = getMemberInfo(todo.assigned_to);
    const isOverdueTodo = isOverdue(todo.due_date, todo.status);
    const typeOption = typeOptions.find(t => t.value === todo.todo_type);
    const departmentOption = departmentOptions.find(d => d.value === todo.department);
    const efficiencyScore = analytics_metadata?.efficiency_score || todo.efficiency_score || 0;

    return (
      <div
        key={todo.id}
        draggable
        onDragStart={(e) => handleDragStart(e, todo.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, todo.id)}
        onDragEnd={handleDragEnd}
        className={`group relative p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.002] active:scale-[0.998] ${theme === 'dark'
            ? 'bg-gray-800 border-gray-700 hover:border-amber-500/50'
            : 'bg-white border-gray-200 hover:border-amber-300 shadow-sm'
          } ${draggingId === todo.id ? 'opacity-50' : ''}`}
      >
        <div className={`absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
          }`}>
          <GripVertical className="w-4 h-4 cursor-grab" />
        </div>

        <div className="ml-6">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleToggleTodo(todo.id)}
                className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 hover:scale-110 ${todo.status === 'completed'
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : theme === 'dark'
                      ? 'border-gray-600 hover:border-amber-500'
                      : 'border-gray-300 hover:border-amber-400'
                  }`}
              >
                {todo.status === 'completed' && <CheckSquare className="w-3 h-3" />}
              </button>

              <h4 className={`font-medium transition-all duration-300 ${todo.status === 'completed'
                  ? 'line-through opacity-60'
                  : theme === 'dark'
                    ? 'text-white'
                    : 'text-gray-900'
                }`}>
                {todo.title}
              </h4>

              {typeOption && (
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${getTypeColor(todo.todo_type)
                  }`}>
                  {typeOption.icon}
                  {typeOption.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => updateTodoStatus(todo.id, 'completed')}
                className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                title="Mark complete"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedTodo(todo)}
                className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {todo.description && (
            <p className={`text-sm mb-3 transition-all duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              {todo.description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.map((tag, idx) => (
                <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${statusOptions.find(s => s.value === todo.status)?.dot || 'bg-gray-400'
                  }`} />
                <span className={`text-xs px-2 py-1 rounded-md font-medium transition-all duration-300 ${getStatusColor(todo.status)
                  }`}>
                  {statusOptions.find(s => s.value === todo.status)?.label || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${priorityOptions.find(p => p.value === todo.priority)?.dot || 'bg-gray-400'
                  }`} />
                <span className={`text-xs px-2 py-1 rounded-md font-medium transition-all duration-300 ${getPriorityColor(todo.priority)
                  }`}>
                  {priorityOptions.find(p => p.value === todo.priority)?.label || 'Unknown'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Calendar className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                <span className={`text-xs font-medium ${isOverdueTodo
                    ? 'text-red-600 dark:text-red-400'
                    : theme === 'dark'
                      ? 'text-gray-300'
                      : 'text-gray-700'
                  }`}>
                  {formatDate(todo.due_date)}
                  {isOverdueTodo && <AlertCircle className="w-3 h-3 inline ml-1" />}
                </span>
              </div>

              {todo.estimated_hours && (
                <div className="flex items-center gap-1">
                  <Clock className={`w-3 h-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {todo.estimated_hours}h
                  </span>
                </div>
              )}

              {efficiencyScore > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${getEfficiencyColor(efficiencyScore)}`} />
                  <span className={`text-xs font-medium ${getEfficiencyColor(efficiencyScore)}`}>
                    {Math.round(efficiencyScore * 100)}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {departmentOption && (
                <span className={`text-xs px-2 py-1 rounded-md transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}>
                  {departmentOption.label}
                </span>
              )}

              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${member.color
                  }`}>
                  {member.avatar}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {member.name}
                </span>
              </div>
            </div>
          </div>

          {(todo.related_property_id || todo.related_transaction_id || todo.related_user_id) && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Link className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Linked to:
                {todo.related_property_id && ` Property #${todo.related_property_id}`}
                {todo.related_transaction_id && ` Transaction #${todo.related_transaction_id}`}
                {todo.related_user_id && ` User #${todo.related_user_id}`}
              </span>
            </div>
          )}

          {comments.length > 0 && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <MessageCircle className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {comments.length} comment{comments.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTodoDetail = () => {
    if (!selectedTodo) return null;

    const member = getMemberInfo(selectedTodo.assigned_to);
    const typeOption = typeOptions.find(t => t.value === selectedTodo.todo_type);
    const categoryOption = categoryOptions.find(c => c.value === selectedTodo.category);
    const departmentOption = departmentOptions.find(d => d.value === selectedTodo.department);
    const isOverdueTodo = isOverdue(selectedTodo.due_date, selectedTodo.status);
    const efficiencyScore = selectedTodo.analytics_metadata?.efficiency_score ||
      selectedTodo.efficiency_score || 0;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`w-full max-w-2xl rounded-2xl shadow-2xl transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {typeOption?.icon}
                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {selectedTodo.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTodo(null)}
                className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-sm px-2 py-1 rounded-md ${getStatusColor(selectedTodo.status)
                }`}>
                {statusOptions.find(s => s.value === selectedTodo.status)?.label || 'Unknown'}
              </span>
              <span className={`text-sm px-2 py-1 rounded-md ${getPriorityColor(selectedTodo.priority)
                }`}>
                {priorityOptions.find(p => p.value === selectedTodo.priority)?.label || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {selectedTodo.description && (
              <div>
                <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Description
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {selectedTodo.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Task Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-md ${getTypeColor(selectedTodo.todo_type)
                      }`}>
                      {typeOption?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                    <span className="text-sm font-medium">{categoryOption?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Department:</span>
                    <span className="text-sm font-medium">{departmentOption?.label}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Timeline
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Due Date:</span>
                    <span className={`text-sm font-medium ${isOverdueTodo ? 'text-red-600 dark:text-red-400' : ''
                      }`}>
                      {formatDate(selectedTodo.due_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Created:</span>
                    <span className="text-sm">{formatDate(selectedTodo.created_at)}</span>
                  </div>
                  {selectedTodo.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Completed:</span>
                      <span className="text-sm">{formatDate(selectedTodo.completed_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Assignment
              </h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${member.color
                    }`}>
                    <span className="font-bold">{member.avatar}</span>
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{member.role}</div>
                  </div>
                </div>
              </div>
            </div>

            {selectedTodo.tags && selectedTodo.tags.length > 0 && (
              <div>
                <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {parseJSONField(selectedTodo.tags).map((tag, idx) => (
                    <span key={idx} className={`px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Analytics
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                  <div className="text-2xl font-bold text-amber-500">
                    {selectedTodo.estimated_hours || 0}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Estimated</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                  <div className="text-2xl font-bold text-blue-500">
                    {selectedTodo.actual_hours || 0}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Actual</div>
                </div>
                <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                  <div className={`text-2xl font-bold ${getEfficiencyColor(efficiencyScore)
                    }`}>
                    {Math.round(efficiencyScore * 100)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleToggleTodo(selectedTodo.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${selectedTodo.status === 'completed'
                    ? theme === 'dark'
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : theme === 'dark'
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-amber-400 text-white hover:bg-amber-500'
                  }`}
              >
                {selectedTodo.status === 'completed' ? 'Reopen Task' : 'Mark Complete'}
              </button>
              <button
                onClick={() => handleDeleteTodo(selectedTodo.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${theme === 'dark'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-red-400 text-white hover:bg-red-500'
                  }`}
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const statCards = [
    { label: 'Total Tasks', value: stats.total, color: 'amber' },
    { label: 'Pending', value: stats.pending, color: 'blue' },
    { label: 'Completed', value: stats.completed, color: 'green' },
    { label: 'Overdue', value: stats.overdue, color: 'red' },
    { label: 'Urgent', value: stats.urgent, color: 'orange' },
    { label: 'In Progress', value: stats.in_progress, color: 'purple' },
    { label: 'Efficiency', value: Math.round(stats.efficiency * 100), color: 'teal' }
  ];

  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700 shadow-xl' : 'bg-white border-gray-200 shadow-lg'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className={`text-xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
            Team Tasks Dashboard
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            Manage and track team tasks efficiently
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-700 text-amber-400' : 'bg-amber-50 text-amber-700'
          }`}>
          <BarChart className="w-4 h-4" />
          <span className="font-medium">{stats.total} tasks</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${theme === 'dark'
                ? `bg-gray-700 border-gray-600 hover:border-${stat.color}-500/50`
                : `bg-white border-gray-200 hover:border-${stat.color}-300 shadow-sm`
              }`}
          >
            <div className={`text-2xl font-bold text-${stat.color}-500`}>
              {stat.value}
              {stat.color === 'teal' ? '%' : ''}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className={`p-4 rounded-xl mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex rounded-lg border overflow-hidden ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
              }`}>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'list'
                    ? theme === 'dark'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-400 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'board'
                    ? theme === 'dark'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-400 text-white'
                    : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all duration-300 ${showCompleted
                  ? theme === 'dark'
                    ? 'bg-green-900/30 text-green-400 border-green-700'
                    : 'bg-green-100 text-green-700 border-green-300'
                  : theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 border-gray-600'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}
            >
              <CheckSquare className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                ? 'bg-gray-600 border-gray-500 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <option value="all">All Priorities</option>
            {priorityOptions.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                ? 'bg-gray-600 border-gray-500 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <option value="all">All Statuses</option>
            {statusOptions.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                ? 'bg-gray-600 border-gray-500 text-white'
                : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <option value="all">All Types</option>
            {typeOptions.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                  ? 'bg-gray-600 border-gray-500 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created_at">Created Date</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className={`px-3 py-2 rounded-lg border transition-all duration-300 ${theme === 'dark'
                  ? 'bg-gray-600 border-gray-500 text-gray-300 hover:bg-gray-500'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <SortAsc className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''
                }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
        {filteredTodos().length > 0 ? (
          filteredTodos().map(renderTodoItem)
        ) : (
          <div className={`text-center py-12 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}>
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h4 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
              No tasks found
            </h4>
            <p className="text-sm mb-4">Try adjusting your filters or create a new task</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterPriority("all");
                setFilterStatus("all");
                setFilterDepartment("all");
                setFilterType("all");
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${theme === 'dark'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-amber-400 text-white hover:bg-amber-500'
                }`}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Add New Task Form */}
      <div className={`p-6 rounded-xl border transition-all duration-300 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
        <h4 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
          Add New Task
        </h4>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Task Title *
            </label>
            <input
              type="text"
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              placeholder="What needs to be done?"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Description
            </label>
            <textarea
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              placeholder="Add details about this task..."
              rows="3"
              className={`w-full px-4 py-3 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Type
              </label>
              <select
                value={newTodo.todo_type}
                onChange={(e) => setNewTodo({ ...newTodo, todo_type: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {typeOptions.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Priority
              </label>
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {priorityOptions.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Time Estimate
              </label>
              <select
                value={newTodo.estimated_hours}
                onChange={(e) => setNewTodo({ ...newTodo, estimated_hours: parseFloat(e.target.value) })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {timeOptions.map(time => (
                  <option key={time.value} value={time.value}>{time.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Assign To
              </label>
              <select
                value={newTodo.assigned_to}
                onChange={(e) => setNewTodo({ ...newTodo, assigned_to: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                <option value="">Select team member</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Category
              </label>
              <select
                value={newTodo.category}
                onChange={(e) => setNewTodo({ ...newTodo, category: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {categoryOptions.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Department
              </label>
              <select
                value={newTodo.department}
                onChange={(e) => setNewTodo({ ...newTodo, department: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              >
                {departmentOptions.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Due Date
              </label>
              <input
                type="date"
                value={newTodo.due_date}
                onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-all duration-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                  }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Tags (Press Enter to add)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="Type a tag and press Enter"
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
              <button
                type="button"
                onClick={() => {
                  if (tagInput.trim()) {
                    const tags = [...newTodo.tags, tagInput.trim()];
                    setNewTodo({ ...newTodo, tags: tags.slice(0, 5) });
                    setTagInput("");
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${theme === 'dark'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-amber-400 text-white hover:bg-amber-500'
                  }`}
              >
                Add
              </button>
            </div>
            {newTodo.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newTodo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Related Property ID
              </label>
              <input
                type="text"
                value={newTodo.related_property_id}
                onChange={(e) => setNewTodo({ ...newTodo, related_property_id: e.target.value })}
                placeholder="Optional"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Related Transaction ID
              </label>
              <input
                type="text"
                value={newTodo.related_transaction_id}
                onChange={(e) => setNewTodo({ ...newTodo, related_transaction_id: e.target.value })}
                placeholder="Optional"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Related User ID
              </label>
              <input
                type="text"
                value={newTodo.related_user_id}
                onChange={(e) => setNewTodo({ ...newTodo, related_user_id: e.target.value })}
                placeholder="Optional"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
            </div>
          </div>

          <button
            onClick={handleAddTodo}
            disabled={!newTodo.title.trim() || isAdding}
            className={`w-full py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${theme === 'dark'
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-amber-400 text-white hover:bg-amber-500'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              {isAdding ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              <span>{isAdding ? 'Adding Task...' : 'Add New Task'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Todo Detail Modal */}
      {renderTodoDetail()}
    </div>
  );
};

export default TodoList;