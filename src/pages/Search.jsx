import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import RestaurantCard from '../components/RestaurantCard.jsx';
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

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlQuery = searchParams.get('q') || '';
  const urlCity = searchParams.get('city') || 'Hà Nội';
  const urlCategory = searchParams.get('category') || 'Tất cả';

  const [query, setQuery] = useState(urlQuery);
  const [city, setCity] = useState(urlCity);
  const [category, setCategory] = useState(urlCategory);
  
  const [sort, setSort] = useState('rating');
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 12; // Tăng limit vì grid view chứa được nhiều item hơn

  const containerRef = useRef();

  // Sync state when URL params change
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
    setCity(searchParams.get('city') || 'Hà Nội');
    setCategory(searchParams.get('category') || 'Tất cả');
    setSkip(0);
  }, [searchParams]);

  const saveSearchHistory = (q) => {
    if (!q || !q.trim()) return;
    try {
      const raw = localStorage.getItem('ff_search_history');
      const history = raw ? JSON.parse(raw) : [];
      const updated = [q.trim(), ...history.filter(h => h !== q.trim())].slice(0, 10);
      localStorage.setItem('ff_search_history', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleSearchSubmit = () => {
    saveSearchHistory(query);
    setSearchParams({ q: query, city, category });
  };

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
        image: r.img_url || r.restaurant_url || '/image.png',
        tags: r.cuisine_tags ? r.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean) : [],
        description: r.menu || 'Chưa có thực đơn chi tiết.',
        is_verified: r.is_verified
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

  useEffect(() => {
    fetchRestaurants(urlCity, urlCategory, urlQuery, sort, 0, false);
  }, [urlCity, urlCategory, urlQuery, sort]);

  useEffect(() => {
    if (skip > 0) {
      fetchRestaurants(urlCity, urlCategory, urlQuery, sort, skip, true);
    }
  }, [skip]);

  // Infinite Scroll
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

  // Animation on mount and when restaurants list changes (for first page load)
  useGSAP(() => {
    if (restaurants.length > 0 && skip === 0) {
      gsap.fromTo('.restaurant-card', 
        { y: 150, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', clearProps: 'transform' }
      );
    } else if (skip > 0) {
      // For appended items
      gsap.to('.restaurant-card', { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', clearProps: 'transform' });
    }
  }, { dependencies: [restaurants, skip], scope: containerRef });

  return (
    <div ref={containerRef} className="container section" style={{ paddingTop: '100px', minHeight: '80vh' }}>
      {/* Centered Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--bg-light)', 
          borderRadius: '50px', 
          padding: '8px 16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: '800px',
          transition: 'box-shadow 0.2s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border)', paddingRight: '12px', gap: '4px' }}>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="select"
              style={{ border: 'none', background: 'transparent', fontWeight: '700', padding: '0 4px', fontSize: '14px', outline: 'none', cursor: 'pointer', color: 'var(--text-dark)', borderRadius: '0' }}
            >
              <option value="Hà Nội">Hà Nội</option>
              <option value="Đà Nẵng">Đà Nẵng</option>
              <option value="Huế">Huế</option>
              <option value="Bình Dương">Bình Dương</option>
              <option value="Lâm Đồng">Lâm Đồng</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid var(--border)', paddingRight: '12px', paddingLeft: '12px' }}>
            <select
              value={category === 'Tất cả' ? 'all' : category}
              onChange={(e) => {
                const val = e.target.value;
                setCategory(val === 'all' ? 'Tất cả' : val);
              }}
              className="select"
              style={{ border: 'none', background: 'transparent', fontWeight: '700', padding: '0 4px', fontSize: '14px', outline: 'none', cursor: 'pointer', color: 'var(--text-dark)', borderRadius: '0' }}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id === 'Tất cả' ? 'all' : opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            placeholder="Tìm quán ngon, món tủ hoặc địa chỉ..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit();
            }}
            style={{ flex: 1, border: 'none', outline: 'none', padding: '0 16px', fontSize: '15px', background: 'transparent', color: 'var(--text-dark)' }}
          />
          <button 
            onClick={handleSearchSubmit}
            style={{
              border: 'none', background: 'var(--primary)', color: '#fff', borderRadius: '50%',
              width: '40px', height: '40px', display: 'grid', placeItems: 'center', cursor: 'pointer',
              transition: 'transform 0.2s', marginLeft: 'auto', flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="section__title" style={{ margin: 0, fontSize: '20px' }}>Kết quả tìm kiếm</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Hiển thị kết quả cho "{urlQuery || urlCategory}" tại {urlCity}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="select"
            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '2px' }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && restaurants.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ height: '320px', background: 'var(--bg-subtle)', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
              <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p style={{ fontSize: '14px', margin: 0 }}>Huhu, không tìm thấy quán ăn nào khớp hết á. Thử đổi bộ lọc hoặc từ khóa khác xem sao nha!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {restaurants.map((r, i) => (
            <RestaurantCard key={r.id} restaurant={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
