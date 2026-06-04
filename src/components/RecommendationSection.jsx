import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// ── Helpers: localStorage ─────────────────────────────────────────────────────

function getLocalHistory() {
  try {
    const searches = localStorage.getItem('ff_search_history');
    const viewed   = localStorage.getItem('ff_viewed_history');
    return {
      search_history:          searches ? JSON.parse(searches) : [],
      viewed_restaurant_ids:   viewed   ? JSON.parse(viewed)   : [],
    };
  } catch {
    return { search_history: [], viewed_restaurant_ids: [] };
  }
}

function hasHistory() {
  const { search_history, viewed_restaurant_ids } = getLocalHistory();
  return search_history.length > 0 || viewed_restaurant_ids.length > 0;
}

// ── Mini Restaurant Card (horizontal scroll) ──────────────────────────────────

function RecoCard({ restaurant, rank }) {
  const scorePercent = Math.round((restaurant.similarity_score || 0) * 100);
  const rating = (restaurant.avg_rating || 0).toFixed(1);
  const tags = restaurant.cuisine_tags
    ? restaurant.cuisine_tags.split(';').map(t => t.trim()).filter(Boolean).slice(0, 2)
    : [];

  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="reco-card"
      title={restaurant.name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        background: 'var(--bg-light)',
        border: '1.5px solid var(--border)',
        borderRadius: '14px',
        overflow: 'hidden',
        minWidth: '200px',
        maxWidth: '200px',
        flexShrink: 0,
        transition: 'transform 0.25s cubic-bezier(.34,1.56,.64,1), border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(232,153,81,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', height: '120px', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
        <img
          src={restaurant.img_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=70'}
          alt={restaurant.name}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onError={e => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=70';
          }}
        />
        {/* Match badge */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(42,29,25,0.82)',
          backdropFilter: 'blur(6px)',
          color: 'var(--primary)',
          fontSize: '10px',
          fontWeight: '800',
          fontFamily: 'var(--font-mono)',
          padding: '3px 7px',
          borderRadius: '6px',
          border: '1px solid rgba(232,153,81,0.3)',
          letterSpacing: '0.3px',
        }}>
          {scorePercent}% match
        </div>
        {/* Rank badge */}
        {rank <= 3 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: rank === 1 ? 'var(--primary)' : rank === 2 ? '#a0a0a0' : '#cd7f32',
            color: rank === 1 ? 'var(--bg-dark)' : '#fff',
            fontSize: '10px',
            fontWeight: '900',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-mono)',
          }}>
            {rank}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <p style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: '800',
          color: 'var(--text-dark)',
          lineHeight: '1.35',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {restaurant.name}
        </p>

        {/* Rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--primary)" style={{ width: '11px', height: '11px', flexShrink: 0 }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
            {rating}
          </span>
          {restaurant.category && (
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: '2px' }}>
              · {restaurant.category}
            </span>
          )}
        </div>

        {/* Address */}
        {restaurant.address && (
          <p style={{
            margin: 0,
            fontSize: '11px',
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            📍 {restaurant.address}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
            {tags.map(tag => (
              <span key={tag} style={{
                fontSize: '9.5px',
                fontWeight: '700',
                color: 'var(--primary)',
                background: 'rgba(232,153,81,0.1)',
                border: '1px solid rgba(232,153,81,0.2)',
                padding: '2px 6px',
                borderRadius: '4px',
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Skeleton Cards ─────────────────────────────────────────────────────────────

function RecoSkeleton() {
  return (
    <div style={{
      minWidth: '200px',
      maxWidth: '200px',
      flexShrink: 0,
      borderRadius: '14px',
      overflow: 'hidden',
      background: 'var(--bg-light)',
      border: '1.5px solid var(--border)',
    }}>
      <div style={{ width: '100%', height: '120px', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
        <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ height: '32px', borderRadius: '6px', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
          <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </div>
        <div style={{ height: '12px', width: '60%', borderRadius: '4px', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
          <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </div>
        <div style={{ height: '10px', width: '80%', borderRadius: '4px', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
          <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RecommendationSection({ city }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isColdStart, setIsColdStart] = useState(false);
  const [hasAnyHistory, setHasAnyHistory] = useState(false);

  const railRef = useRef(null);
  const sectionRef = useRef(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);

    const { search_history, viewed_restaurant_ids } = getLocalHistory();
    const hasHist = search_history.length > 0 || viewed_restaurant_ids.length > 0;
    setHasAnyHistory(hasHist);

    if (!hasHist) {
      // Cold-start: lấy top-rated theo city
      setIsColdStart(true);
      try {
        const url = `/api/v1/restaurants/?city=${city || 'ha-noi'}&sort=rating&limit=8`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.map(r => ({
            id: r.id,
            name: r.name,
            category: r.category,
            address: r.address,
            avg_rating: r.avg_rating || 0,
            img_url: r.restaurant_url || r.img_url,
            cuisine_tags: r.cuisine_tags,
            hours: r.hours,
            district: r.district,
            similarity_score: (r.avg_rating || 0) / 10,
          }));
          setRestaurants(mapped);
        }
      } catch (err) {
        console.error('[RecoSection] Cold-start fetch error:', err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Full recommendation mode
    setIsColdStart(false);
    try {
      const res = await fetch('/api/v1/recommendations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_history,
          viewed_restaurant_ids,
          city: city || null,
          limit: 8,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data);
      } else {
        // Fallback về cold-start nếu API lỗi
        setIsColdStart(true);
      }
    } catch (err) {
      console.error('[RecoSection] Recommendation fetch error:', err);
      setIsColdStart(true);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Animation khi cards xuất hiện
  useGSAP(
    () => {
      if (!loading && restaurants.length > 0 && railRef.current) {
        const cards = railRef.current.querySelectorAll('.reco-card');
        gsap.fromTo(
          cards,
          { opacity: 0, y: 16, scale: 0.96 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.4,
            stagger: 0.06,
            ease: 'power3.out',
            overwrite: 'auto',
          }
        );
      }
    },
    { dependencies: [loading, restaurants], scope: sectionRef }
  );

  const clearHistory = () => {
    try {
      localStorage.removeItem('ff_search_history');
      localStorage.removeItem('ff_viewed_history');
    } catch {}
    fetchRecommendations();
  };

  // Ẩn section hoàn toàn nếu cold-start và không có quán
  if (!loading && restaurants.length === 0) return null;

  return (
    <div ref={sectionRef} style={{ marginBottom: '32px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: isColdStart
              ? 'linear-gradient(135deg, rgba(232,153,81,0.15), rgba(232,153,81,0.05))'
              : 'linear-gradient(135deg, rgba(232,153,81,0.25), rgba(232,153,81,0.08))',
            border: '1.5px solid rgba(232,153,81,0.25)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '15px',
            flexShrink: 0,
          }}>
            {isColdStart ? '🔥' : '✨'}
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '900',
              color: 'var(--text-dark)',
              letterSpacing: '-0.3px',
              lineHeight: 1,
            }}>
              {isColdStart ? 'Quán hot ở khu vực bạn' : 'Gợi ý cho bạn'}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: '500' }}>
              {isColdStart
                ? 'Được đánh giá cao nhất khu vực'
                : 'Dựa trên tìm kiếm và lịch sử xem của bạn'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasAnyHistory && (
            <button
              onClick={clearHistory}
              style={{
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '5px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-mono)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Xóa lịch sử và làm mới gợi ý"
            >
              ↺ Reset thị hiếu
            </button>
          )}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            background: 'var(--bg-subtle)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
          }}>
            {loading ? '...' : `${restaurants.length} quán`}
          </span>
        </div>
      </div>

      {/* Horizontal Scroll Rail */}
      <div
        style={{
          position: 'relative',
          // Fade edges
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 94%, transparent 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 94%, transparent 100%)',
        }}
      >
        <div
          ref={railRef}
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '6px',
            paddingLeft: '4px',
            paddingRight: '24px',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <RecoSkeleton key={i} />)
            : restaurants.map((r, i) => (
                <div key={r.id} style={{ scrollSnapAlign: 'start' }}>
                  <RecoCard restaurant={r} rank={i + 1} />
                </div>
              ))
          }
        </div>
      </div>

      {/* Divider */}
      <div style={{
        marginTop: '24px',
        height: '1px',
        background: 'linear-gradient(to right, transparent, var(--border) 20%, var(--border) 80%, transparent)',
      }} />
    </div>
  );
}
