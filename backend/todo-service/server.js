import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { router as todoRoutes } from './routes/todo.routes.js';


dotenv.config();

const app = express();

app.use(express.json());

// Enable CORS
app.use(cors());

// Routes
app.use('/api/todos', todoRoutes);

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

const PORT = process.env.PORT;

app.listen(PORT, () => console.log(`🚀 Todo Service running on port ${PORT}`));