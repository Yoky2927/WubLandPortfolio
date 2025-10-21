// todo-service/controllers/todo.controller.js
import Todo from "../models/todo.model.js";

export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.getAll();
    res.json(todos);
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserTodos = async (req, res) => {
  try {
    const userId = req.user.id;
    const todos = await Todo.getByUser(userId);
    res.json(todos);
  } catch (error) {
    console.error("Error fetching user todos:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      priority, 
      dueDate, 
      estimatedHours,
      assignedTo,
      department 
    } = req.body;
    
    const created_by = req.user.id; // Use user ID instead of username
    const user_id = req.user.id;

    console.log('Creating todo for user ID:', user_id);

    const newTodo = await Todo.create({
      title,
      description,
      user_id,
      category: category || 'other',
      priority: priority || 'medium',
      due_date: dueDate,
      estimated_hours: estimatedHours,
      assigned_to: assignedTo,
      created_by: created_by,
      department: department || 'administration'
    });

    // Emit WebSocket event
    const io = req.app.get('socketio');
    if (io) {
      io.emit('todo_created', newTodo);
    }

    res.status(201).json(newTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      category, 
      priority, 
      status, 
      dueDate, 
      estimatedHours,
      actualHours,
      assignedTo,
      department,
      completed
    } = req.body;
    
    const updatedTodo = await Todo.update(id, { 
      title, 
      description, 
      category, 
      priority, 
      status, 
      due_date: dueDate,
      estimated_hours: estimatedHours,
      actual_hours: actualHours,
      assigned_to: assignedTo,
      department,
      completed
    });

    // Emit WebSocket event after successful update
    const io = req.app.get("socketio");
    if (io) {
      io.emit("todo_updated", updatedTodo);
    }

    res.json(updatedTodo);
  } catch (error) {
    console.error("Error updating todo:", error);
    res
      .status(error.message === "Todo not found" ? 404 : 500)
      .json({ message: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTodo = await Todo.delete(id);

    // Emit WebSocket event after successful deletion
    const io = req.app.get("socketio");
    if (io) {
      io.emit("todo_deleted", deletedTodo);
    }

    res.json({ message: "Todo deleted successfully", todo: deletedTodo });
  } catch (error) {
    console.error("Error deleting todo:", error);
    res
      .status(error.message === "Todo not found" ? 404 : 500)
      .json({ message: error.message });
  }
};

export const reorderTodos = async (req, res) => {
  try {
    const { todos } = req.body;
    await Todo.reorder(todos);
    
    // Optionally emit a reorder event if needed
    const io = req.app.get("socketio");
    if (io) {
      io.emit("todos_reordered", { reordered: true });
    }

    res.json({ message: "Todos reordered" });
  } catch (error) {
    console.error("Error reordering todos:", error);
    res.status(500).json({ message: "Server error" });
  }
};