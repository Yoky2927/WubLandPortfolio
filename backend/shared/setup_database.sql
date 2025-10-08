CREATE DATABASE IF NOT EXISTS wubland_portfolio_db;
USE wubland_portfolio_db;

-- Create users table with comprehensive role hierarchy
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'support_admin', 'support_lead', 'support_agent', 'broker', 'buyer', 'seller', 'user', 'renter') NOT NULL DEFAULT 'user',
    profile_picture VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    is_premium BOOLEAN DEFAULT FALSE,
    broker_type ENUM('internal', 'external') NULL,
    last_message_time TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date DATE,
    assignee VARCHAR(255),
    created_by VARCHAR(50),
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(username) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    receiver_id INT,
    text TEXT,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    file VARCHAR(255),
    file_type VARCHAR(50),
    file_name VARCHAR(255),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create admin_activities table
CREATE TABLE IF NOT EXISTS admin_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    admin_username VARCHAR(50) NOT NULL,
    target VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_username) REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('account', 'payment', 'technical', 'property', 'safety', 'general') NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(username) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create ticket_responses table
CREATE TABLE IF NOT EXISTS ticket_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    responder_username VARCHAR(50) NOT NULL,
    response_text TEXT NOT NULL,
    internal_note BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_username) REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create knowledge_base_articles table with video_url
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category ENUM('general', 'account', 'payment', 'technical', 'property', 'safety') NOT NULL,
    author_username VARCHAR(50) NOT NULL,
    video_url VARCHAR(500) NULL,
    views INT DEFAULT 0,
    helpful_votes INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_username) REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create flagged_content table with details
CREATE TABLE IF NOT EXISTS flagged_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content_type ENUM('property_listing', 'user_message', 'user_profile', 'review', 'other') NOT NULL,
    content_id VARCHAR(255),
    reported_by_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'under_review', 'resolved', 'approved', 'rejected', 'action_taken') DEFAULT 'pending',
    assigned_to VARCHAR(50),
    resolved_by VARCHAR(50),
    details TEXT,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(username) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(username) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create support_agent_activities table
CREATE TABLE IF NOT EXISTS support_agent_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_username VARCHAR(50) NOT NULL,
    activity_type ENUM('ticket_created', 'ticket_updated', 'ticket_resolved', 'article_created', 
                      'article_updated', 'article_deleted', 'flag_resolved', 'response_sent', 'user_assisted') NOT NULL,
    target_id INT,
    target_type ENUM('ticket', 'article', 'flag', 'user') NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_username) REFERENCES users(username) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_id INT,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    responded_to_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL,
    FOREIGN KEY (responded_to_by) REFERENCES users(username) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample users with different roles
INSERT IGNORE INTO users (first_name, last_name, username, email, password, role, status) VALUES
-- System Owner
('Sarah', 'Wilson', 'sarah_superadmin', 'sarah.owner@wubland.com', '$2b$10$examplehashedpassword', 'super_admin', 'active'),

-- Support Department
('David', 'Chen', 'david_supportadmin', 'david.admin@wubland.com', '$2b$10$examplehashedpassword', 'support_admin', 'active'),
('Maria', 'Garcia', 'maria_lead', 'maria.lead@wubland.com', '$2b$10$examplehashedpassword', 'support_lead', 'active'),
('Alex', 'Johnson', 'alex_agent', 'alex.agent@wubland.com', '$2b$10$examplehashedpassword', 'support_agent', 'active'),
('Lisa', 'Brown', 'lisa_agent', 'lisa.agent@wubland.com', '$2b$10$examplehashedpassword', 'support_agent', 'active'),

-- Regular users
('John', 'Doe', 'john_user', 'john.doe@email.com', '$2b$10$examplehashedpassword', 'user', 'active'),
('Jane', 'Smith', 'jane_buyer', 'jane.smith@email.com', '$2b$10$examplehashedpassword', 'buyer', 'active');

-- Insert sample knowledge base articles
INSERT IGNORE INTO knowledge_base_articles (title, content, category, author_username, views, helpful_votes) VALUES
('How to Reset Your Password', 'Step-by-step guide to reset your password if you''ve forgotten it...', 'account', 'alex_agent', 1245, 89),
('Understanding Payment Processing', 'Learn how payments are processed on our platform and typical timelines...', 'payment', 'maria_lead', 876, 67),
('Property Listing Guidelines', 'Complete guide to creating and managing property listings...', 'property', 'david_supportadmin', 1543, 112);