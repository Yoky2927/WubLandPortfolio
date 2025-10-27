// App.jsx - Add maintenance context
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SystemSettingsProvider } from './contexts/SystemSettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { NavigationProvider } from './contexts/NavigationContext';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <SystemSettingsProvider>
        <NavigationProvider>
         <div className="App">
          <Outlet />
        </div>
        </NavigationProvider>
      </SystemSettingsProvider>
    </ToastProvider>
  );
}

export default App;