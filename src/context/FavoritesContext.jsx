import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);   // array of restaurant IDs
  const [loading, setLoading] = useState(false);

  // ── Load favorites from API when user logs in ───────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setFavorites([]);
      return;
    }
    const token = localStorage.getItem('ff_token');
    if (!token) return;

    setLoading(true);
    fetch('/api/v1/saved-restaurants/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        // API returns list of saved restaurant objects with restaurant_id
        const ids = Array.isArray(data)
          ? data.map(item => item.restaurant_id || item.restaurantId || item.id).filter(Boolean)
          : [];
        setFavorites(ids);
      })
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  // ── Toggle save/unsave restaurant ──────────────────────────────────────────
  const toggleFavorite = useCallback(async (restaurantId) => {
    if (!currentUser) return { ok: false, error: 'Bạn cần đăng nhập để lưu nhà hàng.' };

    const token = localStorage.getItem('ff_token');
    const isSaved = favorites.includes(restaurantId);

    // Optimistic update
    setFavorites(prev =>
      isSaved ? prev.filter(id => id !== restaurantId) : [...prev, restaurantId]
    );

    try {
      const response = await fetch(`/api/v1/saved-restaurants/${restaurantId}`, {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        // Revert on failure
        setFavorites(prev =>
          isSaved ? [...prev, restaurantId] : prev.filter(id => id !== restaurantId)
        );
        return { ok: false, error: 'Thao tác thất bại.' };
      }
      return { ok: true };
    } catch (e) {
      // Revert on error
      setFavorites(prev =>
        isSaved ? [...prev, restaurantId] : prev.filter(id => id !== restaurantId)
      );
      return { ok: false, error: 'Lỗi kết nối.' };
    }
  }, [currentUser, favorites]);

  const isFavorite = useCallback(
    (restaurantId) => favorites.includes(restaurantId),
    [favorites]
  );

  const value = useMemo(
    () => ({ favorites, loading, toggleFavorite, isFavorite }),
    [favorites, loading, toggleFavorite, isFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
