-- =============================================
-- DATABASE INITIALIZATION
-- =============================================

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wubland_portfolio_db;

-- Switch to the created database
USE wubland_portfolio_db;

-- =============================================
-- CORE USER & AUTHENTICATION TABLES
-- =============================================

-- Enhanced users table with comprehensive user management features
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- User basic information
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    
    -- Role and privilege system for access control
    role ENUM(
        'super_admin', 'admin', 'support_admin', 'support_lead', 
        'support_agent', 'internal_broker', 'external_broker', 
        'buyer', 'seller', 'landlord', 'renter', 'user'
    ) NOT NULL DEFAULT 'user',
    
    -- Subscription tier for feature access
    privilege_tier ENUM('basic', 'standard', 'premium', 'enterprise') DEFAULT 'basic',
    feature_flags JSON, -- Store additional feature permissions
    
    -- Profile information
    profile_picture VARCHAR(255),
    bio TEXT,
    date_of_birth DATE,
    
    -- Location information for geographical context
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    zip_code VARCHAR(20),
    
    -- Email verification fields
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires DATETIME,
    
    -- Security fields for account protection
    password_change_required BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_attempts INT DEFAULT 0,
    lock_until DATETIME,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    
    -- Status and metadata
    verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    last_login TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    
    -- Subscription and billing information
    subscription_ends_at TIMESTAMP NULL,
    stripe_customer_id VARCHAR(255),
    
    -- Communication limits for rate limiting
    message_count INT DEFAULT 0,
    last_message_time TIMESTAMP NULL,
    
    -- Timestamps for record tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance optimization
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_privilege_tier (privilege_tier),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User preferences table for personalized settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Notification preferences
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    notification_push BOOLEAN DEFAULT TRUE,
    
    -- User interface preferences
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    theme ENUM('light', 'dark', 'auto') DEFAULT 'light',
    email_frequency ENUM('immediate', 'daily', 'weekly') DEFAULT 'immediate',
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint ensures one preference set per user
    UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table for authentication management
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Session identification
    session_token VARCHAR(255) NOT NULL UNIQUE,
    
    -- Security tracking
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSON,
    
    -- Session lifecycle
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamp for session creation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens table for secure password recovery
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Token for password reset
    token VARCHAR(255) NOT NULL UNIQUE,
    
    -- Token validity
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    
    -- Timestamp for token creation
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- BROKER MANAGEMENT TABLES
-- =============================================

-- Broker profiles table for broker-specific information
CREATE TABLE IF NOT EXISTS broker_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    
    -- Broker classification
    broker_type ENUM('internal', 'external') NOT NULL,
    
    -- Professional information
    license_number VARCHAR(100),
    license_expiry DATE,
    years_experience INT DEFAULT 0,
    specialization JSON DEFAULT '[]', -- Array of specialties
    
    -- Performance statistics
    total_completed_deals INT DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    
    -- Financial information
    commission_rate DECIMAL(5,2) DEFAULT 2.5,
    service_fee DECIMAL(5,2) DEFAULT 0.00,
    
    -- Availability and capacity
    is_available BOOLEAN DEFAULT TRUE,
    max_clients INT DEFAULT 10,
    current_active_clients INT DEFAULT 0,
    
    -- Multilingual support
    languages JSON DEFAULT '["amharic", "english"]',
    
    -- Service coverage areas
    service_areas JSON DEFAULT '[]',
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    
    -- Biography in multiple languages
    bio_amharic TEXT,
    bio_english TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_broker_user (user_id),
    INDEX idx_broker_type (broker_type),
    INDEX idx_is_available (is_available),
    INDEX idx_average_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broker reviews and ratings table
CREATE TABLE IF NOT EXISTS broker_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relationship mapping
    broker_id INT NOT NULL,
    client_id INT NOT NULL,
    property_id INT NULL, -- Optional link to specific property
    
    -- Rating components (1-5 scale)
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
    knowledge_rating INT CHECK (knowledge_rating BETWEEN 1 AND 5),
    
    -- Multilingual review content
    title_amharic VARCHAR(255),
    title_english VARCHAR(255),
    comment_amharic TEXT,
    comment_english TEXT,
    
    -- Transaction context
    transaction_type ENUM('sale', 'rental') NOT NULL,
    transaction_date DATE,
    transaction_amount DECIMAL(15,2),
    
    -- Review moderation status
    is_approved BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE, -- Verified actual client
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_broker_rating (broker_id, overall_rating),
    INDEX idx_created_at (created_at),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broker availability schedule table
CREATE TABLE IF NOT EXISTS broker_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    
    -- Schedule details
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Foreign key and constraints
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_broker_schedule (broker_id, day_of_week),
    INDEX idx_broker_availability (broker_id, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PROPERTY MANAGEMENT TABLES
-- =============================================

-- Main properties table for real estate listings
CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Property basic information
    title VARCHAR(255) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    
    -- Property specifications
    beds INT,
    baths INT,
    sqft INT,
    garage INT,
    property_type VARCHAR(100),
    property_status VARCHAR(50),
    price_per_sqft DECIMAL(10,2),
    year_built INT,
    lot_size INT,
    
    -- Property description
    description TEXT,
    images JSON,
    features JSON,
    coordinates JSON,
    
    -- Listing information
    listed_date DATE,
    views INT DEFAULT 0,
    saves INT DEFAULT 0,
    mls_number VARCHAR(100),
    source VARCHAR(100),
    
    -- Financial information
    est_payment DECIMAL(10,2),
    premium BOOLEAN DEFAULT FALSE,
    
    -- Relationship to broker
    broker_id INT,
    
    -- Historical and additional data
    price_history JSON,
    tax_history JSON,
    nearby_schools JSON,
    floor_plans JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_city (city),
    INDEX idx_property_type (property_type),
    INDEX idx_property_status (property_status),
    INDEX idx_price (price),
    INDEX idx_broker_id (broker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PRIVILEGE & ROLE MANAGEMENT TABLES
-- =============================================

-- Privilege templates for role-based access control
CREATE TABLE IF NOT EXISTS privilege_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Template identification
    template_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Role classification
    role_type ENUM('admin', 'support', 'broker', 'client') NOT NULL,
    tier ENUM('basic', 'standard', 'premium', 'enterprise') NOT NULL,
    
    -- Permission structure
    privileges JSON NOT NULL,
    
    -- Pricing information
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Template status
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for efficient querying
    INDEX idx_role_tier (role_type, tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User privileges table for custom permissions
CREATE TABLE IF NOT EXISTS user_privileges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- User relationship
    user_id INT NOT NULL,
    
    -- Privilege definition
    privilege_key VARCHAR(100) NOT NULL,
    privilege_value JSON,
    
    -- Grant information
    granted_by INT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    -- Foreign keys and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_privilege (user_id, privilege_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- REGISTRATION MANAGEMENT TABLES
-- =============================================

-- Pending registrations table for email verification workflow
CREATE TABLE IF NOT EXISTS pending_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- User information from registration
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    
    -- Role assignment
    role ENUM('user', 'broker', 'seller', 'buyer', 'renter', 'landlord') NOT NULL,
    broker_type ENUM('internal', 'external') NULL,
    
    -- Email verification tokens
    email_verification_token VARCHAR(255) NOT NULL,
    email_verification_expires DATETIME NOT NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_token (email_verification_token),
    INDEX idx_email (email),
    INDEX idx_expires (email_verification_expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- COMMUNICATION SERVICE TABLES
-- =============================================

-- Chat conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Conversation identification
    conversation_uuid VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255),
    
    -- Conversation type classification
    conversation_type ENUM('direct', 'group', 'support') DEFAULT 'direct',
    
    -- Creator information
    created_by INT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL,
    
    -- Foreign key and indexes
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_conversation_uuid (conversation_uuid),
    INDEX idx_last_message_at (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversation participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relationship mapping
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Participant role
    role ENUM('member', 'admin') DEFAULT 'member',
    
    -- Participation tracking
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign keys and constraints
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id),
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Message context
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    
    -- Message type and content
    message_type ENUM('text', 'image', 'file', 'system', 'notification') DEFAULT 'text',
    text TEXT,
    image_url VARCHAR(500),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(100),
    
    -- Message status tracking
    status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
    read_by JSON DEFAULT '[]', -- JSON array of user IDs
    
    -- Reply functionality
    reply_to_message_id INT NULL,
    
    -- Message metadata
    metadata JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL,
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_sender_created (sender_id, created_at),
    INDEX idx_message_type (message_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Message deletions tracking table
CREATE TABLE IF NOT EXISTS message_deletions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Message and user reference
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Deletion scope
    deleted_for ENUM('self', 'everyone') DEFAULT 'self',
    
    -- Deletion timestamp
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and constraints
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_deletion (message_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User message limits tracking for rate limiting
CREATE TABLE IF NOT EXISTS user_message_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- User and period tracking
    user_id INT NOT NULL,
    period_date DATE NOT NULL, -- Daily tracking
    
    -- Message statistics
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP NULL,
    limit_exceeded BOOLEAN DEFAULT FALSE,
    
    -- Foreign key and constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_period (user_id, period_date),
    INDEX idx_period_date (period_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TODO SERVICE TABLES
-- =============================================

-- Enhanced todos table with comprehensive task management
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Task ownership
    user_id INT NOT NULL,
    
    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- ADMIN/SUPPORT WORK CATEGORIES
    category ENUM(
        'user_management', 
        'content_moderation', 
        'system_maintenance', 
        'security_review', 
        'support_tickets', 
        'knowledge_base', 
        'flagged_content', 
        'financial_review', 
        'property_verification', 
        'report_generation', 
        'team_coordination', 
        'training_development',
        'meeting_preparation',
        'policy_update',
        'performance_review',
        'other'
    ) DEFAULT 'other',
    
    -- Task prioritization
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Task lifecycle
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    
    -- Time tracking
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    tags JSON DEFAULT '[]',
    
    -- Task organization
    order_index INT DEFAULT 0,
    parent_todo_id INT NULL, -- For sub-tasks hierarchy
    
    -- Assignment and creation tracking
    assigned_to INT NULL,
    created_by INT NOT NULL,
    
    -- Department/Team assignment
    department ENUM('administration', 'support', 'moderation', 'technical', 'financial') DEFAULT 'administration',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status),
    INDEX idx_due_date (due_date),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_department (department),
    INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo comments table for collaboration
CREATE TABLE IF NOT EXISTS todo_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Comment context
    todo_id INT NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    
    -- Comment metadata
    is_internal_note BOOLEAN DEFAULT FALSE, -- Private team notes
    mentions JSON DEFAULT '[]', -- User IDs mentioned
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_todo_created (todo_id, created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo attachments table for supporting documents
CREATE TABLE IF NOT EXISTS todo_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Attachment context
    todo_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- File information
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    file_category ENUM('document', 'image', 'spreadsheet', 'presentation', 'other') DEFAULT 'document',
    
    -- Attachment metadata
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE, -- Visibility control
    
    -- Upload timestamp
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_todo_id (todo_id),
    INDEX idx_file_category (file_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo history table for audit trail
CREATE TABLE IF NOT EXISTS todo_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- History context
    todo_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type ENUM('created', 'updated', 'status_changed', 'assigned', 'commented', 'attachment_added') NOT NULL,
    
    -- Change tracking
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    
    -- Security metadata
    ip_address VARCHAR(45),
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_todo_action (todo_id, action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo templates for recurring tasks
CREATE TABLE IF NOT EXISTS todo_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Template identification
    template_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Task categorization
    category ENUM(
        'user_management', 
        'content_moderation', 
        'system_maintenance', 
        'security_review', 
        'support_tickets', 
        'knowledge_base', 
        'flagged_content', 
        'financial_review', 
        'property_verification', 
        'report_generation', 
        'team_coordination', 
        'training_development',
        'meeting_preparation',
        'policy_update',
        'performance_review',
        'other'
    ) DEFAULT 'other',
    
    -- Template settings
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_hours DECIMAL(4,2),
    department ENUM('administration', 'support', 'moderation', 'technical', 'financial') DEFAULT 'administration',
    recurrence_pattern ENUM('none', 'daily', 'weekly', 'monthly', 'quarterly') DEFAULT 'none',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Creator information
    created_by INT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category_department (category, department),
    INDEX idx_recurrence (recurrence_pattern)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SUPPORT & VERIFICATION SERVICE TABLES
-- =============================================

-- Enhanced support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Ticket identification
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    
    -- Customer information
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Ticket categorization
    category ENUM('account', 'payment', 'technical', 'property', 'safety', 'general', 'billing') NOT NULL,
    subcategory VARCHAR(100),
    
    -- Priority and status management
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') DEFAULT 'open',
    
    -- Assignment and resolution tracking
    assigned_to INT NULL,
    assigned_at TIMESTAMP NULL,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Customer satisfaction metrics
    customer_rating INT,
    customer_feedback TEXT,
    
    -- Ticket metadata
    source ENUM('web', 'email', 'phone', 'chat') DEFAULT 'web',
    first_response_at TIMESTAMP NULL,
    sla_breached BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status_priority (status, priority),
    INDEX idx_category (category),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced ticket_responses table
CREATE TABLE IF NOT EXISTS ticket_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Response context
    ticket_id INT NOT NULL,
    responder_id INT NOT NULL,
    
    -- Response classification
    response_type ENUM('public', 'internal_note') DEFAULT 'public',
    message TEXT NOT NULL,
    
    -- Attachments
    attachments JSON DEFAULT '[]',
    
    -- Response tracking
    is_first_response BOOLEAN DEFAULT FALSE,
    read_by_customer BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_created (ticket_id, created_at),
    INDEX idx_responder (responder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced knowledge_base_articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Article identification
    article_number VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    
    -- Categorization and tagging
    category ENUM('general', 'account', 'payment', 'technical', 'property', 'safety', 'billing') NOT NULL,
    tags JSON DEFAULT '[]',
    
    -- Author and publication status
    author_id INT NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    
    -- SEO and visibility optimization
    slug VARCHAR(255) UNIQUE NOT NULL,
    meta_description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Engagement metrics
    views INT DEFAULT 0,
    helpful_votes INT DEFAULT 0,
    not_helpful_votes INT DEFAULT 0,
    
    -- Media assets
    featured_image VARCHAR(500),
    video_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    
    -- Foreign key and indexes
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category_status (category, status),
    INDEX idx_slug (slug),
    INDEX idx_published_at (published_at),
    INDEX idx_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Article feedback table
CREATE TABLE IF NOT EXISTS article_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Feedback context
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Feedback metrics
    was_helpful BOOLEAN NOT NULL,
    feedback_comment TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and constraints
    FOREIGN KEY (article_id) REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_article_feedback (article_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced flagged_content table
CREATE TABLE IF NOT EXISTS flagged_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Flag identification
    flag_number VARCHAR(20) NOT NULL UNIQUE,
    
    -- Content identification
    content_type ENUM('property_listing', 'user_message', 'user_profile', 'review', 'article', 'other') NOT NULL,
    content_id VARCHAR(255) NOT NULL,
    content_url VARCHAR(500),
    
    -- Reporting information
    reported_by_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    additional_details TEXT,
    
    -- Severity and status management
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('pending', 'under_review', 'resolved', 'approved', 'rejected', 'action_taken') DEFAULT 'pending',
    
    -- Assignment and resolution
    assigned_to INT NULL,
    assigned_at TIMESTAMP NULL,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status_severity (status, severity),
    INDEX idx_content_type (content_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support agent performance tracking
CREATE TABLE IF NOT EXISTS support_agent_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Agent and period tracking
    agent_id INT NOT NULL,
    period_date DATE NOT NULL, -- Monthly tracking
    
    -- Performance metrics
    tickets_assigned INT DEFAULT 0,
    tickets_resolved INT DEFAULT 0,
    first_response_time_avg DECIMAL(8,2), -- in minutes
    resolution_time_avg DECIMAL(8,2), -- in minutes
    customer_satisfaction_avg DECIMAL(3,2),
    
    -- Activity metrics
    responses_count INT DEFAULT 0,
    articles_created INT DEFAULT 0,
    flags_resolved INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key and constraints
    FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_agent_period (agent_id, period_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SYSTEM & ADMINISTRATION TABLES
-- =============================================

-- Enhanced admin_activities table
CREATE TABLE IF NOT EXISTS admin_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Activity identification
    activity_type VARCHAR(100) NOT NULL,
    admin_user_id INT NOT NULL,
    
    -- Target information
    target_type ENUM('user', 'ticket', 'article', 'flag', 'system', 'property') NOT NULL,
    target_id INT,
    target_name VARCHAR(255),
    
    -- Activity details
    description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    
    -- Activity timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_timestamp (admin_user_id, timestamp),
    INDEX idx_activity_type (activity_type),
    INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced security_logs table
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Log classification
    log_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    
    -- Event details
    description TEXT NOT NULL,
    event_data JSON,
    
    -- Source information
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id INT NULL,
    
    -- Geographical data
    country_code VARCHAR(10),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Response and resolution tracking
    action_taken TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    
    -- Log timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_severity_type (severity, log_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System configurations table
CREATE TABLE IF NOT EXISTS system_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Configuration identification
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'array', 'object') DEFAULT 'string',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    
    -- Configuration management
    is_editable BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    
    -- Update tracking
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key and indexes
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_config_key (config_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Support agent activities tracking table
CREATE TABLE IF NOT EXISTS support_agent_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Agent identification
    agent_username VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    
    -- Target information
    target_id INT,
    target_type ENUM('ticket', 'article', 'flag', 'broker_verification', 'feedback', 'user') NOT NULL,
    
    -- Activity details
    details TEXT,
    
    -- Activity timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_agent (agent_username),
    INDEX idx_timestamp (timestamp),
    INDEX idx_activity (activity_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- NOTIFICATION SYSTEM TABLES
-- =============================================

-- Notifications table for user alerts
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Recipient information
    user_id INT NOT NULL,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'system') DEFAULT 'info',
    
    -- Notification metadata
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    related_entity_type VARCHAR(50),
    related_entity_id INT,
    
    -- Notification lifecycle
    expires_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    -- Foreign key and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INITIAL DATA POPULATION
-- =============================================

-- Insert essential system configurations
INSERT IGNORE INTO system_configurations (config_key, config_value, data_type, description, category) VALUES
-- Communication settings
('chat.free_message_limit', '10', 'number', 'Number of free messages for non-premium users', 'communication'),
('chat.premium_features', '["unlimited_messages", "group_chats", "file_sharing"]', 'array', 'Features available to premium users', 'communication'),

-- Support service level agreements
('support.sla_first_response', '1440', 'number', 'SLA for first response in minutes', 'support'),
('support.sla_resolution', '10080', 'number', 'SLA for ticket resolution in minutes', 'support'),

-- User management settings
('user.verification_required', 'true', 'boolean', 'Whether email verification is required', 'user'),

-- System operation settings
('system.maintenance_mode', 'false', 'boolean', 'System maintenance mode', 'system');

-- Insert privilege templates for role-based access control
INSERT IGNORE INTO privilege_templates (template_name, role_type, tier, privileges, monthly_price, description) VALUES
-- Premium internal broker template
('internal_broker_premium', 'broker', 'premium', 
 '{"properties": {"manage": ["create", "read", "update", "delete", "bulk_upload", "list_directly", "feature"], "limits": {"max_listings": 1000, "max_images": 50, "max_featured": 20}}, "communication": {"chat": ["unlimited_messages", "initiate_chats", "group_chats"], "limits": {"max_active_chats": 100}}, "analytics": ["advanced_reports", "market_trends"]}', 
 299.00, 
 'Premium internal broker with full feature access'),

-- Standard external broker template
('external_broker_standard', 'broker', 'standard', 
 '{"properties": {"manage": ["create", "read", "update", "delete", "list_directly"], "limits": {"max_listings": 100, "max_images": 20, "max_featured": 5}}, "communication": {"chat": ["unlimited_messages", "initiate_chats"], "limits": {"max_active_chats": 50}}, "analytics": ["basic_reports"]}', 
 99.00, 
 'Standard external broker with basic features'),

-- Basic support agent template
('support_agent_basic', 'support', 'basic', 
 '{"support": ["view_assigned_tickets", "respond", "resolve"], "knowledge_base": ["create", "suggest_updates"], "communication": ["view_assigned_chats", "respond_chats"]}', 
 0.00, 
 'Basic support agent privileges');