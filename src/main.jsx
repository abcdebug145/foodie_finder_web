// Intercept global fetch to prefix relative API paths with VITE_API_URL during deployment
const originalFetch = window.fetch;
window.fetch = (input, init) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && typeof input === 'string' && input.startsWith('/api/')) {
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    input = `${cleanApiUrl}${input}`;
  }
  return originalFetch(input, init);
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RestaurantsProvider } from './context/RestaurantsContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';
import { ReviewsProvider } from './context/ReviewsContext.jsx';
import { NotificationsProvider } from './context/NotificationsContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RestaurantsProvider>
          <FavoritesProvider>
            <ReviewsProvider>
              <NotificationsProvider>
                <App />
              </NotificationsProvider>
            </ReviewsProvider>
          </FavoritesProvider>
        </RestaurantsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
