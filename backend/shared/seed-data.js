// backend/shared/seed-data.js

// Helper function to generate UUIDs
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to generate sample price history
const generatePriceHistory = (price, isForRent = false) => {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(now.getMonth() - 3);
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);
  
  if (isForRent) {
    return JSON.stringify([
      {
        date: threeMonthsAgo.toISOString().split('T')[0],
        event: 'Listed for rent',
        price: price * 0.95
      },
      {
        date: oneMonthAgo.toISOString().split('T')[0],
        event: 'Price reduced',
        price: price * 0.90
      },
      {
        date: now.toISOString().split('T')[0],
        event: 'Current price',
        price: price
      }
    ]);
  } else {
    return JSON.stringify([
      {
        date: threeMonthsAgo.toISOString().split('T')[0],
        event: 'Listed for sale',
        price: price * 0.95
      },
      {
        date: oneMonthAgo.toISOString().split('T')[0],
        event: 'Price increased',
        price: price * 1.05
      },
      {
        date: now.toISOString().split('T')[0],
        event: 'Price reduced',
        price: price
      }
    ]);
  }
};

// Helper to generate tax history
const generateTaxHistory = (price) => {
  return JSON.stringify([
    {
      year: 2024,
      assessment: price * 0.7,
      tax: price * 0.014,
      change: '+5%'
    },
    {
      year: 2023,
      assessment: price * 0.66,
      tax: price * 0.013,
      change: '+3%'
    },
    {
      year: 2022,
      assessment: price * 0.64,
      tax: price * 0.013,
      change: '0%'
    }
  ]);
};

// Helper to generate nearby schools
const generateNearbySchools = (city) => {
  const schools = {
    'Addis Ababa': [
      {
        name: 'International School of Ethiopia',
        grades: 'K-12',
        type: 'Private',
        distance: '0.8 miles',
        rating: 9.2,
        description: 'Top-ranked international school with IB curriculum'
      },
      {
        name: 'Bole Preparatory School',
        grades: '1-8',
        type: 'Public',
        distance: '1.2 miles',
        rating: 7.8,
        description: 'Well-regarded public school with strong academics'
      }
    ],
    'Gondar': [
      {
        name: 'Fasiledes School',
        grades: '1-12',
        type: 'Public',
        distance: '0.5 miles',
        rating: 7.9,
        description: 'Historic school in the heart of Gondar'
      },
      {
        name: 'Gondar International School',
        grades: 'K-12',
        type: 'Private',
        distance: '1.0 miles',
        rating: 8.1,
        description: 'International curriculum with modern facilities'
      }
    ],
    'Mekelle': [
      {
        name: 'Mekelle International School',
        grades: 'K-12',
        type: 'Private',
        distance: '0.7 miles',
        rating: 8.3,
        description: 'Leading international school in Tigray region'
      }
    ],
    'Bahirdar': [
      {
        name: 'Bahir Dar International School',
        grades: 'K-12',
        type: 'Private',
        distance: '0.6 miles',
        rating: 8.4,
        description: 'International curriculum with lake views'
      }
    ],
    'Adama': [
      {
        name: 'Adama International School',
        grades: 'K-12',
        type: 'Private',
        distance: '0.9 miles',
        rating: 8.0,
        description: 'International school serving Adama community'
      }
    ]
  };
  
  return JSON.stringify(schools[city] || [
    {
      name: 'Local Community School',
      grades: '1-8',
      type: 'Public',
      distance: '1.0 miles',
      rating: 7.0,
      description: 'Community school serving local residents'
    }
  ]);
};

// Helper to generate floor plans
const generateFloorPlans = (sqft, beds, baths) => {
  return JSON.stringify([
    {
      name: 'Main Floor Plan',
      sqft: Math.floor(sqft * 0.6),
      beds: Math.max(1, Math.floor(beds * 0.6)),
      baths: Math.max(1, Math.floor(baths * 0.6)),
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811',
      description: 'Main living area with open concept design'
    }
  ]);
};

// Helper to generate status history
const generateStatusHistory = (ownerId) => {
  return JSON.stringify([{
    status: 'active',
    changed_at: new Date().toISOString(),
    changed_by: ownerId
  }]);
};

// =============================================
// PROPERTIES DATA (Direct definition)
// =============================================

export const properties = [
  {
    title: "Luxury Villa in Bole",
    description: "A magnificent luxury villa with panoramic city views, located in the prestigious Bole area of Addis Ababa. This property features 5 bedrooms, 6 bathrooms, a swimming pool, and lush gardens.",
    property_type: "villa",
    property_status: "active",
    address: "Summit St. George, Bole, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    neighborhood: "Bole",
    region: "Bole",
    beds: 5,
    baths: 6,
    sqft: 5500,
    lot_size: 1200,
    year_built: 2020,
    garage_spaces: 3,
    parking_spaces: 5,
    price: 26000000,
    currency: "ETB",
    price_per_sqft: 4727,
    is_negotiable: true,
    deposit_amount: 2600000,
    monthly_rent: 0,
    listing_type: "sale",
    mls_number: "ET001234",
    mls_source: "Ethiopian MLS",
    listing_date: "2024-01-15",
    expiration_date: "2024-04-15",
    owner_user_id: 5,
    created_by_user_id: 5,
    assigned_broker_id: 3, // Beza
    is_exclusive: true,
    features: '["swimming pool", "garden", "security system", "smart home"]',
    amenities: '["gym", "spa", "wine cellar", "home theater"]',
    property_tags: '["luxury", "villa", "bole", "premium"]',
    views_count: 150,
    saves_count: 25,
    inquiries_count: 12,
    is_featured: 1,
    is_premium: 1,
    average_rating: 4.8,
    total_reviews: 5,
    tax_amount: 260000,
    hoa_fees: 50000,
    insurance_amount: 130000,
    est_payment: 2600000,
    latitude: 9.0320,
    longitude: 38.7468,
    google_place_id: null
  },
  {
    title: "Modern Apartment in Cazanchise",
    description: "Contemporary 3-bedroom apartment in the heart of Cazanchise with modern finishes and city views. Perfect for young professionals or small families.",
    property_type: "apartment",
    property_status: "active",
    address: "Cazanchise Square, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    neighborhood: "Cazanchise",
    region: "Cazanchise",
    beds: 3,
    baths: 2,
    sqft: 1800,
    lot_size: 0,
    year_built: 2019,
    garage_spaces: 1,
    parking_spaces: 2,
    price: 7000000,
    currency: "ETB",
    price_per_sqft: 3888,
    is_negotiable: true,
    deposit_amount: 14000000,
    monthly_rent: 70000,
    listing_type: "rent",
    mls_number: "ET001235",
    mls_source: "Ethiopian MLS",
    listing_date: "2024-02-01",
    expiration_date: "2024-05-01",
    owner_user_id: 5,
    created_by_user_id: 5,
    assigned_broker_id: 9, // Elias
    is_exclusive: 0,
    features: '["balcony", "modern kitchen", "built-in wardrobes"]',
    amenities: '["elevator", "parking", "security", "gym"]',
    property_tags: '["apartment", "modern", "cazanchise", "rental"]',
    views_count: 120,
    saves_count: 18,
    inquiries_count: 8,
    is_featured: 1,
    is_premium: 1,
    average_rating: 4.5,
    total_reviews: 3,
    tax_amount: 70000,
    hoa_fees: 10000,
    insurance_amount: 35000,
    est_payment: 70000,
    latitude: 9.0320,
    longitude: 38.7468,
    google_place_id: null
  },
  {
    title: "Cozy Cottage in Gondar",
    description: "Charming traditional cottage in the historic city of Gondar. Features 2 bedrooms, rustic decor, and a beautiful garden. Close to historic sites.",
    property_type: "cottage",
    property_status: "active",
    address: "Fasil Ghebbi Area, Gondar",
    city: "Gondar",
    state: "Amhara",
    country: "Ethiopia",
    zip_code: "2000",
    neighborhood: "Fasil Ghebbi",
    region: "Fasil Ghebbi",
    beds: 2,
    baths: 1,
    sqft: 1200,
    lot_size: 800,
    year_built: 2010,
    garage_spaces: 0,
    parking_spaces: 1,
    price: 3000000,
    currency: "ETB",
    price_per_sqft: 2500,
    is_negotiable: true,
    deposit_amount: 300000,
    monthly_rent: 0,
    listing_type: "sale",
    mls_number: "ET001236",
    mls_source: "Gondar MLS",
    listing_date: "2024-01-20",
    expiration_date: "2024-04-20",
    owner_user_id: 5,
    created_by_user_id: 5,
    assigned_broker_id: 9, // Elias
    is_exclusive: 0,
    features: '["garden", "fireplace", "traditional architecture"]',
    amenities: '["patio", "storage shed", "fruit trees"]',
    property_tags: '["cottage", "traditional", "gondar", "historic"]',
    views_count: 85,
    saves_count: 12,
    inquiries_count: 6,
    is_featured: 0,
    is_premium: 0,
    average_rating: 4.3,
    total_reviews: 2,
    tax_amount: 30000,
    hoa_fees: 0,
    insurance_amount: 15000,
    est_payment: 300000,
    latitude: 12.6030,
    longitude: 37.4521,
    google_place_id: null
  },
  {
    title: "Penthouse Suite in Mekelle",
    description: "Exclusive penthouse suite with stunning mountain views in Mekelle city center. Features 4 bedrooms, private rooftop terrace, and premium finishes.",
    property_type: "penthouse",
    property_status: "active",
    address: "Downtown Mekelle, Tigray",
    city: "Mekelle",
    state: "Tigray",
    country: "Ethiopia",
    zip_code: "6000",
    neighborhood: "Downtown",
    region: "Downtown",
    beds: 4,
    baths: 4,
    sqft: 3200,
    lot_size: 0,
    year_built: 2022,
    garage_spaces: 2,
    parking_spaces: 3,
    price: 45000000,
    currency: "ETB",
    price_per_sqft: 14062,
    is_negotiable: true,
    deposit_amount: 4500000,
    monthly_rent: 0,
    listing_type: "sale",
    mls_number: "ET001237",
    mls_source: "Tigray MLS",
    listing_date: "2024-02-10",
    expiration_date: "2024-05-10",
    owner_user_id: 5,
    created_by_user_id: 5,
    assigned_broker_id: 3, // Beza
    is_exclusive: 1,
    features: '["rooftop terrace", "panoramic views", "smart home"]',
    amenities: '["concierge", "private elevator", "wine cellar", "home theater"]',
    property_tags: '["penthouse", "luxury", "mekelle", "premium"]',
    views_count: 95,
    saves_count: 15,
    inquiries_count: 7,
    is_featured: 1,
    is_premium: 1,
    average_rating: 4.9,
    total_reviews: 8,
    tax_amount: 450000,
    hoa_fees: 20000,
    insurance_amount: 225000,
    est_payment: 4500000,
    latitude: 13.4967,
    longitude: 39.4753,
    google_place_id: null
  }
].map((property, index) => {
  // Add generated fields
  return {
    property_uuid: generateUUID(),
    ...property,
    // Generate dynamic fields
    price_history: generatePriceHistory(property.price, property.listing_type === "rent"),
    status_history: generateStatusHistory(property.owner_user_id),
    tax_history: generateTaxHistory(property.price),
    nearby_schools: generateNearbySchools(property.city),
    floor_plans: generateFloorPlans(property.sqft, property.beds, property.baths),
    published_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    last_modified_by_user_id: property.owner_user_id,
    // Image URLs for property_images table
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994"
    ]
  };
});

// =============================================
// CORE USER DATA (Keep existing)
// =============================================

export const users = [
  {
    first_name: "Yokabd",
    last_name: "Bililign",
    username: "yokabd_admin",
    email: "yokabd@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251911223344",
    role: "super_admin",
    privilege_tier: "enterprise",
    feature_flags: "{}",
    profile_picture: null,
    bio: "System super administrator and project lead",
    date_of_birth: "1990-05-15",
    address: "Bole Road, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Saron",
    last_name: "Tesfaye",
    username: "saron_admin",
    email: "saron@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251922334455",
    role: "admin",
    privilege_tier: "premium",
    feature_flags: "{}",
    profile_picture: null,
    bio: "Platform administrator",
    date_of_birth: "1992-08-20",
    address: "Megenagna, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Beza",
    last_name: "Hilemariam",
    username: "beza_hilemariam",
    email: "beza@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251911223344",
    role: "internal_broker",
    privilege_tier: "premium",
    feature_flags: "{}",
    profile_picture: "/images/brokers/beza.jpg",
    bio: "Premium internal real estate broker specializing in commercial properties",
    date_of_birth: "1988-03-10",
    address: "Kirkos Sub-city, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Birtukan",
    last_name: "Yemataw",
    username: "birtukan_support",
    email: "birtukan@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251944556677",
    role: "support_agent",
    privilege_tier: "standard",
    feature_flags: "{}",
    profile_picture: null,
    bio: "Customer support specialist with 3 years experience",
    date_of_birth: "1995-11-25",
    address: "Lideta, Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Test",
    last_name: "Seller",
    username: "test_seller",
    email: "seller@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251955667788",
    role: "seller",
    privilege_tier: "basic",
    feature_flags: "{}",
    profile_picture: null,
    bio: "Homeowner looking to sell family property",
    date_of_birth: "1985-07-12",
    address: "Gondar Town",
    city: "Gondar",
    state: "Amhara",
    country: "Ethiopia",
    zip_code: "2000",
    is_email_verified: 1,
    verified: 0,
    status: "active"
  },
  {
    first_name: "Mikias",
    last_name: "Girma",
    username: "mikias_admin",
    email: "mikias@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251966778899",
    role: "admin",
    privilege_tier: "premium",
    feature_flags: "{}",
    profile_picture: null,
    bio: "System administrator and technical lead",
    date_of_birth: "1991-04-18",
    address: "Bishoftu Town",
    city: "Bishoftu",
    state: "Oromia",
    country: "Ethiopia",
    zip_code: "3000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Hana",
    last_name: "Solomon",
    username: "hana_lead",
    email: "hana@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251977889900",
    role: "support_lead",
    privilege_tier: "premium",
    feature_flags: "{}",
    profile_picture: null,
    bio: "Support team lead and escalation point with 5 years experience",
    date_of_birth: "1989-09-30",
    address: "Hawassa City",
    city: "Hawassa",
    state: "Sidama",
    country: "Ethiopia",
    zip_code: "4000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Daniel",
    last_name: "Mekonnen",
    username: "daniel_support_admin",
    email: "daniel@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251988990011",
    role: "support_admin",
    privilege_tier: "enterprise",
    feature_flags: "{}",
    profile_picture: null,
    bio: "Support administration and team management",
    date_of_birth: "1987-12-05",
    address: "Bahir Dar City",
    city: "Bahir Dar",
    state: "Amhara",
    country: "Ethiopia",
    zip_code: "5000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Elias",
    last_name: "Kebede",
    username: "elias_kebede",
    email: "elias@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251922334455",
    role: "external_broker",
    privilege_tier: "standard",
    feature_flags: "{}",
    profile_picture: "/images/brokers/elias.jpg",
    bio: "Independent real estate broker specializing in residential properties",
    date_of_birth: "1986-06-22",
    address: "Mekele City",
    city: "Mekele",
    state: "Tigray",
    country: "Ethiopia",
    zip_code: "6000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  },
  {
    first_name: "Admin",
    last_name: "User",
    username: "admin",
    email: "admin@wubland.com",
    password: "$2b$10$EUwQv7kAO0TThvOjAcEySOwyGgSYTjIlE58YBvaD2OvRfIexGYrNO",
    phone_number: "+251900000000",
    role: "super_admin",
    privilege_tier: "enterprise",
    feature_flags: "{}",
    profile_picture: null,
    bio: "System super administrator",
    date_of_birth: "1990-01-01",
    address: "Addis Ababa",
    city: "Addis Ababa",
    state: "Addis Ababa",
    country: "Ethiopia",
    zip_code: "1000",
    is_email_verified: 1,
    verified: 1,
    status: "active"
  }
];

// =============================================
// USER PREFERENCES DATA
// =============================================

export const userPreferences = users.map((user, index) => ({
  user_id: index + 1,
  notification_email: 1,
  notification_sms: 0,
  notification_push: 1,
  language: "en",
  timezone: "Africa/Addis_Ababa",
  theme: "light",
  email_frequency: "immediate",
}));

// =============================================
// BROKER PROFILES DATA
// =============================================

export const brokerProfiles = [
  {
    user_id: 3,
    broker_type: "internal",
    license_number: "ET-BRK-001",
    license_expiry: "2026-12-31",
    years_experience: 8,
    specialization: '["luxury-homes", "commercial", "international-clients"]',
    total_completed_deals: 47,
    total_sales: 250000000,
    average_rating: 4.8,
    review_count: 23,
    commission_rate: 2.5,
    service_fee: 0,
    is_available: 1,
    max_clients: 10,
    current_active_clients: 3,
    languages: '["amharic", "english", "oromo"]',
    service_areas: '["Addis Ababa", "Bole", "Cazanchise", "Kirkos"]',
    is_verified: 1,
    bio_english: "Premium internal real estate broker with extensive experience in luxury residential and commercial properties across Addis Ababa.",
    bio_amharic: "ሙሉ ልምድ ያለው የንግድ እና የቤት ንብረት ወኪል በአዲስ አበባ እና ከተማ አካባቢዎች።",
  },
  {
    user_id: 9,
    broker_type: "external",
    license_number: "ET-BRK-002",
    license_expiry: "2025-11-30",
    years_experience: 5,
    specialization: '["apartments", "rentals", "first-time-buyers"]',
    total_completed_deals: 32,
    total_sales: 85000000,
    average_rating: 4.6,
    review_count: 15,
    commission_rate: 2.0,
    service_fee: 500,
    is_available: 1,
    max_clients: 8,
    current_active_clients: 2,
    languages: '["amharic", "english", "tigrigna"]',
    service_areas: '["Mekele", "Adigrat", "Axum", "Adwa"]',
    is_verified: 1,
    bio_english: "Independent real estate broker specializing in residential properties and rental markets across Northern Ethiopia.",
    bio_amharic: "በሰሜን ኢትዮጵያ የቤት ንብረት እና የኪራይ ገበያ ላይ ልምድ ያለው የግል ወኪል።",
  }
];

// =============================================
// BROKER AVAILABILITY DATA
// =============================================

export const brokerAvailability = [
  { broker_id: 3, day_of_week: "monday", start_time: "08:00", end_time: "17:00", is_available: 1 },
  { broker_id: 3, day_of_week: "tuesday", start_time: "08:00", end_time: "17:00", is_available: 1 },
  { broker_id: 3, day_of_week: "wednesday", start_time: "08:00", end_time: "17:00", is_available: 1 },
  { broker_id: 3, day_of_week: "thursday", start_time: "08:00", end_time: "17:00", is_available: 1 },
  { broker_id: 3, day_of_week: "friday", start_time: "08:00", end_time: "17:00", is_available: 1 },
  { broker_id: 3, day_of_week: "saturday", start_time: "10:00", end_time: "14:00", is_available: 1 },
  { broker_id: 3, day_of_week: "sunday", start_time: "00:00", end_time: "00:00", is_available: 0 },
  
  { broker_id: 9, day_of_week: "monday", start_time: "09:00", end_time: "18:00", is_available: 1 },
  { broker_id: 9, day_of_week: "tuesday", start_time: "09:00", end_time: "18:00", is_available: 1 },
  { broker_id: 9, day_of_week: "wednesday", start_time: "09:00", end_time: "18:00", is_available: 1 },
  { broker_id: 9, day_of_week: "thursday", start_time: "09:00", end_time: "18:00", is_available: 1 },
  { broker_id: 9, day_of_week: "friday", start_time: "09:00", end_time: "18:00", is_available: 1 },
  { broker_id: 9, day_of_week: "saturday", start_time: "11:00", end_time: "15:00", is_available: 1 },
  { broker_id: 9, day_of_week: "sunday", start_time: "12:00", end_time: "16:00", is_available: 1 }
];

// =============================================
// PROPERTY IMAGES DATA
// =============================================

export const propertyImages = properties.flatMap((property, index) => {
  const propertyId = index + 1;
  const images = property.images || [];
  
  return images.map((imageUrl, imgIndex) => ({
    property_id: propertyId,
    image_url: imageUrl,
    thumbnail_url: imageUrl,
    image_order: imgIndex,
    caption: `${property.title} - Image ${imgIndex + 1}`,
    alt_text: `${property.title} in ${property.city}`,
    file_size: 1024 * 500,
    mime_type: 'image/jpeg',
    width: 800,
    height: 600,
    is_primary: imgIndex === 0 ? 1 : 0,
    uploaded_by_user_id: property.owner_user_id,
  }));
});

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
    is_editable: 1,
    is_public: 0
  },
  {
    config_key: "chat.premium_features",
    config_value: '["unlimited_messages", "group_chats", "file_sharing"]',
    data_type: "array",
    description: "Features available to premium users",
    category: "communication",
    is_editable: 1,
    is_public: 0
  },
  {
    config_key: "support.sla_first_response",
    config_value: "1440",
    data_type: "number",
    description: "SLA for first response in minutes",
    category: "support",
    is_editable: 1,
    is_public: 0
  }
];

// =============================================
// PRIVILEGE TEMPLATES DATA
// =============================================

export const privilegeTemplates = [
  {
    template_name: "internal_broker_premium",
    role_type: "broker",
    tier: "premium",
    privileges: '{"properties": {"manage": ["create", "read", "update", "delete", "bulk_upload", "list_directly", "feature"], "limits": {"max_listings": 1000, "max_images": 50, "max_featured": 20}}}',
    monthly_price: 299.00,
    is_active: 1,
    description: "Premium internal broker with full feature access",
  }
];

// =============================================
// EXPORT ALL DATA
// =============================================

export default {
  users,
  userPreferences,
  brokerProfiles,
  brokerAvailability,
  properties,
  propertyImages,
  systemConfigurations,
  privilegeTemplates,
};