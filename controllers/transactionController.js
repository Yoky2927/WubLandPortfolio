// transaction-service/controllers/transactionController.js
import axios from "axios";
import dotenv from "dotenv";
import db from "../../shared/db.js"; // ✅ Default import (don’t touch shared/db.js)

dotenv.config();

// ✅ Load Chapa API configuration
const CHAPA_BASE =
  process.env.CHAPA_BASE_URL ||
  process.env.CHAPA_API_URL ||
  "https://api.chapa.co/v1";
const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;

// ✅ GET all transactions
export const getAllTransactions = async (req, res) => {
  try {
    const { user_id } = req.query;
    let sql = "SELECT * FROM transactions";
    const params = [];

    if (user_id) {
      sql += " WHERE user_id = ?";
      params.push(user_id);
    }

    sql += " ORDER BY created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("getAllTransactions error:", err.message);
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

// ✅ GET transaction by ID
export const getTransactionById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query("SELECT * FROM transactions WHERE id = ?", [
      id,
    ]);
    if (!rows.length)
      return res.status(404).json({ message: "Transaction not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("getTransactionById error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ POST create transaction & initialize Chapa payment
export const createTransaction = async (req, res) => {
  try {
    console.log("Request body:", req.body); // Log incoming data
    const { user_id, property_id = null, amount, type, email = "", first_name = "", last_name = "" } = req.body;
    if (!user_id || !amount || !type) {
      return res.status(400).json({ message: "Missing required fields (user_id, amount, type)" });
    }

    // Insert pending transaction
    const [result] = await db.query(
      "INSERT INTO transactions (user_id, property_id, amount, type, status, payment_provider) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, property_id, amount, type, "pending", "chapa"]
    );
    const transactionId = result.insertId;

    // Generate and set provider_reference (tx_ref)
    const tx_ref = `WUBLAND-${transactionId}-${Date.now()}`;
    await db.query("UPDATE transactions SET provider_reference = ? WHERE id = ?", [tx_ref, transactionId]);
    console.log("Transaction inserted, tx_ref:", tx_ref); // Log success

    // Prepare Chapa payload — MINIMAL TEST VERSION
const payload = {
  amount: parseFloat(amount),  // Must be number, not string
  currency: "ETB",
  email: email,  // Required
  first_name: first_name,  // Required
  last_name: last_name,  // Required
  tx_ref: tx_ref,  // Unique, no duplicates
  callback_url: `${process.env.WEBHOOK_BASE_URL}/api/transactions/webhook`,  // ngrok URL
  return_url: "https://google.com",  // Safe test redirect (no localhost)
  customization: {
    title: "WubLand Test",
    description: "Rent Payment Test"
  }
};
    console.log("Chapa payload:", payload); // Log payload before sending

    const response = await axios.post(
      `${CHAPA_BASE.replace(/\/$/, "")}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    const checkout_url = response.data?.data?.checkout_url || null;
    console.log("Chapa response:", response.data); // Log Chapa response
    return res.status(201).json({
      message: "Transaction initialized",
      transactionId,
      tx_ref,
      checkout_url
    });
  } catch (err) {
    console.error("createTransaction error:", err?.response?.data || err.message || err.stack || err);
    return res.status(500).json({ error: "Failed to initialize payment", details: err.message });
  }
};

// ✅ VERIFY TRANSACTION (updated)
export const verifyTransaction = async (req, res) => {
  try {
    const tx_ref = req.params.tx_ref;
    if (!tx_ref) return res.status(400).json({ message: "Missing tx_ref" });

    // Call Chapa API
    const response = await axios.get(
      `${CHAPA_BASE.replace(/\/$/, "")}/transaction/verify/${tx_ref}`,
      {
        headers: { Authorization: `Bearer ${CHAPA_SECRET}` },
      }
    );

    const chapaData = response.data?.data || {};
    const statusFromChapa = chapaData?.status || "pending";

    // ✅ Update local DB
    const newStatus =
      statusFromChapa === "success"
        ? "completed"
        : statusFromChapa === "failed"
        ? "failed"
        : "pending";

    await db.query(
      "UPDATE transactions SET status = ? WHERE provider_reference = ?",
      [newStatus, tx_ref]
    );

    // ✅ Return updated transaction
    const [rows] = await db.query(
      "SELECT * FROM transactions WHERE provider_reference = ?",
      [tx_ref]
    );

    return res.json({
      message: "Verification completed",
      chapaData,
      transaction: rows[0] || null,
    });
  } catch (err) {
    console.error("verifyTransaction error:", err?.response?.data || err.message);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
};


// ✅ POST /api/transactions/webhook (automatic from Chapa)
export const webhookHandler = async (req, res) => {
  try {
    const payload = req.body;
    console.log("Webhook payload:", payload);

    const tx_ref =
      payload?.tx_ref || payload?.data?.tx_ref || payload?.data?.transaction?.tx_ref;
    const statusFromChapa =
      payload?.status || payload?.data?.status || payload?.data?.transaction?.status;

    if (!tx_ref) {
      console.warn("Webhook: tx_ref not present");
      return res.status(400).json({ message: "No tx_ref in payload" });
    }

    const newStatus =
      statusFromChapa === "success" ? "completed" : statusFromChapa || "pending";

    await db.query("UPDATE transactions SET status = ? WHERE provider_reference = ?", [
      newStatus,
      tx_ref,
    ]);

    return res.status(200).json({ message: "Webhook processed", tx_ref, newStatus });
  } catch (err) {
    console.error("webhookHandler error:", err);
    return res.status(500).json({ error: "Webhook handling error" });
  }
};

// ✅ PATCH /api/transactions/:id/status (manual update)
export const updateTransactionStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Missing status" });

    await db.query("UPDATE transactions SET status = ? WHERE id = ?", [status, id]);
    const [rows] = await db.query("SELECT * FROM transactions WHERE id = ?", [id]);
    return res.json(rows[0]);
  } catch (err) {
    console.error("updateTransactionStatus error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
