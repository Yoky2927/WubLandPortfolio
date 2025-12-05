// shared/seed-data.js
import { sampleProperties } from './sampleProperties.js';
import { sampleBrokers } from './sampleBroker.js';

// =============================================
// CORE USER DATA
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
// PROPERTIES DATA (from sampleProperties)
// =============================================

export const properties = sampleProperties.map(property => ({
  title: property.title,
  price: property.price,
  address: property.address,
  city: property.city,
  region: property.region,
  beds: property.beds,
  baths: property.baths,
  sqft: property.sqft,
  garage: property.garage,
  property_type: property.propertyType,
  property_status: property.propertyStatus,
  price_per_sqft: property.pricePerSqft,
  year_built: property.yearBuilt,
  lot_size: property.lotSize,
  description: property.description,
  images: JSON.stringify(property.images),
  features: JSON.stringify(property.features),
  coordinates: JSON.stringify(property.coordinates),
  listed_date: new Date(Date.now() - property.listedDate * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  views: property.views,
  saves: property.saves,
  mls_number: property.mlsNumber,
  source: property.source,
  est_payment: property.estPayment,
  premium: property.premium,
  broker_id: property.broker.id, // Map to user ID from sampleBrokers
  price_history: JSON.stringify(property.priceHistory),
  tax_history: JSON.stringify(property.taxHistory),
  nearby_schools: JSON.stringify(property.nearbySchools),
  floor_plans: JSON.stringify(property.floorPlans),
}));

// =============================================
// TODO SERVICE DATA
// =============================================

export const todos = [
  {
    user_id: 2, // Saron Tesfaye
    title: "Review pending user verifications",
    description: "Check and verify 15 pending user account applications that require manual review",
    category: "user_management",
    priority: "high",
    status: "pending",
    due_date: "2025-10-20",
    estimated_hours: 3.5,
    assigned_to: 2,
    created_by: 1,
    department: "administration",
  },
  {
    user_id: 7, // Hana Solomon
    title: "Handle escalated support tickets",
    description: "Resolve 5 high-priority escalated support tickets from VIP customers",
    category: "support_tickets",
    priority: "urgent",
    status: "in_progress",
    due_date: "2025-10-19",
    estimated_hours: 4.0,
    assigned_to: 7,
    created_by: 1,
    department: "support",
  },
  {
    user_id: 6, // Mikias Girma
    title: "Monthly security audit",
    description: "Conduct comprehensive system security review and generate security report",
    category: "security_review",
    priority: "high",
    status: "pending",
    due_date: "2025-10-25",
    estimated_hours: 6.0,
    assigned_to: 6,
    created_by: 1,
    department: "technical",
  },
  {
    user_id: 4, // Birtukan Yemataw
    title: "Update knowledge base for new features",
    description: "Create documentation and help articles for recently launched property search features",
    category: "knowledge_base",
    priority: "medium",
    status: "pending",
    due_date: "2025-10-22",
    estimated_hours: 5.0,
    assigned_to: 4,
    created_by: 2,
    department: "support",
  },
  {
    user_id: 2, // Saron Tesfaye
    title: "Review flagged property listings",
    description: "Investigate 8 flagged property listings for potential policy violations",
    category: "flagged_content",
    priority: "medium",
    status: "in_progress",
    due_date: "2025-10-18",
    estimated_hours: 2.5,
    assigned_to: 2,
    created_by: 1,
    department: "moderation",
  },
  {
    user_id: 8, // Daniel Mekonnen
    title: "Prepare monthly performance report",
    description: "Compile support team performance metrics and generate monthly report for stakeholders",
    category: "report_generation",
    priority: "medium",
    status: "pending",
    due_date: "2025-10-28",
    estimated_hours: 3.0,
    assigned_to: 8,
    created_by: 1,
    department: "administration",
  },
  {
    user_id: 7, // Hana Solomon
    title: "Team training: New ticket system features",
    description: "Prepare and conduct training session on new ticket management system features",
    category: "training_development",
    priority: "low",
    status: "pending",
    due_date: "2025-10-30",
    estimated_hours: 4.0,
    assigned_to: 7,
    created_by: 8,
    department: "support",
  },
  {
    user_id: 6, // Mikias Girma
    title: "System backup verification",
    description: "Verify all system backups are completed successfully and test restoration process",
    category: "system_maintenance",
    priority: "high",
    status: "completed",
    due_date: "2025-10-15",
    estimated_hours: 2.0,
    actual_hours: 1.5,
    assigned_to: 6,
    created_by: 1,
    department: "technical",
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
    source: "web",
  },
  {
    ticket_number: "TKT-2024-002",
    user_id: 11, // Samuel Alemu
    subject: "Payment not processed",
    description: "Payment made 3 days ago for premium listing still showing as pending. Need urgent resolution.",
    category: "payment",
    subcategory: "transaction_issue",
    priority: "high",
    status: "in_progress",
    assigned_to: 2, // Saron Tesfaye
    source: "web",
  },
  {
    ticket_number: "TKT-2024-003",
    user_id: 12, // Liya Gebre
    subject: "Account verification issue",
    description: "Email verification link not working. Tried multiple times but cannot verify account.",
    category: "account",
    subcategory: "verification",
    priority: "medium",
    status: "resolved",
    assigned_to: 4, // Birtukan Yemataw
    source: "web",
    resolved_at: "2024-10-15 10:30:00",
    customer_rating: 5,
  },
  {
    ticket_number: "TKT-2024-004",
    user_id: 13, // Tigist Assefa
    subject: "Property search filters not working",
    description: "When applying multiple filters to property search, results are not accurate or show no properties.",
    category: "technical",
    subcategory: "search_functionality",
    priority: "medium",
    status: "open",
    assigned_to: 4, // Birtukan Yemataw
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
    content: `# How to Reset Your Password

If you've forgotten your password or need to reset it for security reasons, follow these steps:

## Step-by-Step Guide

1. Go to the login page
2. Click on "Forgot Password" link
3. Enter your registered email address
4. Check your email for the password reset link
5. Click the link and create a new password
6. Log in with your new password

## Requirements
- New password must be at least 8 characters long
- Include uppercase and lowercase letters
- Include at least one number
- Include at least one special character

## Troubleshooting
- If you don't receive the email, check your spam folder
- Ensure you're using the correct email address
- Contact support if issues persist`,
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
  {
    article_number: "KB-002",
    title: "Understanding Payment Processing",
    content: `# Understanding Payment Processing

Learn how payments are processed on our platform and typical timelines for different transaction types.

## Payment Methods
We accept the following payment methods:
- Credit/Debit Cards (Visa, MasterCard)
- Bank Transfers
- Mobile Money
- Digital Wallets

## Processing Times
- Credit Card: 1-2 business days
- Bank Transfer: 2-3 business days
- Mobile Money: Instant to 24 hours

## Common Issues
- Failed transactions
- Pending payments
- Refund processing
- Currency conversion`,
    excerpt: "Learn how payments are processed on our platform and typical timelines",
    category: "payment",
    author_id: 2, // Saron Tesfaye
    status: "published",
    slug: "understanding-payment-processing",
    is_featured: true,
    views: 876,
    helpful_votes: 67,
    published_at: "2024-09-05 10:00:00",
  },
  {
    article_number: "KB-003",
    title: "Property Listing Guidelines",
    content: `# Property Listing Guidelines

Complete guide to creating and managing property listings on our platform.

## Required Information
- Property title and description
- Location details
- Price information
- Property specifications
- High-quality images
- Contact information

## Image Requirements
- Minimum 3 photos, maximum 20
- File size: Up to 5MB per image
- Supported formats: JPG, PNG, WebP
- No watermarks or logos

## Prohibited Content
- False or misleading information
- Duplicate listings
- Inappropriate content
- Personal contact information in descriptions`,
    excerpt: "Complete guide to creating and managing property listings",
    category: "property",
    author_id: 3, // Beza Hilemariam
    status: "published",
    slug: "property-listing-guidelines",
    is_featured: true,
    views: 1543,
    helpful_votes: 112,
    published_at: "2024-09-10 11:00:00",
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
  {
    config_key: "support.sla_first_response",
    config_value: "1440",
    data_type: "number",
    description: "SLA for first response in minutes",
    category: "support",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
  {
    config_key: "support.sla_resolution",
    config_value: "10080",
    data_type: "number",
    description: "SLA for ticket resolution in minutes",
    category: "support",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
  {
    config_key: "user.verification_required",
    config_value: "true",
    data_type: "boolean",
    description: "Whether email verification is required",
    category: "user",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
  {
    config_key: "system.maintenance_mode",
    config_value: "false",
    data_type: "boolean",
    description: "System maintenance mode",
    category: "system",
    is_editable: true,
    is_public: true,
    updated_by: 1,
  },
  {
    config_key: "user.auto_verification_threshold",
    config_value: "100",
    data_type: "number",
    description: "Minimum transaction amount for automatic user verification",
    category: "user",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
  {
    config_key: "support.working_hours",
    config_value: JSON.stringify({ start: "08:00", end: "18:00", timezone: "Africa/Addis_Ababa" }),
    data_type: "object",
    description: "Support team working hours",
    category: "support",
    is_editable: true,
    is_public: false,
    updated_by: 1,
  },
  {
    config_key: "broker.commission_rate",
    config_value: "2.5",
    data_type: "number",
    description: "Default commission rate for brokers",
    category: "financial",
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
      analytics: ["advanced_reports", "market_trends"]
    }),
    monthly_price: 299.00,
    is_active: true,
    description: "Premium internal broker with full feature access",
  },
  {
    template_name: "external_broker_standard",
    role_type: "broker",
    tier: "standard",
    privileges: JSON.stringify({
      properties: {
        manage: ["create", "read", "update", "delete", "list_directly"],
        limits: { max_listings: 100, max_images: 20, max_featured: 5 }
      },
      communication: {
        chat: ["unlimited_messages", "initiate_chats"],
        limits: { max_active_chats: 50 }
      },
      analytics: ["basic_reports"]
    }),
    monthly_price: 99.00,
    is_active: true,
    description: "Standard external broker with basic features",
  },
  {
    template_name: "support_agent_basic",
    role_type: "support",
    tier: "basic",
    privileges: JSON.stringify({
      support: ["view_assigned_tickets", "respond", "resolve"],
      knowledge_base: ["create", "suggest_updates"],
      communication: ["view_assigned_chats", "respond_chats"]
    }),
    monthly_price: 0.00,
    is_active: true,
    description: "Basic support agent privileges",
  },
];

// =============================================
// NOTIFICATIONS DATA
// =============================================

export const notifications = [
  {
    user_id: 3, // Beza Hilemariam
    title: "New Property Inquiry",
    message: "Meron Teshome has inquired about your Luxury Villa listing",
    type: "info",
    is_read: false,
    action_url: "/messages",
    related_entity_type: "property",
    related_entity_id: 1,
    expires_at: "2024-10-25 23:59:59",
  },
  {
    user_id: 9, // Elias Kebede
    title: "Rental Application Received",
    message: "Liya Gebre has submitted a rental application for your Modern Apartment",
    type: "success",
    is_read: true,
    action_url: "/applications",
    related_entity_type: "property",
    related_entity_id: 2,
    read_at: "2024-10-18 11:30:00",
  },
  {
    user_id: 10, // Meron Teshome
    title: "Welcome to WubLand!",
    message: "Your account has been successfully created. Start browsing properties now!",
    type: "success",
    is_read: true,
    action_url: "/properties",
    related_entity_type: "user",
    related_entity_id: 10,
    read_at: "2024-10-17 16:10:00",
  },
];

// =============================================
// SUPPORT AGENT ACTIVITIES DATA
// =============================================

export const supportAgentActivities = [
  {
    agent_username: "birtukan_support",
    activity_type: "ticket_resolved",
    target_id: 3,
    target_type: "ticket",
    details: "Resolved account verification issue for user liya_renter",
  },
  {
    agent_username: "saron_admin",
    activity_type: "ticket_assigned",
    target_id: 2,
    target_type: "ticket",
    details: "Assigned to high priority payment issue ticket",
  },
  {
    agent_username: "birtukan_support",
    activity_type: "article_created",
    target_id: 1,
    target_type: "article",
    details: "Created new knowledge base article about password reset",
  },
];

// =============================================
// FLAGGED CONTENT DATA
// =============================================

export const flaggedContent = [
  {
    flag_number: "FLG-2024-001",
    content_type: "property_listing",
    content_id: "8",
    content_url: "/properties/8",
    reported_by_user_id: 10, // Meron Teshome
    reason: "Suspicious price - seems too low for the location",
    additional_details: "Property in prime area listed at 50% below market value",
    severity: "medium",
    status: "pending",
  },
  {
    flag_number: "FLG-2024-002",
    content_type: "user_message",
    content_id: "45",
    content_url: "/messages/45",
    reported_by_user_id: 11, // Samuel Alemu
    reason: "Inappropriate language in chat",
    additional_details: "User used offensive language during property discussion",
    severity: "high",
    status: "under_review",
    assigned_to: 2, // Saron Tesfaye
    assigned_at: "2024-10-18 10:00:00",
  },
];

// =============================================
// PENDING REGISTRATIONS DATA
// =============================================

export const pendingRegistrations = [
  {
    first_name: "sindu",
    last_name: "tadese",
    username: "sindutadese",
    email: "yokabdbi@gmail.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    role: "user",
    broker_type: null,
    email_verification_token: "test_token_123",
    email_verification_expires: "2024-10-25 23:59:59",
  },
];

// =============================================
// ARTICLE FEEDBACK DATA
// =============================================

export const articleFeedback = [
  {
    article_id: 1,
    user_id: 10,
    was_helpful: true,
    feedback_comment: "Very clear instructions, helped me reset my password quickly!",
  },
  {
    article_id: 2,
    user_id: 11,
    was_helpful: true,
    feedback_comment: "Good overview of payment processing times",
  },
  {
    article_id: 3,
    user_id: 12,
    was_helpful: false,
    feedback_comment: "Could use more examples of good vs bad property photos",
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
  todos,
  supportTickets,
  knowledgeBaseArticles,
  systemConfigurations,
  privilegeTemplates,
  notifications,
  supportAgentActivities,
  flaggedContent,
  pendingRegistrations,
  articleFeedback,
};