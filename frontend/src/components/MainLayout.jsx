// src/components/MainLayout.jsx
import React from 'react';
import AnnouncementBanner from './AnnouncementBanner';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext'; // Update path based on your structure

const MainLayout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Announcement Banner at the top */}
      <AnnouncementBanner theme={theme} />
      
      {/* Main content */}
      <main className="relative">
        {children}
      </main>
      
      {/* Theme Toggle at bottom right */}
      <ThemeToggle />
    </div>
  );
};

export default MainLayout;