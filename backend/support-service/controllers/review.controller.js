import { UserFeedback } from '../models/userFeedback.model.js';
import { SupportActivity } from '../models/supportActivity.model.js';

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await UserFeedback.findAll();
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const getAgentReviews = async (req, res) => {
  try {
    const { username } = req.params;
    const reviews = await UserFeedback.findByAgent(username);
    const stats = await UserFeedback.getAverageRating(username);
    
    res.json({
      reviews,
      stats
    });
  } catch (error) {
    console.error('Error fetching agent reviews:', error);
    res.status(500).json({ error: 'Failed to fetch agent reviews' });
  }
};

export const createReview = async (req, res) => {
  try {
    const { user_id, ticket_id, rating, feedback_text, responded_to_by } = req.body;

    if (!user_id || !rating || !responded_to_by) {
      return res.status(400).json({ error: 'User ID, rating, and responder are required' });
    }

    const reviewId = await UserFeedback.create(user_id, ticket_id, rating, feedback_text, responded_to_by);

    // Log activity
    await SupportActivity.create(
      responded_to_by,
      'feedback_received',
      reviewId,
      'feedback',
      `Received ${rating}-star feedback`
    );

    res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted successfully',
      id: reviewId
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};