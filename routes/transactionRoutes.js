// transaction-service/routes/transactionRoutes.js
import express from "express";
import {
  getAllTransactions,
  verifyTransaction,
  getTransactionById,
  createTransaction,
  webhookHandler,
  updateTransactionStatus
} from "../controllers/transactionController.js";

const router = express.Router();

router.get("/transactions", getAllTransactions); // Confirm this line
router.get("/transactions/verify/:tx_ref", verifyTransaction);
router.get("/transactions/:id", getTransactionById);
router.post("/transactions", createTransaction);
router.post("/transactions/webhook", webhookHandler);
router.patch("/transactions/:id/status", updateTransactionStatus);

export default router;