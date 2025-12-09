// Chart color configurations matching your frontend
export const CHART_COLORS = {
  // Line chart colors
  line: {
    borderColor: '#f59e0b', // amber-500
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    pointBackgroundColor: '#f59e0b',
    pointBorderColor: '#ffffff',
    pointHoverBackgroundColor: '#d97706', // amber-600
    pointHoverBorderColor: '#ffffff'
  },
  
  // Radar chart colors
  radar: {
    backgroundColor: 'rgba(79, 70, 229, 0.2)', // indigo-500
    borderColor: '#4f46e5', // indigo-500
    pointBackgroundColor: '#4f46e5',
    pointBorderColor: '#ffffff',
    pointHoverBackgroundColor: '#4338ca' // indigo-600
  },
  
  // Donut chart colors
  donut: {
    residential: '#3b82f6', // blue-500
    commercial: '#10b981', // emerald-500
    land: '#f59e0b', // amber-500
    apartments: '#8b5cf6', // violet-500
    houses: '#ef4444', // red-500
    completed: '#10b981', // emerald-500
    pending: '#f59e0b', // amber-500
    cancelled: '#ef4444', // red-500
    review: '#8b5cf6' // violet-500
  },
  
  // Status colors
  status: {
    active: '#10b981', // emerald-500
    inactive: '#ef4444', // red-500
    suspended: '#f59e0b', // amber-500
    pending: '#8b5cf6' // violet-500
  }
};