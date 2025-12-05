// shared/populate-db-complete.js
import mysql from 'mysql2/promise';
import seedData from './seed-data.js';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'wubland_portfolio_db'
};

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
           verified, status, message_count, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            user.first_name, user.last_name, user.username, user.email, user.password,
            user.phone_number, user.role, user.privilege_tier, user.feature_flags || JSON.stringify({}),
            user.profile_picture, user.bio, user.date_of_birth, user.address, user.city,
            user.state, user.country, user.zip_code, user.is_email_verified,
            user.verified, user.status, user.message_count || 0
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
            pref.user_id, pref.notification_email, pref.notification_sms,
            pref.notification_push, pref.language, pref.timezone,
            pref.theme, pref.email_frequency
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
            broker.user_id, broker.broker_type, broker.license_number,
            broker.license_expiry, broker.years_experience, broker.specialization,
            broker.total_completed_deals, broker.total_sales, broker.average_rating,
            broker.review_count, broker.commission_rate, broker.service_fee,
            broker.is_available, broker.max_clients, broker.current_active_clients,
            broker.languages, broker.service_areas, broker.is_verified,
            broker.verified_at, broker.bio_english, broker.bio_amharic
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
            availability.broker_id, availability.day_of_week,
            availability.start_time, availability.end_time,
            availability.is_available
          ]
        );
      } catch (err) {
        console.error(`Error inserting availability for broker ${availability.broker_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.brokerAvailability.length} availability entries`);

    // =============================================
    // 5. INSERT PROPERTIES
    // =============================================
    console.log('🏠 Inserting properties...');
    for (const property of seedData.properties) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO properties 
          (title, price, address, city, region, beds, baths, sqft, garage,
           property_type, property_status, price_per_sqft, year_built, lot_size,
           description, images, features, coordinates, listed_date, views, saves,
           mls_number, source, est_payment, premium, broker_id, price_history,
           tax_history, nearby_schools, floor_plans) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            property.title, property.price, property.address, property.city,
            property.region, property.beds, property.baths, property.sqft,
            property.garage, property.property_type, property.property_status,
            property.price_per_sqft, property.year_built, property.lot_size,
            property.description, property.images, property.features,
            property.coordinates, property.listed_date, property.views,
            property.saves, property.mls_number, property.source,
            property.est_payment, property.premium, property.broker_id,
            property.price_history, property.tax_history, property.nearby_schools,
            property.floor_plans
          ]
        );
      } catch (err) {
        console.error(`Error inserting property ${property.title}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.properties.length} properties`);

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
            review.broker_id, review.client_id, review.property_id,
            review.overall_rating, review.communication_rating,
            review.professionalism_rating, review.knowledge_rating,
            review.title_english, review.title_amharic, review.comment_english,
            review.comment_amharic, review.transaction_type, review.transaction_date,
            review.transaction_amount, review.is_approved, review.is_verified
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
            todo.user_id, todo.title, todo.description, todo.category, todo.priority,
            todo.status, todo.due_date, todo.estimated_hours, todo.assigned_to,
            todo.created_by, todo.department, todo.actual_hours || null
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
            ticket.ticket_number, ticket.user_id, ticket.subject, ticket.description,
            ticket.category, ticket.subcategory, ticket.priority, ticket.status,
            ticket.assigned_to, ticket.source, ticket.resolved_at || null, 
            ticket.customer_rating || null
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
            article.article_number, article.title, article.content, article.excerpt,
            article.category, article.author_id, article.status, article.slug,
            article.is_featured, article.views, article.helpful_votes, article.published_at
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
            config.config_key, config.config_value, config.data_type,
            config.description, config.category, config.is_editable || true,
            config.is_public || false, config.updated_by || 1
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
            template.template_name, template.role_type, template.tier,
            template.privileges, template.monthly_price,
            template.is_active, template.description
          ]
        );
      } catch (err) {
        console.error(`Error inserting template ${template.template_name}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.privilegeTemplates.length} privilege templates`);

    // =============================================
    // 12. INSERT NOTIFICATIONS
    // =============================================
    console.log('🔔 Inserting notifications...');
    for (const notification of seedData.notifications) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO notifications 
          (user_id, title, message, type, is_read, action_url,
           related_entity_type, related_entity_id, expires_at, read_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            notification.user_id, notification.title, notification.message,
            notification.type, notification.is_read, notification.action_url,
            notification.related_entity_type, notification.related_entity_id,
            notification.expires_at || null, notification.read_at || null
          ]
        );
      } catch (err) {
        console.error(`Error inserting notification for user ${notification.user_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.notifications.length} notifications`);

    // =============================================
    // 13. INSERT SUPPORT AGENT ACTIVITIES
    // =============================================
    console.log('📊 Inserting support agent activities...');
    for (const activity of seedData.supportAgentActivities) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO support_agent_activities 
          (agent_username, activity_type, target_id, target_type, details) 
          VALUES (?, ?, ?, ?, ?)`,
          [
            activity.agent_username, activity.activity_type,
            activity.target_id, activity.target_type, activity.details
          ]
        );
      } catch (err) {
        console.error(`Error inserting activity for ${activity.agent_username}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.supportAgentActivities.length} support agent activities`);

    // =============================================
    // 14. INSERT FLAGGED CONTENT
    // =============================================
    console.log('🚩 Inserting flagged content...');
    for (const flag of seedData.flaggedContent) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO flagged_content 
          (flag_number, content_type, content_id, content_url, reported_by_user_id,
           reason, additional_details, severity, status, assigned_to, assigned_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            flag.flag_number, flag.content_type, flag.content_id, flag.content_url,
            flag.reported_by_user_id, flag.reason, flag.additional_details,
            flag.severity, flag.status, flag.assigned_to || null,
            flag.assigned_at || null
          ]
        );
      } catch (err) {
        console.error(`Error inserting flag ${flag.flag_number}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.flaggedContent.length} flagged content entries`);

    // =============================================
    // 15. INSERT PENDING REGISTRATIONS
    // =============================================
    console.log('📝 Inserting pending registrations...');
    for (const reg of seedData.pendingRegistrations) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO pending_registrations 
          (first_name, last_name, username, email, password, role, broker_type,
           email_verification_token, email_verification_expires) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reg.first_name, reg.last_name, reg.username, reg.email, reg.password,
            reg.role, reg.broker_type, reg.email_verification_token,
            reg.email_verification_expires
          ]
        );
      } catch (err) {
        console.error(`Error inserting pending registration ${reg.username}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.pendingRegistrations.length} pending registrations`);

    // =============================================
    // 16. INSERT ARTICLE FEEDBACK
    // =============================================
    console.log('💬 Inserting article feedback...');
    for (const feedback of seedData.articleFeedback) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO article_feedback 
          (article_id, user_id, was_helpful, feedback_comment) 
          VALUES (?, ?, ?, ?)`,
          [
            feedback.article_id, feedback.user_id,
            feedback.was_helpful, feedback.feedback_comment
          ]
        );
      } catch (err) {
        console.error(`Error inserting feedback for article ${feedback.article_id}:`, err.message);
      }
    }
    console.log(`✅ Inserted ${seedData.articleFeedback.length} article feedback entries`);

    // =============================================
    // FINAL SUMMARY
    // =============================================
    console.log('\n🎉 Database population completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${seedData.users.length}`);
    console.log(`   ⚙️  User Preferences: ${seedData.userPreferences.length}`);
    console.log(`   🤝 Broker Profiles: ${seedData.brokerProfiles.length}`);
    console.log(`   📅 Broker Availability: ${seedData.brokerAvailability.length}`);
    console.log(`   🏠 Properties: ${seedData.properties.length}`);
    console.log(`   ⭐ Broker Reviews: ${seedData.brokerReviews.length}`);
    console.log(`   ✅ Todos: ${seedData.todos.length}`);
    console.log(`   🎫 Support Tickets: ${seedData.supportTickets.length}`);
    console.log(`   📚 Knowledge Base Articles: ${seedData.knowledgeBaseArticles.length}`);
    console.log(`   ⚙️  System Configurations: ${seedData.systemConfigurations.length}`);
    console.log(`   🔐 Privilege Templates: ${seedData.privilegeTemplates.length}`);
    console.log(`   🔔 Notifications: ${seedData.notifications.length}`);
    console.log(`   📊 Support Agent Activities: ${seedData.supportAgentActivities.length}`);
    console.log(`   🚩 Flagged Content: ${seedData.flaggedContent.length}`);
    console.log(`   📝 Pending Registrations: ${seedData.pendingRegistrations.length}`);
    console.log(`   💬 Article Feedback: ${seedData.articleFeedback.length}`);

    // Verify counts in database
    const tables = [
      'users', 'user_preferences', 'broker_profiles', 'broker_availability',
      'properties', 'broker_reviews', 'todos', 'support_tickets',
      'knowledge_base_articles', 'system_configurations', 'privilege_templates',
      'notifications', 'support_agent_activities', 'flagged_content',
      'pending_registrations', 'article_feedback'
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