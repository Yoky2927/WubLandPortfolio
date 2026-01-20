// communication-service/routes/todo.routes.js
import express from 'express';
import TodoController from '../controllers/todo.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply verifyToken to all routes
router.use(verifyToken);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        service: 'todo-service',
        status: 'active',
        timestamp: new Date().toISOString(),
        user: {
            id: req.user.id,
            role: req.user.role
        },
        endpoints: [
            'GET /api/todos',
            'GET /api/todos/upcoming',
            'GET /api/todos/search',
            'GET /api/todos/stats',
            'GET /api/todos/team-members',
            'GET /api/todos/:id',
            'POST /api/todos',
            'PUT /api/todos/:id',
            'DELETE /api/todos/:id',
            'PUT /api/todos/:id/status',
            'POST /api/todos/:id/comments',
            'GET /api/todos/:id/comments'
        ],
        database: 'connected'
    });
});

// Create a new todo
router.post('/', TodoController.createTodo);

// Get user's todos
router.get('/', TodoController.getUserTodos);

// Get upcoming todos
router.get('/upcoming', TodoController.getUpcomingTodos);

// Search todos
router.get('/search', TodoController.searchTodos);

// Get todo statistics
router.get('/stats', TodoController.getTodoStats);

// Get team members for assignment
router.get('/team-members', TodoController.getTeamMembers);

// Get todo by ID
router.get('/:id', TodoController.getTodoById);

// Update todo
router.put('/:id', TodoController.updateTodo);

// Delete todo
router.delete('/:id', TodoController.deleteTodo);

// Update todo status
router.put('/:id/status', TodoController.updateTodoStatus);

// Add comment to todo
router.post('/:id/comments', TodoController.addTodoComment);

// Get todo comments
router.get('/:id/comments', TodoController.getTodoComments);

export default router;