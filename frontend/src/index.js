// ================================================
// ✅ FILE: /frontend/src/index.js
// React entrypoint with AuthProvider and all global contexts
// ================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';

// 🌐 Global Contexts
import { AuthProvider } from './contexts/AuthContext';
import { SecretsProvider } from './contexts/SecretsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ModalProvider from './contexts/ModalContext';
import NotificationProvider from './contexts/NotificationContext';

import './styles/global.css'; // Ensure global styles are loaded

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <SecretsProvider>
          <ThemeProvider>
            <NotificationProvider>
              <ModalProvider>
                <App />
              </ModalProvider>
            </NotificationProvider>
          </ThemeProvider>
        </SecretsProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
