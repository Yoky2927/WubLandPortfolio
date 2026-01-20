// backend/communication-service/config/database.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'wubland_portfolio_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
db.getConnection()
  .then(connection => {
    console.log('✅ Communication service database connected');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Communication service database connection failed:', error.message);
    process.exit(1);
  });

export default db;