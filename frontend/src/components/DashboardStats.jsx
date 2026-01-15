import React from 'react';
import { Heart, FileText, Calendar, File, Building2, Users, DollarSign, Shield } from 'lucide-react';

const DashboardStats = ({ stats, theme = 'light', onStatClick }) => {
  const statItems = [
    {
      key: 'savedProperties',
      label: 'Saved Properties',
      icon: Heart,
      color: 'red',
      action: () => onStatClick?.('saved')
    },
    {
      key: 'activeApplications',
      label: 'Active Applications',
      icon: FileText,
      color: 'blue',
      action: () => onStatClick?.('applications')
    },
    {
      key: 'completedTours',
      label: 'Completed Tours',
      icon: Calendar,
      color: 'green',
      action: () => onStatClick?.('tours')
    },
    {
      key: 'pendingDocuments',
      label: 'Pending Docs',
      icon: File,
      color: 'yellow',
      action: () => onStatClick?.('documents')
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((stat) => (
        <button
          key={stat.key}
          onClick={stat.action}
          className={`p-6 rounded-xl text-left transition-all hover:scale-[1.02] ${theme === 'dark' 
            ? 'bg-gray-800 hover:bg-gray-700' 
            : 'bg-white hover:bg-amber-50 border border-gray-200'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.label}
              </p>
              <p className={`text-2xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {stats[stat.key] || 0}
              </p>
            </div>
            <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-500`} />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default DashboardStats;