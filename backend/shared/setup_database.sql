-- Create Database
CREATE DATABASE IF NOT EXISTS wubland_portfolio_db;
USE wubland_portfolio_db;

-- Users Table (User Management)
CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'broker', 'admin', 'support_agent') NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Properties Table (Property Management)
CREATE TABLE IF NOT EXISTS properties (
                                          id INT AUTO_INCREMENT PRIMARY KEY,
                                          address VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    type ENUM('rent', 'sale') NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL,
    description TEXT,
    images JSON,
    owner_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
    );

-- Transactions Table (Transaction Management)
CREATE TABLE IF NOT EXISTS transactions (
                                            id INT AUTO_INCREMENT PRIMARY KEY,
                                            property_id INT NOT NULL,
                                            user_id INT NOT NULL,
                                            amount DECIMAL(10, 2) NOT NULL,
    type ENUM('rent', 'purchase') NOT NULL,
    status ENUM('pending', 'completed', 'failed') NOT NULL,
    broker_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (broker_id) REFERENCES users(id)
    );

-- Notifications Table (Communication - One-way)
CREATE TABLE IF NOT EXISTS notifications (
                                             id INT AUTO_INCREMENT PRIMARY KEY,
                                             user_id INT NOT NULL,
                                             message TEXT NOT NULL,
                                             type ENUM('payment_update', 'property_status', 'announcement') NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
    );

-- Messages Table (Communication - Two-way)
CREATE TABLE IF NOT EXISTS messages (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        sender_id INT NOT NULL,
                                        receiver_id INT NOT NULL,
                                        message TEXT NOT NULL,
                                        read BOOLEAN DEFAULT FALSE,
                                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                        FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

-- Reports Table (Analysis and Reporting)
CREATE TABLE IF NOT EXISTS reports (
                                       id INT AUTO_INCREMENT PRIMARY KEY,
                                       type ENUM('sales_rent', 'payment_tracking', 'broker_performance') NOT NULL,
    data JSON,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Insert Sample Data (Optional)
INSERT INTO users (email, password, role) VALUES ('admin@example.com', '$2b$10$...hashed...', 'admin');