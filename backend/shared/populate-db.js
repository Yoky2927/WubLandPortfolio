// backend/shared/populate-db.js - FIXED WITH CLEARING
import mysql from 'mysql2/promise';
import seedData from './seed-data.js';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wubland_portfolio_db',
  multipleStatements: true
};

async function populateDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // =============================================
    // STEP 0: CLEAR EXISTING DATA
    // =============================================
    console.log('\n🗑️  Clearing existing data...');
    
    try {
      await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
      
      // Clear tables in reverse order (child tables first)
      const tables = [
        'property_images',
        'broker_reviews',
        'properties',
        'broker_availability',
        'broker_profiles',
        'user_preferences',
        'users'
      ];
      
      for (const table of tables) {
        try {
          await connection.execute(`DELETE FROM ${table}`);
          console.log(`   Cleared ${table}`);
        } catch (err) {
          console.log(`   ⚠️  Could not clear ${table}: ${err.message}`);
        }
      }
      
      // Reset auto-increment
      await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE properties AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE broker_profiles AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE property_images AUTO_INCREMENT = 1');
      
      await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
      console.log('✅ All data cleared successfully');
    } catch (err) {
      console.error('❌ Error clearing data:', err.message);
    }

    // =============================================
    // STEP 1: INSERT USERS
    // =============================================
    console.log('\n👥 Inserting users...');
    
    const userIdMap = {};
    
    for (let i = 0; i < seedData.users.length; i++) {
      const user = seedData.users[i];
      try {
        const [result] = await connection.execute(
          `INSERT INTO users 
          (first_name, last_name, username, email, password, phone_number, 
           role, privilege_tier, profile_picture, bio, date_of_birth, 
           address, city, state, country, zip_code, is_email_verified, 
           verified, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.first_name,
            user.last_name,
            user.username,
            user.email,
            user.password,
            user.phone_number,
            user.role,
            user.privilege_tier,
            user.profile_picture,
            user.bio,
            user.date_of_birth,
            user.address,
            user.city,
            user.state,
            user.country,
            user.zip_code,
            user.is_email_verified || 1,
            user.verified || 1,
            user.status || 'active'
          ]
        );
        
        const userId = result.insertId;
        userIdMap[user.email] = userId;
        console.log(`   ✅ Added user: ${user.username} (ID: ${userId})`);
      } catch (err) {
        console.error(`   ❌ Error inserting user ${user.username}: ${err.message}`);
        // Try to get existing user ID
        try {
          const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [user.email]
          );
          if (existing.length > 0) {
            userIdMap[user.email] = existing[0].id;
            console.log(`   ⚡ Using existing user: ${user.username} (ID: ${existing[0].id})`);
          }
        } catch (lookupErr) {
          console.error(`   ❌ Could not find existing user: ${lookupErr.message}`);
        }
      }
    }

    // =============================================
    // STEP 2: GET SELLER USER ID (Critical)
    // =============================================
    const sellerUserId = userIdMap['seller@wubland.com'];
    if (!sellerUserId) {
      // Try to get seller ID from database
      try {
        const [seller] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          ['seller@wubland.com']
        );
        if (seller.length > 0) {
          console.log(`⚡ Found seller user ID: ${seller[0].id}`);
        } else {
          console.error('❌ CRITICAL: Seller user not found! Cannot insert properties.');
          return;
        }
      } catch (err) {
        console.error('❌ Could not find seller user:', err.message);
        return;
      }
    }

    // =============================================
    // STEP 3: INSERT PROPERTIES
    // =============================================
    console.log('\n🏠 Inserting properties...');
    
    let insertedProperties = 0;
    const propertyIdMap = {};
    
    for (let i = 0; i < seedData.properties.length; i++) {
      const property = seedData.properties[i];
      try {
        // Check if property already exists
        const [existing] = await connection.execute(
          'SELECT id FROM properties WHERE title = ? AND address = ?',
          [property.title, property.address]
        );
        
        if (existing.length > 0) {
          propertyIdMap[i] = existing[0].id;
          console.log(`   ⚡ Property already exists: "${property.title}" (ID: ${existing[0].id})`);
          continue;
        }
        
        const [result] = await connection.execute(
          `INSERT INTO properties 
          (property_uuid, title, description, property_type, property_status,
           address, city, state, country, zip_code, neighborhood, latitude, longitude,
           google_place_id, region, beds, baths, sqft, lot_size, year_built, garage_spaces, parking_spaces,
           price, currency, price_per_sqft, is_negotiable, deposit_amount, monthly_rent,
           listing_type, mls_number, mls_source, listing_date, expiration_date,
           owner_user_id, created_by_user_id, assigned_broker_id, is_exclusive,
           features, amenities, property_tags, views_count, saves_count, inquiries_count,
           is_featured, is_premium, average_rating, total_reviews, tax_amount, hoa_fees,
           insurance_amount, est_payment, price_history, tax_history, nearby_schools, floor_plans, status_history,
           published_at, last_modified_by_user_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            property.property_uuid,
            property.title,
            property.description,
            property.property_type,
            property.property_status || 'active',
            property.address,
            property.city,
            property.state,
            property.country,
            property.zip_code,
            property.neighborhood,
            property.latitude,
            property.longitude,
            property.google_place_id,
            property.region,
            property.beds,
            property.baths,
            property.sqft,
            property.lot_size,
            property.year_built,
            property.garage_spaces,
            property.parking_spaces,
            property.price,
            property.currency,
            property.price_per_sqft,
            property.is_negotiable ? 1 : 0,
            property.deposit_amount,
            property.monthly_rent,
            property.listing_type,
            property.mls_number,
            property.mls_source,
            property.listing_date,
            property.expiration_date,
            sellerUserId,
            sellerUserId,
            property.assigned_broker_id,
            property.is_exclusive ? 1 : 0,
            property.features,
            property.amenities,
            property.property_tags,
            property.views_count,
            property.saves_count,
            property.inquiries_count,
            property.is_featured ? 1 : 0,
            property.is_premium ? 1 : 0,
            property.average_rating,
            property.total_reviews,
            property.tax_amount,
            property.hoa_fees,
            property.insurance_amount,
            property.est_payment,
            property.price_history,
            property.tax_history,
            property.nearby_schools,
            property.floor_plans,
            property.status_history,
            property.published_at,
            sellerUserId
          ]
        );
        
        const propertyId = result.insertId;
        propertyIdMap[i] = propertyId;
        insertedProperties++;
        console.log(`   ✅ Added property: "${property.title}" (ID: ${propertyId})`);
      } catch (err) {
        console.error(`❌ Error inserting property "${property.title}":`, err.message);
        if (err.sqlMessage) console.error(`   SQL Error: ${err.sqlMessage}`);
      }
    }

    // =============================================
    // STEP 4: INSERT PROPERTY IMAGES
    // =============================================
    console.log('\n🖼️  Inserting property images...');
    
    let insertedImages = 0;
    if (seedData.propertyImages && seedData.propertyImages.length > 0) {
      for (const image of seedData.propertyImages) {
        try {
          const propertyId = propertyIdMap[image.property_id - 1];
          if (!propertyId) {
            console.log(`   ⚠️  Skipping image - property ID ${image.property_id} not found`);
            continue;
          }
          
          await connection.execute(
            `INSERT INTO property_images 
            (property_id, image_url, thumbnail_url, image_order, caption, 
             alt_text, file_size, mime_type, width, height, is_primary, 
             uploaded_by_user_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              propertyId,
              image.image_url,
              image.thumbnail_url,
              image.image_order,
              image.caption,
              image.alt_text,
              image.file_size,
              image.mime_type,
              image.width,
              image.height,
              image.is_primary ? 1 : 0,
              sellerUserId
            ]
          );
          insertedImages++;
        } catch (err) {
          console.error(`   ❌ Error inserting image: ${err.message}`);
        }
      }
    }
    console.log(`   ✅ Added ${insertedImages} property images`);

    // =============================================
    // STEP 5: VERIFY DATA
    // =============================================
    console.log('\n📊 =============================================');
    console.log('✅ DATABASE POPULATION COMPLETE!');
    console.log('=============================================');
    
    // Count records
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [propertyCount] = await connection.execute('SELECT COUNT(*) as count FROM properties');
    const [imageCount] = await connection.execute('SELECT COUNT(*) as count FROM property_images');
    
    console.log(`📈 Summary:`);
    console.log(`   👥 Users: ${userCount[0].count}`);
    console.log(`   🏠 Properties: ${propertyCount[0].count}`);
    console.log(`   🖼️  Property Images: ${imageCount[0].count}`);
    
    // Check if properties have the new fields
    if (propertyCount[0].count > 0) {
      const [sampleProps] = await connection.execute(
        `SELECT 
          id, 
          title,
          price_history,
          tax_history,
          nearby_schools,
          floor_plans,
          status_history
        FROM properties 
        LIMIT 2`
      );
      
      console.log('\n🔍 Sample Properties Data Check:');
      sampleProps.forEach((prop, idx) => {
        console.log(`\n   Property ${idx + 1}: ${prop.title} (ID: ${prop.id})`);
        
        // Check if fields exist and have data
        console.log(`      ✅ Price History: ${prop.price_history && prop.price_history !== '[]' ? '✓' : '✗'}`);
        console.log(`      ✅ Tax History: ${prop.tax_history && prop.tax_history !== '[]' ? '✓' : '✗'}`);
        console.log(`      ✅ Nearby Schools: ${prop.nearby_schools && prop.nearby_schools !== '[]' ? '✓' : '✗'}`);
        console.log(`      ✅ Floor Plans: ${prop.floor_plans && prop.floor_plans !== '[]' ? '✓' : '✗'}`);
        console.log(`      ✅ Status History: ${prop.status_history && prop.status_history !== '[]' ? '✓' : '✗'}`);
        
        // Parse to show counts
        try {
          if (prop.price_history) {
            const parsed = JSON.parse(prop.price_history);
            console.log(`         Price History entries: ${parsed.length}`);
          }
          if (prop.nearby_schools) {
            const parsed = JSON.parse(prop.nearby_schools);
            console.log(`         Nearby schools: ${parsed.length}`);
          }
        } catch (e) {
          // Ignore parse errors
        }
      });
    }
    
    console.log('\n🔗 Test your API endpoints:');
    console.log('   🌐 All Properties: GET http://localhost:5002/api/properties');
    console.log('   🔍 Single Property: GET http://localhost:5002/api/properties/1');
    
    console.log('\n💡 Your PropertyDetailsPopup should now show:');
    console.log('   • Price History Charts');
    console.log('   • Tax History Information');
    console.log('   • Nearby Schools Data');
    console.log('   • Floor Plans');
    
    console.log('\n🚀 Database is ready! Restart your backend if needed.');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    if (error.stack) console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the population script
populateDatabase().catch(console.error);