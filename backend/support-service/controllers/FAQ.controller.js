import { FAQ } from '../models/FAQ.model.js';
import { SupportActivity } from '../models/supportActivity.model.js';

export const getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.findAll();
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

export const getFAQById = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findById(id);
    
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    
    // Increment views
    await FAQ.incrementViews(id);
    
    res.json(faq);
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ' });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { title, content, category, video_url, author_username } = req.body;

    if (!title || !content || !category || !author_username) {
      return res.status(400).json({ error: 'Title, content, category, and author username are required' });
    }

    const faqId = await FAQ.create(title, content, category, author_username, video_url);

    // Log activity
    await SupportActivity.create(
      author_username,
      'article_created',
      faqId,
      'article',
      `Created FAQ: ${title}`
    );

    res.status(201).json({ 
      success: true, 
      message: 'FAQ created successfully',
      id: faqId
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, video_url } = req.body;

    const success = await FAQ.update(id, title, content, category, video_url);
    
    if (!success) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'article_updated',
      id,
      'article',
      `Updated FAQ: ${title}`
    );

    res.json({ success: true, message: 'FAQ updated successfully' });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await FAQ.delete(id);
    
    if (!success) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    // Log activity
    await SupportActivity.create(
      req.user.username,
      'article_deleted',
      id,
      'article',
      `Deleted FAQ #${id}`
    );

    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
};

export const markHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const success = await FAQ.addHelpfulVote(id);
    
    if (!success) {
      return res.status(404).json({ error: 'FAQ not found' });
    }

    res.json({ success: true, message: 'Thank you for your feedback' });
  } catch (error) {
    console.error('Error marking FAQ as helpful:', error);
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
};