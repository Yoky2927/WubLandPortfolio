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
    deleted_at TIMESTAMP NULL, -- For soft deletes
    
    -- Audit trail
    created_by_user_id INT NULL,
    last_modified_by_user_id INT NULL,
    
    -- Indexes for performance optimization
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_privilege_tier (privilege_tier),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at)
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
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    deleted_at TIMESTAMP NULL,
    
    -- Foreign key and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_broker_user (user_id),
    INDEX idx_broker_type (broker_type),
    INDEX idx_is_available (is_available),
    INDEX idx_average_rating (average_rating)
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
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key and constraints
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_broker_schedule (broker_id, day_of_week),
    INDEX idx_broker_availability (broker_id, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PROPERTY SERVICE TABLES (UPDATED WITH ALL FIELDS)
-- =============================================

-- Main properties table for real estate listings (UPDATED)
CREATE TABLE IF NOT EXISTS properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Property identification
    property_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Property basic information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type ENUM('residential', 'commercial', 'industrial', 'land', 'apartment', 'house', 'condo', 'townhouse', 'villa', 'penthouse', 'cottage', 'loft') NOT NULL,
    property_status ENUM('active', 'pending', 'sold', 'rented', 'inactive', 'draft') DEFAULT 'draft',
    
    -- Location information (UPDATED)
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ethiopia',
    zip_code VARCHAR(20),
    neighborhood VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_place_id VARCHAR(255),
    region VARCHAR(100), -- Added for frontend
    
    -- Property specifications
    beds INT,
    baths INT,
    sqft DECIMAL(10,2),
    lot_size DECIMAL(10,2),
    year_built INT,
    garage_spaces INT DEFAULT 0,
    parking_spaces INT DEFAULT 0,
    
    -- Pricing information
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    price_per_sqft DECIMAL(10,2),
    is_negotiable BOOLEAN DEFAULT TRUE,
    deposit_amount DECIMAL(15,2),
    monthly_rent DECIMAL(15,2),
    
    -- Listing information (UPDATED)
    listing_type ENUM('sale', 'rent', 'lease') NOT NULL,
    mls_number VARCHAR(100),
    mls_source VARCHAR(100), -- Added for frontend
    listing_date DATE,
    expiration_date DATE,
    
    -- Ownership and management
    owner_user_id INT NOT NULL, -- Seller/Landlord
    created_by_user_id INT NOT NULL, -- Who created the listing
    assigned_broker_id INT NULL, -- Assigned broker for this property
    is_exclusive BOOLEAN DEFAULT FALSE,
    
    -- Features and amenities
    features JSON DEFAULT '[]',
    amenities JSON DEFAULT '[]',
    property_tags JSON DEFAULT '[]',
    
    -- Status tracking (UPDATED)
    views_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00, -- Added for frontend
    total_reviews INT DEFAULT 0, -- Added for frontend
    
    -- Financial details
    tax_amount DECIMAL(10,2),
    hoa_fees DECIMAL(10,2),
    insurance_amount DECIMAL(10,2),
    est_payment DECIMAL(15,2), -- Added for frontend
    
    -- Historical data
    price_history JSON DEFAULT '[]',
tax_history JSON DEFAULT '[]',
nearby_schools JSON DEFAULT '[]',
floor_plans JSON DEFAULT '[]',

-- Social metrics (for frontend compatibility)
average_rating DECIMAL(3,2) DEFAULT 0.00,
total_reviews INT DEFAULT 0,
    
    -- Timestamps with audit trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    last_modified_by_user_id INT NULL,
    
    -- Foreign keys
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (last_modified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_property_uuid (property_uuid),
    INDEX idx_property_type (property_type),
    INDEX idx_property_status (property_status),
    INDEX idx_listing_type (listing_type),
    INDEX idx_city_state (city, state),
    INDEX idx_price (price),
    INDEX idx_owner_user (owner_user_id),
    INDEX idx_assigned_broker (assigned_broker_id),
    INDEX idx_created_at (created_at),
    INDEX idx_lat_lng (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property images table
CREATE TABLE IF NOT EXISTS property_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    
    -- Image information
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    image_order INT DEFAULT 0,
    caption VARCHAR(255),
    alt_text VARCHAR(255),
    
    -- Image metadata
    file_size INT,
    mime_type VARCHAR(100),
    width INT,
    height INT,
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Upload information
    uploaded_by_user_id INT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_property_id (property_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_image_order (image_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property documents table
CREATE TABLE IF NOT EXISTS property_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    
    -- Document information
    document_type ENUM('deed', 'survey', 'inspection', 'floor_plan', 'certificate', 'permit', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    
    -- Document metadata
    is_public BOOLEAN DEFAULT FALSE,
    expiration_date DATE,
    
    -- Upload information
    uploaded_by_user_id INT NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_property_id (property_id),
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property viewing schedule
CREATE TABLE IF NOT EXISTS property_viewings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    
    -- Viewing information
    viewing_type ENUM('in_person', 'virtual', 'open_house') NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Location details (if different from property)
    viewing_address TEXT,
    virtual_tour_url VARCHAR(500),
    
    -- Organizer information
    organized_by_user_id INT NOT NULL, -- Broker or agent
    max_attendees INT DEFAULT 1,
    
    -- Status
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (organized_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_property_id (property_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_organized_by (organized_by_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property viewing attendees
CREATE TABLE IF NOT EXISTS property_viewing_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    viewing_id INT NOT NULL,
    user_id INT NOT NULL, -- Buyer/Renter
    
    -- Attendee status
    attendee_status ENUM('invited', 'confirmed', 'attended', 'cancelled', 'no_show') DEFAULT 'invited',
    
    -- Additional information
    additional_guests INT DEFAULT 0,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (viewing_id) REFERENCES property_viewings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_viewing_attendee (viewing_id, user_id),
    
    -- Indexes
    INDEX idx_viewing_id (viewing_id),
    INDEX idx_user_id (user_id),
    INDEX idx_attendee_status (attendee_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TRANSACTION SERVICE TABLES
-- =============================================

-- Main transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Transaction identification
    transaction_type ENUM('sale', 'rental', 'lease') NOT NULL,
    transaction_status ENUM('draft', 'offer_pending', 'offer_accepted', 'offer_rejected', 
                           'under_contract', 'pending_approval', 'approved', 'closed', 
                           'cancelled', 'expired') DEFAULT 'draft',
    
    -- Property information
    property_id INT NOT NULL,
    
    -- Parties involved
    buyer_user_id INT, -- For sales/rentals
    seller_user_id INT NOT NULL, -- Property owner
    broker_id INT, -- Assigned broker
    
    -- Financial details
    offer_price DECIMAL(15,2),
    final_price DECIMAL(15,2),
    deposit_amount DECIMAL(15,2),
    commission_amount DECIMAL(15,2),
    commission_rate DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    fees_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'ETB',
    
    -- Dates
    offer_date DATE,
    acceptance_date DATE,
    closing_date DATE,
    occupancy_date DATE,
    lease_start_date DATE,
    lease_end_date DATE,
    
    -- Terms and conditions
    terms JSON,
    special_conditions TEXT,
    
    -- Audit trail
    created_by_user_id INT NOT NULL,
    last_modified_by_user_id INT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    status_changed_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_modified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_transaction_uuid (transaction_uuid),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_status (transaction_status),
    INDEX idx_property_id (property_id),
    INDEX idx_buyer_user (buyer_user_id),
    INDEX idx_seller_user (seller_user_id),
    INDEX idx_broker_id (broker_id),
    INDEX idx_closing_date (closing_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- BROKER_REVIEWS TABLE
-- =============================================

-- Broker reviews and ratings table
CREATE TABLE IF NOT EXISTS broker_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relationship mapping
    broker_id INT NOT NULL,
    client_id INT NOT NULL,
    property_id INT NULL, -- Optional link to specific property
    transaction_id INT NULL, -- Link to specific transaction
    
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
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_broker_rating (broker_id, overall_rating),
    INDEX idx_created_at (created_at),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- CONTINUE WITH OTHER TRANSACTION-RELATED TABLES
-- =============================================

-- Offers table (for both purchase and rental)
CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Offer identification
    offer_type ENUM('purchase', 'rental') NOT NULL,
    offer_status ENUM('pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired') DEFAULT 'pending',
    
    -- Property and transaction context
    property_id INT NOT NULL,
    transaction_id INT NULL,
    
    -- Offer details
    offered_price DECIMAL(15,2) NOT NULL,
    offered_deposit DECIMAL(15,2),
    offer_terms TEXT,
    expiration_date DATE,
    
    -- Parties involved
    offered_by_user_id INT NOT NULL, -- Buyer/Renter
    owner_user_id INT NOT NULL, -- Seller/Landlord
    
    -- Response information
    response_notes TEXT,
    counter_offer_id INT NULL, -- Link to counter offer
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (offered_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (counter_offer_id) REFERENCES offers(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_offer_type (offer_type),
    INDEX idx_offer_status (offer_status),
    INDEX idx_property_id (property_id),
    INDEX idx_offered_by (offered_by_user_id),
    INDEX idx_owner_user (owner_user_id),
    INDEX idx_expiration_date (expiration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_uuid VARCHAR(36) NOT NULL UNIQUE,
    transaction_id INT NOT NULL,
    
    -- Contract details
    contract_type ENUM('purchase', 'lease', 'rental', 'brokerage') NOT NULL,
    contract_status ENUM('draft', 'sent', 'signed', 'expired', 'cancelled') DEFAULT 'draft',
    
    -- Document information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contract_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    
    -- Signature tracking
    signatory_data JSON, -- Array of signatories with their status
    fully_signed_at TIMESTAMP NULL,
    
    -- Terms
    effective_date DATE,
    expiration_date DATE,
    terms_and_conditions TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Created by
    created_by_user_id INT NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_contract_uuid (contract_uuid),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_contract_type (contract_type),
    INDEX idx_contract_status (contract_status),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments/Showings table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Appointment details
    appointment_type ENUM('property_showing', 'consultation', 'signing', 'inspection', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scheduling
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSON,
    
    -- Location
    location_type ENUM('property', 'office', 'virtual', 'other') DEFAULT 'property',
    location_address TEXT,
    virtual_meeting_url VARCHAR(500),
    
    -- Related entities
    property_id INT NULL,
    transaction_id INT NULL,
    
    -- Organizer and attendees
    organizer_user_id INT NOT NULL, -- Usually broker/agent
    broker_id INT NULL,
    
    -- Status
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Created by
    created_by_user_id INT NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_appointment_uuid (appointment_uuid),
    INDEX idx_appointment_type (appointment_type),
    INDEX idx_start_time (start_time),
    INDEX idx_organizer_user (organizer_user_id),
    INDEX idx_broker_id (broker_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment attendees
CREATE TABLE IF NOT EXISTS appointment_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Attendee information
    attendee_role ENUM('client', 'broker', 'agent', 'other') DEFAULT 'client',
    attendee_status ENUM('invited', 'accepted', 'declined', 'tentative', 'attended', 'no_show') DEFAULT 'invited',
    
    -- Notification preferences
    send_reminder BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint
    UNIQUE KEY unique_appointment_attendee (appointment_id, user_id),
    
    -- Indexes
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_attendee_status (attendee_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PAYMENT SERVICE TABLES
-- =============================================

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_uuid VARCHAR(36) NOT NULL UNIQUE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Invoice details
    invoice_type ENUM('rent', 'sale', 'commission', 'service_fee', 'subscription', 'other') NOT NULL,
    invoice_status ENUM('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    
    -- Parties involved
    from_user_id INT NOT NULL, -- Payer
    to_user_id INT NOT NULL, -- Payee
    
    -- Related entities
    property_id INT NULL,
    transaction_id INT NULL,
    
    -- Financial details
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    balance_due DECIMAL(15,2) NOT NULL,
    
    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    
    -- Payment details
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    
    -- Line items
    line_items JSON NOT NULL,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Created by
    created_by_user_id INT NOT NULL,
    
    -- Foreign keys
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_invoice_uuid (invoice_uuid),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_invoice_type (invoice_type),
    INDEX idx_invoice_status (invoice_status),
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Payment details
    payment_type ENUM('rent', 'deposit', 'commission', 'fee', 'subscription', 'refund', 'other') NOT NULL,
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    
    -- Related invoice
    invoice_id INT NULL,
    
    -- Financial details
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    processing_fee DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2) NOT NULL,
    
    -- Payment method
    payment_method ENUM('bank_transfer', 'credit_card', 'mobile_money', 'cash', 'check', 'other') NOT NULL,
    payment_method_details JSON,
    
    -- Parties involved
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    
    -- Transaction details
    transaction_id VARCHAR(255), -- External payment processor ID
    receipt_url VARCHAR(500),
    
    -- Dates
    payment_date DATE NOT NULL,
    processed_at TIMESTAMP NULL,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_payment_uuid (payment_uuid),
    INDEX idx_payment_type (payment_type),
    INDEX idx_payment_status (payment_status),
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TODO SERVICE TABLES
-- =============================================

-- Enhanced todos table with comprehensive task management
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Task ownership
    user_id INT NOT NULL, -- Owner/creator
    
    -- Task details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Task categorization
    todo_type ENUM('general', 'property', 'transaction', 'client', 'marketing', 'admin', 'maintenance') DEFAULT 'general',
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
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'deferred') DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    
    -- Time tracking
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    
    -- Tags
    tags JSON DEFAULT '[]',
    
    -- Task organization
    order_index INT DEFAULT 0,
    parent_todo_id INT NULL, -- For sub-tasks hierarchy
    
    -- Related entities
    related_property_id INT NULL,
    related_transaction_id INT NULL,
    related_user_id INT NULL,
    
    -- Assignment and creation tracking
    assigned_to INT NULL, -- Assigned user
    assigned_by INT NULL, -- Who assigned it
    assigned_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    
    -- Department/Team assignment
    department ENUM('administration', 'support', 'brokerage', 'technical', 'financial', 'sales', 'marketing') DEFAULT 'administration',
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (related_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_todo_uuid (todo_uuid),
    INDEX idx_user_status (user_id, status),
    INDEX idx_due_date (due_date),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_department (department),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_related_property (related_property_id),
    INDEX idx_related_transaction (related_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo comments table for collaboration
CREATE TABLE IF NOT EXISTS todo_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- Comment details
    comment_text TEXT NOT NULL,
    comment_type ENUM('comment', 'update', 'note', 'reminder') DEFAULT 'comment',
    
    -- Comment metadata
    is_internal_note BOOLEAN DEFAULT FALSE, -- Private team notes
    mentions JSON DEFAULT '[]', -- User IDs mentioned
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys and indexes
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_todo_created (todo_id, created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo attachments table for supporting documents
CREATE TABLE IF NOT EXISTS todo_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
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
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys and indexes
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_todo_id (todo_id),
    INDEX idx_file_category (file_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Todo history table for audit trail
CREATE TABLE IF NOT EXISTS todo_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_id INT NOT NULL,
    user_id INT NOT NULL,
    
    -- History details
    action_type ENUM('created', 'updated', 'status_changed', 'assigned', 'commented', 'attachment_added', 'due_date_changed', 'priority_changed') NOT NULL,
    field_changed VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    change_description TEXT,
    
    -- Security metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_todo_action (todo_id, action_type),
    INDEX idx_created_at (created_at),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- COMMUNICATION SERVICE TABLES
-- =============================================

-- Enhanced notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Recipient information
    user_id INT NOT NULL,
    
    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('info', 'success', 'warning', 'error', 'system', 'transaction', 'property', 'message', 'appointment', 'reminder') DEFAULT 'info',
    
    -- Notification metadata
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    icon VARCHAR(100),
    
    -- Related entities
    related_entity_type ENUM('user', 'property', 'transaction', 'appointment', 'offer', 'contract', 'invoice', 'payment', 'ticket', 'todo') DEFAULT NULL,
    related_entity_id INT,
    
    -- Priority
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Notification lifecycle
    expires_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    
    -- Delivery methods
    delivery_methods JSON DEFAULT '["in_app"]', -- in_app, email, sms, push
    
    -- Foreign key and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_uuid (notification_uuid),
    INDEX idx_user_read (user_id, is_read, is_archived),
    INDEX idx_created_at (created_at),
    INDEX idx_notification_type (notification_type),
    INDEX idx_priority (priority),
    INDEX idx_related_entity (related_entity_type, related_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing chat_conversations table remains
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Conversation identification
    conversation_uuid VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255),
    
    -- Conversation type classification
    conversation_type ENUM('direct', 'group', 'support') DEFAULT 'direct',
    
    -- Creator information
    created_by INT NOT NULL,
    
    -- Related entities
    related_property_id INT NULL,
    related_transaction_id INT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL,
    
    -- Foreign key and indexes
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_conversation_uuid (conversation_uuid),
    INDEX idx_last_message_at (last_message_at),
    INDEX idx_related_property (related_property_id),
    INDEX idx_related_transaction (related_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Existing conversation_participants table remains
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
    
    -- Notification preferences
    mute_notifications BOOLEAN DEFAULT FALSE,
    
    -- Foreign keys and constraints
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id),
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_uuid VARCHAR(36) NOT NULL UNIQUE,
    
    -- Message context
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    
    -- Message type and content
    message_type ENUM('text', 'image', 'file', 'system', 'notification', 'offer', 'appointment', 'property') DEFAULT 'text',
    text TEXT,
    image_url VARCHAR(500),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(100),
    
    -- Message status tracking
    status ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    read_by JSON DEFAULT '[]', -- JSON array of user IDs
    
    -- Reply functionality
    reply_to_message_id INT NULL,
    
    -- Related entities
    related_property_id INT NULL,
    related_offer_id INT NULL,
    related_appointment_id INT NULL,
    
    -- Message metadata
    metadata JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign keys and indexes
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages(id) ON DELETE SET NULL,
    FOREIGN KEY (related_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (related_offer_id) REFERENCES offers(id) ON DELETE SET NULL,
    FOREIGN KEY (related_appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX idx_message_uuid (message_uuid),
    INDEX idx_conversation_created (conversation_id, created_at),
    INDEX idx_sender_created (sender_id, created_at),
    INDEX idx_message_type (message_type)
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
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys and indexes
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_privilege (user_id, privilege_key),
    INDEX idx_expires_at (expires_at)
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
    deleted_at TIMESTAMP NULL,
    
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
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
    deleted_at TIMESTAMP NULL,
    
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
    deleted_at TIMESTAMP NULL,
    
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
    target_type ENUM('user', 'ticket', 'article', 'flag', 'system', 'property', 'transaction', 'payment', 'invoice', 'offer') NOT NULL,
    target_id INT,
    target_name VARCHAR(255),
    
    -- Activity details
    description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
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

-- Existing message_deletions table
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

-- Existing user_message_limits table
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

-- Existing todo_templates table remains
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