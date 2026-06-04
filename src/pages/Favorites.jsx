import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import RestaurantCard from '../components/RestaurantCard.jsx';

export default function Favorites() {
  const { favorites } = useFavorites();
  const { getRestaurant } = useRestaurants();
  const [favoriteList, setFavoriteList] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      if (favorites.length === 0) {
        if (active) {
          setFavoriteList([]);
          setLoading(false);
        }
        return;
      }
      try {
        const promises = favorites.map(id => getRestaurant(id));
        const results = await Promise.all(promises);
        if (active) {
          setFavoriteList(results.filter(Boolean));
        }
      } catch (err) {
        console.error("Error loading favorites:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { active = false; };
  }, [favorites, getRestaurant]);

  // Thêm staggered animation khi danh sách yêu thích xuất hiện
  useGSAP(
    () => {
      if (!loading && favoriteList.length > 0) {
        gsap.fromTo(
          '.grid .card',
          { opacity: 0, y: 35, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.06,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );
      } else if (!loading) {
        gsap.from('.empty', {
          opacity: 0,
          y: 25,
          duration: 0.6,
          ease: 'power2.out',
        });
      }
    },
    { dependencies: [loading, favoriteList], scope: containerRef }
  );

  return (
    <div className="container section" ref={containerRef}>
      <div className="section__head">
        <div>
          <h2 className="section__title">Nhà hàng yêu thích</h2>
          <p className="section__subtitle">
            Những nơi bạn đã lưu lại — luôn sẵn sàng khi bạn cần.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '60px 0', color: 'var(--text-dark)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
          </svg>
          <span>Đang tải danh sách quán yêu thích...</span>
        </div>
      ) : favoriteList.length === 0 ? (
        <div className="empty empty--large" style={{ borderRadius: '4px' }}>
          <div className="empty__icon" style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h3 style={{ textTransform: 'uppercase', fontWeight: '900', letterSpacing: '-0.5px' }}>Chưa có nhà hàng yêu thích nào</h3>
          <p>Hãy khám phá các nhà hàng và nhấn nút yêu thích để lưu lại những nơi bạn thích!</p>
          <Link to="/" className="btn btn--primary" style={{ borderRadius: '2px' }}>Khám phá ngay</Link>
        </div>
      ) : (
        <div className="grid">
          {favoriteList.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}
