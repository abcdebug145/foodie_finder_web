import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import RestaurantDetail from './pages/RestaurantDetail.jsx';
import Favorites from './pages/Favorites.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AppLoader from './components/AppLoader.jsx';
import FloatingFood from './components/FloatingFood.jsx';
import ToastContainer from './components/Toast.jsx';

import PreferenceSelectorModal from './components/PreferenceSelectorModal.jsx';
import ChatBot from './components/ChatBot.jsx';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showPrefModal, setShowPrefModal] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!loading) {
      const prefSet = localStorage.getItem('ff_pref_set');
      if (prefSet !== 'true') {
        setShowPrefModal(true);
      } else if (currentUser && (!currentUser.preferences || currentUser.preferences.length === 0)) {
        const sessionDismissed = sessionStorage.getItem('ff_pref_dismissed');
        if (sessionDismissed !== 'true') {
          setShowPrefModal(true);
        }
      }
    }
  }, [loading, currentUser]);

  return (
    <>
      {loading && <AppLoader onComplete={() => setLoading(false)} />}
      {showPrefModal && (
        <PreferenceSelectorModal 
          onClose={() => {
            setShowPrefModal(false);
            sessionStorage.setItem('ff_pref_dismissed', 'true');
          }} 
        />
      )}

      <ToastContainer />
      <div className="app-shell" style={{ position: 'relative' }}>
        {/* Nền ẩm thực bay lơ lửng, nhẹ nhàng di chuyển */}
        <FloatingFood count={8} />
        
        <Navbar />
        <main className="app-main" style={{ position: 'relative', zIndex: 2 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/restaurants/:id" element={<RestaurantDetail />} />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </main>
        <Footer />
        <ChatBot />
      </div>
    </>
  );
}

