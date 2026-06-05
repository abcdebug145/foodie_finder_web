import { useMemo, useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReviews } from '../context/ReviewsContext.jsx';
import RestaurantReviewPair from '../components/RestaurantReviewPair.jsx';
import RestaurantSkeleton from '../components/RestaurantSkeleton.jsx';
import SuggestRestaurantModal from '../components/SuggestRestaurantModal.jsx';
import RecommendationSection from '../components/RecommendationSection.jsx';
import { toast } from '../components/Toast.jsx';

const SORT_OPTIONS = [
  { id: 'rating', label: 'Đánh giá cao nhất' },
  { id: 'reviews', label: 'Nhiều đánh giá nhất' },
  { id: 'name', label: 'Tên A → Z' }
];

const CATEGORY_OPTIONS = [
  { id: 'Tất cả', label: 'Gì cũm được?' },
  { id: 'nha-hang', label: 'Nhà hàng' },
  { id: 'quan-nhau', label: 'Quán nhậu' },
  { id: 'quan-an', label: 'Quán ăn' },
  { id: 'cafe', label: 'Cafe' }
];

export default function Home() {
  const { reviews, fetchReviews, hasMoreReviews, reviewsLoading } = useReviews();

  const LIMIT = 6;
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [sort, setSort] = useState('rating');
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [city, setCity] = useState(() => localStorage.getItem('ff_user_city') || 'ha-noi');
  const [locationLoading, setLocationLoading] = useState(false);
  const [pinnedAddress, setPinnedAddress] = useState(() => localStorage.getItem('ff_user_address') || null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerRef = useRef(null);
  const heroArtRef = useRef(null);

  // Dynamic API Fetching
  const fetchRestaurants = async (currentCity, currentCategory, currentSearch, currentSort, currentSkip, append = false) => {
    setIsLoading(true);
    try {
      const url = `/api/v1/restaurants/?city=${currentCity}&category=${encodeURIComponent(currentCategory)}&q=${encodeURIComponent(currentSearch)}&sort=${currentSort}&skip=${currentSkip}&limit=${LIMIT}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Không thể tải danh sách quán ăn");
      const data = await res.json();
      
      const mapped = data.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category || 'Khác',
        priceRange: r.capacity && r.capacity.includes('$$') ? r.capacity : '$$',
        address: r.address || 'Chưa cập nhật',
        phone: r.phone || 'Chưa cập nhật',
        hours: r.hours || '08:00 - 22:00',
        rating: r.avg_rating || 0.0,
        image: r.restaurant_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
        tags: r.cuisine_tags ? r.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean) : [],
        description: r.menu || 'Chưa có thực đơn chi tiết.'
      }));

      if (append) {
        setRestaurants(prev => [...prev, ...mapped]);
      } else {
        setRestaurants(mapped);
      }
      
      if (data.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      console.error(error);
      toast("Lỗi khi tải dữ liệu từ máy chủ", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger loading when filter states change
  useEffect(() => {
    setSkip(0);
    fetchRestaurants(city, category, searchQuery, sort, 0, false);
    fetchReviews(searchQuery, city, 0, 10, false);
  }, [city, category, searchQuery, sort, pinnedAddress]);

  // Infinite Scroll for restaurant pairs feed
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      if (scrollHeight <= clientHeight) return;
      
      const scrolledPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      if (scrolledPercent >= 75) {
        if (hasMore && !isLoading) {
          setSkip((prev) => prev + LIMIT);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isLoading]);

  // Load next pages
  useEffect(() => {
    if (skip > 0) {
      fetchRestaurants(city, category, searchQuery, sort, skip, true);
    }
  }, [skip]);

  // Browser Geolocation reverse-geocoding
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast("Ủa trình duyệt kén cá chọn canh thế, hổng hỗ trợ định vị rồi bồ ơi!", "error");
      return;
    }

    setLocationLoading(true);
    toast("Đang quét tọa độ GPS của bồ... Chờ xíu siêu nha!", "info");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/v1/restaurants/reverse-geocode?lat=${latitude}&lon=${longitude}`
          );
          if (!res.ok) throw new Error("Geolocation geocoding failed");
          const data = await res.json();
          const address = data.address || {};
          const cityName = address.city || address.state || address.county || address.town || "";
          
          let detectedCity = 'ha-noi';
          if (cityName.includes('Hồ Chí Minh') || cityName.includes('Ho Chi Minh') || cityName.includes('Sài Gòn') || cityName.includes('Saigon')) {
            detectedCity = 'ho-chi-minh';
          } else if (cityName.includes('Hà Nội') || cityName.includes('Ha Noi')) {
            detectedCity = 'ha-noi';
          } else if (cityName.includes('Đà Nẵng') || cityName.includes('Da Nang')) {
            detectedCity = 'da-nang';
          } else if (cityName.includes('Cần Thơ') || cityName.includes('Can Tho')) {
            detectedCity = 'can-tho';
          } else if (cityName.includes('Huế') || cityName.includes('Hue') || cityName.includes('Thừa Thiên Huế')) {
            detectedCity = 'hue';
          }

          setCity(detectedCity);
          localStorage.setItem('ff_user_city', detectedCity);
          
          const exactAddress = data.display_name || 
            `${address.house_number || ''} ${address.road || ''}, ${address.suburb || address.quarter || ''}, ${address.city || address.state || ''}`.trim().replace(/^,\s*/, '');
          
          setPinnedAddress(exactAddress);
          localStorage.setItem('ff_user_lat', latitude);
          localStorage.setItem('ff_user_lon', longitude);
          localStorage.setItem('ff_user_address', exactAddress);
          toast(`Dò ra tọa độ: ${exactAddress}. Đỉnh chóp luôn bồ ơi!`, 'success');
        } catch (err) {
          console.error(err);
          toast("Ủa đi đâu mà GPS lạc trôi luôn rồi bồ ơi!", "error");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error(error);
        toast("Huhu, bị từ chối quyền định vị rồi. Cho phép GPS đi nha bồ tèo!", "error");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Run geolocation on mount if no city saved
  useEffect(() => {
    const saved = localStorage.getItem('ff_user_city');
    if (!saved) {
      detectLocation();
    }
  }, []);

  const filteredRestaurants = restaurants;

  // Sắp xếp các bài đánh giá mới nhất lên bảng tin
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviews]);

  const handleCategoryChange = (c) => {
    if (category === c) return;
    setCategory(c);
  };

  const handleSortChange = (s) => {
    if (sort === s) return;
    setSort(s);
  };

  // ── Lưu search query vào localStorage (content-based recommender) ───────────
  const saveSearchHistory = (q) => {
    if (!q || !q.trim()) return;
    try {
      const raw = localStorage.getItem('ff_search_history');
      const history = raw ? JSON.parse(raw) : [];
      // Loại bỏ duplicate, thêm mới nhất vào đầu, giới hạn 10
      const updated = [q.trim(), ...history.filter(h => h !== q.trim())].slice(0, 10);
      localStorage.setItem('ff_search_history', JSON.stringify(updated));
    } catch (e) {
      // Bỏ qua lỗi localStorage
    }
  };

  // 1. Animation cho phần Hero (chạy một lần duy nhất khi mount)
  useGSAP(
    () => {
      const tl = gsap.timeline();

      gsap.set('.hero__eyebrow, .hero__title, .hero__subtitle, .hero__search', {
        opacity: 0,
        y: 30,
      });
      gsap.set(heroArtRef.current, {
        opacity: 0,
        x: 100,
        scale: 0.9,
        rotation: 5,
      });

      tl.to('.hero__eyebrow', {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'back.out(1.7)',
      })
        .to('.hero__title', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .to('.hero__subtitle', { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
        .to('.hero__search', { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.75)' }, '-=0.4')
        .to(heroArtRef.current, { opacity: 1, x: 0, scale: 1, rotation: 0, duration: 1.0, ease: 'power4.out' }, '-=0.8');

      gsap.to(heroArtRef.current, {
        y: 12,
        rotation: 1,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        force3D: true,
      });
    },
    { scope: containerRef }
  );

  // 2. Animation xuất hiện của danh sách cặp đôi đề xuất
  useGSAP(
    () => {
      // Chỉ chạy hiệu ứng khi tải danh sách trang đầu tiên (skip === 0)
      if (skip > 0) return;
      const pairs = containerRef.current.querySelectorAll('.restaurant-review-pair');
      if (pairs.length > 0) {
        gsap.fromTo(
          pairs,
          { opacity: 0, y: 35, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );
      }
    },
    { dependencies: [filteredRestaurants, skip], scope: containerRef }
  );

  return (
    <div ref={containerRef}>
      {/* Hero Section */}
      <section className="hero">
        <div className="noise-overlay" />
        <div className="orb orb-green" style={{ top: '-20%', left: '-15%', opacity: 0.35 }} />
        <div className="orb orb-orange" style={{ bottom: '-10%', right: '-15%', opacity: 0.2 }} />
        <div className="container hero__inner">
          <div className="hero__content">
            <span className="hero__eyebrow">Vũ trụ ăn uống đỉnh nóc kịch trần</span>
            <h1 className="hero__title">
              Săn quán ngon đúng <span className="accent">gu bồ tèo</span>
            </h1>
            <p className="hero__subtitle">
              Lướt nhẹ là có vạn quán ngon đúng gu ruột, xem review thực tế cực suy từ hội foodie
              và lưu lại tọa độ ưa thích — không lo đói nha cả nhà yêu.
            </p>
            <div className="hero__search" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'transparent', flexShrink: 0, gap: '8px' }}>
                
                {/* City select / Pinned Address wrapper with Clickable Pin Button */}
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '6px', borderRight: '2px solid var(--border)', paddingRight: '12px', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={locationLoading}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '0',
                      color: locationLoading ? 'var(--text-muted)' : 'var(--text-dark)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      transition: 'transform 0.2s, opacity 0.2s',
                      opacity: locationLoading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !locationLoading && (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => !locationLoading && (e.currentTarget.style.transform = 'scale(1)')}
                    title="Định vị tọa độ vị trí hiện tại"
                  >
                    {locationLoading ? (
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline-block' }}>
                        <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    )}
                  </button>

                    <select
                      key="city-select"
                      value={pinnedAddress ? "pinned" : city}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "pinned") return;
                        setPinnedAddress(null);
                        setCity(val);
                        setSearchQuery(query);
                        localStorage.setItem('ff_user_city', val);
                        localStorage.removeItem('ff_user_lat');
                        localStorage.removeItem('ff_user_lon');
                        localStorage.removeItem('ff_user_address');
                      }}
                      className="select"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontWeight: '700',
                        padding: '0 4px',
                        fontSize: '13px',
                        outline: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-dark)',
                        borderRadius: '0',
                        maxWidth: '170px',
                      }}
                      aria-label="Chọn địa điểm hoặc thành phố"
                    >
                      {pinnedAddress && (
                        <option value="pinned">
                          {pinnedAddress.length > 20 ? pinnedAddress.slice(0, 17) + '...' : pinnedAddress}
                        </option>
                      )}
                      <option value="ha-noi">Hà Nội</option>
                      <option value="ho-chi-minh">TP. HCM</option>
                      <option value="da-nang">Đà Nẵng</option>
                      <option value="can-tho">Cần Thơ</option>
                      <option value="hue">Huế</option>
                    </select>
                </div>

                {/* Category select wrapper with Utensils SVG */}
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '6px', borderRight: '2px solid var(--border)', paddingRight: '12px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', color: 'var(--text-dark)', marginRight: '6px', flexShrink: 0 }}>
                    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                    <path d="M7 2v20" />
                    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z" />
                    <path d="M19 15v7" />
                  </svg>
                  <select
                    value={category === 'Tất cả' ? 'all' : category}
                    onChange={(e) => {
                      const val = e.target.value;
                      const catName = val === 'all' ? 'Tất cả' : val;
                      setCategory(catName);
                      setSearchQuery(query);
                    }}
                    className="select"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      fontWeight: '700',
                      padding: '0 4px',
                      fontSize: '13px',
                      outline: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-dark)',
                      borderRadius: '0'
                    }}
                    aria-label="Chọn danh mục"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id === 'Tất cả' ? 'all' : opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

              </div>
              <input
                type="text"
                placeholder="Tìm quán ngon, món tủ hoặc địa chỉ... Gõ đi chờ chi!"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(query);
                    saveSearchHistory(query);
                  }
                }}
                aria-label="Tìm kiếm nhà hàng"
                style={{ flex: 1, border: 'none', outline: 'none', minWidth: '0', background: 'transparent', color: 'var(--text-dark)' }}
              />
              <button 
                onClick={() => { setSearchQuery(query); saveSearchHistory(query); }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--text-dark)',
                  boxShadow: 'none',
                  transition: 'transform 0.2s',
                  marginLeft: 'auto',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Tìm kiếm"
                aria-label="Tìm kiếm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
            </div>
          </div>
          <div className="hero__art" aria-hidden ref={heroArtRef}>
            <div className="hero__art-circle" />
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
              alt=""
            />
          </div>
        </div>
      </section>

      {/* Main Layout: Bố cục 2 cột (Feed & Sidebar) */}
      <section className="container section">
        {/* Section Gợi ý cho bạn - full width phía trên layout 2 cột */}
        <RecommendationSection city={city} />

        {/* Layout Gợi ý địa điểm đi kèm Đánh giá (Restaurant-Review Pairs) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="section__title" style={{ margin: 0, fontSize: '24px' }}>
              Vũ trụ quán ngon & Đánh giá thực tế
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Khám phá các địa điểm ăn uống kèm bằng chứng review chi tiết
            </p>
          </div>
          {/* Bộ lọc nhỏ gọn */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  className={`chip ${category === opt.id || (opt.id === 'Tất cả' && category === 'Tất cả') ? 'is-active' : ''}`}
                  onClick={() => handleCategoryChange(opt.id === 'Tất cả' ? 'Tất cả' : opt.id)}
                  style={{ padding: '8px 16px', fontSize: '12px', borderRadius: 'var(--radius-md)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="select"
              style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '2px' }}
              aria-label="Sắp xếp danh sách"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading && restaurants.length === 0 ? (
          <div className="home-layout-pairs">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="restaurant-review-pair" style={{ opacity: 0.6 }}>
                <div className="restaurant-review-pair__left" style={{ height: '320px', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
                  <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
                </div>
                <div className="restaurant-review-pair__right" style={{ background: 'var(--bg-light)', position: 'relative', overflow: 'hidden' }}>
                  <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
                </div>
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="empty" style={{ padding: '48px' }}>
            <p style={{ fontSize: '14px' }}>Huhu, không tìm thấy tọa độ hay quán ăn nào khớp hết á bồ tèo ơi. Thử đổi bộ lọc hoặc từ khóa khác xem sao nha!</p>
          </div>
        ) : (
          <>
            <div className="home-layout-pairs">
              {restaurants.map((r) => (
                <RestaurantReviewPair key={r.id} restaurant={r} />
              ))}
            </div>
            {isLoading && (
              <div className="home-layout-pairs" style={{ marginTop: '32px' }}>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`skeleton-more-${i}`} className="restaurant-review-pair" style={{ opacity: 0.6 }}>
                    <div className="restaurant-review-pair__left" style={{ height: '320px', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
                      <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
                    </div>
                    <div className="restaurant-review-pair__right" style={{ background: 'var(--bg-light)', position: 'relative', overflow: 'hidden' }}>
                      <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Modal đề xuất quán ăn mới */}
      {isModalOpen && <SuggestRestaurantModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
