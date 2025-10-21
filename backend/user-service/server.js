// server.js - FIXED VERSION
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import privilegeRoutes from "./routes/privilege.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';
import db from "../shared/db.js"; // ADD THIS IMPORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
}));

app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.post("/api/test-upload", (req, res) => {
  if (!req.files || !req.files.profilePicture) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const file = req.files.profilePicture;
  console.log('File received:', file.name, file.size, file.mimetype);
  
  res.json({ 
    message: "File received successfully", 
    filename: file.name,
    size: file.size,
    type: file.mimetype
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/profile", authRoutes);
app.get("/ping", (req, res) => {
  res.send("pong");
});
app.use('/api/privileges', privilegeRoutes);

// Debug route to check database schema
app.get('/api/debug/db-schema', async (req, res) => {
  try {
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME]);
    
    res.json({ columns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check a specific user's data
app.get('/api/debug/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug route to check database connection
app.get('/api/debug/db-connection', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as test');
    res.json({ 
      status: 'connected', 
      test: result,
      database: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      database: process.env.DB_NAME
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'user-service' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 User service running on port ${PORT}`));