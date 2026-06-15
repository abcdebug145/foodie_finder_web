import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatCategory } from '../utils/category.js';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useReviews } from '../context/ReviewsContext.jsx';
import StarRating from '../components/StarRating.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import ReportModal from '../components/ReportModal.jsx';
import { toast } from '../components/Toast.jsx';
import { getSessionId } from '../utils/session.js';

// ── Aspect labels (shared config) ────────────────────────────────────────────
const ASPECT_KEYS = [
  { key: 'aspect_food_quality',             label: 'Chất lượng món', icon: '🍽️' },
  { key: 'aspect_service_general',          label: 'Dịch vụ',        icon: '🙋' },
  { key: 'aspect_ambience_general',         label: 'Không gian',     icon: '✨' },
  { key: 'aspect_food_prices',              label: 'Giá món ăn',     icon: '💰' },
  { key: 'aspect_restaurant_general',       label: 'Quán tổng thể',  icon: '🏠' },
  { key: 'aspect_location_general',         label: 'Vị trí',         icon: '📍' },
  { key: 'aspect_drinks_quality',           label: 'Đồ uống',        icon: '🥤' },
  { key: 'aspect_food_style_options',       label: 'Sự đa dạng',     icon: '🌈' },
];

// Đăng ký plugin ScrollTrigger với GSAP
gsap.registerPlugin(ScrollTrigger);

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getRestaurant } = useRestaurants();
  const { currentUser } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { reviews } = useReviews();
  
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  
  // Reviews state with pagination and stats separation
  const [restaurantReviews, setRestaurantReviews] = useState([]);
  const [reviewsForStats, setReviewsForStats] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsSkip, setReviewsSkip] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);

  const handleReviewUpdate = useCallback((updatedReview) => {
    setRestaurantReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
    setReviewsForStats(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
  }, []);
  const [showMap, setShowMap] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Menu items and booking states
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [preOrder, setPreOrder] = useState({}); // { [itemId]: quantity }

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [bookingDate, setBookingDate] = useState(getTodayString());
  const [bookingTime, setBookingTime] = useState('18:00');
  const [partySize, setPartySize] = useState(2);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  
  const containerRef = useRef(null);
  const heroImageRef = useRef(null);

  const handleVerify = async () => {
    if (verifying || !restaurant) return;
    setVerifying(true);
    try {
      const token = localStorage.getItem('ff_token');
      const res = await fetch(`/api/v1/restaurants/${restaurant.id}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast('Đã xác minh nhà hàng thành công!', 'success');
        setRestaurant(prev => ({ ...prev, is_verified: true }));
      } else {
        toast('Xác minh nhà hàng thất bại.', 'error');
      }
    } catch (e) {
      toast('Lỗi kết nối máy chủ.', 'error');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setRestaurantLoading(true);
      const data = await getRestaurant(id);
      if (active) {
        setRestaurant(data);
        setRestaurantLoading(false);

        // ── Lưu vào viewed history cho content-based recommender ─────────────
        if (data?.id) {
          try {
            const raw = localStorage.getItem('ff_viewed_history');
            const history = raw ? JSON.parse(raw) : [];
            // Loại duplicate, thêm mới nhất vào đầu, giới hạn 20
            const updated = [data.id, ...history.filter(h => h !== data.id)].slice(0, 20);
            localStorage.setItem('ff_viewed_history', JSON.stringify(updated));
          } catch (e) {
            // Bỏ qua lỗi localStorage
          }
        }
      }
    };
    load();
    return () => { active = false; };
  }, [id, getRestaurant]);

  useEffect(() => {
    let active = true;
    const fetchMenu = async () => {
      setMenuLoading(true);
      try {
        const res = await fetch(`/api/v1/menu/restaurant/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setMenuItems(data);
          }
        }
      } catch (err) {
        console.error("Error fetching menu items:", err);
      } finally {
        if (active) {
          setMenuLoading(false);
        }
      }
    };
    if (id) {
      fetchMenu();
    }
    return () => { active = false; };
  }, [id]);

  const menuByCategory = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return null;
    const groups = {};
    menuItems.forEach(item => {
      const cat = item.category || "Khác";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });
    return groups;
  }, [menuItems]);

  const preOrderTotal = useMemo(() => {
    let total = 0;
    Object.entries(preOrder).forEach(([itemId, quantity]) => {
      const item = menuItems.find(i => i.id === parseInt(itemId));
      if (item && item.price) {
        total += item.price * quantity;
      }
    });
    return total;
  }, [preOrder, menuItems]);

  const addToPreOrder = (itemId) => {
    setPreOrder(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromPreOrder = (itemId) => {
    setPreOrder(prev => {
      const next = { ...prev };
      if (next[itemId] <= 1) {
        delete next[itemId];
      } else {
        next[itemId] = next[itemId] - 1;
      }
      return next;
    });
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Vui lòng đăng nhập để đặt bàn!', 'error');
      navigate('/login', { state: { from: `/restaurants/${restaurant.id}` } });
      return;
    }

    setBookingSubmitting(true);
    const token = localStorage.getItem('ff_token');

    const items = Object.entries(preOrder).map(([itemId, quantity]) => {
      const item = menuItems.find(i => i.id === parseInt(itemId));
      return {
        menu_item_id: parseInt(itemId),
        item_name: item ? item.name : `Món #${itemId}`,
        quantity: quantity,
        unit_price: item ? item.price : 0,
        note: ''
      };
    });

    const bookingData = {
      restaurant_id: restaurant.id,
      booking_date: bookingDate,
      booking_time: bookingTime,
      party_size: partySize,
      note: bookingNote,
      items: items
    };

    try {
      const res = await fetch('/api/v1/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        toast('Đặt bàn & Pre-order thành công! Đã tự động xác nhận.', 'success');
        setPreOrder({});
        setBookingNote('');
      } else {
        const err = await res.json();
        toast(err.detail || 'Đặt bàn thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi kết nối máy chủ.', 'error');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // 1. Fetch all reviews for calculating statistics
  useEffect(() => {
    let active = true;
    const fetchStatsReviews = async () => {
      try {
        const res = await fetch(`/api/v1/reviews/?restaurant_id=${id}&limit=500`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setReviewsForStats(data);
          }
        }
      } catch (err) {
        console.error("Error fetching reviews for stats:", err);
      }
    };
    fetchStatsReviews();
    return () => { active = false; };
  }, [id, reviews]);

  // 2. Reset pagination state when restaurant ID or global reviews change
  useEffect(() => {
    setRestaurantReviews([]);
    setReviewsSkip(0);
    setHasMoreReviews(true);
  }, [id, reviews]);

  // 3. Fetch current page of reviews
  useEffect(() => {
    let active = true;
    const fetchPageReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`/api/v1/reviews/?restaurant_id=${id}&skip=${reviewsSkip}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (active) {
            if (reviewsSkip === 0) {
              setRestaurantReviews(data);
            } else {
              setRestaurantReviews(prev => {
                const ids = new Set(prev.map(r => r.id));
                const uniqueNew = data.filter(r => !ids.has(r.id));
                return [...prev, ...uniqueNew];
              });
            }
            setHasMoreReviews(data.length === 5);
          }
        }
      } catch (err) {
        console.error("Error fetching reviews page:", err);
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    };
    fetchPageReviews();
    return () => { active = false; };
  }, [id, reviewsSkip, reviews]);

  const avg = useMemo(() => {
    if (!restaurant) return 0.0;
    if (reviewsForStats.length === 0) return restaurant.rating || 0.0;
    const sum = reviewsForStats.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / reviewsForStats.length) * 10) / 10;
  }, [reviewsForStats, restaurant]);

  const faved = isFavorite(restaurant?.id || '');

  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviewsForStats.filter((r) => {
        const stars = Math.max(0, Math.min(5, r.rating > 5 ? Math.round(r.rating / 2) : Math.round(r.rating)));
        return stars === star;
      }).length
    }));
  }, [reviewsForStats]);

  // Aggregate aspect sentiments across all reviews
  const aspectStats = useMemo(() => {
    return ASPECT_KEYS.map(({ key, label, icon }) => {
      const mentioned = reviewsForStats.filter(r => r[key]);
      const pos = mentioned.filter(r => r[key] === 'positive').length;
      const neg = mentioned.filter(r => r[key] === 'negative').length;
      const neu = mentioned.filter(r => r[key] === 'neutral').length;
      const total = mentioned.length;
      return { key, label, icon, pos, neg, neu, total,
        score: total > 0 ? Math.round((pos / total) * 100) : null };
    }).filter(a => a.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [reviewsForStats]);

  const parsedMenu = useMemo(() => {
    if (!restaurant || !restaurant.menu) return null;
    try {
      const raw = restaurant.menu;
      if (typeof raw === 'object') return raw;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {
      // Not a JSON string
    }
    return null;
  }, [restaurant]);

  // Hiệu ứng GSAP mượt mà cho trang chi tiết
  useGSAP(
    () => {
      if (!restaurant) return;

      // 1. Phóng to nhẹ ảnh bìa và tạo hiệu ứng Parallax khi cuộn trang
      gsap.set(heroImageRef.current, { scale: 1.15 });
      gsap.to(heroImageRef.current, {
        yPercent: 15,
        ease: 'none',
        scrollTrigger: {
          trigger: '.detail__hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // 2. Animation xuất hiện cho các phần tử tiêu đề trên Hero
      const heroTl = gsap.timeline();
      gsap.set(
        '.detail__back, .detail__hero-content .badge, .detail__hero-content h1, .detail__meta, .detail__hero-content .btn',
        { opacity: 0, y: 20 }
      );
      
      heroTl.to('.detail__back', { opacity: 0.9, y: 0, duration: 0.5 })
        .to('.detail__hero-content .badge', { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
        .to('.detail__hero-content h1', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.3')
        .to('.detail__meta', { opacity: 0.95, y: 0, duration: 0.4 }, '-=0.3')
        .to('.detail__hero-content .btn', { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)' }, '-=0.3');

      // 3. Hiệu ứng xuất hiện so le cho các panel thông tin (Giới thiệu, liên hệ, món đặc sắc)
      const panels = containerRef.current.querySelectorAll('.panel');
      panels.forEach((panel) => {
        gsap.from(panel, {
          opacity: 0,
          y: 40,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: panel,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        });
      });

      // 4. Chạy thanh điểm đánh giá (Rating bars) khi cuộn chuột đến
      const ratingBars = containerRef.current.querySelectorAll('.rating-bar__fill');
      ratingBars.forEach((bar) => {
        const targetPct = bar.getAttribute('data-percent');
        gsap.to(bar, {
          width: `${targetPct}%`,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.rating-summary',
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });

      // 5. Hiệu ứng staggered cho các món đặc trưng
      gsap.from('.specialties li', {
        opacity: 0,
        x: -25,
        stagger: 0.1,
        duration: 0.6,
        ease: 'back.out(1.5)',
        scrollTrigger: {
          trigger: '.specialties',
          start: 'top 90%',
          toggleActions: 'play none none none',
        },
      });
    },
    { dependencies: [restaurant], scope: containerRef }
  );

  if (restaurantLoading) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-dark)', fontFamily: 'var(--font-mono)', fontWeight: '800' }}>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
          </svg>
          <span>Đang tải thông tin quán ăn...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2 style={{ marginBottom: '16px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Không tìm thấy quán ăn</h2>
        <p>
          <Link to="/" className="btn btn--primary" style={{ borderRadius: '2px' }}>Quay về trang chủ</Link>
        </p>
      </div>
    );
  }

  const handleLike = () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/restaurants/${restaurant.id}` } });
      return;
    }
    toggleFavorite(restaurant.id);
  };

  const handleReportClick = () => {
    if (!currentUser) {
      toast('Bạn cần đăng nhập để báo cáo vi phạm.', 'error');
      navigate('/login', { state: { from: `/restaurants/${restaurant.id}` } });
      return;
    }
    setShowReportModal(true);
  };

  return (
    <div className="detail" ref={containerRef}>
      <div className="detail__hero">
        <img ref={heroImageRef} src={restaurant.image} alt={restaurant.name} />
        <div className="detail__hero-overlay" />
        <div className="container detail__hero-content">
          <Link to="/" className="detail__back">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Tất cả nhà hàng
          </Link>
          <span className="badge">{formatCategory(restaurant.category)}</span>
          <h1>{restaurant.name}</h1>
          <div className="detail__meta">
            <span className="detail__rating">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '15px', height: '15px', marginRight: '4px' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {avg.toFixed(1)}{' '}
              <small>({reviewsForStats.length} đánh giá)</small>
            </span>
            <span>•</span>
            <span>{restaurant.priceRange}</span>
            <span>•</span>
            <span>{restaurant.hours}</span>
          </div>
          <button
            className={`btn btn--like ${faved ? 'is-liked' : ''}`}
            onClick={handleLike}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {faved ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                Đã thích
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                Thích nhà hàng
              </>
            )}
          </button>
          
          <button
            className="btn btn--ghost"
            onClick={handleReportClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginLeft: '12px',
              borderColor: 'var(--danger)',
              color: 'var(--danger)'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '15px', height: '15px' }}>
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="11"></line>
            </svg>
            Báo cáo
          </button>
        </div>
      </div>

      <div className="container detail__body">
        {restaurant && restaurant.is_verified === false && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '16px 20px',
            background: 'rgba(236, 182, 95, 0.12)',
            border: '2px dashed var(--accent)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-dark)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14.5px',
            fontWeight: '600',
            lineHeight: '1.5',
            flexWrap: 'wrap',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <span>Địa điểm này do thành viên cộng đồng đóng góp và chưa được xác minh chính thức. Thông tin hiển thị (địa chỉ, giờ mở cửa...) có thể chưa chính xác 100%.</span>
            </div>
            {currentUser && currentUser.is_admin && (
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="btn btn--primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  background: 'var(--accent-green)',
                  borderColor: 'var(--accent-green)',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {verifying ? 'Đang duyệt...' : 'Xác minh ngay'}
              </button>
            )}
          </div>
        )}

        <div className="detail__main">
          {/* Áp dụng class glass-panel cho giao diện kính mờ sang trọng */}
          <section className="panel glass-panel">
            <h2 className="panel__title">Thực đơn</h2>
            {menuLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0' }}>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Đang tải menu mới nhất...</span>
              </div>
            ) : menuByCategory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
                {Object.entries(menuByCategory).map(([catName, items]) => (
                  <div key={catName}>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', borderBottom: '1.5px solid var(--border)', paddingBottom: '6px', marginBottom: '14px', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {catName}
                    </h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '16px'
                    }}>
                      {items.map(item => (
                        <div 
                          key={item.id}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '12px',
                            background: 'var(--bg-subtle)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border)',
                            alignItems: 'center',
                            position: 'relative'
                          }}
                        >
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              style={{
                                width: '70px',
                                height: '70px',
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                flexShrink: 0
                              }} 
                            />
                          ) : (
                            <div style={{
                              width: '70px',
                              height: '70px',
                              background: 'rgba(42,29,25,0.05)',
                              borderRadius: 'var(--radius-md)',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '24px',
                              flexShrink: 0
                            }}>
                              🍲
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                            <strong 
                              style={{ 
                                fontSize: '14px', 
                                color: 'var(--text-dark)', 
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </strong>
                            {item.description && (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.description}
                              </span>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '13.5px', color: 'var(--primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                                {item.price ? `${item.price.toLocaleString('vi-VN')}đ` : 'Liên hệ'}
                              </span>
                              
                              {/* Quantity Selector for Pre-order */}
                              {currentUser && item.is_available && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {preOrder[item.id] ? (
                                    <>
                                      <button 
                                        type="button"
                                        onClick={() => removeFromPreOrder(item.id)}
                                        style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: '800' }}
                                      >
                                        -
                                      </button>
                                      <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '16px', textAlign: 'center' }}>
                                        {preOrder[item.id]}
                                      </span>
                                    </>
                                  ) : null}
                                  <button 
                                    type="button"
                                    onClick={() => addToPreOrder(item.id)}
                                    style={{ 
                                      width: '22px', 
                                      height: '22px', 
                                      borderRadius: '50%', 
                                      border: 'none', 
                                      background: 'var(--primary)', 
                                      color: 'var(--bg-dark)', 
                                      cursor: 'pointer', 
                                      display: 'grid', 
                                      placeItems: 'center', 
                                      fontSize: '12px', 
                                      fontWeight: '800' 
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : parsedMenu ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                marginTop: '16px'
              }}>
                {Object.entries(parsedMenu).map(([name, info]) => (
                  <div 
                    key={name}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '12px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)',
                      alignItems: 'center',
                    }}
                  >
                    {info.img_url && (
                      <img 
                        src={info.img_url} 
                        alt={name} 
                        style={{
                          width: '70px',
                          height: '70px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          flexShrink: 0
                        }} 
                      />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-dark)', lineHeight: '1.4' }}>{name}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                        {info.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>{restaurant.description}</p>
            )}
            <div className="detail__tags" style={{ marginTop: '20px' }}>
              {restaurant.tags.map((t) => (
                <span className="tag" key={t}>#{t}</span>
              ))}
            </div>
          </section>
 
          <section className="panel glass-panel">
            <h2 className="panel__title">Món đặc trưng</h2>
            <ul className="specialties">
              {restaurant.specialties.map((s) => (
                <li key={s}>
                  <span className="icon-wrap specialty-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '12px', height: '12px' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </section>

          {restaurant.gallery?.length > 0 && (
            <section className="panel glass-panel">
              <h2 className="panel__title">Thư viện ảnh</h2>
              <div className="gallery">
                {restaurant.gallery.map((src, i) => (
                  <img key={i} src={src} alt={`${restaurant.name} ${i + 1}`} loading="lazy" />
                ))}
              </div>
            </section>
          )}

          <section className="panel glass-panel">
            <h2 className="panel__title">Đánh giá từ khách hàng</h2>

            {reviewsLoading && restaurantReviews.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', color: 'var(--text-dark)', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                <span>Đang tải các bài viết đánh giá...</span>
              </div>
            ) : (
              <>
                <div className="rating-summary">
                  <div className="rating-summary__avg">
                    <strong>{avg.toFixed(1)}</strong>
                    <StarRating value={Math.round(avg)} readOnly size={18} />
                    <span>{reviewsForStats.length} đánh giá</span>
                  </div>
                  <div className="rating-summary__bars">
                    {ratingCounts.map(({ star, count }) => {
                      const pct = reviewsForStats.length ? (count / reviewsForStats.length) * 100 : 0;
                      return (
                        <div key={star} className="rating-bar">
                          <span className="rating-bar__label" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                            {star}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          </span>
                          <div className="rating-bar__track">
                            {/* Lưu trữ pct vào data-percent để GSAP lấy động */}
                            <div
                              className="rating-bar__fill"
                              data-percent={pct}
                            />
                          </div>
                          <span className="rating-bar__count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <ReviewForm restaurantId={restaurant.id} />

                {/* Aspect Sentiment Summary */}
                {aspectStats.length > 0 && (
                  <div style={{ margin: '20px 0', padding: '18px 20px', background: 'rgba(232,153,81,0.04)', border: '1px solid rgba(232,153,81,0.15)', borderRadius: '12px' }}>
                    <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>
                      📊 Phân tích khía cạnh từ đánh giá
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {aspectStats.map(({ key, label, icon, pos, neg, neu, total, score }) => (
                        <div key={key}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)' }}>
                              {icon} {label}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                              <span style={{ color: '#059669', fontWeight: '700' }}>✓ {pos}</span>
                              <span style={{ color: '#6b7280' }}>~ {neu}</span>
                              <span style={{ color: '#dc2626', fontWeight: '700' }}>✗ {neg}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/ {total}</span>
                            </div>
                          </div>
                          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                            <div style={{ width: `${(pos/total)*100}%`, background: '#10b981', transition: 'width 0.8s ease' }} />
                            <div style={{ width: `${(neu/total)*100}%`, background: '#d1d5db', transition: 'width 0.8s ease' }} />
                            <div style={{ width: `${(neg/total)*100}%`, background: '#ef4444', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="reviews">
                  {restaurantReviews.length === 0 ? (
                    <p className="empty">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                  ) : (
                    restaurantReviews.map((rv) => <ReviewCard key={rv.id} review={rv} onReviewUpdate={handleReviewUpdate} />)
                  )}
                </div>

                {hasMoreReviews && (
                  <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '16px' }}>
                    <button
                      onClick={() => setReviewsSkip(prev => prev + 5)}
                      disabled={reviewsLoading}
                      className="btn btn--ghost"
                      style={{
                        padding: '10px 24px',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '24px',
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--primary)';
                        e.currentTarget.style.color = 'var(--bg-dark)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--primary)';
                      }}
                    >
                      {reviewsLoading ? (
                        <>
                          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
                          </svg>
                          Đang tải...
                        </>
                      ) : (
                        'Xem thêm đánh giá'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="detail__aside">
          {/* Booking & Pre-order Panel */}
          <div className="panel glass-panel" style={{ border: '2px solid var(--primary)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10px', left: '16px', background: 'var(--primary)', color: 'var(--bg-dark)', padding: '2px 8px', fontSize: '11px', fontWeight: '800', borderRadius: '4px', textTransform: 'uppercase' }}>
              Online Booking
            </div>
            <h3 className="panel__title" style={{ marginTop: '6px' }}>Đặt bàn & Gọi món</h3>
            
            {!currentUser ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
                  Đăng nhập để đặt bàn giữ chỗ trực tuyến và chọn trước thực đơn của nhà hàng.
                </p>
                <button
                  onClick={() => navigate('/login', { state: { from: `/restaurants/${restaurant.id}` } })}
                  className="btn btn--primary btn--block"
                  style={{ fontSize: '12px', padding: '10px 16px' }}
                >
                  Đăng nhập ngay
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Ngày đặt bàn</label>
                  <input
                    type="date"
                    required
                    min={getTodayString()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'white', color: 'var(--text-dark)', fontSize: '13.5px', fontFamily: 'var(--font)' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Giờ đặt</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'white', color: 'var(--text-dark)', fontSize: '13.5px', fontFamily: 'var(--font)' }}
                    >
                      {["11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"].map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Số khách</label>
                    <select
                      value={partySize}
                      onChange={(e) => setPartySize(parseInt(e.target.value))}
                      style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'white', color: 'var(--text-dark)', fontSize: '13.5px', fontFamily: 'var(--font)' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(num => (
                        <option key={num} value={num}>{num} người</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Pre-order Basket display */}
                {Object.keys(preOrder).length > 0 && (
                  <div style={{ background: 'var(--bg-subtle)', border: '1px dashed var(--primary)', borderRadius: 'var(--radius-md)', padding: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-dark)' }}>Thực đơn gọi trước:</span>
                      <button 
                        type="button" 
                        onClick={() => setPreOrder({})}
                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', fontWeight: '700' }}
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', paddingRight: '4px' }}>
                      {Object.entries(preOrder).map(([itemId, quantity]) => {
                        const item = menuItems.find(i => i.id === parseInt(itemId));
                        if (!item) return null;
                        return (
                          <div key={itemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                            <span style={{ color: 'var(--text-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                              {item.name} <small style={{ color: 'var(--text-muted)' }}>x{quantity}</small>
                            </span>
                            <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)' }}>
                              {item.price ? `${(item.price * quantity).toLocaleString('vi-VN')}đ` : '0đ'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontSize: '13px', fontWeight: '800' }}>
                      <span>Tổng tạm tính:</span>
                      <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {preOrderTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Ghi chú đặt bàn</label>
                  <textarea
                    rows={2}
                    placeholder="Yêu cầu đặc biệt (VD: bàn ngoài trời, ghế trẻ em...)"
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'white', color: 'var(--text-dark)', fontSize: '13px', fontFamily: 'var(--font)' }}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="btn btn--primary btn--block"
                  style={{ padding: '12px', fontSize: '13px' }}
                >
                  {bookingSubmitting ? 'Đang gửi...' : 'Xác nhận đặt bàn'}
                </button>
              </form>
            )}
          </div>

          <div className="panel glass-panel">
            <h3 className="panel__title">Thông tin liên hệ</h3>
            <ul className="info-list">
              <li>
                <span className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <div>
                  <strong>Địa chỉ</strong>
                  <p>{restaurant.address}</p>
                </div>
              </li>
              <li>
                <span className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </span>
                <div>
                  <strong>Điện thoại</strong>
                  <p>{restaurant.phone}</p>
                </div>
              </li>
              <li>
                <span className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                </span>
                <div>
                  <strong>Giờ mở cửa</strong>
                  <p>{restaurant.hours}</p>
                </div>
              </li>
              <li>
                <span className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </span>
                <div>
                  <strong>Mức giá</strong>
                  <p>{restaurant.priceRange}</p>
                </div>
              </li>
            </ul>
            <button
              onClick={() => setShowMap(true)}
              className="btn btn--ghost btn--block"
              style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                fontSize: '12px',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '15px', height: '15px' }}>
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" y1="3" x2="9" y2="18" />
                <line x1="15" y1="6" x2="15" y2="21" />
              </svg>
              Xem bản đồ chỉ đường
            </button>
          </div>

          {(restaurant.cuisine_style || restaurant.suitable_for || restaurant.suitable_times || restaurant.capacity || restaurant.prep_time || restaurant.last_order || restaurant.holiday_closing) && (
            <div className="panel glass-panel" style={{ marginTop: '20px' }}>
              <h3 className="panel__title">Chi tiết về quán</h3>
              <ul className="info-list">
                {restaurant.cuisine_style && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /></svg>
                    </span>
                    <div>
                      <strong>Phong cách ẩm thực</strong>
                      <p>{restaurant.cuisine_style}</p>
                    </div>
                  </li>
                )}
                {restaurant.suitable_for && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </span>
                    <div>
                      <strong>Phù hợp cho</strong>
                      <p>{restaurant.suitable_for.replace(/;/g, ', ')}</p>
                    </div>
                  </li>
                )}
                {restaurant.suitable_times && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 15 15" /></svg>
                    </span>
                    <div>
                      <strong>Thời điểm phù hợp</strong>
                      <p>{restaurant.suitable_times.replace(/;/g, ', ')}</p>
                    </div>
                  </li>
                )}
                {restaurant.capacity && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
                    </span>
                    <div>
                      <strong>Sức chứa</strong>
                      <p>{restaurant.capacity}</p>
                    </div>
                  </li>
                )}
                {restaurant.prep_time && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-7 7 7 7 0 0 1-7-7V2M5 22v-4a7 7 0 0 1 7-7 7 7 0 0 1 7 7v4" /></svg>
                    </span>
                    <div>
                      <strong>Thời gian chuẩn bị</strong>
                      <p>{restaurant.prep_time}</p>
                    </div>
                  </li>
                )}
                {restaurant.last_order && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                    </span>
                    <div>
                      <strong>Giờ nhận khách cuối</strong>
                      <p>{restaurant.last_order}</p>
                    </div>
                  </li>
                )}
                {restaurant.holiday_closing && (
                  <li>
                    <span className="icon-wrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '18px', height: '18px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </span>
                    <div>
                      <strong>Ngày nghỉ lễ</strong>
                      <p>{restaurant.holiday_closing}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          )}
        </aside>
        
        {/* Similar Restaurants Section */}
        <SimilarRestaurantsSection restaurantId={restaurant.id} city={restaurant.city} />
      </div>

      {/* ── Leaflet Map Modal Overlay ───────────────────────────────── */}
      {showMap && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(42, 29, 25, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'grid',
          placeItems: 'center',
          padding: '24px'
        }}
          onClick={() => setShowMap(false)}
        >
          <div style={{
            width: '100%',
            maxWidth: '800px',
            height: '600px',
            maxHeight: '80vh',
            background: 'var(--bg-light)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '2px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-subtle)'
            }}>
              <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px', color: 'var(--primary)' }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Bản đồ đường đi - {restaurant.name}
              </h3>
              <button
                onClick={() => setShowMap(false)}
                style={{
                  border: 'none', background: 'rgba(42, 29, 25, 0.05)',
                  color: 'var(--text-dark)', cursor: 'pointer',
                  width: 30, height: 30, borderRadius: '50%',
                  display: 'grid', placeItems: 'center',
                  fontSize: 14, transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(42, 29, 25, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(42, 29, 25, 0.05)'}
              >
                ✕
              </button>
            </div>

            {/* Map Body */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#eee' }}>
              {restaurant.latitude && restaurant.longitude ? (
                <MapContainer
                  center={[restaurant.latitude, restaurant.longitude]}
                  zoom={16}
                  style={{ width: '100%', height: '100%', zIndex: 1 }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[restaurant.latitude, restaurant.longitude]}>
                    <Popup>
                      <div style={{ padding: '2px' }}>
                        <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-dark)' }}>{restaurant.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{restaurant.address}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', padding: '40px', color: 'var(--text-dark)', textAlign: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '48px', height: '48px', color: 'var(--text-muted)' }}>
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  <strong style={{ fontWeight: 800 }}>Chưa có tọa độ bản đồ</strong>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                    Quán ăn này hiện chưa được cập nhật tọa độ GPS (kinh độ, vĩ độ) trên hệ thống.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 24px',
              borderTop: '2px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--bg-subtle)',
              gap: '12px'
            }}>
              {restaurant.latitude && restaurant.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                  style={{ fontSize: '12px', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Chỉ đường bằng Google Maps ↗
                </a>
              )}
              <button
                onClick={() => setShowMap(false)}
                className="btn btn--ghost"
                style={{ fontSize: '12px', padding: '10px 18px', borderRadius: 'var(--radius-md)' }}
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
      {showReportModal && (
        <ReportModal
          targetType="restaurant"
          targetId={restaurant.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}

function SimilarRestaurantsSection({ restaurantId, city }) {
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchSimilar = async () => {
      setLoading(true);
      const token = localStorage.getItem('ff_token');
      const sid = getSessionId();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const res = await fetch('/api/v1/recommendations/', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            search_history: [],
            viewed_restaurant_ids: [],
            city: city || null,
            limit: 4,
            session_id: sid,
            context: 'detail',
            restaurant_id: restaurantId
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (active) {
            setSimilar(data);
          }
        }
      } catch (err) {
        console.error('[SimilarRestaurants] Fetch error:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (restaurantId) {
      fetchSimilar();
    }
    return () => { active = false; };
  }, [restaurantId, city]);

  if (loading) {
    return (
      <div style={{ gridColumn: '1 / -1', marginTop: '40px', padding: '24px 0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-dark)', marginBottom: '16px' }}>
          Nhà hàng tương tự
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: '260px', borderRadius: '12px', border: '1.5px solid var(--border)', background: 'var(--bg-light)', overflow: 'hidden', position: 'relative' }}>
              <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (similar.length === 0) return null;

  return (
    <div style={{ gridColumn: '1 / -1', marginTop: '48px', padding: '24px 0', borderTop: '1px solid var(--border)' }}>
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: '900', 
        color: 'var(--text-dark)', 
        marginBottom: '4px',
        letterSpacing: '-0.3px'
      }}>
        ✨ Nhà hàng tương tự bạn có thể thích
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
        Được gợi ý dựa trên đặc trưng ẩm thực và không gian tương đồng
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '20px' 
      }}>
        {similar.map(r => {
          const scorePercent = Math.round((r.similarity_score || 0) * 100);
          const tags = r.cuisine_tags
            ? r.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean).slice(0, 2)
            : [];
          return (
            <Link
              key={r.id}
              to={`/restaurants/${r.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                background: 'var(--bg-light)',
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1), border-color 0.2s, box-shadow 0.2s',
                position: 'relative',
                height: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(232,153,81,0.15)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
                <img
                  src={r.img_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=70'}
                  alt={r.name}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=70';
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(42,29,25,0.82)',
                  backdropFilter: 'blur(6px)',
                  color: 'var(--primary)',
                  fontSize: '9.5px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '5px',
                  border: '1px solid rgba(232,153,81,0.3)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {scorePercent}% tương đồng
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <strong style={{
                  fontSize: '13.5px',
                  fontWeight: '800',
                  color: 'var(--text-dark)',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  margin: 0
                }}>
                  {r.name}
                </strong>

                {/* Rating & Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '11.5px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--primary)" style={{ width: '10px', height: '10px', flexShrink: 0 }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span style={{ fontWeight: '700', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {Number(r.avg_rating || 0).toFixed(1)}
                  </span>
                  {r.category && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      · {r.category}
                    </span>
                  )}
                </div>

                {/* District/Address */}
                {r.district && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    📍 {r.district}
                  </span>
                )}

                {/* Tags */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '4px' }}>
                    {tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: 'var(--primary)',
                        background: 'rgba(232,153,81,0.08)',
                        border: '1px solid rgba(232,153,81,0.15)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
