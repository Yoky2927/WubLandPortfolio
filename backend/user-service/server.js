import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 User service running on port ${PORT}`));