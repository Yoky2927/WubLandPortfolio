const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    const { email, password, role } = req.body;
    if (!['user', 'broker', 'admin', 'support_agent'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        const id = await User.create({ email, password, role });
        res.status(201).json({ id, email, role });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

exports.verifyBroker = async (req, res) => {
    const { id } = req.params;
    const { user } = req; // From auth middleware
    if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    try {
        const affectedRows = await User.updateVerification(id, true);
        if (affectedRows) {
            res.json({ message: 'Broker verified' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Verification failed' });
    }
};