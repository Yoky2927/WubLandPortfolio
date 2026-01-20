// communication-service/controllers/todo.controller.js
import TodoModel from '../models/todo.model.js';
import NotificationService from '../services/notificationService.js';

class TodoController {
  // Create a new todo
  static async createTodo(req, res) {
    try {
      const userId = req.user.id;
      const todoData = req.body;
      
      // Validate required fields
      if (!todoData.title) {
        return res.status(400).json({
          success: false,
          message: 'Todo title is required'
        });
      }
      
      // Set user and creator
      todoData.user_id = userId;
      todoData.created_by = userId;
      
      // If assigned_to is provided, set assigned_by
      if (todoData.assigned_to && todoData.assigned_to !== userId) {
        todoData.assigned_by = userId;
        todoData.assigned_at = new Date();
      }
      
      // Create todo
      const todoId = await TodoModel.createTodo(todoData);
      
      // Get full todo details
      const todo = await TodoModel.getTodoById(todoId);
      
      // Send notification to assigned user
      if (todoData.assigned_to && todoData.assigned_to !== userId) {
        await NotificationService.createNotification({
          userId: todoData.assigned_to,
          title: 'New Task Assigned',
          message: `You have been assigned a new task: "${todoData.title}"`,
          type: 'todo',
          actionUrl: `/todos/${todoId}`,
          priority: todoData.priority === 'urgent' ? 'high' : 'medium',
          relatedEntityType: 'todo',
          relatedEntityId: todoId
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Todo created successfully',
        data: todo
      });
      
    } catch (error) {
      console.error('Error creating todo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create todo',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get user todos
  static async getUserTodos(req, res) {
    try {
      const userId = req.user.id;
      const filters = req.query;
      
      const todos = await TodoModel.getUserTodos(userId, filters);
      
      res.json({
        success: true,
        data: todos,
        count: todos.length
      });
      
    } catch (error) {
      console.error('Error getting user todos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get todos'
      });
    }
  }

  // Get todo by ID
  static async getTodoById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get todo
      const todo = await TodoModel.getTodoById(id);
      
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      // Check if user has access to this todo
      const hasAccess = todo.user_id === userId || 
                       todo.assigned_to === userId || 
                       todo.assigned_by === userId;
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this todo'
        });
      }
      
      // Get comments
      const comments = await TodoModel.getTodoComments(id);
      
      res.json({
        success: true,
        data: {
          ...todo,
          comments
        }
      });
      
    } catch (error) {
      console.error('Error getting todo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get todo'
      });
    }
  }

  // Update todo
  static async updateTodo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;
      
      // Get todo to check permissions
      const todo = await TodoModel.getTodoById(id);
      
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      // Check if user can update this todo
      const canUpdate = todo.user_id === userId || 
                       todo.assigned_to === userId || 
                       todo.assigned_by === userId;
      
      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this todo'
        });
      }
      
      // Handle status change
      if (updates.status && updates.status !== todo.status) {
        // If completing todo, set completed_at
        if (updates.status === 'completed') {
          updates.completed_at = new Date();
          // Calculate completion duration
          const created = new Date(todo.created_at);
          const completed = new Date();
          const durationDays = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
          updates.completion_duration_days = durationDays;
        }
        
        // Send notification about status change
        if (todo.user_id !== userId) {
          await NotificationService.createNotification({
            userId: todo.user_id,
            title: 'Todo Status Updated',
            message: `Todo "${todo.title}" status changed to ${updates.status} by ${req.user.first_name} ${req.user.last_name}`,
            type: 'todo',
            priority: 'low'
          });
        }
      }
      
      // Handle assignment change
      if (updates.assigned_to && updates.assigned_to !== todo.assigned_to) {
        updates.assigned_by = userId;
        updates.assigned_at = new Date();
        
        // Send notification to new assignee
        await NotificationService.createNotification({
          userId: updates.assigned_to,
          title: 'Task Reassigned',
          message: `You have been assigned to: "${todo.title}"`,
          type: 'todo',
          actionUrl: `/todos/${id}`,
          priority: updates.priority || todo.priority
        });
      }
      
      // Update todo
      const updated = await TodoModel.updateTodo(id, updates);
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update todo'
        });
      }
      
      // Get updated todo
      const updatedTodo = await TodoModel.getTodoById(id);
      
      res.json({
        success: true,
        message: 'Todo updated successfully',
        data: updatedTodo
      });
      
    } catch (error) {
      console.error('Error updating todo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update todo'
      });
    }
  }

  // Delete todo
  static async deleteTodo(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get todo to check permissions
      const todo = await TodoModel.getTodoById(id);
      
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      // Check if user can delete this todo
      const canDelete = todo.user_id === userId || 
                       todo.assigned_by === userId;
      
      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this todo'
        });
      }
      
      // Delete todo
      const deleted = await TodoModel.deleteTodo(id, userId);
      
      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete todo'
        });
      }
      
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete todo'
      });
    }
  }

  // Update todo status
  static async updateTodoStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      
      if (!status || !['pending', 'in_progress', 'completed', 'cancelled', 'deferred'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
      }
      
      // Get todo to check permissions
      const todo = await TodoModel.getTodoById(id);
      
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      // Check if user can update this todo
      const canUpdate = todo.user_id === userId || 
                       todo.assigned_to === userId || 
                       todo.assigned_by === userId;
      
      if (!canUpdate) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this todo'
        });
      }
      
      // Update status
      const updated = await TodoModel.updateTodoStatus(id, status, userId);
      
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update todo status'
        });
      }
      
      // Get updated todo
      const updatedTodo = await TodoModel.getTodoById(id);
      
      // Send notification about status change
      if (status === 'completed' && todo.user_id !== userId) {
        await NotificationService.createNotification({
          userId: todo.user_id,
          title: 'Todo Completed',
          message: `Todo "${todo.title}" has been marked as completed by ${req.user.first_name} ${req.user.last_name}`,
          type: 'todo',
          priority: 'low'
        });
      }
      
      res.json({
        success: true,
        message: `Todo status updated to ${status}`,
        data: updatedTodo
      });
      
    } catch (error) {
      console.error('Error updating todo status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update todo status'
      });
    }
  }

  // Get team members for assignment
  static async getTeamMembers(req, res) {
    try {
      const userId = req.user.id;
      const { department } = req.query;
      
      const teamMembers = await TodoModel.getTeamMembers(userId, department);
      
      res.json({
        success: true,
        data: teamMembers
      });
      
    } catch (error) {
      console.error('Error getting team members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team members'
      });
    }
  }

  // Get todo statistics
  static async getTodoStats(req, res) {
    try {
      const userId = req.user.id;
      
      const stats = await TodoModel.getTodoStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('Error getting todo stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get todo statistics'
      });
    }
  }

  // Add comment to todo
  static async addTodoComment(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { comment, attachments = [] } = req.body;
      
      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Comment is required'
        });
      }
      
      // Get todo to check permissions
      const todo = await TodoModel.getTodoById(id);
      
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      // Check if user has access to this todo
      const hasAccess = todo.user_id === userId || 
                       todo.assigned_to === userId || 
                       todo.assigned_by === userId;
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to comment on this todo'
        });
      }
      
      // Add comment
      const commentId = await TodoModel.addTodoComment(id, {
        user_id: userId,
        comment: comment.trim(),
        attachments
      });
      
      // Get all comments
      const comments = await TodoModel.getTodoComments(id);
      const newComment = comments.find(c => c.id === commentId);
      
      // Send notification to other participants
      const participants = new Set([
        todo.user_id,
        todo.assigned_to,
        todo.assigned_by
      ].filter(id => id && id !== userId));
      
      for (const participantId of participants) {
        await NotificationService.createNotification({
          userId: participantId,
          title: 'New Comment on Todo',
          message: `${req.user.first_name} ${req.user.last_name} commented on "${todo.title}": ${comment.substring(0, 50)}...`,
          type: 'todo',
          actionUrl: `/todos/${id}`,
          priority: 'low'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: newComment
      });
      
    } catch (error) {
      console.error('Error adding todo comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add comment'
      });
    }
  }

  // Get todo comments
  static async getTodoComments(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Get todo to check permissions
      const todo = await TodoModel.getTodoById(id);
      
      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      
      // Check if user has access to this todo
      const hasAccess = todo.user_id === userId || 
                       todo.assigned_to === userId || 
                       todo.assigned_by === userId;
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view comments for this todo'
        });
      }
      
      // Get comments
      const comments = await TodoModel.getTodoComments(id);
      
      res.json({
        success: true,
        data: comments
      });
      
    } catch (error) {
      console.error('Error getting todo comments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get comments'
      });
    }
  }

  // Get upcoming todos
  static async getUpcomingTodos(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      
      const todos = await TodoModel.getUpcomingTodos(userId, limit);
      
      res.json({
        success: true,
        data: todos,
        count: todos.length
      });
      
    } catch (error) {
      console.error('Error getting upcoming todos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get upcoming todos'
      });
    }
  }

  // Search todos
  static async searchTodos(req, res) {
    try {
      const userId = req.user.id;
      const { q, ...filters } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters'
        });
      }
      
      const todos = await TodoModel.searchTodos(userId, q.trim(), filters);
      
      res.json({
        success: true,
        data: todos,
        count: todos.length
      });
      
    } catch (error) {
      console.error('Error searching todos:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search todos'
      });
    }
  }
}

export default TodoController;