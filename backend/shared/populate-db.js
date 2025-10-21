// shared/populate-db-simple.js
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

    // First, let's check the actual columns in the users table
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND TABLE_SCHEMA = 'wubland_portfolio_db'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Users table columns:', columns.map(col => col.COLUMN_NAME));

    // Insert users with only essential fields
    console.log('👥 Inserting users...');
    for (const user of seedData.users) {
      await connection.execute(
        `INSERT IGNORE INTO users 
        (first_name, last_name, username, email, password, phone_number, role, 
         privilege_tier, profile_picture, bio, city, country, is_email_verified, 
         verified, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          user.first_name, user.last_name, user.username, user.email, user.password,
          user.phone_number, user.role, user.privilege_tier, user.profile_picture,
          user.bio, user.city, user.country, user.is_email_verified, user.verified,
          user.status
        ]
      );
    }

    // Rest of the code remains the same...
    console.log('⚙️ Inserting user preferences...');
    const [userRows] = await connection.execute('SELECT id FROM users');
    for (const user of userRows) {
      await connection.execute(
        `INSERT IGNORE INTO user_preferences (user_id) VALUES (?)`,
        [user.id]
      );
    }

    console.log('✅ Inserting todos...');
    for (const todo of seedData.todos) {
      await connection.execute(
        `INSERT IGNORE INTO todos 
        (user_id, title, description, category, priority, status, due_date, 
         assigned_to, created_by, department, estimated_hours, actual_hours, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          todo.assigned_to || todo.created_by,
          todo.title, todo.description, todo.category, todo.priority,
          todo.status, todo.due_date, todo.assigned_to, todo.created_by,
          todo.department, todo.estimated_hours, todo.actual_hours || null
        ]
      );
    }

    console.log('🎫 Inserting support tickets...');
    for (const ticket of seedData.supportTickets) {
      await connection.execute(
        `INSERT IGNORE INTO support_tickets 
        (ticket_number, user_id, subject, description, category, subcategory, 
         priority, status, assigned_to, source, resolved_at, customer_rating, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ticket.ticket_number, ticket.user_id, ticket.subject, ticket.description,
          ticket.category, ticket.subcategory, ticket.priority, ticket.status,
          ticket.assigned_to, ticket.source, ticket.resolved_at || null, 
          ticket.customer_rating || null
        ]
      );
    }

    console.log('📚 Inserting knowledge base articles...');
    for (const article of seedData.knowledgeBaseArticles) {
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
    }

    console.log('⚙️ Inserting system configurations...');
    for (const config of seedData.systemConfigurations) {
      await connection.execute(
        `INSERT IGNORE INTO system_configurations 
        (config_key, config_value, data_type, description, category) 
        VALUES (?, ?, ?, ?, ?)`,
        [config.config_key, config.config_value, config.data_type, config.description, config.category]
      );
    }

    console.log('🎉 Database population completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${seedData.users.length}`);
    console.log(`   ✅ Todos: ${seedData.todos.length}`);
    console.log(`   🎫 Tickets: ${seedData.supportTickets.length}`);
    console.log(`   📚 Articles: ${seedData.knowledgeBaseArticles.length}`);

  } catch (error) {
    console.error('❌ Error populating database:', error);
    console.error('Error details:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
populateDatabase();