// shared/populate-db.js
import mysql from 'mysql2/promise';
import seedData from './seed-data.js';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wubland_portfolio_db'
};

// Helper function to convert undefined to null
function safeValue(value) {
  return value === undefined ? null : value;
}

// Helper function to convert object to JSON string if needed
function toJSON(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return JSON.stringify(value);
  return value;
}

async function populateDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // =============================================
    // 1. INSERT USERS
    // =============================================
    console.log('👥 Inserting users...');
    for (const user of seedData.users) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO users 
          (first_name, last_name, username, email, password, phone_number, role, 
           privilege_tier, feature_flags, profile_picture, bio, date_of_birth,
           address, city, state, country, zip_code, is_email_verified,
           verified, status, message_count) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.first_name, user.last_name, user.username, user.email, user.password,
            safeValue(user.phone_number), user.role, safeValue(user.privilege_tier), 
            toJSON(user.feature_flags || {}),
            safeValue(user.profile_picture), safeValue(user.bio), safeValue(user.date_of_birth), 
            safeValue(user.address), safeValue(user.city),
            safeValue(user.state), safeValue(user.country), safeValue(user.zip_code), 
            safeValue(user.is_email_verified || false),
            safeValue(user.verified || false), safeValue(user.status || 'active'), 
            safeValue(user.message_count || 0)
          ]
        );
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          console.error(`Error inserting user ${user.username}:`, err.message);
        }
      }
    }
    console.log(`✅ Inserted ${seedData.users.length} users`);

    // =============================================
    // 2. INSERT USER PREFERENCES
    // =============================================
    console.log('⚙️ Inserting user preferences...');
    for (const pref of seedData.userPreferences) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO user_preferences 
          (user_id, notification_email, notification_sms, notification_push,
           language, timezone, theme, email_frequency) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            pref.user_id, 
            safeValue(pref.notification_email), 
            safeValue(pref.notification_sms),
            safeValue(pref.notification_push), 
            safeValue(pref.language), 
            safeValue(pref.timezone),
            safeValue(pref.theme), 
            safeValue(pref.email_frequency)
          ]
        );
      } catch (err) {
        console.error(`Error inserting preferences for user ${pref.user_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.userPreferences.length} user preferences`);

    // =============================================
    // 3. INSERT BROKER PROFILES
    // =============================================
    console.log('🤝 Inserting broker profiles...');
    for (const broker of seedData.brokerProfiles) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO broker_profiles 
          (user_id, broker_type, license_number, license_expiry, years_experience,
           specialization, total_completed_deals, total_sales, average_rating,
           review_count, commission_rate, service_fee, is_available, max_clients,
           current_active_clients, languages, service_areas, is_verified,
           verified_at, bio_english, bio_amharic) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            broker.user_id, 
            broker.broker_type, 
            safeValue(broker.license_number),
            safeValue(broker.license_expiry), 
            safeValue(broker.years_experience), 
            toJSON(broker.specialization || []),
            safeValue(broker.total_completed_deals), 
            safeValue(broker.total_sales), 
            safeValue(broker.average_rating),
            safeValue(broker.review_count), 
            safeValue(broker.commission_rate), 
            safeValue(broker.service_fee),
            safeValue(broker.is_available), 
            safeValue(broker.max_clients), 
            safeValue(broker.current_active_clients),
            toJSON(broker.languages || ["amharic", "english"]), 
            toJSON(broker.service_areas || []), 
            safeValue(broker.is_verified),
            safeValue(broker.verified_at), 
            safeValue(broker.bio_english), 
            safeValue(broker.bio_amharic)
          ]
        );
      } catch (err) {
        console.error(`Error inserting broker profile for user ${broker.user_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.brokerProfiles.length} broker profiles`);

    // =============================================
    // 4. INSERT BROKER AVAILABILITY
    // =============================================
    console.log('📅 Inserting broker availability...');
    for (const availability of seedData.brokerAvailability) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO broker_availability 
          (broker_id, day_of_week, start_time, end_time, is_available) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            availability.broker_id, 
            availability.day_of_week,
            availability.start_time, 
            availability.end_time,
            safeValue(availability.is_available)
          ]
        );
      } catch (err) {
        console.error(`Error inserting availability for broker ${availability.broker_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.brokerAvailability.length} availability entries`);

    // =============================================
    // 5. INSERT PROPERTIES - FIXED VERSION
    // =============================================
    console.log('🏠 Inserting properties...');
    let propertyCount = 0;
    for (const property of seedData.properties) {
      try {
        // Note: We need to match the actual column names from your CREATE TABLE statement
        await connection.execute(
          `INSERT IGNORE INTO properties 
          (title, description, property_type, property_status, address, city, state, 
           country, zip_code, neighborhood, google_place_id, beds, baths, sqft, 
           lot_size, year_built, garage_spaces, parking_spaces, price, currency, 
           price_per_sqft, is_negotiable, deposit_amount, monthly_rent, 
           listing_type, mls_number, listing_date, expiration_date, owner_user_id, 
           created_by_user_id, assigned_broker_id, is_exclusive, features, 
           amenities, property_tags, views_count, saves_count, inquiries_count, 
           is_featured, is_premium, tax_amount, hoa_fees, insurance_amount, 
           price_history, status_history) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            safeValue(property.title), 
            safeValue(property.description), 
            safeValue(property.property_type || 'residential'),
            safeValue(property.property_status || 'active'), 
            safeValue(property.address), 
            safeValue(property.city),
            safeValue(property.state), 
            safeValue(property.country || 'Ethiopia'), 
            safeValue(property.zip_code),
            safeValue(property.neighborhood), 
            safeValue(property.google_place_id), 
            safeValue(property.beds),
            safeValue(property.baths), 
            safeValue(property.sqft), 
            safeValue(property.lot_size),
            safeValue(property.year_built), 
            safeValue(property.garage_spaces || 0), 
            safeValue(property.parking_spaces || 0),
            safeValue(property.price || 0), 
            safeValue(property.currency || 'ETB'), 
            safeValue(property.price_per_sqft),
            safeValue(property.is_negotiable || true), 
            safeValue(property.deposit_amount),
            safeValue(property.monthly_rent), 
            safeValue(property.listing_type || 'sale'), 
            safeValue(property.mls_number),
            safeValue(property.listing_date), 
            safeValue(property.expiration_date), 
            safeValue(property.owner_user_id || 1),
            safeValue(property.created_by_user_id || 1), 
            safeValue(property.assigned_broker_id),
            safeValue(property.is_exclusive || false), 
            toJSON(property.features || []), 
            toJSON(property.amenities || []),
            toJSON(property.property_tags || []), 
            safeValue(property.views_count || 0), 
            safeValue(property.saves_count || 0),
            safeValue(property.inquiries_count || 0), 
            safeValue(property.is_featured || false), 
            safeValue(property.is_premium || false),
            safeValue(property.tax_amount), 
            safeValue(property.hoa_fees), 
            safeValue(property.insurance_amount),
            toJSON(property.price_history || []), 
            toJSON(property.status_history || [])
          ]
        );
        propertyCount++;
      } catch (err) {
        console.error(`Error inserting property ${property.title}:`, err.message);
        console.error('Property data:', JSON.stringify(property, null, 2));
      }
    }
    console.log(`✅ Inserted ${propertyCount} properties`);

    // =============================================
    // 6. INSERT BROKER REVIEWS
    // =============================================
    console.log('⭐ Inserting broker reviews...');
    for (const review of seedData.brokerReviews) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO broker_reviews 
          (broker_id, client_id, property_id, overall_rating, communication_rating,
           professionalism_rating, knowledge_rating, title_english, title_amharic,
           comment_english, comment_amharic, transaction_type, transaction_date,
           transaction_amount, is_approved, is_verified) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            review.broker_id, 
            review.client_id, 
            safeValue(review.property_id),
            safeValue(review.overall_rating), 
            safeValue(review.communication_rating),
            safeValue(review.professionalism_rating), 
            safeValue(review.knowledge_rating),
            safeValue(review.title_english), 
            safeValue(review.title_amharic), 
            safeValue(review.comment_english),
            safeValue(review.comment_amharic), 
            safeValue(review.transaction_type), 
            safeValue(review.transaction_date),
            safeValue(review.transaction_amount), 
            safeValue(review.is_approved || false), 
            safeValue(review.is_verified || false)
          ]
        );
      } catch (err) {
        console.error(`Error inserting review for broker ${review.broker_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.brokerReviews.length} broker reviews`);

    // =============================================
    // 7. INSERT TODOS
    // =============================================
    console.log('✅ Inserting todos...');
    for (const todo of seedData.todos) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO todos 
          (user_id, title, description, category, priority, status, due_date, 
           estimated_hours, assigned_to, created_by, department, actual_hours) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            todo.user_id, 
            safeValue(todo.title), 
            safeValue(todo.description), 
            safeValue(todo.category), 
            safeValue(todo.priority),
            safeValue(todo.status), 
            safeValue(todo.due_date), 
            safeValue(todo.estimated_hours), 
            safeValue(todo.assigned_to),
            safeValue(todo.created_by), 
            safeValue(todo.department), 
            safeValue(todo.actual_hours)
          ]
        );
      } catch (err) {
        console.error(`Error inserting todo ${todo.title}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.todos.length} todos`);

    // =============================================
    // 8. INSERT SUPPORT TICKETS
    // =============================================
    console.log('🎫 Inserting support tickets...');
    for (const ticket of seedData.supportTickets) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO support_tickets 
          (ticket_number, user_id, subject, description, category, subcategory, 
           priority, status, assigned_to, source, resolved_at, customer_rating) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ticket.ticket_number, 
            ticket.user_id, 
            safeValue(ticket.subject), 
            safeValue(ticket.description),
            safeValue(ticket.category), 
            safeValue(ticket.subcategory), 
            safeValue(ticket.priority), 
            safeValue(ticket.status),
            safeValue(ticket.assigned_to), 
            safeValue(ticket.source), 
            safeValue(ticket.resolved_at), 
            safeValue(ticket.customer_rating)
          ]
        );
      } catch (err) {
        console.error(`Error inserting ticket ${ticket.ticket_number}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.supportTickets.length} support tickets`);

    // =============================================
    // 9. INSERT KNOWLEDGE BASE ARTICLES
    // =============================================
    console.log('📚 Inserting knowledge base articles...');
    for (const article of seedData.knowledgeBaseArticles) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO knowledge_base_articles 
          (article_number, title, content, excerpt, category, author_id, status, 
           slug, is_featured, views, helpful_votes, published_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            article.article_number, 
            safeValue(article.title), 
            safeValue(article.content), 
            safeValue(article.excerpt),
            safeValue(article.category), 
            safeValue(article.author_id), 
            safeValue(article.status), 
            safeValue(article.slug),
            safeValue(article.is_featured), 
            safeValue(article.views || 0), 
            safeValue(article.helpful_votes || 0), 
            safeValue(article.published_at)
          ]
        );
      } catch (err) {
        console.error(`Error inserting article ${article.article_number}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.knowledgeBaseArticles.length} knowledge base articles`);

    // =============================================
    // 10. INSERT SYSTEM CONFIGURATIONS
    // =============================================
    console.log('⚙️ Inserting system configurations...');
    for (const config of seedData.systemConfigurations) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO system_configurations 
          (config_key, config_value, data_type, description, category, 
           is_editable, is_public, updated_by) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            config.config_key, 
            toJSON(config.config_value), 
            safeValue(config.data_type),
            safeValue(config.description), 
            safeValue(config.category), 
            safeValue(config.is_editable || true),
            safeValue(config.is_public || false), 
            safeValue(config.updated_by || 1)
          ]
        );
      } catch (err) {
        console.error(`Error inserting config ${config.config_key}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.systemConfigurations.length} system configurations`);

    // =============================================
    // 11. INSERT PRIVILEGE TEMPLATES
    // =============================================
    console.log('🔐 Inserting privilege templates...');
    for (const template of seedData.privilegeTemplates) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO privilege_templates 
          (template_name, role_type, tier, privileges, monthly_price, 
           is_active, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            template.template_name, 
            safeValue(template.role_type), 
            safeValue(template.tier),
            toJSON(template.privileges), 
            safeValue(template.monthly_price),
            safeValue(template.is_active || true), 
            safeValue(template.description)
          ]
        );
      } catch (err) {
        console.error(`Error inserting template ${template.template_name}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.privilegeTemplates.length} privilege templates`);

// =============================================
// 12. INSERT NOTIFICATIONS (UPDATED)
// =============================================
console.log('🔔 Inserting notifications...');
let notificationCount = 0;
for (const notification of seedData.notifications || []) {
  try {
    await connection.execute(
      `INSERT IGNORE INTO notifications 
      (notification_uuid, user_id, title, message, notification_type, 
       is_read, is_archived, action_url, icon, related_entity_type, 
       related_entity_id, priority, expires_at, delivery_methods, 
       sent_at, read_at, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        safeValue(notification.notification_uuid), 
        safeValue(notification.user_id), 
        safeValue(notification.title), 
        safeValue(notification.message),
        safeValue(notification.notification_type || 'info'), 
        safeValue(notification.is_read || false), 
        safeValue(notification.is_archived || false), 
        safeValue(notification.action_url),
        safeValue(notification.icon), 
        safeValue(notification.related_entity_type), 
        safeValue(notification.related_entity_id),
        safeValue(notification.priority || 'medium'), 
        safeValue(notification.expires_at), 
        toJSON(notification.delivery_methods || ["in_app"]),
        safeValue(notification.sent_at), 
        safeValue(notification.read_at)
      ]
    );
    notificationCount++;
  } catch (err) {
    console.error(`Error inserting notification for user ${notification.user_id}:`, err.message);
    console.error('Error details:', err);
  }
}
console.log(`✅ Inserted ${notificationCount} notifications`);

    // =============================================
    // 13. INSERT SUPPORT AGENT ACTIVITIES (OPTIONAL)
    // =============================================
    console.log('📊 Inserting support agent activities...');
    if (seedData.supportAgentActivities && Array.isArray(seedData.supportAgentActivities)) {
      for (const activity of seedData.supportAgentActivities) {
        try {
          await connection.execute(
            `INSERT IGNORE INTO support_agent_activities 
            (agent_username, activity_type, target_id, target_type, details) 
            VALUES (?, ?, ?, ?, ?)`,
            [
              safeValue(activity.agent_username), 
              safeValue(activity.activity_type),
              safeValue(activity.target_id), 
              safeValue(activity.target_type), 
              safeValue(activity.details)
            ]
          );
        } catch (err) {
          console.error(`Error inserting activity for ${activity.agent_username}:`, err.message);
        }
      }
      console.log(`✅ Inserted ${seedData.supportAgentActivities.length} support agent activities`);
    } else {
      console.log('⚠️  No support agent activities to insert');
    }

    // =============================================
    // 14. INSERT FLAGGED CONTENT (OPTIONAL)
    // =============================================
    console.log('🚩 Inserting flagged content...');
    if (seedData.flaggedContent && Array.isArray(seedData.flaggedContent)) {
      for (const flag of seedData.flaggedContent) {
        try {
          await connection.execute(
            `INSERT IGNORE INTO flagged_content 
            (flag_number, content_type, content_id, content_url, reported_by_user_id,
             reason, additional_details, severity, status, assigned_to, assigned_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              flag.flag_number, 
              safeValue(flag.content_type), 
              safeValue(flag.content_id), 
              safeValue(flag.content_url),
              safeValue(flag.reported_by_user_id), 
              safeValue(flag.reason), 
              safeValue(flag.additional_details),
              safeValue(flag.severity), 
              safeValue(flag.status), 
              safeValue(flag.assigned_to),
              safeValue(flag.assigned_at)
            ]
          );
        } catch (err) {
          console.error(`Error inserting flag ${flag.flag_number}:`, err.message);
        }
      }
      console.log(`✅ Inserted ${seedData.flaggedContent.length} flagged content entries`);
    } else {
      console.log('⚠️  No flagged content to insert');
    }

    // =============================================
    // 15. INSERT PENDING REGISTRATIONS (OPTIONAL)
    // =============================================
    console.log('📝 Inserting pending registrations...');
    if (seedData.pendingRegistrations && Array.isArray(seedData.pendingRegistrations)) {
      for (const reg of seedData.pendingRegistrations) {
        try {
          await connection.execute(
            `INSERT IGNORE INTO pending_registrations 
            (first_name, last_name, username, email, password, role, broker_type,
             email_verification_token, email_verification_expires) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              reg.first_name, 
              reg.last_name, 
              reg.username, 
              reg.email, 
              reg.password,
              reg.role, 
              safeValue(reg.broker_type), 
              reg.email_verification_token,
              reg.email_verification_expires
            ]
          );
        } catch (err) {
          console.error(`Error inserting pending registration ${reg.username}:`, err.message);
        }
      }
      console.log(`✅ Inserted ${seedData.pendingRegistrations.length} pending registrations`);
    } else {
      console.log('⚠️  No pending registrations to insert');
    }

    // =============================================
    // 16. INSERT ARTICLE FEEDBACK (OPTIONAL)
    // =============================================
    console.log('💬 Inserting article feedback...');
    if (seedData.articleFeedback && Array.isArray(seedData.articleFeedback)) {
      for (const feedback of seedData.articleFeedback) {
        try {
          await connection.execute(
            `INSERT IGNORE INTO article_feedback 
            (article_id, user_id, was_helpful, feedback_comment) 
            VALUES (?, ?, ?, ?)`,
            [
              safeValue(feedback.article_id), 
              safeValue(feedback.user_id),
              safeValue(feedback.was_helpful), 
              safeValue(feedback.feedback_comment)
            ]
          );
        } catch (err) {
          console.error(`Error inserting feedback for article ${feedback.article_id}:`, err.message);
        }
      }
      console.log(`✅ Inserted ${seedData.articleFeedback.length} article feedback entries`);
    } else {
      console.log('⚠️  No article feedback to insert');
    }

    // =============================================
    // FINAL SUMMARY
    // =============================================
    console.log('\n🎉 Database population completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${seedData.users.length}`);
    console.log(`   ⚙️  User Preferences: ${seedData.userPreferences.length}`);
    console.log(`   🤝 Broker Profiles: ${seedData.brokerProfiles.length}`);
    console.log(`   📅 Broker Availability: ${seedData.brokerAvailability.length}`);
    console.log(`   🏠 Properties: ${propertyCount}`);
    console.log(`   ⭐ Broker Reviews: ${seedData.brokerReviews.length}`);
    console.log(`   ✅ Todos: ${seedData.todos.length}`);
    console.log(`   🎫 Support Tickets: ${seedData.supportTickets.length}`);
    console.log(`   📚 Knowledge Base Articles: ${seedData.knowledgeBaseArticles.length}`);
    console.log(`   ⚙️  System Configurations: ${seedData.systemConfigurations.length}`);
    console.log(`   🔐 Privilege Templates: ${seedData.privilegeTemplates.length}`);
    console.log(`   🔔 Notifications: ${notificationCount}`);

    // Verify counts in database
    const tables = [
      'users', 'user_preferences', 'broker_profiles', 'broker_availability',
      'properties', 'broker_reviews', 'todos', 'support_tickets',
      'knowledge_base_articles', 'system_configurations', 'privilege_templates',
      'notifications'
    ];

    console.log('\n📋 Database verification:');
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${rows[0].count} rows`);
      } catch (err) {
        console.log(`   ${table}: Table not found or error counting`);
      }
    }

  } catch (error) {
    console.error('❌ Error populating database:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
populateDatabase().catch(console.error);