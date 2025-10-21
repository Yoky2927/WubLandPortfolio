// todo-service/routes/todo.routes.js
import express from 'express';
import { 
  getTodos, 
  getUserTodos,
  createTodo, 
  updateTodo, 
  deleteTodo, 
  reorderTodos 
} from '../controllers/todo.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Test route for token verification
router.get('/test-token', authenticateToken, (req, res) => {
    res.status(200).json({
        message: 'Token is valid',
        user: req.user,
    });
});

// Get all todos (admin view)
router.get('/', authenticateToken, getTodos);

// Get user's todos (personal view)
router.get('/my-todos', authenticateToken, getUserTodos);

router.post('/', authenticateToken, createTodo);
router.put('/:id', authenticateToken, updateTodo);
router.delete('/:id', authenticateToken, deleteTodo);
router.put('/reorder', authenticateToken, reorderTodos);

export { router };