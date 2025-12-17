export const getSupportAnalytics = async (req, res) => {
  try {
    const token = req.headers.authorization;
    
    // Fetch all support data
    const [tickets, faqs, flags, feedback] = await Promise.all([
      Ticket.findAll(),
      FAQ.findAll(),
      FlaggedContent.findAll(),
      UserFeedback.findAll()
    ]);
    
    // Calculate analytics
    const analytics = {
      tickets: {
        total: tickets.length,
        byStatus: {
          open: tickets.filter(t => t.status === 'open').length,
          in_progress: tickets.filter(t => t.status === 'in_progress').length,
          resolved: tickets.filter(t => t.status === 'resolved').length
        },
        byPriority: {
          urgent: tickets.filter(t => t.priority === 'urgent').length,
          high: tickets.filter(t => t.priority === 'high').length,
          medium: tickets.filter(t => t.priority === 'medium').length,
          low: tickets.filter(t => t.priority === 'low').length
        }
      },
      faqs: {
        total: faqs.length,
        topViewed: faqs.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
        byCategory: faqs.reduce((acc, faq) => {
          acc[faq.category] = (acc[faq.category] || 0) + 1;
          return acc;
        }, {})
      },
      flags: {
        pending: flags.filter(f => f.status === 'pending').length,
        resolved: flags.filter(f => f.status === 'resolved').length
      },
      feedback: {
        averageRating: feedback.length > 0 ? 
          (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 0,
        total: feedback.length
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch support analytics' });
  }
};