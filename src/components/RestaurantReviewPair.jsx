import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import ReviewCard from './ReviewCard.jsx';
import { toast } from './Toast.jsx';
import { getSessionId } from '../utils/session.js';
import { formatCategory } from '../utils/category.js';

export default function RestaurantReviewPair({ restaurant }) {
  const navigate = useNavigate();
  const { reviews, getAverageRating, getReviewsByRestaurant } = useReviews();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentUser } = useAuth();

  const reviewsContainerRef = useRef(null);

  const [localReviews, setLocalReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Pagination states for reviews
  const [reviewsSkip, setReviewsSkip] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const LIMIT = 3;

  // Auto-load more reviews if the container doesn't overflow but more exist on server
  useEffect(() => {
    if (!loadingReviews && !loadingMoreReviews && hasMoreReviews && reviewsContainerRef.current) {
      const target = reviewsContainerRef.current;
      const scrollableHeight = target.scrollHeight - target.clientHeight;
      if (scrollableHeight <= 0) {
        const nextSkip = reviewsSkip + LIMIT;
        setReviewsSkip(nextSkip);
        loadMoreReviews(nextSkip);
      }
    }
  }, [localReviews, loadingReviews, loadingMoreReviews, hasMoreReviews, reviewsSkip, restaurant.id]);

  // Sync with global context for review totals and averages
  const faved = isFavorite(restaurant.id);
  const avg = getAverageRating(restaurant.id) || restaurant.rating || 0;
  const reviewCount = getReviewsByRestaurant(restaurant.id).length;

  // Asynchronously fetch top reviews for this restaurant
  useEffect(() => {
    let active = true;
    setLoadingReviews(true);
    setReviewsSkip(0);
    setHasMoreReviews(true);
    
    const sid = getSessionId();
    const token = localStorage.getItem('ff_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Fetch initial list of reviews
    fetch(`/api/v1/reviews/?restaurant_id=${restaurant.id}&skip=0&limit=${LIMIT}&session_id=${sid}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then((data) => {
        if (active) {
          setLocalReviews(data);
          setHasMoreReviews(data.length >= LIMIT);
          setLoadingReviews(false);
        }
      })
      .catch((err) => {
        console.error(`Error loading reviews for restaurant ${restaurant.id}:`, err);
        if (active) {
          setLoadingReviews(false);
        }
      });

    return () => {
      active = false;
    };
  }, [restaurant.id]);

  // Load more reviews when scrolling reaches bottom of container
  const loadMoreReviews = async (nextSkip) => {
    if (loadingMoreReviews || !hasMoreReviews) return;
    setLoadingMoreReviews(true);
    
    const sid = getSessionId();
    const token = localStorage.getItem('ff_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await fetch(`/api/v1/reviews/?restaurant_id=${restaurant.id}&skip=${nextSkip}&limit=${LIMIT}&session_id=${sid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.length < LIMIT) {
          setHasMoreReviews(false);
        } else {
          setHasMoreReviews(true);
        }
        setLocalReviews((prev) => [...prev, ...data]);
      } else {
        setHasMoreReviews(false);
      }
    } catch (err) {
      console.error(`Error loading more reviews for ${restaurant.id}:`, err);
      setHasMoreReviews(false);
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  // Sync locally fetched reviews with context review updates (e.g. likes, new comments)
  const reviewsToDisplay = useMemo(() => {
    return localReviews.map((localRev) => {
      const globalRev = reviews.find((r) => r.id === localRev.id);
      return globalRev || localRev;
    });
  }, [localReviews, reviews]);

  const handleLikeRestaurant = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      toast('Bồ cần đăng nhập để thêm vào danh sách yêu thích nha!', 'error');
      navigate('/login');
      return;
    }
    toggleFavorite(restaurant.id);
  };

  // Scroll handler for infinite scroll of reviews (triggering at 75% scroll depth)
  const handleScroll = (e) => {
    const target = e.currentTarget;
    const scrollableHeight = target.scrollHeight - target.clientHeight;
    if (scrollableHeight <= 0) return;
    const scrolledPercent = (target.scrollTop / scrollableHeight) * 100;
    if (scrolledPercent >= 75) {
      if (hasMoreReviews && !loadingMoreReviews && !loadingReviews) {
        const nextSkip = reviewsSkip + LIMIT;
        setReviewsSkip(nextSkip);
        loadMoreReviews(nextSkip);
      }
    }
  };

  return (
    <div className="restaurant-review-pair">
      {/* Left Column: Restaurant Info Card */}
      <div className="restaurant-review-pair__left">
        <div className="card__media" style={{ aspectRatio: '16/10', borderBottom: '1px solid var(--border)' }}>
          <img
            src={restaurant.image}
            alt={restaurant.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <span className="card__price">{restaurant.priceRange}</span>
          <button
            className={`card__like ${faved ? 'is-liked' : ''}`}
            onClick={handleLikeRestaurant}
            aria-label={faved ? 'Bo yeu thich' : 'Yeu thich'}
            style={{ display: 'grid', placeItems: 'center' }}
          >
            {faved ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--danger)" stroke="var(--danger)" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="card__body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div className="card__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className="badge">{formatCategory(restaurant.category)}</span>
              {restaurant.is_verified === false && (
                <span 
                  style={{
                    padding: '3px 6px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    background: 'rgba(236,182,95,0.15)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(236,182,95,0.3)',
                    fontFamily: 'var(--font-mono)'
                  }}
                  title="Thông tin chưa được kiểm chứng chính thức"
                >
                  Chưa xác minh
                </span>
              )}
            </div>
            <span className="card__rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: 'var(--primary-dark)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '13px', height: '13px', marginRight: '2px' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {avg.toFixed(1)}
              <small style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '11px', marginLeft: '2px' }}>
                ({reviewCount})
              </small>
            </span>
          </div>
          
          <h3 className="card__title" style={{ margin: '4px 0', fontSize: '18px', fontWeight: '900', color: 'var(--text-dark)' }}>
            {restaurant.name}
          </h3>
          
          <p className="card__address" style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {restaurant.address}
          </p>
          
          <div className="card__tags" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
            {restaurant.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag" style={{ fontSize: '10px', padding: '3px 8px' }}>
                #{t}
              </span>
            ))}
          </div>

          <Link
            to={`/restaurants/${restaurant.id}`}
            style={{
              display: 'flex',
              marginTop: 'auto',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '11.5px',
              fontWeight: '800',
              color: 'var(--primary)',
              padding: '9px 0',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              transition: 'background 0.2s',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.4px',
              gap: '4px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(232, 153, 81, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Chi tiết & Review
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Right Column: Scrollable list of reviews with infinite scroll and sticky header */}
      <div ref={reviewsContainerRef} className="restaurant-review-pair__right" onScroll={handleScroll}>
        <h4 className="restaurant-review-pair__header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px', color: 'var(--primary)' }}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Đánh giá từ hội thực thần</span>
        </h4>

        {loadingReviews ? (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '60px 24px', color: 'var(--text-muted)', gap: '8px' }}>
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
            </svg>
            <span style={{ fontSize: '12.5px', fontFamily: 'var(--font-mono)' }}>Đang tải đánh giá...</span>
          </div>
        ) : reviewsToDisplay.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--border)',
            borderRadius: '4px',
            padding: '32px 24px',
            margin: '24px',
            textAlign: 'center',
            background: 'var(--bg-subtle)'
          }}>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Quán này chưa có bài đánh giá nào. Bồ tèo hãy là người mở bát review cho quán nhé!
            </p>
            <Link 
              to={`/restaurants/${restaurant.id}`}
              className="btn btn--primary" 
              style={{ padding: '8px 18px', fontSize: '12px', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Viết Review Ngay</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '12px', height: '12px' }}>
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px 24px 24px 24px' }}>
            {reviewsToDisplay.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
            {loadingMoreReviews && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', color: 'var(--text-muted)', gap: '8px', alignItems: 'center' }}>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>Đang tải thêm...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
