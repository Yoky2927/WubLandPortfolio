// backend/shared/populate-db.js - FIXED VERSION
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

      const tables = [
        'property_images',
        'broker_availability', // Added this
        'broker_profiles', // Added this
        'properties',
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

      await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE properties AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE broker_profiles AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE property_images AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE broker_availability AUTO_INCREMENT = 1');

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
      }
    }

    // =============================================
    // STEP 2: GET SELLER USER ID
    // =============================================
    const sellerUserId = userIdMap['seller@wubland.com'];
    if (!sellerUserId) {
      console.error('❌ Seller user not found!');
      return;
    }
    console.log(`⚡ Using seller user ID: ${sellerUserId}`);

    // =============================================
    // STEP 3: INSERT BROKER PROFILES (Check if exists)
    // =============================================
    console.log('\n🤵 Inserting broker profiles...');

    if (seedData.brokerProfiles && seedData.brokerProfiles.length > 0) {
      console.log(`🔍 Found ${seedData.brokerProfiles.length} broker profiles in seed data`);

      for (const broker of seedData.brokerProfiles) {
        try {
          // Find the broker's email based on user_id
          let brokerEmail = null;
          let brokerUsername = null;

          // Map user_id to email (hardcoded mapping based on your seed data)
          if (broker.user_id === 3) {
            brokerEmail = 'beza@wubland.com';
            brokerUsername = 'beza_hilemariam';
          } else if (broker.user_id === 9) {
            brokerEmail = 'elias@wubland.com';
            brokerUsername = 'elias_kebede';
          }

          if (!brokerEmail) {
            console.log(`   ⚠️  Skipping broker profile - unknown user_id ${broker.user_id}`);
            continue;
          }

          const userId = userIdMap[brokerEmail];
          if (!userId) {
            console.log(`   ⚠️  Skipping broker profile - user not found for email ${brokerEmail}`);
            continue;
          }

          console.log(`   Processing broker: ${brokerUsername} (user_id: ${userId})`);

          await connection.execute(
            `INSERT INTO broker_profiles 
            (user_id, broker_type, license_number, license_expiry, years_experience, 
             specialization, total_completed_deals, total_sales, average_rating, 
             review_count, commission_rate, service_fee, is_available, max_clients, 
             current_active_clients, languages, service_areas, is_verified, 
             bio_english, bio_amharic) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              broker.broker_type,
              broker.license_number || null,
              broker.license_expiry || null,
              broker.years_experience || 0,
              broker.specialization || '[]',
              broker.total_completed_deals || 0,
              broker.total_sales || 0,
              broker.average_rating || 0,
              broker.review_count || 0,
              broker.commission_rate || 2.5,
              broker.service_fee || 0,
              broker.is_available ? 1 : 1, // Default to available
              broker.max_clients || 10,
              broker.current_active_clients || 0,
              broker.languages || '["amharic", "english"]',
              broker.service_areas || '[]',
              broker.is_verified ? 1 : 0,
              broker.bio_english || '',
              broker.bio_amharic || ''
            ]
          );
          console.log(`   ✅ Added broker profile for ${brokerUsername} (ID: ${userId})`);
        } catch (err) {
          console.error(`   ❌ Error inserting broker profile: ${err.message}`);
        }
      }
    } else {
      console.log('   ⚠️  No brokerProfiles found in seed data');
    }

    // =============================================
    // STEP 4: INSERT BROKER AVAILABILITY (Check if exists)
    // =============================================
    console.log('\n📅 Inserting broker availability...');

    if (seedData.brokerAvailability && seedData.brokerAvailability.length > 0) {
      console.log(`🔍 Found ${seedData.brokerAvailability.length} availability entries in seed data`);

      for (const availability of seedData.brokerAvailability) {
        try {
          let brokerEmail = null;

          // Map broker_id to email
          if (availability.broker_id === 3) {
            brokerEmail = 'beza@wubland.com';
          } else if (availability.broker_id === 9) {
            brokerEmail = 'elias@wubland.com';
          } else {
            console.log(`   ⚠️  Skipping availability - unknown broker_id ${availability.broker_id}`);
            continue;
          }

          const userId = userIdMap[brokerEmail];
          if (!userId) {
            console.log(`   ⚠️  Skipping availability - user not found for email ${brokerEmail}`);
            continue;
          }

          await connection.execute(
            `INSERT INTO broker_availability 
            (broker_id, day_of_week, start_time, end_time, is_available) 
            VALUES (?, ?, ?, ?, ?)`,
            [
              userId,
              availability.day_of_week,
              availability.start_time,
              availability.end_time,
              availability.is_available ? 1 : 1
            ]
          );
          console.log(`   ✅ Added availability for broker ${userId} (${availability.day_of_week})`);
        } catch (err) {
          console.error(`   ❌ Error inserting broker availability: ${err.message}`);
        }
      }
    } else {
      console.log('   ⚠️  No brokerAvailability found in seed data');
    }

    // =============================================
    // STEP 5: INSERT PROPERTIES
    // =============================================
    console.log('\n🏠 Inserting properties...');

    let insertedProperties = 0;
    const propertyIdMap = {};

    console.log(`🔍 Found ${seedData.properties.length} properties in seed data`);

    for (let i = 0; i < seedData.properties.length; i++) {
      const property = seedData.properties[i];
      console.log(`\n📝 Processing property ${i + 1}: "${property.title}"`);

      try {
        // Generate UUID if not present
        if (!property.property_uuid || property.property_uuid === '') {
          property.property_uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        console.log(`   UUID: ${property.property_uuid}`);

        // CORRECTED INSERT STATEMENT - Count matches your properties table schema
        const [result] = await connection.execute(
          `INSERT INTO properties 
          (property_uuid, title, description, property_type, property_status,
           address, city, state, country, zip_code, neighborhood, latitude, longitude,
           region, beds, baths, sqft, lot_size, year_built, garage_spaces, parking_spaces,
           price, currency, price_per_sqft, is_negotiable, deposit_amount, monthly_rent,
           listing_type, mls_number, mls_source, listing_date, expiration_date,
           owner_user_id, created_by_user_id, assigned_broker_id, is_exclusive,
           features, amenities, property_tags, views_count, saves_count, inquiries_count,
           is_featured, is_premium, tax_amount, hoa_fees, insurance_amount, est_payment, 
           price_history, tax_history, nearby_schools, floor_plans,
           published_at, last_modified_by_user_id, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,  // 56 question marks total
          [
            // Basic info (5)
            property.property_uuid,
            property.title,
            property.description,
            property.property_type,
            property.property_status || 'active',

            // Location (11)
            property.address,
            property.city,
            property.state,
            property.country,
            property.zip_code || '',
            property.neighborhood || '',
            property.latitude || null,
            property.longitude || null,
            property.region || '',

            // Property specs (8)
            property.beds || 0,
            property.baths || 0,
            property.sqft || 0,
            property.lot_size || 0,
            property.year_built || null,
            property.garage_spaces || 0,
            property.parking_spaces || 0,

            // Pricing (8)
            property.price,
            property.currency || 'ETB',
            property.price_per_sqft || 0,
            property.is_negotiable ? 1 : 0,
            property.deposit_amount || 0,
            property.monthly_rent || 0,
            property.listing_type,

            // Listing info (5)
            property.mls_number || '',
            property.mls_source || '',
            property.listing_date || null,
            property.expiration_date || null,

            // Ownership (5)
            sellerUserId,
            sellerUserId,
            property.assigned_broker_id || null,
            property.is_exclusive ? 1 : 0,

            // Features (3)
            property.features || '[]',
            property.amenities || '[]',
            property.property_tags || '[]',

            // Stats (3)
            property.views_count || 0,
            property.saves_count || 0,
            property.inquiries_count || 0,

            // Flags (2)
            property.is_featured ? 1 : 0,
            property.is_premium ? 1 : 0,

            // Financials (4) - REMOVED average_rating and total_reviews as they might be auto-calculated
            property.tax_amount || 0,
            property.hoa_fees || 0,
            property.insurance_amount || 0,
            property.est_payment || 0,

            // Historical data (4)
            property.price_history || '[]',
            property.tax_history || '[]',
            property.nearby_schools || '[]',
            property.floor_plans || '[]',

            // Timestamps (5)
            property.published_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
            sellerUserId,
            property.created_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
            property.updated_at || new Date().toISOString().slice(0, 19).replace('T', ' '),

            // NULL for deleted_at
            null
          ]
        );

        const propertyId = result.insertId;
        propertyIdMap[i] = propertyId;
        insertedProperties++;
        console.log(`   ✅ Added property: "${property.title}" (ID: ${propertyId})`);

      } catch (err) {
        console.error(`   ❌ Error inserting property "${property.title}":`, err.message);
        console.error(`   SQL Error: ${err.sqlMessage}`);
        console.error(`   Error code: ${err.code}`);

        // Try a simpler insert for debugging
        console.log('   🔄 Trying simplified insert...');
        try {
          const [simpleResult] = await connection.execute(
            `INSERT INTO properties 
            (property_uuid, title, description, property_type, property_status,
             address, city, state, country, price, currency, listing_type,
             owner_user_id, created_by_user_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
              property.price,
              property.currency || 'ETB',
              property.listing_type,
              sellerUserId,
              sellerUserId,
              property.created_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
              property.updated_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
            ]
          );

          const propertyId = simpleResult.insertId;
          propertyIdMap[i] = propertyId;
          insertedProperties++;
          console.log(`   ✅ Added basic property: "${property.title}" (ID: ${propertyId})`);

        } catch (simpleErr) {
          console.error(`   ❌ Simple insert also failed: ${simpleErr.message}`);
        }
      }
    }

    // =============================================
    // STEP 6: INSERT PROPERTY IMAGES
    // =============================================
    console.log('\n🖼️  Inserting property images...');

    let insertedImages = 0;
    if (seedData.propertyImages && seedData.propertyImages.length > 0) {
      console.log(`🔍 Found ${seedData.propertyImages.length} property images in seed data`);

      for (const image of seedData.propertyImages) {
        try {
          // Get property ID from map (seed data uses 1-based index, but our map is 0-based)
          const propertyIndex = image.property_id - 1;
          const propertyId = propertyIdMap[propertyIndex];

          if (!propertyId) {
            console.log(`   ⚠️  Skipping image - property ID ${image.property_id} not found in map`);
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
              image.thumbnail_url || image.image_url,
              image.image_order || 0,
              image.caption || '',
              image.alt_text || '',
              image.file_size || 0,
              image.mime_type || 'image/jpeg',
              image.width || 0,
              image.height || 0,
              image.is_primary ? 1 : 0,
              sellerUserId
            ]
          );
          insertedImages++;
          console.log(`   ✅ Added image ${insertedImages} for property ${propertyId}`);
        } catch (err) {
          console.error(`   ❌ Error inserting image: ${err.message}`);
        }
      }
    } else {
      console.log('   ⚠️  No propertyImages found in seed data');
    }
    console.log(`   ✅ Added ${insertedImages} property images`);

    // =============================================
    // STEP 7: VERIFY DATA
    // =============================================
    console.log('\n📊 =============================================');
    console.log('✅ DATABASE POPULATION COMPLETE!');
    console.log('=============================================');

    // Count records
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [brokerCount] = await connection.execute('SELECT COUNT(*) as count FROM broker_profiles');
    const [availabilityCount] = await connection.execute('SELECT COUNT(*) as count FROM broker_availability');
    const [propertyCount] = await connection.execute('SELECT COUNT(*) as count FROM properties');
    const [imageCount] = await connection.execute('SELECT COUNT(*) as count FROM property_images');

    console.log(`📈 Summary:`);
    console.log(`   👥 Users: ${userCount[0].count}`);
    console.log(`   🤵 Broker Profiles: ${brokerCount[0].count}`);
    console.log(`   📅 Broker Availability: ${availabilityCount[0].count}`);
    console.log(`   🏠 Properties: ${propertyCount[0].count}`);
    console.log(`   🖼️  Property Images: ${imageCount[0].count}`);

    // Show brokers
    if (brokerCount[0].count > 0) {
      const [brokers] = await connection.execute(
        `SELECT bp.user_id, u.first_name, u.last_name, u.role, bp.broker_type, bp.is_verified 
         FROM broker_profiles bp
         JOIN users u ON bp.user_id = u.id`
      );

      console.log('\n🔍 Brokers in database:');
      brokers.forEach((broker, idx) => {
        console.log(`   ${idx + 1}. ${broker.first_name} ${broker.last_name} (ID: ${broker.user_id})`);
        console.log(`      Type: ${broker.broker_type}, Verified: ${broker.is_verified ? 'Yes' : 'No'}`);
      });
    }

    console.log('\n🔗 Test your API endpoints:');
    console.log('   🤵 Brokers: GET http://localhost:5000/api/brokers');
    console.log('   🌐 All Properties: GET http://localhost:5002/api/properties');
    console.log('   🔍 Single Property: GET http://localhost:5002/api/properties/1');

    console.log('\n🚀 Database is ready!');

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