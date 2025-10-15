// App.jsx - Add maintenance context
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SystemSettingsProvider } from './contexts/SystemSettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

function App() {
  return (
    <ToastProvider>
      <SystemSettingsProvider>
        <div className="App">
          <Outlet />
        </div>
      </SystemSettingsProvider>
    </ToastProvider>
  );
}

export default App;