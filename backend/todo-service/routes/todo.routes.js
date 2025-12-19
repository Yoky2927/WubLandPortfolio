import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from '../controllers/todo.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();


// Test route for token verification
router.get('/test-token', authenticateToken, (req, res) => {
    res.status(200).json({
        message: 'Token is valid',
        user: req.user, // This should include userId and username
    });
});
router.get('/', authenticateToken, getTodos);
router.post('/', authenticateToken, createTodo);
router.put('/:id', authenticateToken, updateTodo);
router.delete('/:id', authenticateToken, deleteTodo);
router.put('/reorder', authenticateToken, reorderTodos);

export { router };