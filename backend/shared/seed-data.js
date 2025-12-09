// shared/seed-data.js
import { sampleProperties } from './sampleProperties.js';
import { sampleBrokers } from './sampleBroker.js';

// Helper function to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// =============================================
// CORE USER DATA (Updated with new schema fields)
// =============================================

export const users = [
  // Yokabd Bililign - Super Admin
  {
    first_name: "Yokabd",
    last_name: "Bililign",
    username: "yokabd_admin",
    email: "yokabd@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO", // 123456
    phone_number: "+251911223344",
    role: "super_admin",
    privilege_tier: "enterprise",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "System super administrator and project lead",
    date_of_birth: "1990-05-15",
    address: "Bole Road, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 10:00:00",
    last_activity: "2024-10-18 12:00:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 0,
    last_message_time: null,
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Saron Tesfaye - Admin
  {
    first_name: "Saron",
    last_name: "Tesfaye",
    username: "saron_admin",
    email: "saron@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251922334455",
    role: "admin",
    privilege_tier: "premium",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Platform administrator",
    date_of_birth: "1992-08-20",
    address: "Megenagna, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 09:30:00",
    last_activity: "2024-10-18 11:45:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 0,
    last_message_time: null,
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Beza Hilemariam - Internal Broker (matches sampleBrokers[0])
  {
    first_name: "Beza",
    last_name: "Hilemariam",
    username: "beza_broker",
    email: "beza@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251933445566",
    role: "internal_broker",
    privilege_tier: "premium",
    feature_flags: JSON.stringify({}),
    profile_picture: "/uploads/profiles/beza.jpg",
    bio: "Premium internal real estate broker specializing in commercial properties",
    date_of_birth: "1988-03-10",
    address: "Kirkos Sub-city, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 08:15:00",
    last_activity: "2024-10-18 10:30:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 5,
    last_message_time: "2024-10-18 10:25:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Birtukan Yemataw - Support Agent
  {
    first_name: "Birtukan",
    last_name: "Yemataw",
    username: "birtukan_support",
    email: "birtukan@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251944556677",
    role: "support_agent",
    privilege_tier: "standard",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Customer support specialist with 3 years experience",
    date_of_birth: "1995-11-25",
    address: "Lideta, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 08:00:00",
    last_activity: "2024-10-18 12:30:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 12,
    last_message_time: "2024-10-18 12:15:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Beletu Wolde - Seller
  {
    first_name: "Beletu",
    last_name: "Wolde",
    username: "beletu_seller",
    email: "beletu@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251955667788",
    role: "seller",
    privilege_tier: "basic",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Homeowner looking to sell family property",
    date_of_birth: "1985-07-12",
    address: "Gondar Town",
    city: "Gondar",
    state: "Amhara",
    country: "Ethiopia",
    zip_code: "2000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: false,
    status: "active",
    last_login: "2024-10-17 14:20:00",
    last_activity: "2024-10-17 16:45:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 3,
    last_message_time: "2024-10-17 16:30:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Mikias Girma - Admin
  {
    first_name: "Mikias",
    last_name: "Girma",
    username: "mikias_admin",
    email: "mikias@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251966778899",
    role: "admin",
    privilege_tier: "premium",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "System administrator and technical lead",
    date_of_birth: "1991-04-18",
    address: "Bishoftu Town",
    city: "Bishoftu",
    state: "Oromia",
    country: "Ethiopia",
    zip_code: "3000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 07:45:00",
    last_activity: "2024-10-18 11:20:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 8,
    last_message_time: "2024-10-18 11:10:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Hana Solomon - Support Lead
  {
    first_name: "Hana",
    last_name: "Solomon",
    username: "hana_lead",
    email: "hana@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251977889900",
    role: "support_lead",
    privilege_tier: "premium",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Support team lead and escalation point with 5 years experience",
    date_of_birth: "1989-09-30",
    address: "Hawassa City",
    city: "Hawassa",
    state: "Sidama",
    country: "Ethiopia",
    zip_code: "4000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 08:30:00",
    last_activity: "2024-10-18 13:15:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 15,
    last_message_time: "2024-10-18 13:00:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Daniel Mekonnen - Support Admin
  {
    first_name: "Daniel",
    last_name: "Mekonnen",
    username: "daniel_support_admin",
    email: "daniel@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251988990011",
    role: "support_admin",
    privilege_tier: "enterprise",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Support administration and team management",
    date_of_birth: "1987-12-05",
    address: "Bahir Dar City",
    city: "Bahir Dar",
    state: "Amhara",
    country: "Ethiopia",
    zip_code: "5000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 07:30:00",
    last_activity: "2024-10-18 14:00:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 20,
    last_message_time: "2024-10-18 13:45:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Elias Kebede - External Broker (matches sampleBrokers[1])
  {
    first_name: "Elias",
    last_name: "Kebede",
    username: "elias_broker",
    email: "elias@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251999001122",
    role: "external_broker",
    privilege_tier: "standard",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Independent real estate broker specializing in residential properties",
    date_of_birth: "1986-06-22",
    address: "Mekele City",
    city: "Mekele",
    state: "Tigray",
    country: "Ethiopia",
    zip_code: "6000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: true,
    status: "active",
    last_login: "2024-10-18 09:00:00",
    last_activity: "2024-10-18 12:45:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 25,
    last_message_time: "2024-10-18 12:30:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Meron Teshome - Buyer
  {
    first_name: "Meron",
    last_name: "Teshome",
    username: "meron_buyer",
    email: "meron@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251910112233",
    role: "buyer",
    privilege_tier: "basic",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Looking for a family home in Addis Ababa",
    date_of_birth: "1993-02-14",
    address: "Debre Markos Town",
    city: "Debre Markos",
    state: "Amhara",
    country: "Ethiopia",
    zip_code: "7000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: false,
    status: "active",
    last_login: "2024-10-17 16:00:00",
    last_activity: "2024-10-17 18:30:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 7,
    last_message_time: "2024-10-17 18:15:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Samuel Alemu - Landlord
  {
    first_name: "Samuel",
    last_name: "Alemu",
    username: "samuel_landlord",
    email: "samuel@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251920223344",
    role: "landlord",
    privilege_tier: "basic",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Property owner with multiple rental units",
    date_of_birth: "1978-10-08",
    address: "Jimma City",
    city: "Jimma",
    state: "Oromia",
    country: "Ethiopia",
    zip_code: "8000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: false,
    status: "active",
    last_login: "2024-10-16 11:00:00",
    last_activity: "2024-10-16 13:45:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 4,
    last_message_time: "2024-10-16 13:30:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Liya Gebre - Renter
  {
    first_name: "Liya",
    last_name: "Gebre",
    username: "liya_renter",
    email: "liya@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251930334455",
    role: "renter",
    privilege_tier: "basic",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "University student looking for affordable housing",
    date_of_birth: "2000-01-20",
    address: "Arba Minch Town",
    city: "Arba Minch",
    state: "SNNPR",
    country: "Ethiopia",
    zip_code: "9000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: false,
    status: "active",
    last_login: "2024-10-18 10:30:00",
    last_activity: "2024-10-18 12:15:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 6,
    last_message_time: "2024-10-18 12:00:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
  // Tigist Assefa - Regular User
  {
    first_name: "Tigist",
    last_name: "Assefa",
    username: "tigist_user",
    email: "tigist@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251940445566",
    role: "user",
    privilege_tier: "basic",
    feature_flags: JSON.stringify({}),
    profile_picture: null,
    bio: "Exploring property options for future investment",
    date_of_birth: "1994-03-25",
    address: "Dire Dawa City",
    city: "Dire Dawa",
    state: "Dire Dawa",
    country: "Ethiopia",
    zip_code: "3000",
    is_email_verified: true,
    email_verification_token: null,
    email_verification_expires: null,
    password_change_required: false,
    login_attempts: 0,
    lock_until: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    verified: false,
    status: "active",
    last_login: "2024-10-17 15:00:00",
    last_activity: "2024-10-17 17:20:00",
    subscription_ends_at: null,
    stripe_customer_id: null,
    message_count: 2,
    last_message_time: "2024-10-17 17:10:00",
    created_by_user_id: 1,
    last_modified_by_user_id: 1,
  },
];

// =============================================
// USER PREFERENCES DATA
// =============================================

export const userPreferences = users.map((user, index) => ({
  user_id: index + 1, // Auto-increment IDs start at 1
  notification_email: true,
  notification_sms: false,
  notification_push: true,
  language: "en",
  timezone: "Africa/Addis_Ababa",
  theme: "light",
  email_frequency: "immediate",
}));

// =============================================
// BROKER PROFILES DATA (from sampleBrokers)
// =============================================

export const brokerProfiles = [
  // Beza Hilemariam (User ID: 3)
  {
    user_id: 3,
    broker_type: "internal",
    license_number: "ET-BRK-2020-003",
    license_expiry: "2026-12-31",
    years_experience: 5,
    specialization: JSON.stringify(["residential", "luxury", "commercial"]),
    total_completed_deals: 47,
    total_sales: 250000000,
    average_rating: 4.8,
    review_count: 23,
    commission_rate: 2.5,
    service_fee: 0,
    is_available: true,
    max_clients: 10,
    current_active_clients: 3,
    languages: JSON.stringify(["english", "amharic"]),
    service_areas: JSON.stringify(["Addis Ababa", "Bole", "Cazanchise", "Kirkos"]),
    is_verified: true,
    verified_at: "2024-01-15 10:00:00",
    bio_english: "Premium internal real estate broker with extensive experience in luxury residential and commercial properties across Addis Ababa.",
    bio_amharic: "ሙሉ ልምድ ያለው የንግድ እና የቤት ንብረት ወኪል በአዲስ አበባ እና ከተማ አካባቢዎች።",
  },
  // Elias Kebede (User ID: 9)
  {
    user_id: 9,
    broker_type: "external",
    license_number: "ET-BRK-2021-013",
    license_expiry: "2025-11-30",
    years_experience: 4,
    specialization: JSON.stringify(["residential", "apartments", "rental"]),
    total_completed_deals: 28,
    total_sales: 85000000,
    average_rating: 4.6,
    review_count: 15,
    commission_rate: 2.0,
    service_fee: 500,
    is_available: true,
    max_clients: 8,
    current_active_clients: 2,
    languages: JSON.stringify(["english", "amharic", "tigrigna"]),
    service_areas: JSON.stringify(["Mekele", "Adigrat", "Axum", "Adwa"]),
    is_verified: true,
    verified_at: "2024-02-20 14:30:00",
    bio_english: "Independent real estate broker specializing in residential properties and rental markets across Northern Ethiopia.",
    bio_amharic: "በሰሜን ኢትዮጵያ የቤት ንብረት እና የኪራይ ገበያ ላይ ልምድ ያለው የግል ወኪል።",
  },
];

// =============================================
// BROKER AVAILABILITY DATA
// =============================================

export const brokerAvailability = [
  // Beza Hilemariam (Monday-Friday)
  { broker_id: 3, day_of_week: "monday", start_time: "08:00", end_time: "17:00", is_available: true },
  { broker_id: 3, day_of_week: "tuesday", start_time: "08:00", end_time: "17:00", is_available: true },
  { broker_id: 3, day_of_week: "wednesday", start_time: "08:00", end_time: "17:00", is_available: true },
  { broker_id: 3, day_of_week: "thursday", start_time: "08:00", end_time: "17:00", is_available: true },
  { broker_id: 3, day_of_week: "friday", start_time: "08:00", end_time: "17:00", is_available: true },
  { broker_id: 3, day_of_week: "saturday", start_time: "10:00", end_time: "14:00", is_available: true },
  { broker_id: 3, day_of_week: "sunday", start_time: "00:00", end_time: "00:00", is_available: false },
  
  // Elias Kebede
  { broker_id: 9, day_of_week: "monday", start_time: "09:00", end_time: "18:00", is_available: true },
  { broker_id: 9, day_of_week: "tuesday", start_time: "09:00", end_time: "18:00", is_available: true },
  { broker_id: 9, day_of_week: "wednesday", start_time: "09:00", end_time: "18:00", is_available: true },
  { broker_id: 9, day_of_week: "thursday", start_time: "09:00", end_time: "18:00", is_available: true },
  { broker_id: 9, day_of_week: "friday", start_time: "09:00", end_time: "18:00", is_available: true },
  { broker_id: 9, day_of_week: "saturday", start_time: "11:00", end_time: "15:00", is_available: true },
  { broker_id: 9, day_of_week: "sunday", start_time: "12:00", end_time: "16:00", is_available: true },
];

// =============================================
// BROKER REVIEWS DATA
// =============================================

export const brokerReviews = [
  // Reviews for Beza Hilemariam
  {
    broker_id: 3,
    client_id: 10, // Meron Teshome
    property_id: 1, // Luxury Villa
    overall_rating: 5,
    communication_rating: 5,
    professionalism_rating: 5,
    knowledge_rating: 5,
    title_english: "Excellent Service!",
    title_amharic: "በጣም ጥሩ አገልግሎት!",
    comment_english: "Beza helped us find our dream home. Professional, knowledgeable, and always available.",
    comment_amharic: "ብዘ የህልማችንን ቤት እንድናገኝ ረድቶናል። ፕሮፌሽናል፣ ዕውቀት ያለው እና ሁልጊዜ የሚገኝ ነው።",
    transaction_type: "sale",
    transaction_date: "2024-08-15",
    transaction_amount: 26000000,
    is_approved: true,
    is_verified: true,
  },
  {
    broker_id: 3,
    client_id: 11, // Samuel Alemu
    property_id: 4, // Penthouse Suite
    overall_rating: 4,
    communication_rating: 4,
    professionalism_rating: 5,
    knowledge_rating: 5,
    title_english: "Great experience",
    title_amharic: "በጣም ጥሩ ተሞክሮ",
    comment_english: "Very professional and detailed in explaining all aspects of the property.",
    comment_amharic: "በጣም ፕሮፌሽናል እና ሁሉንም የንብረቱን ገጽታዎች በዝርዝር ያብራራል።",
    transaction_type: "sale",
    transaction_date: "2024-09-20",
    transaction_amount: 45000000,
    is_approved: true,
    is_verified: true,
  },
  // Reviews for Elias Kebede
  {
    broker_id: 9,
    client_id: 12, // Liya Gebre
    property_id: 2, // Modern Apartment
    overall_rating: 5,
    communication_rating: 5,
    professionalism_rating: 4,
    knowledge_rating: 5,
    title_english: "Helpful and responsive",
    title_amharic: "ረዳት እና ፈጣን ምላሽ",
    comment_english: "Elias found me the perfect apartment for my studies. Always quick to respond.",
    comment_amharic: "ኤልያስ ለትምህርቴ ፍጹም አፓርታማ አገኘልኝ። ሁልጊዜ ፈጣን ምላሽ ይሰጣል።",
    transaction_type: "rental",
    transaction_date: "2024-10-01",
    transaction_amount: 20000,
    is_approved: true,
    is_verified: true,
  },
  {
    broker_id: 9,
    client_id: 13, // Tigist Assefa
    property_id: 3, // Cozy Cottage
    overall_rating: 4,
    communication_rating: 4,
    professionalism_rating: 4,
    knowledge_rating: 5,
    title_english: "Good service",
    title_amharic: "ጥሩ አገልግሎት",
    comment_english: "Elias was very knowledgeable about the Mekelle property market.",
    comment_amharic: "ኤልያስ ስለ መቀሌ የንብረት ገበያ በጣም ዕውቀት ነበረው።",
    transaction_type: "sale",
    transaction_date: "2024-07-10",
    transaction_amount: 30000000,
    is_approved: true,
    is_verified: false,
  },
];

// =============================================
// PROPERTIES DATA (Updated for new schema)
// =============================================

export const properties = sampleProperties.map(property => {
  // Map old property type to new ENUM values
  const propertyTypeMap = {
    'Single Family Residence': 'house',
    'Apartment': 'apartment',
    'Cottage': 'house',
    'Penthouse': 'apartment',
    'Villa': 'house',
    'Loft': 'apartment'
  };

  // Map property status
  const propertyStatusMap = {
    'for sale': 'active',
    'for rent': 'active'
  };

  // Determine owner user ID (use seller/landlord users)
  let ownerUserId;
  if (property.title.includes('Villa') || property.title.includes('Penthouse')) {
    ownerUserId = 5; // Beletu Wolde (seller)
  } else if (property.title.includes('Apartment') || property.title.includes('Cottage')) {
    ownerUserId = 11; // Samuel Alemu (landlord)
  } else {
    ownerUserId = 5; // Default to Beletu Wolde
  }

  // Determine listing type
  const listingType = property.propertyStatus === 'for rent' ? 'rent' : 'sale';

  // Determine created by user ID (same as owner for now)
  const createdByUserId = ownerUserId;

  // Determine assigned broker ID from sampleBrokers
  const assignedBrokerId = property.broker.id;

  return {
    property_uuid: generateUUID(),
    title: property.title,
    description: property.description,
    property_type: propertyTypeMap[property.propertyType] || 'house',
    property_status: propertyStatusMap[property.propertyStatus] || 'active',
    address: property.address,
    city: property.city,
    state: property.region,
    country: 'Ethiopia',
    zip_code: property.city === 'Addis Ababa' ? '1000' : 
              property.city === 'Gondar' ? '2000' : 
              property.city === 'Mekelle' ? '6000' : '3000',
    neighborhood: property.region,
    // coordinates: `POINT(${property.coordinates[1]} ${property.coordinates[0]})`, // MySQL POINT format
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft,
    lot_size: property.lotSize || 0,
    year_built: property.yearBuilt,
    garage_spaces: property.garage,
    parking_spaces: property.garage,
    price: property.price,
    currency: 'ETB',
    price_per_sqft: property.pricePerSqft,
    is_negotiable: true,
    deposit_amount: property.price * 0.1, // 10% deposit
    monthly_rent: property.propertyStatus === 'for rent' ? property.price : 0,
    listing_type: listingType,
    mls_number: property.mlsNumber,
    listing_date: new Date(Date.now() - property.listedDate * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiration_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
    owner_user_id: ownerUserId,
    created_by_user_id: createdByUserId,
    assigned_broker_id: assignedBrokerId,
    is_exclusive: property.premium,
    features: JSON.stringify(property.features),
    amenities: JSON.stringify(['Water', 'Electricity', 'Security']),
    property_tags: JSON.stringify([property.propertyType, property.region]),
    views_count: property.views,
    saves_count: property.saves,
    inquiries_count: Math.floor(property.views * 0.1), // 10% of views
    is_featured: property.premium,
    is_premium: property.premium,
    tax_amount: property.price * 0.01, // 1% tax
    hoa_fees: 0,
    insurance_amount: property.price * 0.005, // 0.5% insurance
    price_history: JSON.stringify(property.priceHistory),
    status_history: JSON.stringify([
      {
        status: 'draft',
        changed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        changed_by: createdByUserId
      },
      {
        status: 'active',
        changed_at: new Date(Date.now() - property.listedDate * 24 * 60 * 60 * 1000).toISOString(),
        changed_by: createdByUserId
      }
    ]),
    published_at: new Date(Date.now() - property.listedDate * 24 * 60 * 60 * 1000).toISOString(),
    last_modified_by_user_id: createdByUserId,
  };
});

// =============================================
// PROPERTY IMAGES DATA
// =============================================

export const propertyImages = sampleProperties.flatMap((property, index) => {
  const propertyId = index + 1; // Assuming properties will have sequential IDs
  return property.images.map((imageUrl, imgIndex) => ({
    property_id: propertyId,
    image_url: imageUrl,
    thumbnail_url: imageUrl,
    image_order: imgIndex,
    caption: `${property.title} - Image ${imgIndex + 1}`,
    alt_text: `${property.title} in ${property.city}`,
    file_size: 1024 * 500, // 500KB
    mime_type: 'image/jpeg',
    width: 800,
    height: 600,
    is_primary: imgIndex === 0,
    uploaded_by_user_id: property.owner_user_id || 5,
  }));
});

// =============================================
// TODO SERVICE DATA (Updated with new schema)
// =============================================

export const todos = [
  {
    todo_uuid: generateUUID(),
    user_id: 2, // Saron Tesfaye
    title: "Review pending user verifications",
    description: "Check and verify 15 pending user account applications that require manual review",
    todo_type: "admin",
    category: "user_management",
    priority: "high",
    status: "pending",
    due_date: "2024-10-20",
    estimated_hours: 3.5,
    assigned_to: 2,
    assigned_by: 1,
    assigned_at: "2024-10-18 09:00:00",
    created_by: 1,
    department: "administration",
    reminder_sent: false,
    reminder_date: "2024-10-19",
  },
  {
    todo_uuid: generateUUID(),
    user_id: 7, // Hana Solomon
    title: "Handle escalated support tickets",
    description: "Resolve 5 high-priority escalated support tickets from VIP customers",
    todo_type: "admin",
    category: "support_tickets",
    priority: "urgent",
    status: "in_progress",
    due_date: "2024-10-19",
    estimated_hours: 4.0,
    assigned_to: 7,
    assigned_by: 1,
    assigned_at: "2024-10-18 10:00:00",
    created_by: 1,
    department: "support",
    reminder_sent: true,
    reminder_date: "2024-10-18",
  },
  {
    todo_uuid: generateUUID(),
    user_id: 6, // Mikias Girma
    title: "Monthly security audit",
    description: "Conduct comprehensive system security review and generate security report",
    todo_type: "admin",
    category: "security_review",
    priority: "high",
    status: "pending",
    due_date: "2024-10-25",
    estimated_hours: 6.0,
    assigned_to: 6,
    assigned_by: 1,
    assigned_at: "2024-10-18 11:00:00",
    created_by: 1,
    department: "technical",
    reminder_sent: false,
    reminder_date: "2024-10-24",
  },
];

// =============================================
// TRANSACTIONS DATA (New for schema)
// =============================================

export const transactions = [
  {
    transaction_uuid: generateUUID(),
    transaction_type: "sale",
    transaction_status: "closed",
    property_id: 1, // Luxury Villa
    buyer_user_id: 10, // Meron Teshome
    seller_user_id: 5, // Beletu Wolde
    broker_id: 3, // Beza Hilemariam
    offer_price: 26000000,
    final_price: 26000000,
    deposit_amount: 2600000,
    commission_amount: 650000,
    commission_rate: 2.5,
    tax_amount: 260000,
    fees_amount: 50000,
    currency: "ETB",
    offer_date: "2024-08-01",
    acceptance_date: "2024-08-05",
    closing_date: "2024-08-15",
    occupancy_date: "2024-09-01",
    terms: JSON.stringify({}),
    special_conditions: "Furniture included",
    created_by_user_id: 3,
    last_modified_by_user_id: 3,
    status_changed_at: "2024-08-15 14:00:00",
  },
  {
    transaction_uuid: generateUUID(),
    transaction_type: "rental",
    transaction_status: "approved",
    property_id: 2, // Modern Apartment
    buyer_user_id: 12, // Liya Gebre
    seller_user_id: 11, // Samuel Alemu
    broker_id: 9, // Elias Kebede
    offer_price: 20000,
    final_price: 20000,
    deposit_amount: 40000,
    commission_amount: 2000,
    commission_rate: 2.0,
    tax_amount: 200,
    fees_amount: 500,
    currency: "ETB",
    offer_date: "2024-09-25",
    acceptance_date: "2024-09-28",
    lease_start_date: "2024-10-01",
    lease_end_date: "2025-10-01",
    terms: JSON.stringify({}),
    special_conditions: "Utilities included",
    created_by_user_id: 9,
    last_modified_by_user_id: 9,
    status_changed_at: "2024-10-01 10:00:00",
  },
];

// =============================================
// OFFERS DATA (New for schema)
// =============================================

export const offers = [
  {
    offer_type: "purchase",
    offer_status: "accepted",
    property_id: 1,
    transaction_id: 1,
    offered_price: 26000000,
    offered_deposit: 2600000,
    offer_terms: "Standard purchase agreement with 30-day closing",
    expiration_date: "2024-08-10",
    offered_by_user_id: 10,
    owner_user_id: 5,
    response_notes: "Offer accepted as is",
    responded_at: "2024-08-05 15:30:00",
  },
  {
    offer_type: "rental",
    offer_status: "accepted",
    property_id: 2,
    transaction_id: 2,
    offered_price: 20000,
    offered_deposit: 40000,
    offer_terms: "12-month lease, utilities included",
    expiration_date: "2024-09-30",
    offered_by_user_id: 12,
    owner_user_id: 11,
    response_notes: "Offer accepted with utilities included",
    responded_at: "2024-09-28 11:45:00",
  },
];

// =============================================
// APPOINTMENTS DATA (New for schema)
// =============================================

export const appointments = [
  {
    appointment_uuid: generateUUID(),
    appointment_type: "property_showing",
    title: "Luxury Villa Viewing",
    description: "Initial property viewing for interested buyer",
    start_time: "2024-08-03 10:00:00",
    end_time: "2024-08-03 11:00:00",
    timezone: "Africa/Addis_Ababa",
    is_recurring: false,
    location_type: "property",
    location_address: "Summit St. George, Bole, Addis Ababa",
    property_id: 1,
    transaction_id: 1,
    organizer_user_id: 3,
    broker_id: 3,
    status: "completed",
    reminder_sent: true,
    created_by_user_id: 3,
  },
];

// =============================================
// SUPPORT TICKETS DATA
// =============================================

export const supportTickets = [
  {
    ticket_number: "TKT-2024-001",
    user_id: 10, // Meron Teshome
    subject: "Cannot upload property images",
    description: 'Getting error message "File size too large" when trying to upload property photos, even though files are under 5MB limit.',
    category: "technical",
    subcategory: "file_upload",
    priority: "medium",
    status: "open",
    assigned_to: 4, // Birtukan Yemataw
    assigned_at: "2024-10-18 09:00:00",
    source: "web",
  },
];

// =============================================
// KNOWLEDGE BASE ARTICLES DATA
// =============================================

export const knowledgeBaseArticles = [
  {
    article_number: "KB-001",
    title: "How to Reset Your Password",
    content: `# How to Reset Your Password\n\nIf you've forgotten your password or need to reset it for security reasons, follow these steps...`,
    excerpt: "Complete guide to resetting your password if you forget it",
    category: "account",
    author_id: 4, // Birtukan Yemataw
    status: "published",
    slug: "how-to-reset-password",
    is_featured: true,
    views: 1245,
    helpful_votes: 89,
    published_at: "2024-09-01 09:00:00",
  },
];

// =============================================
// SYSTEM CONFIGURATIONS DATA
// =============================================

export const systemConfigurations = [
  {
    config_key: "chat.free_message_limit",
    config_value: "10",
    data_type: "number",
    description: "Number of free messages for non-premium users",
    category: "communication",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
  {
    config_key: "chat.premium_features",
    config_value: JSON.stringify(["unlimited_messages", "group_chats", "file_sharing"]),
    data_type: "array",
    description: "Features available to premium users",
    category: "communication",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
];

// =============================================
// PRIVILEGE TEMPLATES DATA
// =============================================

export const privilegeTemplates = [
  {
    template_name: "internal_broker_premium",
    role_type: "broker",
    tier: "premium",
    privileges: JSON.stringify({
      properties: {
        manage: ["create", "read", "update", "delete", "bulk_upload", "list_directly", "feature"],
        limits: { max_listings: 1000, max_images: 50, max_featured: 20 }
      },
      communication: {
        chat: ["unlimited_messages", "initiate_chats", "group_chats"],
        limits: { max_active_chats: 100 }
      },
      analytics: ["advanced_reports", "market_trends"],
      transactions: ["create_offers", "manage_contracts", "view_financials"],
      payments: ["receive_commissions", "view_payment_history"]
    }),
    monthly_price: 299.00,
    is_active: true,
    description: "Premium internal broker with full feature access",
  },
];

// =============================================
// NOTIFICATIONS DATA (COMPLETE VERSION)
// =============================================

export const notifications = [
  // Notification for Beza Hilemariam (user_id: 3)
  {
    notification_uuid: generateUUID(),
    user_id: 3,
    title: "New Property Inquiry",
    message: "Meron Teshome has inquired about your Luxury Villa listing",
    notification_type: "property",
    is_read: false,
    is_archived: false,
    action_url: "/messages",
    icon: "home",
    related_entity_type: "property",
    related_entity_id: 1,
    priority: "medium",
    expires_at: "2024-12-31 23:59:59",
    delivery_methods: JSON.stringify(["in_app", "email"]),
    sent_at: "2024-10-18 09:00:00",
  },
  // Notification for Yokabd (user_id: 1)
  {
    notification_uuid: generateUUID(),
    user_id: 1,
    title: "Welcome to WubLand",
    message: "Welcome to the WubLand platform! Your account has been created successfully.",
    notification_type: "info",
    is_read: false,
    is_archived: false,
    action_url: "/dashboard",
    icon: "welcome",
    related_entity_type: "user",
    related_entity_id: 1,
    priority: "low",
    expires_at: "2024-12-31 23:59:59",
    delivery_methods: JSON.stringify(["in_app"]),
    sent_at: "2024-10-18 08:00:00",
  },
  // Notification for Saron (user_id: 2)
  {
    notification_uuid: generateUUID(),
    user_id: 2,
    title: "System Update Available",
    message: "A new system update is available. Please review the changes.",
    notification_type: "system",
    is_read: true,
    is_archived: false,
    action_url: "/admin/updates",
    icon: "system",
    related_entity_type: "system",
    related_entity_id: null,
    priority: "medium",
    expires_at: "2024-10-25 23:59:59",
    delivery_methods: JSON.stringify(["in_app", "email"]),
    sent_at: "2024-10-18 07:30:00",
    read_at: "2024-10-18 08:15:00",
  },
  // Notification for Birtukan (user_id: 4)
  {
    notification_uuid: generateUUID(),
    user_id: 4,
    title: "New Support Ticket Assigned",
    message: "You have been assigned to support ticket TKT-2024-001",
    notification_type: "info",
    is_read: false,
    is_archived: false,
    action_url: "/support/tickets/TKT-2024-001",
    icon: "support",
    related_entity_type: "ticket",
    related_entity_id: 1,
    priority: "high",
    expires_at: "2024-10-20 23:59:59",
    delivery_methods: JSON.stringify(["in_app"]),
    sent_at: "2024-10-18 09:15:00",
  },
  // Notification for Elias (user_id: 9)
  {
    notification_uuid: generateUUID(),
    user_id: 9,
    title: "New Client Message",
    message: "Liya Gebre has sent you a new message regarding the apartment.",
    notification_type: "message",
    is_read: false,
    is_archived: false,
    action_url: "/messages",
    icon: "message",
    related_entity_type: "message",
    related_entity_id: 1,
    priority: "medium",
    expires_at: "2024-10-19 23:59:59",
    delivery_methods: JSON.stringify(["in_app", "email"]),
    sent_at: "2024-10-18 10:30:00",
  },
  // Notification for Meron (user_id: 10)
  {
    notification_uuid: generateUUID(),
    user_id: 10,
    title: "Payment Reminder",
    message: "Your payment of ETB 2,600,000 is due in 3 days",
    notification_type: "reminder",
    is_read: false,
    is_archived: false,
    action_url: "/payments",
    icon: "payment",
    related_entity_type: "payment",
    related_entity_id: 1,
    priority: "high",
    expires_at: "2024-10-21 23:59:59",
    delivery_methods: JSON.stringify(["in_app", "email", "sms"]),
    sent_at: "2024-10-18 11:00:00",
  },
];

// =============================================
// EXPORT ALL DATA
// =============================================

export default {
  users,
  userPreferences,
  brokerProfiles,
  brokerAvailability,
  brokerReviews,
  properties,
  propertyImages,
  transactions,
  offers,
  appointments,
  todos,
  supportTickets,
  knowledgeBaseArticles,
  systemConfigurations,
  privilegeTemplates,
  notifications,
};