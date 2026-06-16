import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { formatCategory } from '../utils/category.js';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useState } from 'react';
import LoginPromptModal from './LoginPromptModal.jsx';

export default function RestaurantCard({ restaurant, index }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentUser } = useAuth();
  const { getAverageRating, getReviewsByRestaurant } = useReviews();
  const [loginPrompt, setLoginPrompt] = useState(false);

  const faved = isFavorite(restaurant.id);
  const avg = getAverageRating(restaurant.id) || restaurant.rating || 0;
  const reviewCount = getReviewsByRestaurant(restaurant.id).length;

  const handleLikeRestaurant = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    toggleFavorite(restaurant.id);
  };

  return (
    <>
      <Link 
        to={`/restaurants/${restaurant.id}`} 
        className="restaurant-card"
        style={{ 
          textDecoration: 'none', 
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-light)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          transition: 'transform 0.3s, box-shadow 0.3s',
          height: '100%',
          opacity: 0, // for GSAP animation
          transform: 'translateY(50px)' // initial state for GSAP
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
        }}
      >
        <div className="card__media" style={{ aspectRatio: '16/10', position: 'relative', borderBottom: '1px solid var(--border)' }}>
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
            style={{ 
              display: 'grid', placeItems: 'center', position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(255, 255, 255, 0.9)', border: 'none', borderRadius: '50%', width: '32px', height: '32px',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {faved ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--danger)" stroke="var(--danger)" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px', color: 'var(--text-dark)' }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="card__body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <div className="card__meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span className="badge" style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'var(--bg-subtle)', fontWeight: '600' }}>
                {formatCategory(restaurant.category)}
              </span>
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
              <span key={t} className="tag" style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                #{t}
              </span>
            ))}
          </div>

          <div
            className="restaurant-detail-btn"
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
              transition: 'background 0.2s',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.4px',
              gap: '4px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(238, 114, 20, 0.05)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Chi tiết & Review
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '11px', height: '11px' }}>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </Link>
      <LoginPromptModal
        open={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        message="Bồ cần đăng nhập để thêm quán vào danh sách yêu thích nha!"
      />
    </>
  );
}
