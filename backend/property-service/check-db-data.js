// check-db-data.js - Simple script to check what's in your database
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wubland_portfolio_db',
    port: process.env.DB_PORT || 3306,
  });

  console.log('🔍 Checking database contents...\n');

  try {
    // Check properties table
    console.log('📊 PROPERTIES TABLE:');
    const [properties] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN property_status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN property_status = 'draft' THEN 1 ELSE 0 END) as draft,
        SUM(CASE WHEN property_status = 'sold' THEN 1 ELSE 0 END) as sold,
        SUM(CASE WHEN property_status = 'rented' THEN 1 ELSE 0 END) as rented,
        SUM(CASE WHEN listing_type = 'sale' THEN 1 ELSE 0 END) as for_sale,
        SUM(CASE WHEN listing_type = 'rent' THEN 1 ELSE 0 END) as for_rent,
        AVG(price) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM properties 
      WHERE deleted_at IS NULL
    `);
    console.log(properties[0]);

    // Show some sample properties
    console.log('\n📋 SAMPLE PROPERTIES (first 5):');
    const [sampleProps] = await connection.execute(`
      SELECT id, property_uuid, title, city, property_type, listing_type, 
             property_status, price, beds, baths, created_at
      FROM properties 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    sampleProps.forEach((prop, i) => {
      console.log(`\n${i + 1}. ${prop.title}`);
      console.log(`   ID: ${prop.id}, UUID: ${prop.property_uuid}`);
      console.log(`   Location: ${prop.city}, Type: ${prop.property_type}`);
      console.log(`   Status: ${prop.property_status}, Listing: ${prop.listing_type}`);
      console.log(`   Price: ${prop.price} ETB, Beds: ${prop.beds}, Baths: ${prop.baths}`);
      console.log(`   Created: ${prop.created_at}`);
    });

    // Check users with broker profiles
    console.log('\n👥 BROKERS IN SYSTEM:');
    const [brokers] = await connection.execute(`
      SELECT 
        u.id, u.username, u.email, u.role,
        bp.broker_type, bp.license_number, bp.is_verified,
        bp.total_completed_deals, bp.average_rating
      FROM users u
      LEFT JOIN broker_profiles bp ON u.id = bp.user_id
      WHERE u.role LIKE '%broker%' AND u.status = 'active'
      ORDER BY u.id
    `);
    
    if (brokers.length > 0) {
      brokers.forEach((broker, i) => {
        console.log(`\n${i + 1}. ${broker.username} (${broker.email})`);
        console.log(`   ID: ${broker.id}, Role: ${broker.role}`);
        console.log(`   Broker Type: ${broker.broker_type}, Verified: ${broker.is_verified}`);
        console.log(`   Completed Deals: ${broker.total_completed_deals}, Rating: ${broker.average_rating}`);
        console.log(`   License: ${broker.license_number || 'N/A'}`);
      });
    } else {
      console.log('No brokers found in the system.');
    }

    // Check property images
    console.log('\n🖼️ PROPERTY IMAGES COUNT:');
    const [images] = await connection.execute(`
      SELECT 
        COUNT(*) as total_images,
        COUNT(DISTINCT property_id) as properties_with_images
      FROM property_images 
      WHERE deleted_at IS NULL
    `);
    console.log(images[0]);

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabase().catch(console.error);