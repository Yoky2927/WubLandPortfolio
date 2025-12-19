// transaction-service/server.js
import express from "express";
import dotenv from "dotenv";
import transactionRoutes from "./routes/transactionRoutes.js";

dotenv.config();

const app = express();
app.use(express.json()); // Must be before routes

app.use("/api", transactionRoutes); // Mounts all routes under /api

const PORT = process.env.PORT || 5006;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));