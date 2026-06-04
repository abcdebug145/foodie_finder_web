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
