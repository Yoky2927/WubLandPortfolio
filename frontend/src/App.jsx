// App.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AnnouncementBanner from './components/AnnouncementBanner';
import ThemeToggle from './components/ThemeToggle';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const { theme } = useTheme();

  return (
    <div className={` ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Announcement Banner at the top */}
      <AnnouncementBanner theme={theme} />
      
      {/* Main content */}
      <main className="relative">
        <Outlet />
      </main>
      
      {/* Theme Toggle at bottom right */}
      <ThemeToggle />
    </div>
  );
}

export default App;