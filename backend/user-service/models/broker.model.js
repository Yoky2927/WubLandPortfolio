import db from "../../shared/db.js";

export const Broker = {
  // Get all available brokers with their profiles
  getAllBrokers: async (filters = {}) => {
    let query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.username,
        u.email,
        u.phone_number,
        u.profile_picture,
        u.city,
        u.address,
        u.role,
        u.status,
        u.created_at,
        bp.broker_type,
        bp.license_number,
        bp.license_expiry,
        bp.years_experience,
        bp.specialization,
        bp.total_completed_deals,
        bp.total_sales,
        bp.average_rating,
        bp.review_count,
        bp.commission_rate,
        bp.service_fee,
        bp.languages,
        bp.service_areas,
        bp.is_available,
        bp.is_verified,
        bp.verified_at,
        bp.bio_english,
        bp.max_clients,
        bp.current_active_clients,
        COUNT(DISTINCT br.id) as total_reviews
      FROM users u
      INNER JOIN broker_profiles bp ON u.id = bp.user_id
      LEFT JOIN broker_reviews br ON u.id = br.broker_id AND br.is_approved = true
      WHERE u.role IN ('internal_broker', 'external_broker')
        AND u.status = 'active'
    `;

    const params = [];
    
    // Apply filters
    if (filters.specialization) {
      query += ` AND JSON_CONTAINS(bp.specialization, ?)`;
      params.push(`"${filters.specialization}"`);
    }
    
    if (filters.location) {
      query += ` AND (u.city LIKE ? OR JSON_CONTAINS(bp.service_areas, ?))`;
      params.push(`%${filters.location}%`, `"${filters.location}"`);
    }
    
    if (filters.broker_type) {
      query += ` AND bp.broker_type = ?`;
      params.push(filters.broker_type);
    }
    
    if (filters.is_available !== undefined) {
      query += ` AND bp.is_available = ?`;
      params.push(filters.is_available);
    }

    query += ` GROUP BY u.id ORDER BY bp.average_rating DESC, bp.total_completed_deals DESC`;

    if (filters.limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(filters.limit));
    }

    const [brokers] = await db.execute(query, params);
    return brokers;
  },

  // Get broker by ID with detailed information
  getBrokerById: async (brokerId) => {
    const [brokers] = await db.execute(`
      SELECT 
        u.*,
        bp.*,
        COUNT(DISTINCT br.id) as total_reviews
      FROM users u
      INNER JOIN broker_profiles bp ON u.id = bp.user_id
      LEFT JOIN broker_reviews br ON u.id = br.broker_id AND br.is_approved = true
      WHERE u.id = ? AND u.role IN ('internal_broker', 'external_broker')
      GROUP BY u.id
    `, [brokerId]);

    return brokers[0] || null;
  },

  // Get broker reviews
  getBrokerReviews: async (brokerId, limit = 10) => {
    const [reviews] = await db.execute(`
      SELECT 
        br.*,
        CONCAT(u.first_name, ' ', u.last_name) as client_name,
        u.profile_picture as client_profile_picture
      FROM broker_reviews br
      INNER JOIN users u ON br.client_id = u.id
      WHERE br.broker_id = ? AND br.is_approved = true
      ORDER BY br.created_at DESC
      LIMIT ?
    `, [brokerId, limit]);

    return reviews;
  },

  // Create or update broker profile
  upsertBrokerProfile: async (brokerData) => {
    const {
      user_id,
      broker_type,
      license_number,
      license_expiry,
      years_experience,
      specialization,
      commission_rate,
      service_fee,
      languages,
      service_areas,
      bio_english,
      max_clients
    } = brokerData;

    const [result] = await db.execute(`
      INSERT INTO broker_profiles (
        user_id, broker_type, license_number, license_expiry, years_experience,
        specialization, commission_rate, service_fee, languages, service_areas,
        bio_english, max_clients, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        broker_type = VALUES(broker_type),
        license_number = VALUES(license_number),
        license_expiry = VALUES(license_expiry),
        years_experience = VALUES(years_experience),
        specialization = VALUES(specialization),
        commission_rate = VALUES(commission_rate),
        service_fee = VALUES(service_fee),
        languages = VALUES(languages),
        service_areas = VALUES(service_areas),
        bio_english = VALUES(bio_english),
        max_clients = VALUES(max_clients),
        updated_at = NOW()
    `, [
      user_id, broker_type, license_number, license_expiry, years_experience,
      JSON.stringify(specialization || []), commission_rate, service_fee,
      JSON.stringify(languages || ['english']), JSON.stringify(service_areas || []),
      bio_english, max_clients || 10
    ]);

    return result;
  },

  // Update broker statistics after a successful deal
  updateBrokerStats: async (brokerId, dealAmount, rating = null) => {
    const broker = await Broker.getBrokerById(brokerId);
    if (!broker) return null;

    let newAverageRating = broker.average_rating;
    let newReviewCount = broker.review_count;
    let newTotalSales = parseFloat(broker.total_sales || 0) + parseFloat(dealAmount);
    let newCompletedDeals = broker.total_completed_deals + 1;

    if (rating) {
      const currentTotalRating = parseFloat(broker.average_rating || 0) * (broker.review_count || 0);
      newReviewCount = (broker.review_count || 0) + 1;
      newAverageRating = (currentTotalRating + rating) / newReviewCount;
    }

    const [result] = await db.execute(`
      UPDATE broker_profiles 
      SET total_completed_deals = ?,
          total_sales = ?,
          average_rating = ?,
          review_count = ?,
          updated_at = NOW()
      WHERE user_id = ?
    `, [newCompletedDeals, newTotalSales, newAverageRating, newReviewCount, brokerId]);

    return result;
  },

  // Toggle broker availability
  setAvailability: async (brokerId, isAvailable) => {
    const [result] = await db.execute(`
      UPDATE broker_profiles 
      SET is_available = ?, updated_at = NOW() 
      WHERE user_id = ?
    `, [isAvailable, brokerId]);

    return result;
  },

  // Get brokers by specialization
  getBrokersBySpecialization: async (specialization) => {
    const [brokers] = await db.execute(`
      SELECT u.*, bp.*
      FROM users u
      INNER JOIN broker_profiles bp ON u.id = bp.user_id
      WHERE u.role IN ('internal_broker', 'external_broker')
        AND u.status = 'active'
        AND bp.is_available = true
        AND JSON_CONTAINS(bp.specialization, ?)
      ORDER BY bp.average_rating DESC
    `, [`"${specialization}"`]);

    return brokers;
  },

  // Add broker review
  addReview: async (reviewData) => {
    const {
      broker_id,
      client_id,
      property_id,
      overall_rating,
      communication_rating,
      professionalism_rating,
      knowledge_rating,
      title_english,
      comment_english,
      transaction_type,
      transaction_date,
      transaction_amount
    } = reviewData;

    const [result] = await db.execute(`
      INSERT INTO broker_reviews (
        broker_id, client_id, property_id, overall_rating, communication_rating,
        professionalism_rating, knowledge_rating, title_english, comment_english,
        transaction_type, transaction_date, transaction_amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      broker_id, client_id, property_id, overall_rating, communication_rating,
      professionalism_rating, knowledge_rating, title_english, comment_english,
      transaction_type, transaction_date, transaction_amount
    ]);

    // Update broker stats
    await Broker.updateBrokerStats(broker_id, transaction_amount, overall_rating);

    return result;
  }
};