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

export const createTodo = async (req, res) => {
  try {
    const { text, completed, dueDate, assignee } = req.body;
    const created_by = req.user.username;

    const newTodo = await Todo.create({
      text,
      completed,
      due_date: dueDate,
      assignee,
      created_by,
    });

    // Emit WebSocket event after successful creation
    const io = req.app.get('socketio');
    if (io) {
      io.emit('todo_created', newTodo);
    }

    res.status(201).json(newTodo);
  } catch (error) {
    console.error("Error creating todo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    const updatedTodo = await Todo.update(id, { completed });

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