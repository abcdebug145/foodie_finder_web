import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { getSessionId } from '../utils/session.js';

const ReviewsContext = createContext(null);

export function ReviewsProvider({ children }) {
  const [reviews, setReviews] = useState([]);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ── Fetch reviews (with optional search, city, pagination) ──────────────────
  const fetchReviews = useCallback(async (searchQuery = '', city = '', skip = 0, limit = 10, append = false) => {
    setReviewsLoading(true);
    const sid = getSessionId();
    const token = localStorage.getItem('ff_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      const response = await fetch(
        `/api/v1/reviews/?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(city)}&skip=${skip}&limit=${limit}&session_id=${sid}`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setReviews(prev => [...prev, ...data]);
        } else {
          setReviews(data);
        }
        setHasMoreReviews(data.length >= limit);
      }
    } catch (e) {
      console.error('Error fetching reviews', e);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // ── Add new review ──────────────────────────────────────────────────────────
  const addReview = useCallback(async ({ restaurantId, user, rating, content, imageUrls }) => {
    if (!user) return { ok: false, error: 'Bạn cần đăng nhập để viết đánh giá.' };
    if (!content?.trim()) return { ok: false, error: 'Vui lòng nhập nội dung đánh giá.' };
    if (!rating || rating < 1) return { ok: false, error: 'Vui lòng chọn số sao.' };

    const token = localStorage.getItem('ff_token');
    try {
      const response = await fetch('/api/v1/reviews/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          restaurantId,
          rating,
          content: content.trim(),
          image_urls: imageUrls || null
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        return { ok: false, error: errorData.detail || 'Không thể đăng đánh giá.' };
      }
      const newReview = await response.json();
      setReviews(prev => [newReview, ...prev]);
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối với máy chủ.' };
    }
  }, []);

  // ── Toggle like on review ───────────────────────────────────────────────────
  const toggleLikeReview = useCallback(async (reviewId, userId) => {
    if (!userId) return { ok: false, error: 'Bạn cần đăng nhập.' };
    const token = localStorage.getItem('ff_token');
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return { ok: false, error: 'Thao tác thất bại.' };

      const updatedReview = await response.json();
      // Upsert: update if present, otherwise prepend so localReviews merge works
      setReviews(prev => {
        const exists = prev.some(r => r.id === reviewId);
        if (exists) return prev.map(r => r.id === reviewId ? updatedReview : r);
        return [updatedReview, ...prev];
      });
      return { ok: true, review: updatedReview };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối.' };
    }
  }, []);

  // ── Add level-1 comment to review ──────────────────────────────────────────
  const addCommentToReview = useCallback(async (reviewId, { userName, userAvatar, content, imageUrl }) => {
    if (!content?.trim()) return { ok: false, error: 'Vui lòng nhập nội dung bình luận.' };
    const token = localStorage.getItem('ff_token');
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), image_url: imageUrl || null })
      });
      if (!response.ok) return { ok: false, error: 'Bình luận thất bại.' };

      const updatedReview = await response.json();
      setReviews(prev => {
        const exists = prev.some(r => r.id === reviewId);
        if (exists) return prev.map(r => r.id === reviewId ? updatedReview : r);
        return [updatedReview, ...prev];
      });
      return { ok: true, review: updatedReview };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối.' };
    }
  }, []);

  // ── Add level-2 reply to a comment ─────────────────────────────────────────
  const addReplyToComment = useCallback(async (reviewId, commentId, content) => {
    if (!content?.trim()) return { ok: false, error: 'Vui lòng nhập nội dung phản hồi.' };
    const token = localStorage.getItem('ff_token');
    try {
      const response = await fetch(`/api/v1/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: content.trim(), parent_id: commentId })
      });
      if (!response.ok) return { ok: false, error: 'Phản hồi thất bại.' };

      const updatedReview = await response.json();
      setReviews(prev => {
        const exists = prev.some(r => r.id === reviewId);
        if (exists) return prev.map(r => r.id === reviewId ? updatedReview : r);
        return [updatedReview, ...prev];
      });
      return { ok: true, review: updatedReview };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối.' };
    }
  }, []);

  // ── Toggle like on a comment ──────────────────────────────────────────────
  const toggleLikeComment = useCallback(async (commentId, userId) => {
    if (!userId) return { ok: false, error: 'Bạn cần đăng nhập.' };
    const token = localStorage.getItem('ff_token');
    try {
      const response = await fetch(`/api/v1/reviews/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) return { ok: false, error: 'Thao tác thất bại.' };

      const likeData = await response.json(); // { id, likeCount, liked }
      
      setReviews(prev => prev.map(r => {
        const hasComment = r.comments?.some(c => c.id.toString() === commentId.toString());
        if (!hasComment) return r;
        
        const updatedComments = r.comments.map(c => {
          if (c.id.toString() === commentId.toString()) {
            return {
              ...c,
              likeCount: likeData.likeCount,
              likedByUser: likeData.liked
            };
          }
          return c;
        });
        return { ...r, comments: updatedComments };
      }));

      return { ok: true, data: likeData };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối.' };
    }
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const getReviewsByRestaurant = useCallback(
    (restaurantId) => reviews
      .filter(r => r.restaurantId === restaurantId || r.restaurant_id === restaurantId)
      .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)),
    [reviews]
  );

  const getAverageRating = useCallback((restaurantId) => {
    const list = reviews.filter(r => r.restaurantId === restaurantId || r.restaurant_id === restaurantId);
    if (!list.length) return 0;
    return Math.round((list.reduce((acc, r) => acc + r.rating, 0) / list.length) * 10) / 10;
  }, [reviews]);

  const value = useMemo(() => ({
    reviews,
    hasMoreReviews,
    reviewsLoading,
    fetchReviews,
    addReview,
    getReviewsByRestaurant,
    getAverageRating,
    toggleLikeReview,
    addCommentToReview,
    addReplyToComment,
    toggleLikeComment,
  }), [
    reviews, hasMoreReviews, reviewsLoading,
    fetchReviews, addReview, getReviewsByRestaurant, getAverageRating,
    toggleLikeReview, addCommentToReview, addReplyToComment, toggleLikeComment,
  ]);

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
