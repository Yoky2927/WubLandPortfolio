const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.put('/verify-broker/:id', authMiddleware, userController.verifyBroker);

module.exports = router;