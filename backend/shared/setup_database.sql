-- =============================================
-- DATABASE INITIALIZATION - WUBLAND PORTFOLIO
-- =============================================

-- Drop existing database if exists
DROP DATABASE IF EXISTS wubland_portfolio_db;

-- Create fresh database
CREATE DATABASE wubland_portfolio_db;
USE wubland_portfolio_db;

-- =============================================
-- CORE USER & AUTHENTICATION TABLES
-- =============================================

-- Enhanced users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role ENUM(
        'super_admin', 'admin', 'support_admin', 'support_lead', 
        'support_agent', 'internal_broker', 'external_broker', 
        'buyer', 'seller', 'landlord', 'renter', 'user'
    ) NOT NULL DEFAULT 'user',
    privilege_tier ENUM('basic', 'standard', 'premium', 'enterprise') DEFAULT 'basic',
    feature_flags JSON,
    profile_picture VARCHAR(255),
    bio TEXT,
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ethiopia',
    zip_code VARCHAR(20),
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires DATETIME,
    password_change_required BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login_attempts INT DEFAULT 0,
    lock_until DATETIME,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    last_login TIMESTAMP NULL,
    last_activity TIMESTAMP NULL,
    subscription_ends_at TIMESTAMP NULL,
    stripe_customer_id VARCHAR(255),
    message_count INT DEFAULT 0,
    last_message_time TIMESTAMP NULL,
    analytics_metadata JSON DEFAULT '{}',
    activity_score DECIMAL(3,2) DEFAULT 0.00,
    engagement_level ENUM('low', 'medium', 'high', 'very_high') DEFAULT 'low',
    last_analysis_update TIMESTAMP NULL,
    kebele_id_document VARCHAR(255) DEFAULT NULL,
    proof_of_income_document VARCHAR(255) DEFAULT NULL,
    other_documents JSON DEFAULT NULL,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verification_reason TEXT DEFAULT NULL,
    verified_at TIMESTAMP NULL DEFAULT NULL,
    broker_license_number VARCHAR(100),
    broker_license_expiry DATE,
    tin_number VARCHAR(100),
    brokerage_firm VARCHAR(255),
    experience_years INT,
    commission_rate VARCHAR(20),
    property_type_owned VARCHAR(50),
    property_location TEXT,
    property_value_estimate DECIMAL(15,2),
    ownership_duration INT,
    property_ownership_proof VARCHAR(255),
    investment_purpose VARCHAR(100),
    timeline VARCHAR(100),
    financing_method VARCHAR(100),
    rental_duration VARCHAR(100),
    family_size INT,
    pet_friendly BOOLEAN DEFAULT FALSE,
    furnished BOOLEAN DEFAULT FALSE,
    employment_status VARCHAR(50),
    monthly_income DECIMAL(15,2),
    profile_complete BOOLEAN DEFAULT FALSE,
    profile_completion_percentage INT DEFAULT 0,
    setup_completed_at TIMESTAMP NULL,
    verification_feedback TEXT DEFAULT NULL,
    verification_notes TEXT DEFAULT NULL,
    last_verification_review_by INT DEFAULT NULL,
    last_verification_review_at TIMESTAMP NULL,
    document_rejection_reason TEXT DEFAULT NULL,
    documents_need_resubmission BOOLEAN DEFAULT FALSE,
    resubmission_requested_at TIMESTAMP NULL,
    verification_step_status ENUM('pending', 'submitted', 'reviewing', 'needs_resubmission', 'verified', 'rejected') DEFAULT 'pending',
    verification_history JSON DEFAULT '[]',
    has_submitted_documents BOOLEAN DEFAULT FALSE,
    documents_submitted_at TIMESTAMP NULL DEFAULT NULL,
    current_verification_step INT DEFAULT 1,
    verification_started_at DATETIME,
    verification_completed_at DATETIME,
    step1_status ENUM('not_started', 'uploaded', 'approved', 'rejected') DEFAULT 'not_started',
    step2_status ENUM('not_started', 'uploaded', 'approved', 'rejected') DEFAULT 'not_started',
    step3_status ENUM('not_started', 'uploaded', 'approved', 'rejected') DEFAULT 'not_started',
    step1_uploaded_at DATETIME,
    step2_uploaded_at DATETIME,
    step3_uploaded_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by_user_id INT NULL,
    last_modified_by_user_id INT NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_privilege_tier (privilege_tier),
    INDEX idx_created_at (created_at),
    INDEX idx_deleted_at (deleted_at),
    FOREIGN KEY (last_verification_review_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- First, let's modify the verification_status to allow NULL
ALTER TABLE users 
MODIFY COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL;

-- Change verification_step_status to allow NULL
ALTER TABLE users 
MODIFY COLUMN verification_step_status ENUM('pending', 'submitted', 'reviewing', 'needs_resubmission', 'verified', 'rejected') DEFAULT NULL;

-- Change the step statuses to allow NULL
ALTER TABLE users 
MODIFY COLUMN step1_status ENUM('not_started', 'uploaded', 'approved', 'rejected') DEFAULT NULL,
MODIFY COLUMN step2_status ENUM('not_started', 'uploaded', 'approved', 'rejected') DEFAULT NULL,
MODIFY COLUMN step3_status ENUM('not_started', 'uploaded', 'approved', 'rejected') DEFAULT NULL;

-- Also make has_submitted_documents default to NULL
ALTER TABLE users 
MODIFY COLUMN has_submitted_documents BOOLEAN DEFAULT NULL;


-- Allow verification_status to be NULL for new users
ALTER TABLE users 
MODIFY COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL;

-- Allow verification_step_status to be NULL
ALTER TABLE users 
MODIFY COLUMN verification_step_status ENUM('pending', 'submitted', 'reviewing', 'needs_resubmission', 'verified', 'rejected') DEFAULT NULL;

-- Allow has_submitted_documents to be NULL (not false)
ALTER TABLE users 
MODIFY COLUMN has_submitted_documents BOOLEAN DEFAULT NULL;

UPDATE users 
SET verification_status = NULL, 
    verification_step_status = NULL,
    has_submitted_documents = NULL
WHERE role IN ('buyer', 'renter') 
  AND verification_status = 'pending' 
  AND has_submitted_documents = 0;

  
-- Document verification records
CREATE TABLE document_verification_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    document_filename VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected', 'needs_resubmission') DEFAULT 'pending',
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    rejection_reason TEXT,
    admin_comments TEXT,
    resubmission_requested BOOLEAN DEFAULT FALSE,
    resubmission_deadline DATE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resubmitted_at TIMESTAMP NULL,
    version INT DEFAULT 1,
    previous_version_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (previous_version_id) REFERENCES document_verification_records(id) ON DELETE SET NULL,
    INDEX idx_user_status (user_id, status),
    INDEX idx_document_type (document_type),
    INDEX idx_reviewed_by (reviewed_by),
    INDEX idx_resubmission (resubmission_requested, resubmission_deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User preferences table
CREATE TABLE user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_sms BOOLEAN DEFAULT FALSE,
    notification_push BOOLEAN DEFAULT TRUE,
    appointment_notifications BOOLEAN DEFAULT TRUE,
    appointment_reminders BOOLEAN DEFAULT TRUE,
    appointment_reminder_hours INT DEFAULT 24,
    booking_confirmation_email BOOLEAN DEFAULT TRUE,
    booking_cancellation_email BOOLEAN DEFAULT TRUE,
    appointment_email BOOLEAN DEFAULT TRUE,
    appointment_sms BOOLEAN DEFAULT FALSE,
    appointment_push BOOLEAN DEFAULT TRUE,
    transaction_email BOOLEAN DEFAULT TRUE,
    transaction_sms BOOLEAN DEFAULT FALSE,
    transaction_push BOOLEAN DEFAULT TRUE,
    property_email BOOLEAN DEFAULT TRUE,
    property_sms BOOLEAN DEFAULT FALSE,
    property_push BOOLEAN DEFAULT TRUE,
    message_email BOOLEAN DEFAULT TRUE,
    message_sms BOOLEAN DEFAULT FALSE,
    message_push BOOLEAN DEFAULT TRUE,
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    theme ENUM('light', 'dark', 'auto') DEFAULT 'light',
    email_frequency ENUM('immediate', 'daily', 'weekly') DEFAULT 'immediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preferences (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions table
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_info JSON,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- BROKER MANAGEMENT TABLES
-- =============================================

-- Broker profiles table
CREATE TABLE broker_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    broker_type ENUM('internal', 'external') NOT NULL,
    license_number VARCHAR(100),
    license_expiry DATE,
    years_experience INT DEFAULT 0,
    specialization JSON DEFAULT '[]',
    total_completed_deals INT DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0.00,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    analytics_metadata JSON DEFAULT '{}',
    monthly_performance JSON DEFAULT '{"transactions": 0, "revenue": 0.00, "client_satisfaction": 0.00}',
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_deal_size DECIMAL(15,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) DEFAULT 2.5,
    service_fee DECIMAL(5,2) DEFAULT 0.00,
    is_available BOOLEAN DEFAULT TRUE,
    max_clients INT DEFAULT 10,
    current_active_clients INT DEFAULT 0,
    languages JSON DEFAULT '["amharic", "english"]',
    service_areas JSON DEFAULT '[]',
    brokerage_firm VARCHAR(255) DEFAULT 'Independent Broker',
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    bio_amharic TEXT,
    bio_english TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_broker_user (user_id),
    INDEX idx_broker_type (broker_type),
    INDEX idx_is_available (is_available),
    INDEX idx_average_rating (average_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broker availability schedule table
CREATE TABLE broker_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_broker_schedule (broker_id, day_of_week),
    INDEX idx_broker_availability (broker_id, is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PROPERTY SERVICE TABLES
-- =============================================

-- Main properties table
CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_uuid VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    property_type ENUM('residential', 'commercial', 'industrial', 'land', 'apartment', 'house', 'condo', 'townhouse', 'villa', 'penthouse', 'cottage', 'loft') NOT NULL,
    property_status ENUM('active', 'pending', 'sold', 'rented', 'inactive', 'draft') DEFAULT 'draft',
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ethiopia',
    zip_code VARCHAR(20),
    neighborhood VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_place_id VARCHAR(255),
    region VARCHAR(100),
    beds INT,
    baths INT,
    sqft DECIMAL(10,2),
    lot_size DECIMAL(10,2),
    year_built INT,
    garage_spaces INT DEFAULT 0,
    parking_spaces INT DEFAULT 0,
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    price_per_sqft DECIMAL(10,2),
    is_negotiable BOOLEAN DEFAULT TRUE,
    deposit_amount DECIMAL(15,2),
    monthly_rent DECIMAL(15,2),
    listing_type ENUM('sale', 'rent', 'lease') NOT NULL,
    mls_number VARCHAR(100),
    mls_source VARCHAR(100),
    listing_date DATE,
    expiration_date DATE,
    owner_user_id INT NOT NULL,
    created_by_user_id INT NOT NULL,
    assigned_broker_id INT NULL,
    is_exclusive BOOLEAN DEFAULT FALSE,
    features JSON DEFAULT '[]',
    amenities JSON DEFAULT '[]',
    property_tags JSON DEFAULT '[]',
    analytics_metadata JSON DEFAULT '{}',
    time_on_market_days INT NULL,
    price_reduction_count INT DEFAULT 0,
    engagement_score DECIMAL(3,2) DEFAULT 0.00,
    views_count INT DEFAULT 0,
    saves_count INT DEFAULT 0,
    inquiries_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    saved_by_users JSON DEFAULT '[]',
    viewed_by_users JSON DEFAULT '[]',
    recent_applications JSON DEFAULT '[]',
    application_stats JSON DEFAULT '{"total": 0, "pending": 0, "approved": 0, "rejected": 0}',
    property_source ENUM('company_owned', 'client_listed', 'joint_venture') DEFAULT 'client_listed',
    company_project_name VARCHAR(255) NULL,
    development_stage ENUM('planning', 'construction', 'completed', 'launched') NULL,
    company_ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
    tax_amount DECIMAL(10,2),
    hoa_fees DECIMAL(10,2),
    insurance_amount DECIMAL(10,2),
    est_payment DECIMAL(15,2),
    price_history JSON DEFAULT '[]',
    tax_history JSON DEFAULT '[]',
    nearby_schools JSON DEFAULT '[]',
    floor_plans JSON DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    published_at TIMESTAMP NULL,
    last_modified_by_user_id INT NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (last_modified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_property_uuid (property_uuid),
    INDEX idx_property_type (property_type),
    INDEX idx_property_status (property_status),
    INDEX idx_listing_type (listing_type),
    INDEX idx_city_state (city, state),
    INDEX idx_price (price),
    INDEX idx_owner_user (owner_user_id),
    INDEX idx_assigned_broker (assigned_broker_id),
    INDEX idx_created_at (created_at),
    INDEX idx_lat_lng (latitude, longitude),
    INDEX idx_property_source (property_source),
    INDEX idx_development_stage (development_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE properties 
MODIFY COLUMN property_status 
ENUM('active', 'pending', 'sold', 'rented', 'inactive', 'draft', 'rejected') 
DEFAULT 'draft';

-- Property images table
CREATE TABLE property_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    image_order INT DEFAULT 0,
    caption VARCHAR(255),
    alt_text VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    width INT,
    height INT,
    is_primary BOOLEAN DEFAULT FALSE,
    uploaded_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_property_id (property_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_image_order (image_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property documents table
CREATE TABLE property_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    document_type ENUM('deed', 'survey', 'inspection', 'floor_plan', 'certificate', 'permit', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INT,
    mime_type VARCHAR(100),
    is_public BOOLEAN DEFAULT FALSE,
    expiration_date DATE,
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verification_feedback TEXT,
    verified_by_user_id INT,
    verified_at TIMESTAMP NULL,
    uploaded_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_property_id (property_id),
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property applications table
CREATE TABLE property_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_uuid VARCHAR(36) NOT NULL UNIQUE,
    property_id INT NOT NULL,
    user_id INT NOT NULL,
    application_type ENUM('sale', 'rent', 'lease') NOT NULL DEFAULT 'rent',
    status ENUM('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'withdrawn') DEFAULT 'submitted',
    message TEXT,
    offered_amount DECIMAL(15,2),
    cover_letter TEXT,
    submitted_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    decision_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_application_uuid (application_uuid),
    INDEX idx_user_property (user_id, property_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property requests table
CREATE TABLE property_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('seller', 'leaser') NOT NULL DEFAULT 'seller',
    property_type ENUM('house', 'apartment', 'villa', 'condo', 'commercial', 'land', 'other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    price DECIMAL(15,2),
    price_currency VARCHAR(3) DEFAULT 'ETB',
    verification_method ENUM('physical', 'video', 'documents', 'mixed') DEFAULT 'physical',
    description TEXT,
    property_image_url VARCHAR(500),
    property_images JSON DEFAULT '[]',
    current_step INT DEFAULT 1,
    step_status JSON DEFAULT '[]',
    selected_broker_id INT NULL,
    broker_selected_at TIMESTAMP NULL,
    status ENUM('draft', 'pending', 'assigned', 'in_progress', 'verification', 'listing', 'marketing', 'completed', 'rejected', 'cancelled') DEFAULT 'draft',
    assigned_broker_id INT NULL,
    assigned_at TIMESTAMP NULL,
    property_data JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (selected_broker_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_user_type (user_type),
    INDEX idx_assigned_broker (assigned_broker_id),
    INDEX idx_selected_broker (selected_broker_id),
    INDEX idx_created_at (created_at),
    INDEX idx_current_step (current_step)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property viewing schedule
CREATE TABLE property_viewings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    viewing_type ENUM('in_person', 'virtual', 'open_house') NOT NULL,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    viewing_address TEXT,
    virtual_tour_url VARCHAR(500),
    organized_by_user_id INT NOT NULL,
    max_attendees INT DEFAULT 1,
    status ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (organized_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_property_id (property_id),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_organized_by (organized_by_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Property viewing attendees
CREATE TABLE property_viewing_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    viewing_id INT NOT NULL,
    user_id INT NOT NULL,
    broker_id INT NULL,
    attendee_status ENUM('invited', 'confirmed', 'attended', 'cancelled', 'no_show') DEFAULT 'invited',
    is_broker BOOLEAN DEFAULT FALSE,
    additional_guests INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    FOREIGN KEY (viewing_id) REFERENCES property_viewings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_viewing_attendee (viewing_id, user_id),
    INDEX idx_viewing_id (viewing_id),
    INDEX idx_user_id (user_id),
    INDEX idx_attendee_status (attendee_status),
    INDEX idx_viewing_broker (viewing_id, broker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- =============================================
-- TRANSACTION SERVICE TABLES
-- =============================================

-- Main transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_uuid VARCHAR(36) NOT NULL UNIQUE,
    transaction_type ENUM('sale', 'rental', 'lease') NOT NULL,
    transaction_status ENUM('draft', 'offer_pending', 'offer_accepted', 'offer_rejected', 
                           'under_contract', 'pending_approval', 'approved', 'closed', 
                           'cancelled', 'expired') DEFAULT 'draft',
    analytics_metadata JSON DEFAULT '{}',
    processing_duration_days INT NULL,
    client_retention_score DECIMAL(3,2) DEFAULT 0.00,
    revenue_contribution DECIMAL(15,2) DEFAULT 0.00,
    property_id INT NOT NULL,
    buyer_user_id INT,
    seller_user_id INT NOT NULL,
    broker_id INT,
    offer_price DECIMAL(15,2),
    final_price DECIMAL(15,2),
    deposit_amount DECIMAL(15,2),
    commission_amount DECIMAL(15,2),
    commission_rate DECIMAL(5,2),
    tax_amount DECIMAL(15,2),
    fees_amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'ETB',
    offer_date DATE,
    acceptance_date DATE,
    closing_date DATE,
    occupancy_date DATE,
    lease_start_date DATE,
    lease_end_date DATE,
    terms JSON,
    special_conditions TEXT,
    created_by_user_id INT NOT NULL,
    last_modified_by_user_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    status_changed_at TIMESTAMP NULL,
    last_rent_reminder_sent TIMESTAMP NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (seller_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_modified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_transaction_uuid (transaction_uuid),
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_status (transaction_status),
    INDEX idx_property_id (property_id),
    INDEX idx_buyer_user (buyer_user_id),
    INDEX idx_seller_user (seller_user_id),
    INDEX idx_broker_id (broker_id),
    INDEX idx_closing_date (closing_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Broker reviews and ratings table
CREATE TABLE broker_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    client_id INT NOT NULL,
    property_id INT NULL,
    transaction_id INT NULL,
    overall_rating INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    communication_rating INT CHECK (communication_rating BETWEEN 1 AND 5),
    professionalism_rating INT CHECK (professionalism_rating BETWEEN 1 AND 5),
    knowledge_rating INT CHECK (knowledge_rating BETWEEN 1 AND 5),
    title_amharic VARCHAR(255),
    title_english VARCHAR(255),
    comment_amharic TEXT,
    comment_english TEXT,
    transaction_type ENUM('sale', 'rental') NOT NULL,
    transaction_date DATE,
    transaction_amount DECIMAL(15,2),
    is_approved BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_broker_rating (broker_id, overall_rating),
    INDEX idx_created_at (created_at),
    INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Offers table
CREATE TABLE offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    offer_type ENUM('purchase', 'rental') NOT NULL,
    offer_status ENUM('pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired') DEFAULT 'pending',
    property_id INT NOT NULL,
    transaction_id INT NULL,
    offered_price DECIMAL(15,2) NOT NULL,
    offered_deposit DECIMAL(15,2),
    offer_terms TEXT,
    expiration_date DATE,
    offered_by_user_id INT NOT NULL,
    owner_user_id INT NOT NULL,
    response_notes TEXT,
    counter_offer_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (offered_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (counter_offer_id) REFERENCES offers(id) ON DELETE SET NULL,
    INDEX idx_offer_type (offer_type),
    INDEX idx_offer_status (offer_status),
    INDEX idx_property_id (property_id),
    INDEX idx_offered_by (offered_by_user_id),
    INDEX idx_owner_user (owner_user_id),
    INDEX idx_expiration_date (expiration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contracts table
CREATE TABLE contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contract_uuid VARCHAR(36) NOT NULL UNIQUE,
    transaction_id INT NOT NULL,
    contract_type ENUM('purchase', 'lease', 'rental', 'brokerage') NOT NULL,
    contract_status ENUM('draft', 'sent', 'signed', 'expired', 'cancelled') DEFAULT 'draft',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    contract_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    signatory_data JSON,
    fully_signed_at TIMESTAMP NULL,
    effective_date DATE,
    expiration_date DATE,
    terms_and_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by_user_id INT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_contract_uuid (contract_uuid),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_contract_type (contract_type),
    INDEX idx_contract_status (contract_status),
    INDEX idx_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- APPOINTMENT & BOOKING TABLES
-- =============================================

-- Appointments/Showings table (FIXED VERSION)
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_uuid VARCHAR(36) NOT NULL UNIQUE,
    appointment_type ENUM('property_showing', 'consultation', 'signing', 'inspection', 'property_viewing', 'other') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    analytics_metadata JSON DEFAULT '{}',
    completion_duration_minutes INT NULL,
    client_satisfaction_rating INT CHECK (client_satisfaction_rating BETWEEN 1 AND 5),
    rescheduled_count INT DEFAULT 0,
    scheduled_date DATE NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSON,
    location_type ENUM('property', 'office', 'virtual', 'other') DEFAULT 'property',
    location_address TEXT,
    virtual_meeting_url VARCHAR(500),
    property_id INT NULL,
    transaction_id INT NULL,
    organizer_user_id INT NOT NULL,
    broker_id INT NULL,
    status ENUM('scheduled', 'confirmed', 'pending', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    cancellation_reason TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,
    overdue_reminder_sent BOOLEAN DEFAULT FALSE,
    internal_notes TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE NULL,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    max_attendees INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by_user_id INT NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (organizer_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_appointment_uuid (appointment_uuid),
    INDEX idx_appointment_type (appointment_type),
    INDEX idx_start_time (start_time),
    INDEX idx_organizer_user (organizer_user_id),
    INDEX idx_broker_id (broker_id),
    INDEX idx_status (status),
    INDEX idx_appointment_date_status (scheduled_date, status),
    INDEX idx_appointment_property (property_id, scheduled_date),
    INDEX idx_appointment_broker_date (broker_id, scheduled_date),
    INDEX idx_appointment_organizer (organizer_user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointment attendees
CREATE TABLE appointment_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    user_id INT NOT NULL,
    broker_id INT NULL,
    attendee_role ENUM('client', 'broker', 'agent', 'other') DEFAULT 'client',
    attendee_status ENUM('invited', 'accepted', 'declined', 'tentative', 'attended', 'no_show', 'confirmed', 'pending', 'cancelled') DEFAULT 'invited',
    is_broker BOOLEAN DEFAULT FALSE,
    send_reminder BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_appointment_attendee (appointment_id, user_id),
    INDEX idx_appointment_id (appointment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_attendee_status (attendee_status),
    INDEX idx_appointment_broker (appointment_id, broker_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PAYMENT SERVICE TABLES
-- =============================================

-- Invoices table
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_uuid VARCHAR(36) NOT NULL UNIQUE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type ENUM('rent', 'sale', 'commission', 'service_fee', 'subscription', 'other') NOT NULL,
    invoice_status ENUM('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    property_id INT NULL,
    transaction_id INT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    paid_amount DECIMAL(15,2) DEFAULT 0.00,
    balance_due DECIMAL(15,2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    line_items JSON NOT NULL,
    notes TEXT,
    overdue_reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    created_by_user_id INT NOT NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_invoice_uuid (invoice_uuid),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_invoice_type (invoice_type),
    INDEX idx_invoice_status (invoice_status),
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payment_uuid VARCHAR(36) NOT NULL UNIQUE,
    payment_type ENUM('rent', 'deposit', 'commission', 'fee', 'subscription', 'refund', 'other') NOT NULL,
    payment_status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    invoice_id INT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    processing_fee DECIMAL(15,2) DEFAULT 0.00,
    net_amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('bank_transfer', 'credit_card', 'mobile_money', 'cash', 'check', 'other') NOT NULL,
    payment_method_details JSON,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    transaction_id VARCHAR(255),
    receipt_url VARCHAR(500),
    payment_date DATE NOT NULL,
    processed_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_payment_uuid (payment_uuid),
    INDEX idx_payment_type (payment_type),
    INDEX idx_payment_status (payment_status),
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_from_user (from_user_id),
    INDEX idx_to_user (to_user_id),
    INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- TODOS TABLE
-- =============================================

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    todo_uuid VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
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
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'in_progress', 'completed', 'cancelled', 'deferred') DEFAULT 'pending',
    due_date DATE,
    completed_at TIMESTAMP NULL,
    estimated_hours DECIMAL(4,2),
    actual_hours DECIMAL(4,2),
    analytics_metadata JSON DEFAULT '{}',
    completion_duration_days INT DEFAULT 0,
    overdue_count INT DEFAULT 0,
    reassignment_count INT DEFAULT 0,
    priority_changes_count INT DEFAULT 0,
    efficiency_score DECIMAL(3,2) DEFAULT 0.00,
    tags JSON DEFAULT '[]',
    attachments JSON DEFAULT '[]',
    comments JSON DEFAULT '[]',
    metadata JSON DEFAULT '{}',
    order_index INT DEFAULT 0,
    parent_todo_id INT NULL,
    related_property_id INT NULL,
    related_transaction_id INT NULL,
    related_user_id INT NULL,
    related_chat_conversation_id INT NULL,  -- REMOVE THIS COLUMN OR COMMENT OUT THE FK
    assigned_to INT NULL,
    assigned_by INT NULL,
    assigned_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    department ENUM('administration', 'support', 'brokerage', 'technical', 'financial', 'sales', 'marketing') DEFAULT 'administration',
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_date DATE,
    reminder_sent_at TIMESTAMP NULL,
    last_comment_at TIMESTAMP NULL,
    comment_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_todo_id) REFERENCES todos(id) ON DELETE CASCADE,
    FOREIGN KEY (related_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    -- REMOVE OR COMMENT OUT THIS FOREIGN KEY:
    -- FOREIGN KEY (related_chat_conversation_id) REFERENCES chat_conversations(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_todo_uuid (todo_uuid),
    INDEX idx_user_status (user_id, status),
    INDEX idx_due_date (due_date),
    INDEX idx_category (category),
    INDEX idx_priority (priority),
    INDEX idx_department (department),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_related_property (related_property_id),
    INDEX idx_related_transaction (related_transaction_id),
    INDEX idx_created_at (created_at),
    INDEX idx_todo_type (todo_type),
    INDEX idx_parent_todo (parent_todo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- COMMUNICATION SERVICE TABLES (CORRECTED)
-- =============================================

-- Enhanced notifications table (keep this as is)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    notification_uuid VARCHAR(36) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('info', 'success', 'warning', 'error', 'system', 'transaction', 'property', 'message', 'appointment', 'reminder') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    icon VARCHAR(100),
    related_entity_type ENUM('user', 'property', 'transaction', 'appointment', 'offer', 'contract', 'invoice', 'payment', 'ticket', 'todo') DEFAULT NULL,
    related_entity_id INT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    delivery_methods JSON DEFAULT '["in_app"]',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_uuid (notification_uuid),
    INDEX idx_user_read (user_id, is_read, is_archived),
    INDEX idx_created_at (created_at),
    INDEX idx_notification_type (notification_type),
    INDEX idx_priority (priority),
    INDEX idx_related_entity (related_entity_type, related_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- chat_conversations table (FIXED - added missing column)
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_uuid VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255),
    conversation_type ENUM('direct', 'group', 'support') DEFAULT 'direct',
    created_by INT NOT NULL,
    related_property_id INT NULL,
    related_transaction_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_property_id) REFERENCES properties(id) ON DELETE SET NULL,
    FOREIGN KEY (related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    INDEX idx_conversation_uuid (conversation_uuid),
    INDEX idx_last_message_at (last_message_at),
    INDEX idx_related_property (related_property_id),
    INDEX idx_related_transaction (related_transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- conversation_participants table (CORRECTED VERSION)
CREATE TABLE IF NOT EXISTS conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('member', 'admin') DEFAULT 'member', -- FIXED: Changed from participant_role to role
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    mute_notifications BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (conversation_id, user_id),
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced chat_messages table (FIXED - added missing columns)
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_uuid VARCHAR(36) NOT NULL UNIQUE,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_type ENUM('text', 'image', 'file', 'system', 'notification', 'offer', 'appointment', 'property') DEFAULT 'text',
    text TEXT,
    image_url VARCHAR(500),
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INT,
    file_type VARCHAR(100),
    status ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
    read_by JSON DEFAULT '[]',
    reply_to_message_id INT NULL,
    related_property_id INT NULL,
    related_offer_id INT NULL,
    related_appointment_id INT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
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

-- DELETE EXISTING SUPPORT DATA AND START FRESH
-- This will clear all support-related data and reset auto-increment counters

-- 1. First, delete from child tables (due to foreign key constraints)
DELETE FROM ticket_responses;
DELETE FROM support_tickets;

-- 2. Reset auto-increment counters
ALTER TABLE support_tickets AUTO_INCREMENT = 1;
ALTER TABLE ticket_responses AUTO_INCREMENT = 1;

-- 3. Now insert fresh support tickets
INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status, created_at) VALUES
-- Users: 11(sindu_seller), 13(samuel_buyer), 14(mekdes_renter), 18(yohannes_buyer), 19(marta_renter), 15(kebede_landlord), 12(tigist_seller), 20(berhanu_seller)
('TICKET-101', 11, 'Document Verification Issue', 'Having trouble uploading my ID document for verification. File size seems to be too large.', 'account', 'medium', 'open', NOW() - INTERVAL 1 DAY),
('TICKET-102', 13, 'Property Information Request', 'Need more information about property amenities, utility costs, and maintenance fees', 'property', 'low', 'in_progress', NOW() - INTERVAL 12 HOUR),
('TICKET-103', 14, 'Payment Processing Issue', 'Rental deposit payment not processing successfully. Getting error message during transaction.', 'payment', 'high', 'open', NOW() - INTERVAL 6 HOUR),
('TICKET-104', 18, 'Broker Contact Request', 'Need to contact my assigned broker urgently about changing viewing time', 'general', 'medium', 'resolved', NOW() - INTERVAL 2 DAY),
('TICKET-105', 19, 'Account Access Problem', 'Cannot log into my account, password reset not working', 'account', 'urgent', 'open', NOW() - INTERVAL 3 HOUR),
('TICKET-106', 12, 'Property Listing Question', 'How to list my property for rent? Need guidance on process.', 'property', 'medium', 'in_progress', NOW() - INTERVAL 1 DAY),
('TICKET-107', 15, 'Invoice Dispute', 'Received incorrect invoice amount for rental property', 'payment', 'high', 'open', NOW() - INTERVAL 4 HOUR),
('TICKET-108', 20, 'Broker Service Complaint', 'Assigned broker not responding to messages for 3 days', 'general', 'medium', 'resolved', NOW() - INTERVAL 3 DAY);

-- 4. Insert ticket responses (now tickets have IDs 1-8 since we reset auto-increment)
INSERT INTO ticket_responses (ticket_id, responder_id, response_type, message, created_at) VALUES
(1, 4, 'public', 'Thank you for your inquiry. I have contacted the broker and they will reach out to you within 1 hour.', NOW() - INTERVAL 1 DAY),
(1, 4, 'internal_note', 'Broker alerted via WhatsApp. Follow up in 2 hours.', NOW() - INTERVAL 23 HOUR),
(2, 17, 'public', 'I can provide you with detailed information about the property amenities. The monthly maintenance fee is 1500 ETB and utilities average 2000 ETB per month.', NOW() - INTERVAL 10 HOUR),
(8, 7, 'public', 'I apologize for the delay. The broker has been reassigned and will contact you shortly.', NOW() - INTERVAL 2 DAY),
(1, 4, 'public', 'Please try compressing your document or upload a PDF version. Maximum file size is 5MB.', NOW() - INTERVAL 20 HOUR);

-- 5. Insert Knowledge Base Articles (FAQs)
-- Clear existing FAQ data first
DELETE FROM knowledge_base_articles;
ALTER TABLE knowledge_base_articles AUTO_INCREMENT = 1;

INSERT INTO knowledge_base_articles (article_number, title, content, category, author_id, status, slug, is_featured, views, helpful_votes, video_url) VALUES
('FAQ-001', 'How to Create an Account', 'Step-by-step guide to create your WubLand account...', 'account', 4, 'published', 'how-to-create-account', TRUE, 245, 45, NULL),
('FAQ-002', 'Property Listing Requirements', 'Documents and information needed to list a property...', 'property', 17, 'published', 'property-listing-requirements', TRUE, 189, 32, 'https://www.youtube.com/watch?v=example1'),
('FAQ-003', 'Payment Methods Accepted', 'Learn about all accepted payment methods...', 'payment', 4, 'published', 'payment-methods', FALSE, 312, 67, NULL),
('FAQ-004', 'Document Verification Process', 'Complete guide to document verification...', 'account', 7, 'published', 'document-verification', TRUE, 156, 28, 'https://www.youtube.com/watch?v=example2'),
('FAQ-005', 'Broker Selection Guide', 'How to choose the right broker for your needs...', 'general', 17, 'published', 'broker-selection', FALSE, 98, 15, NULL),
('FAQ-006', 'Rental Application Process', 'Step-by-step rental application guide...', 'property', 4, 'published', 'rental-application', TRUE, 201, 42, 'https://www.youtube.com/watch?v=example3'),
('FAQ-007', 'Security and Privacy', 'Learn about our security measures...', 'safety', 7, 'published', 'security-privacy', FALSE, 87, 19, NULL),
('FAQ-008', 'Technical Support Guide', 'Troubleshooting common technical issues...', 'technical', 17, 'published', 'technical-support', TRUE, 134, 31, NULL);


-- =============================================
-- SIMPLIFIED FIX: Run this step by step
-- =============================================

-- Step 1: Just add the columns without trying to check information_schema
ALTER TABLE users 
ADD COLUMN broker_status ENUM('inactive', 'pending_verification', 'active', 'rejected', 'suspended') 
DEFAULT 'inactive';

ALTER TABLE users 
ADD COLUMN business_license_verified BOOLEAN DEFAULT FALSE;

-- Step 2: Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS support_agent_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agent_username VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    target_id INT NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_agent_username (agent_username),
    INDEX idx_activity_type (activity_type),
    INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ticket_id INT,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    responded_to_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE SET NULL,
    INDEX idx_responded_to (responded_to_by),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS broker_verification_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    broker_id INT NOT NULL,
    business_license_number VARCHAR(100),
    business_license_document VARCHAR(500),
    additional_documents JSON,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT,
    reviewed_at TIMESTAMP NULL,
    review_notes TEXT,
    rejection_reason TEXT,
    FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Now insert sample data (check if tables exist first)
-- First, let's clear ONLY if you want fresh data (comment out if you want to keep existing)
-- TRUNCATE TABLE support_tickets;
-- TRUNCATE TABLE ticket_responses;
-- TRUNCATE TABLE knowledge_base_articles;
-- ALTER TABLE support_tickets AUTO_INCREMENT = 1;
-- ALTER TABLE ticket_responses AUTO_INCREMENT = 1;
-- ALTER TABLE knowledge_base_articles AUTO_INCREMENT = 1;

-- Step 4: Insert Support Tickets
INSERT IGNORE INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status, source, created_at) VALUES
('TICKET-001', 11, 'Document Verification Issue', 'Having trouble uploading my ID document for verification. File size seems to be too large.', 'account', 'medium', 'open', 'web', NOW() - INTERVAL 1 DAY),
('TICKET-002', 13, 'Property Information Request', 'Need more information about property amenities, utility costs, and maintenance fees', 'property', 'low', 'in_progress', 'web', NOW() - INTERVAL 12 HOUR),
('TICKET-003', 14, 'Payment Processing Issue', 'Rental deposit payment not processing successfully. Getting error message during transaction.', 'payment', 'high', 'open', 'web', NOW() - INTERVAL 6 HOUR),
('TICKET-004', 18, 'Broker Contact Request', 'Need to contact my assigned broker urgently about changing viewing time', 'general', 'medium', 'resolved', 'web', NOW() - INTERVAL 2 DAY),
('TICKET-005', 19, 'Account Access Problem', 'Cannot log into my account, password reset not working', 'account', 'urgent', 'open', 'web', NOW() - INTERVAL 3 HOUR),
('TICKET-006', 12, 'Property Listing Question', 'How to list my property for rent? Need guidance on process.', 'property', 'medium', 'in_progress', 'web', NOW() - INTERVAL 1 DAY),
('TICKET-007', 15, 'Invoice Dispute', 'Received incorrect invoice amount for rental property', 'payment', 'high', 'open', 'web', NOW() - INTERVAL 4 HOUR),
('TICKET-008', 20, 'Broker Service Complaint', 'Assigned broker not responding to messages for 3 days', 'general', 'medium', 'resolved', 'web', NOW() - INTERVAL 3 DAY);

-- Step 5: Insert Ticket Responses
INSERT IGNORE INTO ticket_responses (ticket_id, responder_id, response_type, message, created_at) VALUES
(1, 4, 'public', 'Thank you for your inquiry. I have contacted the broker and they will reach out to you within 1 hour.', NOW() - INTERVAL 1 DAY),
(1, 4, 'internal_note', 'Broker alerted via WhatsApp. Follow up in 2 hours.', NOW() - INTERVAL 23 HOUR),
(2, 17, 'public', 'I can provide you with detailed information about the property amenities. The monthly maintenance fee is 1500 ETB and utilities average 2000 ETB per month.', NOW() - INTERVAL 10 HOUR),
(8, 7, 'public', 'I apologize for the delay. The broker has been reassigned and will contact you shortly.', NOW() - INTERVAL 2 DAY),
(1, 4, 'public', 'Please try compressing your document or upload a PDF version. Maximum file size is 5MB.', NOW() - INTERVAL 20 HOUR);

-- Step 6: Insert Knowledge Base Articles
INSERT IGNORE INTO knowledge_base_articles (article_number, title, content, category, author_id, status, slug, is_featured, views, helpful_votes, video_url) VALUES
('FAQ-001', 'How to Create an Account', 'Step-by-step guide to create your WubLand account.', 'account', 4, 'published', 'how-to-create-account', TRUE, 245, 45, NULL),
('FAQ-002', 'Property Listing Requirements', 'Documents needed to list a property.', 'property', 17, 'published', 'property-listing-requirements', TRUE, 189, 32, 'https://www.youtube.com/watch?v=example1'),
('FAQ-003', 'Payment Methods Accepted', 'Learn about accepted payment methods.', 'payment', 4, 'published', 'payment-methods', FALSE, 312, 67, NULL),
('FAQ-004', 'Document Verification Process', 'Complete guide to document verification.', 'account', 7, 'published', 'document-verification', TRUE, 156, 28, 'https://www.youtube.com/watch?v=example2'),
('FAQ-005', 'Broker Selection Guide', 'How to choose the right broker.', 'general', 17, 'published', 'broker-selection', FALSE, 98, 15, NULL),
('FAQ-006', 'Rental Application Process', 'Step-by-step rental application guide.', 'property', 4, 'published', 'rental-application', TRUE, 201, 42, 'https://www.youtube.com/watch?v=example3'),
('FAQ-007', 'Security and Privacy', 'Learn about our security measures.', 'safety', 7, 'published', 'security-privacy', FALSE, 87, 19, NULL),
('FAQ-008', 'Technical Support Guide', 'Troubleshooting common issues.', 'technical', 17, 'published', 'technical-support', TRUE, 134, 31, NULL);

-- Step 7: Insert User Feedback
INSERT IGNORE INTO user_feedback (user_id, ticket_id, rating, feedback_text, responded_to_by, created_at) VALUES
(11, 1, 5, 'Quick response and very helpful.', 'birtukan_support', NOW() - INTERVAL 20 HOUR),
(13, 2, 4, 'Agent provided detailed information.', 'selam_support', NOW() - INTERVAL 8 HOUR),
(18, 4, 5, 'Excellent service!', 'hana_lead', NOW() - INTERVAL 1 DAY),
(20, 8, 3, 'Issue resolved but took longer.', 'hana_lead', NOW() - INTERVAL 2 DAY),
(14, 3, 5, 'Payment issue fixed immediately.', 'birtukan_support', NOW() - INTERVAL 4 HOUR);

-- Step 8: Insert Support Agent Activities
INSERT IGNORE INTO support_agent_activities (agent_username, activity_type, target_id, target_type, details, timestamp) VALUES
('birtukan_support', 'ticket_response', 1, 'ticket', 'Responded to document verification issue', NOW() - INTERVAL 1 DAY),
('selam_support', 'ticket_response', 2, 'ticket', 'Provided property information', NOW() - INTERVAL 10 HOUR),
('hana_lead', 'ticket_response', 8, 'ticket', 'Resolved broker complaint', NOW() - INTERVAL 2 DAY),
('selam_support', 'article_created', 2, 'article', 'Created FAQ article', NOW() - INTERVAL 3 DAY);

-- Step 9: Insert Broker Verification Requests
INSERT IGNORE INTO broker_verification_requests (broker_id, business_license_number, business_license_document, additional_documents, status, submitted_at) VALUES
(9, 'BROKER-ETH-2024-001', '/uploads/licenses/elias_license.pdf', '["tin_certificate.pdf"]', 'pending', NOW() - INTERVAL 5 DAY),
(3, 'BROKER-ETH-2023-045', '/uploads/licenses/beza_license.pdf', '["insurance_certificate.pdf"]', 'approved', NOW() - INTERVAL 10 DAY),
(16, 'BROKER-ETH-2024-002', '/uploads/licenses/alem_license.pdf', '["tin_certificate.pdf"]', 'pending', NOW() - INTERVAL 3 DAY);

-- Step 10: Update broker status
UPDATE users SET 
    broker_status = 'pending_verification',
    business_license_verified = FALSE 
WHERE id IN (9, 16);

UPDATE users SET 
    broker_status = 'active',
    business_license_verified = TRUE 
WHERE id = 3;

-- Step 11: Check if everything worked
SELECT 'Success! Database setup complete.' as message;

SELECT 'Support Tickets:' as Table_Name, COUNT(*) as Count FROM support_tickets
UNION ALL
SELECT 'Ticket Responses:', COUNT(*) FROM ticket_responses
UNION ALL
SELECT 'Knowledge Base:', COUNT(*) FROM knowledge_base_articles
UNION ALL
SELECT 'User Feedback:', COUNT(*) FROM user_feedback
UNION ALL
SELECT 'Support Activities:', COUNT(*) FROM support_agent_activities
UNION ALL
SELECT 'Broker Verifications:', COUNT(*) FROM broker_verification_requests;

-- Step 12: Show broker status updates
SELECT id, username, role, broker_status, business_license_verified 
FROM users 
WHERE id IN (3, 9, 16);

-- 6. Verify the data was inserted correctly
SELECT 'Support Tickets:' as Table_Name;
SELECT id, ticket_number, user_id, subject, status FROM support_tickets;

SELECT 'Ticket Responses:' as Table_Name;
SELECT id, ticket_id, responder_id, response_type, LEFT(message, 50) as preview FROM ticket_responses;

SELECT 'Knowledge Base Articles:' as Table_Name;
SELECT id, article_number, title, category, author_id, views FROM knowledge_base_articles;


-- Create FAQs table if it doesn't exist
CREATE TABLE IF NOT EXISTS faqs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  author_username VARCHAR(100) NOT NULL,
  video_url VARCHAR(500),
  helpful_count INT DEFAULT 0,
  views INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_author (author_username)
);



-- Insert comprehensive FAQ sample data
INSERT INTO faqs (title, content, category, author_username, helpful_count, views) VALUES
-- ACCOUNT & PROFILE CATEGORY
('How do I create an account?', 
 'To create an account, click the "Sign Up" button on the homepage. Fill in your name, email address, and create a secure password. You will receive a verification email to confirm your account.',
 'Account', 'support_admin', 45, 120),

('How do I reset my password?', 
 'Go to the login page and click "Forgot Password". Enter your registered email address, and we will send you a password reset link. The link will expire in 24 hours for security.',
 'Account', 'support_admin', 89, 250),

('How do I update my profile information?', 
 'Log in to your account, go to "My Profile" from the dashboard menu. Click "Edit Profile" to update your personal information, contact details, and preferences.',
 'Account', 'support_agent1', 32, 98),

('How do I verify my email address?', 
 'After signing up, check your email inbox for a verification email from WubLand. Click the verification link in the email. If you didn''t receive it, check your spam folder or request a new verification email from your account settings.',
 'Account', 'support_admin', 67, 180),

-- PROPERTY LISTINGS CATEGORY
('How do I list a property for sale?', 
 'Navigate to "List a Property" from your dashboard. Fill in the property details including location, price, features, and upload photos. Your listing will be reviewed by our team and published within 24-48 hours.',
 'Listings', 'broker_support', 120, 450),

('What information do I need to list a property?', 
 'You will need: property address, price, square footage, number of bedrooms/bathrooms, property type, year built, photos, property description, and any special features or amenities.',
 'Listings', 'broker_support', 56, 210),

('How long does it take for my property listing to be approved?', 
 'Property listings are typically reviewed and approved within 24-48 hours during business days. You will receive an email notification once your listing is live.',
 'Listings', 'support_agent2', 42, 165),

('Can I edit my property listing after it''s published?', 
 'Yes, you can edit your listing anytime. Go to "My Listings" in your dashboard, select the property, and click "Edit". Changes will be reviewed and updated within 24 hours.',
 'Listings', 'broker_support', 31, 140),

-- BUYING & OFFERS CATEGORY
('How do I make an offer on a property?', 
 'When you find a property you''re interested in, click the "Make Offer" button on the property page. Enter your offer amount, financing details, and any contingencies. The seller will be notified of your offer.',
 'Buying', 'transaction_support', 95, 320),

('What happens after I make an offer?', 
 'The seller receives your offer and has 48 hours to respond. They can accept, reject, or counter your offer. You will be notified via email and in-app notification of any updates.',
 'Buying', 'transaction_support', 48, 195),

('Can I withdraw an offer?', 
 'Yes, you can withdraw an offer before it is accepted by the seller. Go to "My Offers" in your dashboard, select the offer, and click "Withdraw Offer".',
 'Buying', 'support_agent3', 27, 110),

('What is earnest money?', 
 'Earnest money is a deposit made to show your serious intent to purchase the property. It is typically 1-3% of the purchase price and is held in escrow until closing.',
 'Buying', 'transaction_support', 63, 240),

-- PAYMENTS & FEES CATEGORY
('What payment methods do you accept?', 
 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, bank transfers (ACH), and wire transfers for larger transactions.',
 'Payments', 'finance_support', 110, 380),

('Are there any fees for using WubLand?', 
 'For buyers: No fees. For sellers: We charge a 2% commission on successful sales. For brokers: Annual subscription fees apply. All fees are clearly displayed before confirmation.',
 'Payments', 'finance_support', 78, 290),

('When will I receive my payment after a sale?', 
 'Sellers receive payment within 3-5 business days after closing. Funds are transferred directly to your registered bank account after deducting any applicable fees.',
 'Payments', 'finance_support', 52, 220),

('Is my payment information secure?', 
 'Yes, we use bank-level 256-bit SSL encryption and PCI DSS compliance for all payment processing. We never store your full credit card numbers on our servers.',
 'Payments', 'support_admin', 91, 310),

-- VERIFICATION CATEGORY
('How do I get verified as a broker?', 
 'Submit your license information, proof of insurance, and business registration through the verification portal. Our team reviews documents within 3-5 business days.',
 'Verification', 'verification_team', 68, 230),

('What documents do I need for verification?', 
 'For brokers: Real estate license, E&O insurance, business license. For investors: Government-issued ID, proof of funds. For sellers: Property ownership documents.',
 'Verification', 'verification_team', 45, 175),

('How long does verification take?', 
 'Standard verification takes 3-5 business days. You will receive email notifications at each stage of the review process. Expedited verification is available for premium members.',
 'Verification', 'support_agent4', 39, 155),

('Why was my verification rejected?', 
 'Common reasons: Blurry documents, expired licenses, mismatched information, incomplete submissions. Check the specific reason in your rejection email and resubmit with corrected documents.',
 'Verification', 'verification_team', 29, 135),

-- SUPPORT & TROUBLESHOOTING CATEGORY
('How do I contact customer support?', 
 'You can contact us through: 1) In-app support ticket system 2) Email: support@wubland.com 3) Phone: 1-800-WUB-LAND during business hours (9AM-6PM EST).',
 'Support', 'support_admin', 150, 500),

('What are your support hours?', 
 'Phone support: Monday-Friday 9AM-6PM EST. Email and ticket support: 24/7 with typical response within 4 hours during business days and 24 hours on weekends.',
 'Support', 'support_admin', 87, 280),

('How do I report a bug or technical issue?', 
 'Use the "Report Issue" button in the app footer or submit a support ticket with the category "Technical Issue". Include screenshots and steps to reproduce the issue for faster resolution.',
 'Support', 'tech_support', 41, 160),

('The website/app is not loading properly. What should I do?', 
 '1) Clear your browser cache and cookies 2) Try a different browser 3) Check your internet connection 4) If using mobile app, ensure it''s updated to the latest version. If issues persist, contact technical support.',
 'Support', 'tech_support', 58, 210),

-- SECURITY & PRIVACY CATEGORY
('How do you protect my personal information?', 
 'We use industry-standard encryption, secure servers, regular security audits, and comply with GDPR and CCPA regulations. We never sell your personal data to third parties.',
 'Security', 'security_team', 73, 260),

('Can I delete my account?', 
 'Yes, you can request account deletion from your account settings. Note: This action is irreversible and will permanently delete all your data from our systems.',
 'Security', 'support_admin', 34, 145),

('How do I enable two-factor authentication?', 
 'Go to Account Settings > Security > Two-Factor Authentication. Choose between SMS, authenticator app, or email verification for enhanced security.',
 'Security', 'security_team', 49, 185),

('What should I do if I suspect unauthorized account activity?', 
 'Immediately change your password from the login page and enable two-factor authentication. Contact our security team at security@wubland.com to report the incident.',
 'Security', 'security_team', 62, 225),

-- MOBILE APP CATEGORY
('Is there a mobile app available?', 
 'Yes, WubLand is available for both iOS (App Store) and Android (Google Play Store). Search for "WubLand Real Estate" to download the app.',
 'Mobile', 'mobile_support', 95, 340),

('Do all features work on the mobile app?', 
 'The mobile app offers all core features: property search, saved properties, making offers, messaging, and notifications. Some advanced broker tools are optimized for desktop.',
 'Mobile', 'mobile_support', 42, 175),

('How do I enable push notifications?', 
 'On iOS: Go to Settings > Notifications > WubLand. On Android: Go to App Settings > Notifications. Ensure notifications are enabled both in device settings and app settings.',
 'Mobile', 'mobile_support', 38, 165),

('The app keeps crashing. How do I fix it?', 
 '1) Update to the latest version 2) Clear app cache (Android) or offload app (iOS) 3) Restart your device 4) Reinstall the app. Contact support if issues continue.',
 'Mobile', 'mobile_support', 27, 125),

-- BROKER TOOLS CATEGORY
('How do I use the CRM features?', 
 'Access the CRM from your broker dashboard. Features include: lead management, client tracking, automated follow-ups, document management, and transaction pipeline view.',
 'Broker Tools', 'broker_support', 56, 210),

('Can I import my existing client list?', 
 'Yes, you can import CSV files with client information. Go to CRM > Import Contacts. The system supports standard fields: name, email, phone, and property interests.',
 'Broker Tools', 'broker_support', 31, 140),

('How do I generate reports?', 
 'Navigate to Analytics > Reports. Select report type (sales, leads, performance), date range, and filters. Reports can be exported as PDF, Excel, or CSV.',
 'Broker Tools', 'broker_support', 44, 180),

('Is there training available for broker tools?', 
 'Yes, we offer: 1) Onboarding webinars 2) Video tutorials 3) Documentation library 4) One-on-one training sessions for premium members.',
 'Broker Tools', 'broker_support', 29, 135);

-- Additional sample data for popular categories
INSERT INTO faqs (title, content, category, author_username, helpful_count, views) VALUES
-- LEGAL & DOCUMENTS
('What legal documents do I need for a property sale?', 
 'Standard documents include: Purchase agreement, disclosure forms, title documents, inspection reports, mortgage documents (if applicable), and closing statements.',
 'Legal', 'legal_support', 71, 245),

('Who prepares the purchase agreement?', 
 'Typically, the seller''s broker or attorney prepares the initial agreement. Both parties should have their legal counsel review before signing.',
 'Legal', 'legal_support', 43, 175),

-- MARKETING
('How do I market my property effectively?', 
 'Use professional photography, virtual tours, detailed descriptions, social media sharing, and consider premium listings for increased visibility. Our marketing team can assist with premium packages.',
 'Marketing', 'marketing_support', 52, 195),

('What is a virtual tour and how do I create one?', 
 'A virtual tour is an interactive 360-degree view of the property. You can schedule a professional virtual tour through our partner services or use our mobile app to create basic tours.',
 'Marketing', 'marketing_support', 38, 165);
 
-- Message deletions table
CREATE TABLE IF NOT EXISTS message_deletions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    deleted_for ENUM('self', 'everyone') DEFAULT 'self',
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_message_deletion (message_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User message limits table
CREATE TABLE IF NOT EXISTS user_message_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    period_date DATE NOT NULL,
    message_count INT DEFAULT 0,
    last_message_at TIMESTAMP NULL,
    limit_exceeded BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_period (user_id, period_date),
    INDEX idx_period_date (period_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- PRIVILEGE & ROLE MANAGEMENT TABLES
-- =============================================

-- Privilege templates for role-based access control
CREATE TABLE privilege_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    role_type ENUM('admin', 'support', 'broker', 'client') NOT NULL,
    tier ENUM('basic', 'standard', 'premium', 'enterprise') NOT NULL,
    privileges JSON NOT NULL,
    monthly_price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_role_tier (role_type, tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User privileges table for custom permissions
CREATE TABLE user_privileges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    privilege_key VARCHAR(100) NOT NULL,
    privilege_value JSON,
    granted_by INT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_privilege (user_id, privilege_key),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- REGISTRATION MANAGEMENT TABLES
-- =============================================

-- Pending registrations table for email verification workflow
CREATE TABLE pending_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'broker', 'seller', 'buyer', 'renter', 'landlord') NOT NULL,
    broker_type ENUM('internal', 'external') NULL,
    email_verification_token VARCHAR(255) NOT NULL,
    email_verification_expires DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (email_verification_token),
    INDEX idx_email (email),
    INDEX idx_expires (email_verification_expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SUPPORT & VERIFICATION SERVICE TABLES
-- =============================================

-- Enhanced support_tickets table
CREATE TABLE support_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    analytics_metadata JSON DEFAULT '{}',
    resolution_efficiency_score DECIMAL(3,2) DEFAULT 0.00,
    customer_satisfaction_score DECIMAL(3,2) DEFAULT 0.00,
    first_response_time_minutes INT NULL,
    user_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('account', 'payment', 'technical', 'property', 'safety', 'general', 'billing') NOT NULL,
    subcategory VARCHAR(100),
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'waiting_customer', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT NULL,
    assigned_at TIMESTAMP NULL,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    customer_rating INT,
    customer_feedback TEXT,
    source ENUM('web', 'email', 'phone', 'chat') DEFAULT 'web',
    first_response_at TIMESTAMP NULL,
    sla_breached BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
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
CREATE TABLE ticket_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    responder_id INT NOT NULL,
    response_type ENUM('public', 'internal_note') DEFAULT 'public',
    message TEXT NOT NULL,
    attachments JSON DEFAULT '[]',
    is_first_response BOOLEAN DEFAULT FALSE,
    read_by_customer BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_ticket_created (ticket_id, created_at),
    INDEX idx_responder (responder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced knowledge_base_articles table
CREATE TABLE knowledge_base_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_number VARCHAR(20) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category ENUM('general', 'account', 'payment', 'technical', 'property', 'safety', 'billing') NOT NULL,
    tags JSON DEFAULT '[]',
    author_id INT NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    slug VARCHAR(255) UNIQUE NOT NULL,
    meta_description TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    views INT DEFAULT 0,
    helpful_votes INT DEFAULT 0,
    not_helpful_votes INT DEFAULT 0,
    featured_image VARCHAR(500),
    video_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_category_status (category, status),
    INDEX idx_slug (slug),
    INDEX idx_published_at (published_at),
    INDEX idx_is_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Article feedback table
CREATE TABLE article_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT NOT NULL,
    user_id INT NOT NULL,
    was_helpful BOOLEAN NOT NULL,
    feedback_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_article_feedback (article_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced flagged_content table
CREATE TABLE flagged_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flag_number VARCHAR(20) NOT NULL UNIQUE,
    content_type ENUM('property_listing', 'user_message', 'user_profile', 'review', 'article', 'other') NOT NULL,
    content_id VARCHAR(255) NOT NULL,
    content_url VARCHAR(500),
    reported_by_user_id INT NOT NULL,
    reason TEXT NOT NULL,
    additional_details TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('pending', 'under_review', 'resolved', 'approved', 'rejected', 'action_taken') DEFAULT 'pending',
    assigned_to INT NULL,
    assigned_at TIMESTAMP NULL,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status_severity (status, severity),
    INDEX idx_content_type (content_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- SYSTEM & ADMINISTRATION TABLES
-- =============================================

-- Enhanced admin_activities table
CREATE TABLE admin_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_type VARCHAR(100) NOT NULL,
    admin_user_id INT NOT NULL,
    target_type ENUM('user', 'ticket', 'article', 'flag', 'system', 'property', 'transaction', 'payment', 'invoice', 'offer') NOT NULL,
    target_id INT,
    target_name VARCHAR(255),
    description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_timestamp (admin_user_id, timestamp),
    INDEX idx_activity_type (activity_type),
    INDEX idx_target (target_type, target_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced security_logs table
CREATE TABLE security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50),
    log_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    description TEXT NOT NULL,
    event_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    user_id INT NULL,
    country_code VARCHAR(10),
    region VARCHAR(100),
    city VARCHAR(100),
    action_taken TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_severity_type (severity, log_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System configurations table
CREATE TABLE system_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value JSON NOT NULL,
    data_type ENUM('string', 'number', 'boolean', 'array', 'object') DEFAULT 'string',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_editable BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_config_key (config_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =============================================
-- ANNOUNCEMENTS MANAGEMENT TABLES
-- =============================================

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_uuid VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target ENUM(
        'all_brokers', 'external_brokers', 'internal_brokers', 
        'commercial_clients', 'sellers', 'buyers', 'landlords', 
        'renters', 'premium_users', 'support_staff', 'administrators',
        'all_users', 'specific_users'
    ) DEFAULT 'all_brokers',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    status ENUM('draft', 'scheduled', 'sent', 'cancelled', 'expired') DEFAULT 'draft',
    notification_type ENUM('in_app', 'email', 'both') DEFAULT 'both',
    language VARCHAR(10) DEFAULT 'en',
    is_urgent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NULL,
    scheduled_for TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    analytics_metadata JSON DEFAULT '{}',
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_announcement_uuid (announcement_uuid),
    INDEX idx_status (status),
    INDEX idx_target (target),
    INDEX idx_priority (priority),
    INDEX idx_scheduled_for (scheduled_for),
    INDEX idx_created_by (created_by_user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE announcements ADD COLUMN category VARCHAR(50) DEFAULT 'general' AFTER is_urgent;

-- Announcement recipients table (for tracking)
CREATE TABLE IF NOT EXISTS announcement_recipients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    received_at TIMESTAMP NULL,
    viewed_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    status ENUM('pending', 'sent', 'delivered', 'viewed', 'clicked', 'failed') DEFAULT 'pending',
    delivery_method ENUM('in_app', 'email', 'sms') DEFAULT 'in_app',
    failure_reason TEXT,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_announcement_recipient (announcement_id, user_id),
    INDEX idx_announcement_id (announcement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcement logs table (for audit)
CREATE TABLE IF NOT EXISTS announcement_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    action ENUM('created', 'updated', 'scheduled', 'sent', 'cancelled', 'resent', 'expired') NOT NULL,
    performed_by_user_id INT NOT NULL,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_announcement_id (announcement_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- INSERT SAMPLE DATA WITH ETHIOPIAN NAMES
-- =============================================

-- Insert your group members (users 1-5)
INSERT INTO users (id, first_name, last_name, username, email, password, phone_number, role, privilege_tier, city, country, status, verified, profile_complete, profile_completion_percentage, profile_picture, bio, date_of_birth, address, zip_code, is_email_verified) VALUES
-- User 1: Yokabd Bililign (super_admin)
(1, 'Yokabd', 'Bililign', 'yokabd_admin', 'yokabd@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251911223344', 'super_admin', 'enterprise', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, '/Uploads/profile-pictures/profile-1-1768249630387-...', 'System super administrator and project lead', '1990-05-15', 'Bole Road, Addis Ababa', '1000', TRUE),

-- User 2: Saron Tesfaye (admin)
(2, 'Saron', 'Tesfaye', 'saron_admin', 'saron@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251922334455', 'admin', 'premium', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Platform administrator', '1992-08-20', 'Megenagna, Addis Ababa', '1000', TRUE),

-- User 3: Beza Hilemariam (internal_broker)
(3, 'Beza', 'Hilemariam', 'beza_hilemariam', 'beza@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251911223344', 'internal_broker', 'premium', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Premium internal real estate broker specializing in luxury properties', '1988-03-10', 'Kirkos Sub-city, Addis Ababa', '1000', TRUE),

-- User 4: Birtukan Yemataw (support_agent)
(4, 'Birtukan', 'Yemataw', 'birtukan_support', 'birtukan@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251944556677', 'support_agent', 'standard', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Customer support specialist with 3 years experience in real estate', '1995-11-25', 'Lideta, Addis Ababa', '1000', TRUE),

-- User 5: Beletu Wolde (buyer)
(5, 'Beletu', 'Wolde', 'beletu_buyer', 'ybililign@gmail.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251953152002', 'buyer', 'basic', 'Gondar', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Looking for investment properties in Gondar area', '1990-01-01', '123/1000, Debark', '2000', TRUE),

-- User 6: Mikias Girma (admin)
(6, 'Mikias', 'Girma', 'mikias_admin', 'mikias@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251966778899', 'admin', 'premium', 'Bishoftu', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'System administrator and technical lead', '1991-04-18', 'Bishoftu Town', '3000', TRUE),

-- User 7: Hana Solomon (support_lead)
(7, 'Hana', 'Solomon', 'hana_lead', 'hana@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251977889900', 'support_lead', 'premium', 'Hawassa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Support team lead and escalation point with 5 years experience', '1989-09-30', 'Hawassa City', '4000', TRUE),

-- User 8: Daniel Mekonnen (support_admin)
(8, 'Daniel', 'Mekonnen', 'daniel_support_admin', 'daniel@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251988990011', 'support_admin', 'enterprise', 'Bahir Dar', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Support administration and team management', '1987-12-05', 'Bahir Dar City', '5000', TRUE),

-- User 9: Elias Kebede (external_broker)
(9, 'Elias', 'Kebede', 'elias_kebede', 'elias@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251922334455', 'external_broker', 'standard', 'Mekele', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Independent real estate broker specializing in residential properties', '1986-06-22', 'Mekele City', '6000', TRUE),

-- User 10: Admin User (super_admin)
(10, 'Admin', 'User', 'admin', 'admin@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251900000000', 'super_admin', 'enterprise', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'System super administrator', '1990-01-01', 'Addis Ababa', '1000', TRUE),

-- User 11: Sindu Tadese (seller)
(11, 'Sindu', 'Tadese', 'sindu_seller', 'yokabdbi@gmail.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251911223344', 'seller', 'basic', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Homeowner looking to sell family property', NULL, NULL, NULL, TRUE),

-- User 12: Tigist Getachew (seller)
(12, 'Tigist', 'Getachew', 'tigist_seller', 'tigist@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251912345678', 'seller', 'basic', 'Adama', 'Ethiopia', 'active', TRUE, TRUE, 90, NULL, 'Property owner in Adama looking to sell commercial space', '1985-07-12', 'Adama Town', '1000', TRUE),

-- User 13: Samuel Mengistu (buyer)
(13, 'Samuel', 'Mengistu', 'samuel_buyer', 'samuel@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251913456789', 'buyer', 'basic', 'Dire Dawa', 'Ethiopia', 'active', TRUE, TRUE, 85, NULL, 'Looking to invest in commercial properties in Dire Dawa', '1982-03-25', 'Dire Dawa City', '3000', TRUE),

-- User 14: Mekdes Haile (renter)
(14, 'Mekdes', 'Haile', 'mekdes_renter', 'mekdes@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251914567890', 'renter', 'basic', 'Hawassa', 'Ethiopia', 'active', TRUE, TRUE, 80, NULL, 'Looking for rental apartment in Hawassa for family', '1990-08-15', 'Hawassa Lake Area', '4000', TRUE),

-- User 15: Kebede Worku (landlord)
(15, 'Kebede', 'Worku', 'kebede_landlord', 'kebede@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251915678901', 'landlord', 'standard', 'Bahir Dar', 'Ethiopia', 'active', TRUE, TRUE, 95, NULL, 'Property landlord with multiple rental units in Bahir Dar', '1978-11-30', 'Bahir Dar City Center', '5000', TRUE),

-- User 16: Alem Tesfaye (internal_broker)
(16, 'Alem', 'Tesfaye', 'alem_broker', 'alem@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251916789012', 'internal_broker', 'premium', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Internal broker specializing in luxury villas and commercial properties', '1984-09-14', 'Bole, Addis Ababa', '1000', TRUE),

-- User 17: Selam Bekele (support_agent)
(17, 'Selam', 'Bekele', 'selam_support', 'selam@wubland.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251917890123', 'support_agent', 'standard', 'Addis Ababa', 'Ethiopia', 'active', TRUE, TRUE, 100, NULL, 'Customer support agent with expertise in property verification', '1993-02-28', 'Cazanchis, Addis Ababa', '1000', TRUE),

-- User 18: Yohannes Assefa (buyer)
(18, 'Yohannes', 'Assefa', 'yohannes_buyer', 'yohannes@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251918901234', 'buyer', 'basic', 'Gondar', 'Ethiopia', 'active', TRUE, TRUE, 75, NULL, 'First-time home buyer looking for family house in Gondar', '1988-05-20', 'Gondar Town', '2000', TRUE),

-- User 19: Marta Dereje (renter)
(19, 'Marta', 'Dereje', 'marta_renter', 'marta@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251919012345', 'renter', 'basic', 'Jimma', 'Ethiopia', 'active', TRUE, TRUE, 70, NULL, 'Student looking for affordable apartment rental in Jimma', '1998-12-10', 'Jimma University Area', '7000', TRUE),

-- User 20: Berhanu Negash (seller)
(20, 'Berhanu', 'Negash', 'berhanu_seller', 'berhanu@example.com', '$2b$10$nfGXoYK0x8hppXp5Iaged.XyS2hYU6eihy8jD9skDqfOfdRBhbKJe', '+251920123456', 'seller', 'standard', 'Mekele', 'Ethiopia', 'active', TRUE, TRUE, 85, NULL, 'Selling inherited family property in Mekele', '1975-04-05', 'Mekele City Center', '6000', TRUE);

-- Insert broker profiles
INSERT INTO broker_profiles (user_id, broker_type, license_number, years_experience, specialization, total_completed_deals, total_sales, average_rating, brokerage_firm, is_available) VALUES
(3, 'internal', 'LIC-ETH-001', 8, '["luxury_homes", "commercial", "apartments"]', 42, 85000000.00, 4.9, 'WubLand Real Estate', TRUE),
(9, 'external', 'LIC-EXT-001', 6, '["land", "commercial", "industrial", "residential"]', 32, 68000000.00, 4.7, 'Independent Broker', TRUE),
(16, 'internal', 'LIC-ETH-002', 4, '["apartments", "condos", "townhouses", "villas"]', 18, 32000000.00, 4.6, 'WubLand Real Estate', TRUE);

-- Insert sample properties (15 properties)
INSERT INTO properties (property_uuid, title, description, property_type, property_status, address, city, state, country, zip_code, neighborhood, latitude, longitude, beds, baths, sqft, lot_size, price, currency, listing_type, owner_user_id, created_by_user_id, assigned_broker_id, features, amenities, views_count, saves_count, is_featured, is_premium, average_rating, total_reviews) VALUES
(UUID(), 'Modern Luxury Villa in Bole', 'Spacious 5-bedroom luxury villa with swimming pool, garden, and security system.', 'villa', 'active', 'Bole Road, near Bole International Airport', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Bole', 8.9806, 38.7998, 5, 5, 450.00, 800.00, 25000000.00, 'ETB', 'sale', 12, 16, 16, '["swimming_pool", "garden", "security_system", "garage", "backup_generator", "modern_kitchen"]', '["air_conditioning", "wifi", "cable_tv", "parking", "gym", "jacuzzi"]', 250, 42, TRUE, TRUE, 4.8, 15),

(UUID(), '3-Bedroom Modern Apartment in Kirkos', 'Newly built apartment with city views and modern finishes.', 'apartment', 'active', 'Kirkos Sub-city, near Edna Mall', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Kirkos', 9.0106, 38.7612, 3, 2, 140.00, NULL, 6500000.00, 'ETB', 'sale', 11, 16, 16, '["balcony", "modern_kitchen", "security", "elevator", "storage"]', '["gym", "parking", "security", "water_backup", "wifi"]', 180, 35, TRUE, FALSE, 4.5, 8),

(UUID(), 'Prime Commercial Office Space in Megenagna', 'Perfect for businesses seeking high visibility.', 'commercial', 'active', 'Megenagna Square, near Friendship City Center', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Megenagna', 9.0151, 38.7802, 0, 3, 300.00, NULL, 12000000.00, 'ETB', 'sale', 20, 3, 3, '["high_ceiling", "store_front", "parking", "security", "display_windows"]', '["air_conditioning", "security", "parking", "wifi", "elevator"]', 95, 18, FALSE, TRUE, 4.6, 6),

(UUID(), 'Beautiful Family Home for Rent in Gerji', '3-bedroom family home in quiet neighborhood with garden.', 'house', 'active', 'Gerji, near Bole Bulbula', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Gerji', 9.0256, 38.7953, 3, 2, 220.00, 500.00, 35000.00, 'ETB', 'rent', 15, 9, 9, '["garden", "garage", "security", "furnished", "backup_water"]', '["wifi", "parking", "security", "backup_generator", "cable_tv"]', 210, 45, TRUE, FALSE, 4.7, 12),

(UUID(), 'Penthouse with Panoramic City View in Kazanchis', 'Exclusive penthouse with 360-degree city views.', 'penthouse', 'active', 'Kazanchis Business District', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Kazanchis', 9.0208, 38.7469, 4, 3, 280.00, NULL, 18000000.00, 'ETB', 'sale', 12, 3, 3, '["rooftop", "panoramic_view", "smart_home", "jacuzzi", "wine_cellar"]', '["concierge", "gym", "pool", "security", "spa", "valet_parking"]', 120, 25, TRUE, TRUE, 4.9, 18),

(UUID(), '1 Hectare Prime Land for Development in Sebeta', 'Flat terrain with road access and all utilities available.', 'land', 'active', 'Sebeta Town, near Addis Ababa', 'Sebeta', 'Oromia', 'Ethiopia', '1000', 'Sebeta', 8.9167, 38.6167, 0, 0, 10000.00, 10000.00, 5000000.00, 'ETB', 'sale', 20, 9, 9, '["flat_terrain", "road_access", "utilities", "fenced", "good_drainage"]', '[]', 85, 15, FALSE, FALSE, 4.3, 5),

(UUID(), 'Modern Townhouse Development in CMC', 'New townhouse with community amenities including pool and playground.', 'townhouse', 'active', 'CMC Area, near African Union', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'CMC', 9.0056, 38.7639, 3, 2.5, 180.00, 300.00, 8500000.00, 'ETB', 'sale', 11, 16, 16, '["modern_design", "community_space", "garden", "security"]', '["community_pool", "playground", "security", "parking", "gym"]', 150, 28, FALSE, TRUE, 4.4, 9),

(UUID(), 'Cozy 2-Bedroom Apartment in Mekanisa', 'Clean and comfortable apartment in secure building.', 'apartment', 'active', 'Mekanisa Area', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Mekanisa', 9.0050, 38.7200, 2, 1, 95.00, NULL, 18000.00, 'ETB', 'rent', 15, 9, 9, '["furnished", "balcony", "security", "modern_bathroom"]', '["security", "water_backup", "generator", "wifi", "parking"]', 175, 32, TRUE, FALSE, 4.2, 11),

(UUID(), 'Executive Villa for Rent in Old Airport Area', 'Fully furnished luxury villa perfect for corporate executives.', 'villa', 'active', 'Old Airport Area', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Old Airport', 8.9950, 38.8000, 6, 5, 550.00, 1200.00, 75000.00, 'ETB', 'rent', 12, 3, 3, '["fully_furnished", "swimming_pool", "garden", "staff_quarters", "security", "garage"]', '["staff", "security", "maintenance", "utilities", "gym", "pool_service"]', 95, 22, TRUE, TRUE, 4.8, 14),

(UUID(), 'Retail Space in Historic Piazza District', 'Prime retail space in historic commercial area with high foot traffic.', 'commercial', 'active', 'Piazza, near City Hall', 'Addis Ababa', 'Addis Ababa', 'Ethiopia', '1000', 'Piazza', 9.0386, 38.7464, 0, 2, 200.00, NULL, 45000.00, 'ETB', 'lease', 20, 9, 9, '["store_front", "display_windows", "storage", "security", "historic_building"]', '["air_conditioning", "security", "parking", "wifi", "kitchen"]', 110, 20, FALSE, FALSE, 4.5, 7),

(UUID(), 'Lake View Property in Bahir Dar', 'Beautiful property with stunning Lake Tana views.', 'house', 'active', 'Near Lake Tana', 'Bahir Dar', 'Amhara', 'Ethiopia', '6000', 'Lake View', 11.5890, 37.3210, 4, 3, 300.00, 1000.00, 8500000.00, 'ETB', 'sale', 8, 9, 9, '["lake_view", "garden", "security", "renovated", "patio"]', '["furnished", "parking", "security", "wifi", "lake_access"]', 65, 12, FALSE, TRUE, 4.6, 5),

(UUID(), 'Modern Villa in Hawassa with Lake Access', 'New villa close to Hawassa Lake with modern amenities.', 'villa', 'active', 'Near Hawassa Lake', 'Hawassa', 'Sidama', 'Ethiopia', '4000', 'Lake Area', 7.0480, 38.4840, 4, 3, 350.00, 750.00, 12000000.00, 'ETB', 'sale', 7, 16, 16, '["lake_access", "garden", "security", "modern_design", "garage"]', '["air_conditioning", "wifi", "parking", "security", "garden_maintenance"]', 55, 10, FALSE, FALSE, 4.4, 4),

(UUID(), '3-Story Commercial Building in Central Mekele', 'Commercial building in central Mekele suitable for offices or retail.', 'commercial', 'active', 'Downtown Mekele', 'Mekele', 'Tigray', 'Ethiopia', '7000', 'City Center', 13.4960, 39.4760, 0, 6, 800.00, NULL, 15000000.00, 'ETB', 'sale', 9, 9, 9, '["multiple_floors", "store_front", "elevator", "security", "parking"]', '["air_conditioning", "security", "parking", "wifi", "backup_generator"]', 45, 8, FALSE, TRUE, 4.3, 3),

(UUID(), 'Historic Home in Gondar near Fasil Ghebbi', 'Renovated historic home near Fasil Ghebbi.', 'house', 'active', 'Near Fasil Ghebbi', 'Gondar', 'Amhara', 'Ethiopia', '2000', 'Historic District', 12.6070, 37.4590, 5, 3, 400.00, 900.00, 9500000.00, 'ETB', 'sale', 5, 16, 16, '["historic", "garden", "renovated", "traditional_architecture", "courtyard"]', '["furnished", "parking", "security", "wifi", "garden_maintenance"]', 70, 15, TRUE, FALSE, 4.7, 8),

(UUID(), 'New Apartment Complex in Dire Dawa', 'Modern apartment complex with 12 units, perfect for investment.', 'apartment', 'active', 'Kezena Area', 'Dire Dawa', 'Dire Dawa', 'Ethiopia', '3000', 'Kezena', 9.6000, 41.8500, 12, 24, 1200.00, NULL, 22000000.00, 'ETB', 'sale', 13, 9, 9, '["multiple_units", "modern_design", "security", "elevator", "balconies"]', '["gym", "pool", "parking", "security", "community_hall"]', 60, 12, FALSE, TRUE, 4.5, 6);

-- Insert user preferences for all users
INSERT IGNORE INTO user_preferences (user_id) SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM user_preferences);

-- Insert sample appointments
INSERT INTO appointments (appointment_uuid, appointment_type, title, description, scheduled_date, start_time, end_time, duration_minutes, organizer_user_id, broker_id, property_id, status, max_attendees, created_by_user_id) VALUES
(UUID(), 'property_showing', 'Villa Viewing - Bole Area', 'Viewing of luxury villa in Bole for potential buyer', CURDATE() + INTERVAL 2 DAY, CONCAT(CURDATE() + INTERVAL 2 DAY, ' 10:00:00'), CONCAT(CURDATE() + INTERVAL 2 DAY, ' 11:00:00'), 60, 16, 16, 1, 'scheduled', 5, 16),
(UUID(), 'consultation', 'Investment Consultation', 'Meeting with potential investor about penthouse purchase', CURDATE() + INTERVAL 1 DAY, CONCAT(CURDATE() + INTERVAL 1 DAY, ' 14:00:00'), CONCAT(CURDATE() + INTERVAL 1 DAY, ' 15:00:00'), 60, 3, 3, 5, 'confirmed', 3, 3),
(UUID(), 'property_showing', 'Apartment Tour - Kirkos', 'Showing modern apartment to first-time buyer', CURDATE() + INTERVAL 3 DAY, CONCAT(CURDATE() + INTERVAL 3 DAY, ' 11:00:00'), CONCAT(CURDATE() + INTERVAL 3 DAY, ' 12:00:00'), 60, 16, 16, 2, 'scheduled', 4, 16),
(UUID(), 'consultation', 'Rental Inquiry Meeting', 'Discussing rental options for family home', CURDATE() + INTERVAL 4 DAY, CONCAT(CURDATE() + INTERVAL 4 DAY, ' 15:00:00'), CONCAT(CURDATE() + INTERVAL 4 DAY, ' 16:00:00'), 60, 9, 9, 4, 'pending', 2, 9);

-- Insert sample appointments attendees
INSERT INTO appointment_attendees (appointment_id, user_id, broker_id, attendee_status) VALUES
(1, 5, 16, 'confirmed'),
(2, 13, 3, 'confirmed'),
(3, 18, 16, 'pending'),
(4, 14, 9, 'confirmed');

-- Insert sample todos
INSERT INTO todos (todo_uuid, user_id, title, description, todo_type, category, priority, status, due_date, assigned_to, created_by, department, tags, attachments, comments, metadata) VALUES
(UUID(), 1, 'Review property verification requests', 'Check and verify 8 new property listings submitted this week', 'property', 'property_verification', 'high', 'pending', CURDATE() + INTERVAL 1 DAY, 16, 1, 'support', '["verification", "urgent", "properties"]', '[]', '[{"user_id": 1, "comment": "Need to verify all documents before approval", "created_at": "2024-01-15 09:00:00"}]', '{"estimated_time": "3 hours"}'),
(UUID(), 16, 'Client follow-up - Beletu Wolde', 'Follow up with Beletu regarding villa viewing feedback and next steps', 'client', 'financial_review', 'medium', 'in_progress', CURDATE() + INTERVAL 2 DAY, 16, 16, 'brokerage', '["client", "followup", "villa", "boley"]', '[]', '[{"user_id": 16, "comment": "Client showed strong interest in the villa, need to discuss financing options", "created_at": "2024-01-15 10:30:00"}]', '{"client_id": 5, "property_id": 1}'),
(UUID(), 3, 'Prepare broker performance report', 'Compile monthly broker performance metrics and sales reports', 'admin', 'report_generation', 'medium', 'pending', CURDATE() + INTERVAL 5 DAY, 3, 3, 'administration', '["report", "performance", "brokers", "monthly"]', '[]', '[]', '{"report_type": "broker_performance", "period": "monthly"}'),
(UUID(), 9, 'Site visit - Sebeta Land', 'Visit land property in Sebeta for assessment and documentation', 'property', 'property_verification', 'high', 'pending', CURDATE() + INTERVAL 3 DAY, 9, 9, 'brokerage', '["site_visit", "land", "assessment", "sebeta"]', '[]', '[{"user_id": 9, "comment": "Need to check soil quality and boundary markings", "created_at": "2024-01-15 14:00:00"}]', '{"location": "Sebeta", "property_id": 6}');

-- Insert sample notifications
INSERT INTO notifications (notification_uuid, user_id, title, message, notification_type, is_read, priority, created_at) VALUES
(UUID(), 5, 'Property Viewing Scheduled', 'Your villa viewing in Bole has been scheduled for tomorrow at 10:00 AM. Please arrive 10 minutes early.', 'appointment', FALSE, 'medium', NOW() - INTERVAL 2 HOUR),
(UUID(), 13, 'New Properties Matched', '5 new properties match your search criteria in Addis Ababa area. Check them out!', 'property', FALSE, 'low', NOW() - INTERVAL 1 HOUR),
(UUID(), 14, 'Rental Application Update', 'Your rental application status has been updated to "Under Review". We will contact you within 48 hours.', 'transaction', FALSE, 'medium', NOW() - INTERVAL 30 MINUTE),
(UUID(), 18, 'Appointment Reminder', 'Reminder: Your apartment viewing in Kirkos is scheduled for tomorrow at 11:00 AM. Don\'t forget!', 'reminder', FALSE, 'medium', NOW() - INTERVAL 45 MINUTE);

-- Insert sample broker reviews
INSERT INTO broker_reviews (broker_id, client_id, property_id, overall_rating, communication_rating, professionalism_rating, knowledge_rating, title_english, comment_english, transaction_type, is_approved, is_verified) VALUES
(16, 5, 1, 5, 5, 5, 5, 'Excellent Service from Alem Tesfaye', 'Alem was very professional and helped us understand every detail of the property. Highly recommended!', 'sale', TRUE, TRUE),
(3, 13, 5, 4, 4, 5, 5, 'Great Experience with Beza Hilemariam', 'Beza was extremely knowledgeable about the market and very responsive to all our questions.', 'sale', TRUE, TRUE),
(9, 14, 4, 5, 5, 4, 5, 'Helpful and Professional Broker', 'Elias made the rental process smooth and was very professional throughout. Would work with him again.', 'rental', TRUE, TRUE),
(16, 18, 2, 4, 5, 4, 4, 'Good Service from Alem', 'Alem showed us several properties and was patient with our decision-making process.', 'sale', TRUE, TRUE);

-- Update broker profiles with review data
UPDATE broker_profiles SET 
    review_count = (SELECT COUNT(*) FROM broker_reviews WHERE broker_id = 16),
    average_rating = (SELECT AVG(overall_rating) FROM broker_reviews WHERE broker_id = 16)
WHERE user_id = 16;

UPDATE broker_profiles SET 
    review_count = (SELECT COUNT(*) FROM broker_reviews WHERE broker_id = 3),
    average_rating = (SELECT AVG(overall_rating) FROM broker_reviews WHERE broker_id = 3)
WHERE user_id = 3;

UPDATE broker_profiles SET 
    review_count = (SELECT COUNT(*) FROM broker_reviews WHERE broker_id = 9),
    average_rating = (SELECT AVG(overall_rating) FROM broker_reviews WHERE broker_id = 9)
WHERE user_id = 9;

-- Insert sample property applications
INSERT INTO property_applications (application_uuid, property_id, user_id, application_type, status, message, offered_amount, submitted_at) VALUES
(UUID(), 1, 5, 'sale', 'submitted', 'Very interested in this villa. Please contact me to discuss financing options and next steps.', 24000000.00, NOW() - INTERVAL 2 DAY),
(UUID(), 4, 14, 'rent', 'reviewing', 'Looking to rent this house for my family of 4. We have good rental history and references available.', 34000.00, NOW() - INTERVAL 1 DAY),
(UUID(), 2, 18, 'sale', 'approved', 'Application approved for apartment purchase. Ready for contract signing and next steps.', 6300000.00, NOW() - INTERVAL 3 DAY),
(UUID(), 5, 13, 'sale', 'submitted', 'Very interested in the penthouse. Can we schedule another viewing with family members?', 17500000.00, NOW() - INTERVAL 1 DAY);

-- Insert sample support tickets
INSERT INTO support_tickets (ticket_number, user_id, subject, description, category, priority, status, source, created_at) VALUES
('TICKET-001', 5, 'Document Verification Issue', 'Having trouble uploading my ID document for verification. File size seems to be too large.', 'account', 'medium', 'open', 'web', NOW() - INTERVAL 1 DAY),
('TICKET-002', 13, 'Property Information Request', 'Need more information about property amenities, utility costs, and maintenance fees', 'property', 'low', 'in_progress', 'web', NOW() - INTERVAL 12 HOUR),
('TICKET-003', 14, 'Payment Processing Issue', 'Rental deposit payment not processing successfully. Getting error message during transaction.', 'payment', 'high', 'open', 'web', NOW() - INTERVAL 6 HOUR),
('TICKET-004', 18, 'Broker Contact Request', 'Need to contact my assigned broker urgently about changing viewing time', 'general', 'medium', 'resolved', 'web', NOW() - INTERVAL 2 DAY);

-- Insert sample property requests
INSERT INTO property_requests (user_id, user_type, property_type, location, price, description, current_step, status, created_at) VALUES
(5, 'buyer', 'villa', 'Addis Ababa, Bole area', 25000000.00, 'Looking for modern 4-5 bedroom villa with garden and pool for family residence', 3, 'in_progress', NOW() - INTERVAL 5 DAY),
(13, 'buyer', 'penthouse', 'Addis Ababa, city center', 20000000.00, 'Seeking luxury penthouse with city views and modern amenities for investment', 2, 'pending', NOW() - INTERVAL 3 DAY),
(14, 'renter', 'house', 'Addis Ababa, Gerji area', 40000.00, 'Need 3-bedroom house with garden for family of 4, prefer furnished option', 4, 'assigned', NOW() - INTERVAL 2 DAY),
(18, 'buyer', 'apartment', 'Addis Ababa, Kirkos area', 7000000.00, 'Looking for modern 3-bedroom apartment for investment purposes', 1, 'draft', NOW() - INTERVAL 1 DAY);

-- =============================================
-- FINAL MESSAGES
-- =============================================

SELECT 'Database created successfully!' as message;
SELECT CONCAT('Total users inserted: ', COUNT(*)) as user_count FROM users;
SELECT CONCAT('Total properties inserted: ', COUNT(*)) as property_count FROM properties;
SELECT CONCAT('Total appointments created: ', COUNT(*)) as appointment_count FROM appointments;
SELECT CONCAT('Total todos created: ', COUNT(*)) as todo_count FROM todos;
SELECT CONCAT('Total broker profiles: ', COUNT(*)) as broker_count FROM broker_profiles;
SELECT 'NOTE: All users have password: 123456' as note;
SELECT 'Your group members (users 1-5) are preserved with Ethiopian names' as note2;
SELECT 'Appointments table includes all required columns (duration_minutes, max_attendees, brokerage_firm)' as note3;

-- Add nationality column to users table
ALTER TABLE users 
ADD COLUMN nationality VARCHAR(100) DEFAULT NULL 
AFTER country;

-- You might want to update existing users with Ethiopian nationality
UPDATE users 
SET nationality = 'Ethiopian' 
WHERE country = 'Ethiopia' OR country LIKE '%ethiopia%';

-- Run this in your property service database
ALTER TABLE properties 
ADD COLUMN main_image VARCHAR(500) DEFAULT NULL AFTER description;

ALTER TABLE appointment_attendees 
ADD COLUMN additional_guests INT DEFAULT 0;


-- First, check if you have a user with ID 1
SELECT * FROM users WHERE id = 1;

-- If not, create a test user or use an existing user ID
SELECT id, email FROM users LIMIT 5;

-- Create a test invoice (adjust user IDs as needed)
INSERT INTO invoices (
  invoice_uuid,
  invoice_number,
  invoice_type,
  invoice_status,
  from_user_id,
  to_user_id,
  property_id,
  transaction_id,
  amount,
  tax_amount,
  total_amount,
  currency,
  paid_amount,
  balance_due,
  invoice_date,
  due_date,
  line_items,
  notes,
  created_by_user_id
) VALUES (
  UUID(),
  CONCAT('INV-', DATE_FORMAT(NOW(), '%Y%m'), '-', LPAD(FLOOR(RAND() * 10000), 4, '0')),
  'sale',
  'draft',
  1, -- from_user_id (change to your user ID)
  2, -- to_user_id (change to another user or admin)
  NULL, -- property_id (or use actual property ID)
  NULL, -- transaction_id
  1000.00, -- amount
  0.00, -- tax_amount
  1000.00, -- total_amount
  'ETB',
  0.00, -- paid_amount
  1000.00, -- balance_due
  NOW(),
  DATE_ADD(NOW(), INTERVAL 30 DAY),
  JSON_ARRAY(
    JSON_OBJECT(
      'description', 'Test Payment',
      'amount', 1000.00,
      'quantity', 1
    )
  ),
  'Test invoice for payment integration',
  1 -- created_by_user_id (change to your user ID)
);

-- Get the invoice ID
SELECT * FROM invoices ORDER BY id DESC LIMIT 1;