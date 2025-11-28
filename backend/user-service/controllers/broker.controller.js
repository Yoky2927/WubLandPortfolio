import { Broker } from '../models/broker.model.js';

export const getBrokers = async (req, res) => {
  try {
    console.log('🔍 GetBrokers called with query:', req.query);
    
    const { 
      specialization, 
      location, 
      broker_type, 
      limit = 20,
      language = 'english'
    } = req.query;

    const filters = {
      specialization,
      location,
      broker_type,
      is_available: true,
      limit: parseInt(limit)
    };

    console.log('🎯 Fetching brokers with filters:', filters);
    
    const brokers = await Broker.getAllBrokers(filters);
    console.log('📊 Raw brokers from database:', brokers);

    const formattedBrokers = brokers.map(broker => ({
      id: broker.id,
      name: `${broker.first_name} ${broker.last_name}`,
      profile_picture: broker.profile_picture,
      phone_number: broker.phone_number,
      email: broker.email,
      location: broker.city || broker.address,
      broker_type: broker.broker_type,
      years_experience: broker.years_experience,
      specialization: broker.specialization || [],
      completed_deals: broker.total_completed_deals || 0,
      rating: parseFloat(broker.average_rating || 0).toFixed(1),
      review_count: broker.review_count || 0,
      commission_rate: `${broker.commission_rate || 2.5}%`,
      service_fee: broker.service_fee || 0,
      languages: broker.languages || ['english'],
      service_areas: broker.service_areas || [],
      is_available: broker.is_available,
      is_verified: broker.is_verified,
      bio: broker.bio_english,
      total_reviews: broker.total_reviews || 0,
      license_number: broker.license_number,
      max_clients: broker.max_clients,
      current_active_clients: broker.current_active_clients
    }));

    console.log('✅ Formatted brokers:', formattedBrokers);

    res.json({
      success: true,
      brokers: formattedBrokers,
      total: formattedBrokers.length,
      language: language
    });

  } catch (error) {
    console.error('❌ Get brokers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brokers data',
      error: error.message
    });
  }
};

export const getBrokerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'english' } = req.query;

    const broker = await Broker.getBrokerById(id);
    
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    const reviews = await Broker.getBrokerReviews(id);

    const formattedBroker = {
      id: broker.id,
      name: `${broker.first_name} ${broker.last_name}`,
      email: broker.email,
      phone_number: broker.phone_number,
      profile_picture: broker.profile_picture,
      location: broker.city || broker.address,
      broker_type: broker.broker_type,
      years_experience: broker.years_experience,
      specialization: broker.specialization || [],
      completed_deals: broker.total_completed_deals || 0,
      rating: parseFloat(broker.average_rating || 0).toFixed(1),
      review_count: broker.review_count || 0,
      commission_rate: `${broker.commission_rate || 2.5}%`,
      service_fee: broker.service_fee || 0,
      languages: broker.languages || ['english'],
      service_areas: broker.service_areas || [],
      is_available: broker.is_available,
      is_verified: broker.is_verified,
      license_number: broker.license_number,
      bio: broker.bio_english,
      total_reviews: broker.total_reviews || 0,
      max_clients: broker.max_clients,
      current_active_clients: broker.current_active_clients,
      reviews: reviews.map(review => ({
        id: review.id,
        client_name: review.client_name,
        client_profile_picture: review.client_profile_picture,
        overall_rating: review.overall_rating,
        communication_rating: review.communication_rating,
        professionalism_rating: review.professionalism_rating,
        knowledge_rating: review.knowledge_rating,
        title: review.title_english,
        comment: review.comment_english,
        transaction_type: review.transaction_type,
        transaction_date: review.transaction_date,
        created_at: review.created_at
      }))
    };

    res.json({
      success: true,
      broker: formattedBroker,
      language: language
    });

  } catch (error) {
    console.error('Get broker details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch broker details'
    });
  }
};

export const createBrokerProfile = async (req, res) => {
  try {
    const brokerData = {
      user_id: req.user.id,
      ...req.body
    };

    // Check if user is actually a broker
    if (!req.user.role.includes('broker')) {
      return res.status(400).json({
        success: false,
        message: 'Only brokers can create broker profiles'
      });
    }

    const result = await Broker.upsertBrokerProfile(brokerData);

    res.json({
      success: true,
      message: 'Broker profile created/updated successfully',
      profile_id: result.insertId
    });

  } catch (error) {
    console.error('Create broker profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create broker profile'
    });
  }
};

export const addBrokerReview = async (req, res) => {
  try {
    const reviewData = {
      client_id: req.user.id,
      ...req.body
    };

    const result = await Broker.addReview(reviewData);

    res.json({
      success: true,
      message: 'Review added successfully',
      review_id: result.insertId
    });

  } catch (error) {
    console.error('Add broker review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review'
    });
  }
};