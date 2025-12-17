// insert-sample-properties.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function insertSampleProperties() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wubland_portfolio_db',
    port: process.env.DB_PORT || 3306,
  });

  console.log('📥 Inserting sample properties...\n');

  // Sample properties based on your frontend data
  const sampleProperties = [
    {
      property_uuid: uuidv4(),
      title: "Luxury Villa",
      description: "Stunning modern villa in the prestigious Bole area featuring panoramic city views, high-end finishes, and smart home technology.",
      property_type: "house",
      property_status: "active",
      address: "Summit St. George, Bole",
      city: "Addis Ababa",
      state: "Addis Ababa",
      country: "Ethiopia",
      beds: 3,
      baths: 3,
      sqft: 3200,
      lot_size: 5000,
      year_built: 2020,
      garage_spaces: 2,
      price: 26000000,
      currency: "ETB",
      price_per_sqft: 8125,
      listing_type: "sale",
      owner_user_id: 1,
      created_by_user_id: 1,
      assigned_broker_id: 3,
      features: JSON.stringify(["Swimming Pool", "Garden", "Security System", "Parking", "Smart Home", "Central AC"]),
      amenities: JSON.stringify(["Modern Kitchen", "Walk-in Closets", "Home Office", "Entertainment Room"]),
      property_tags: JSON.stringify(["luxury", "villa", "bole", "premium"]),
      is_featured: 1,
      is_premium: 1
    },
    {
      property_uuid: uuidv4(),
      title: "Modern Apartment",
      description: "Beautiful modern apartment in the heart of Gondar with easy access to historical sites and local markets.",
      property_type: "apartment",
      property_status: "active",
      address: "Yeho Street, Arada",
      city: "Gondar",
      state: "Amhara",
      country: "Ethiopia",
      beds: 2,
      baths: 1,
      sqft: 1200,
      lot_size: 800,
      year_built: 2018,
      price: 20000,
      currency: "ETB",
      price_per_sqft: 16.67,
      listing_type: "rent",
      monthly_rent: 20000,
      owner_user_id: 1,
      created_by_user_id: 1,
      assigned_broker_id: 9,
      features: JSON.stringify(["Balcony", "Modern Kitchen", "Security", "Parking"]),
      amenities: JSON.stringify(["Storage", "Laundry Room"]),
      property_tags: JSON.stringify(["apartment", "gondar", "rental"]),
      is_featured: 1,
      is_premium: 1
    },
    {
      property_uuid: uuidv4(),
      title: "Cozy Cottage",
      description: "Charming cottage with traditional architecture and modern amenities in Mekelle.",
      property_type: "house",
      property_status: "active",
      address: "Mekele Road, Kebele 18",
      city: "Mekelle",
      state: "Tigray",
      country: "Ethiopia",
      beds: 4,
      baths: 3,
      sqft: 2800,
      lot_size: 4000,
      year_built: 2015,
      garage_spaces: 2,
      price: 30000000,
      currency: "ETB",
      price_per_sqft: 10714,
      listing_type: "sale",
      owner_user_id: 1,
      created_by_user_id: 1,
      assigned_broker_id: 9,
      features: JSON.stringify(["Garden", "Fireplace", "Traditional Design"]),
      amenities: JSON.stringify(["Spacious Rooms", "Storage"]),
      property_tags: JSON.stringify(["cottage", "mekelle", "traditional"]),
      is_featured: 0,
      is_premium: 1
    }
  ];

  try {
    let insertedCount = 0;
    
    for (const property of sampleProperties) {
      const query = `
        INSERT INTO properties (
          property_uuid, title, description, property_type, property_status,
          address, city, state, country, beds, baths, sqft, lot_size,
          year_built, garage_spaces, price, currency, price_per_sqft,
          listing_type, monthly_rent, owner_user_id, created_by_user_id,
          assigned_broker_id, features, amenities, property_tags,
          is_featured, is_premium, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const values = [
        property.property_uuid,
        property.title,
        property.description,
        property.property_type,
        property.property_status,
        property.address,
        property.city,
        property.state,
        property.country,
        property.beds,
        property.baths,
        property.sqft,
        property.lot_size,
        property.year_built,
        property.garage_spaces || 0,
        property.price,
        property.currency,
        property.price_per_sqft,
        property.listing_type,
        property.monthly_rent || null,
        property.owner_user_id,
        property.created_by_user_id,
        property.assigned_broker_id,
        property.features,
        property.amenities,
        property.property_tags,
        property.is_featured,
        property.is_premium
      ];

      await connection.execute(query, values);
      insertedCount++;
      console.log(`✅ Inserted: ${property.title}`);
    }

    console.log(`\n🎉 Successfully inserted ${insertedCount} sample properties!`);
    
    // Verify the insertion
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM properties');
    console.log(`📊 Total properties in database: ${rows[0].count}`);

  } catch (error) {
    console.error('❌ Error inserting sample properties:', error.message);
  } finally {
    await connection.end();
  }
}

// Install uuid if not installed: npm install uuid
insertSampleProperties().catch(console.error);