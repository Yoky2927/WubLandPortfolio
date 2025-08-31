const express = require('express');
const userRoutes = require('./routes/userRoutes');
const { pool } = require('../shared/db');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`User service running on port ${PORT}`));