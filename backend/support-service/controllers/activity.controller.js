import { SupportActivity } from '../models/supportActivity.model.js';
import { UserFeedback } from '../models/userFeedback.model.js';

export const getRecentActivities = async (req, res) => {
  try {
    const activities = await SupportActivity.findRecent(10);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

export const getAgentActivities = async (req, res) => {
  try {
    const { username } = req.params;
    const activities = await SupportActivity.findByAgent(username, 20);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching agent activities:', error);
    res.status(500).json({ error: 'Failed to fetch agent activities' });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await UserFeedback.findAll();
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

export const getAgentFeedback = async (req, res) => {
  try {
    const { username } = req.params;
    const feedback = await UserFeedback.findByAgent(username);
    const ratingStats = await UserFeedback.getAverageRating(username);
    
    res.json({
      feedback,
      stats: ratingStats
    });
  } catch (error) {
    console.error('Error fetching agent feedback:', error);
    res.status(500).json({ error: 'Failed to fetch agent feedback' });
  }
};

// Support lead only - get team analytics
export const getTeamAnalytics = async (req, res) => {
  try {
    // Fetch all support agents from user service
    const supportAgents = await req.services.makeAuthenticatedRequest(
      `${req.services.userService}/api/users?role=support_agent`
    );

    // Fetch support leads
    const supportLeads = await req.services.makeAuthenticatedRequest(
      `${req.services.userService}/api/users?role=support_lead`
    );

    // Get analytics from analysis service
    const analyticsData = await req.services.makeAuthenticatedRequest(
      `${req.services.analysisService}/api/analytics/dashboard`
    );

    // Calculate team-specific metrics
    const teamMetrics = {
      totalAgents: supportAgents.length + supportLeads.length,
      activeTickets: await getActiveTicketsCount(),
      resolvedThisWeek: await getResolvedThisWeekCount(),
      averageResponseTime: await getAverageResponseTime(),
      customerSatisfaction: await getCustomerSatisfactionRate(),
      teamPerformance: await getTeamPerformanceMetrics(supportAgents, supportLeads)
    };

    res.json({
      teamMetrics,
      supportAgents: [...supportAgents, ...supportLeads],
      generalAnalytics: analyticsData
    });
  } catch (error) {
    console.error('Error fetching team analytics:', error);
    res.status(500).json({ error: 'Failed to fetch team analytics' });
  }
};

// Helper functions for analytics
const getActiveTicketsCount = async () => {
  // Implementation to count active tickets
  return 15; // Replace with actual count
};

const getResolvedThisWeekCount = async () => {
  // Implementation to count resolved tickets this week
  return 42; // Replace with actual count
};

const getAverageResponseTime = async () => {
  // Implementation to calculate average response time
  return "2.3h"; // Replace with actual calculation
};

const getCustomerSatisfactionRate = async () => {
  // Implementation to calculate satisfaction rate from feedback
  return "94%"; // Replace with actual calculation
};

const getTeamPerformanceMetrics = async (agents, leads) => {
  // Implementation to calculate individual agent performance
  return agents.map(agent => ({
    username: agent.username,
    ticketsResolved: Math.floor(Math.random() * 20) + 10,
    averageRating: (Math.random() * 2 + 3).toFixed(1),
    responseTime: (Math.random() * 2 + 1).toFixed(1) + "h"
  }));
};
