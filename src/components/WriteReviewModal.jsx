import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ReviewForm from './ReviewForm.jsx';

export default function WriteReviewModal({ onClose, onSuggestNew }) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Debouncing searchTerm to debouncedTerm
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch results when debouncedTerm changes
  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/restaurants/?q=${encodeURIComponent(debouncedTerm)}&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setResults([]);
      } finally {
        setLoading(false);
        setHasSearched(true);
      }
    };

    fetchSuggestions();
  }, [debouncedTerm]);

  // Slide-in modal animation using GSAP
  useGSAP(
    () => {
      gsap.set(overlayRef.current, { willChange: 'opacity' });
      gsap.set(modalRef.current, { willChange: 'transform, opacity' });

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 0.2, 
          ease: 'power2.out',
          force3D: true
        }
      );
      gsap.fromTo(
        modalRef.current,
        { y: 30, scale: 0.98, opacity: 0 },
        { 
          y: 0, 
          scale: 1, 
          opacity: 1, 
          duration: 0.25, 
          ease: 'power3.out', 
          delay: 0.02,
          force3D: true
        }
      );
    },
    { scope: containerRef }
  );

  const handleClose = () => {
    gsap.to(modalRef.current, {
      y: 20,
      scale: 0.98,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      force3D: true
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: onClose,
      force3D: true
    });
  };

  const handleSuggestNew = () => {
    gsap.to(modalRef.current, {
      y: 20,
      scale: 0.98,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      force3D: true
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: onSuggestNew,
      force3D: true
    });
  };

  const selectRestaurant = (res) => {
    setSelectedRestaurant({
      id: res.id,
      name: res.name,
      address: res.address || 'Chưa cập nhật địa chỉ'
    });
    setSearchTerm('');
    setResults([]);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        ref={overlayRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(42, 29, 25, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: -1
        }}
        onClick={handleClose}
      />
      <div
        ref={modalRef}
        className="panel glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '30px',
          position: 'relative',
          borderRadius: '4px',
          boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            border: 'none',
            background: 'rgba(42, 29, 25, 0.05)',
            width: '32px',
            height: '32px',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-muted)'
          }}
          aria-label="Đóng"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: '0 0 8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
          Viết Đánh Giá
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>
          Chia sẻ trải nghiệm ăn uống thực tế của bạn để giúp mọi người tìm được quán ngon chuẩn gu.
        </p>

        {/* Selected Restaurant Information */}
        {selectedRestaurant ? (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: 'var(--bg-subtle)', 
              padding: '14px 18px', 
              border: '2px solid var(--border)', 
              borderRadius: '2px', 
              marginBottom: '24px' 
            }}>
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '2px' }}>
                  Đang đánh giá
                </span>
                <strong style={{ fontSize: '16px', color: 'var(--text-dark)', display: 'block' }}>
                  {selectedRestaurant.name}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                  {selectedRestaurant.address}
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedRestaurant(null); setSearchTerm(''); }}
                className="btn btn--ghost"
                style={{ padding: '8px 14px', fontSize: '11px', flexShrink: 0 }}
              >
                Chọn quán khác
              </button>
            </div>

            {/* Embedded Review Form */}
            <ReviewForm restaurantId={selectedRestaurant.id} onSubmitSuccess={handleClose} />
          </div>
        ) : (
          <div className="form">
            <div className="form__field" style={{ position: 'relative', marginBottom: '16px' }}>
              <span>Tìm kiếm quán ăn *</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Ví dụ: Romance Heo, Phở Gia Truyền..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                {loading && (
                  <div style={{ position: 'absolute', right: '12px', display: 'grid', placeItems: 'center' }}>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--primary)' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Debounced search dropdown results */}
              {searchTerm.trim() !== '' && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--bg-light)',
                  border: '2px solid var(--border)',
                  borderTop: 'none',
                  borderRadius: '0 0 2px 2px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 99,
                  boxShadow: 'var(--shadow-lg)',
                  marginTop: '-2px'
                }}>
                  {loading && results.length === 0 && (
                    <div style={{ padding: '14px 18px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      Đang tìm kiếm...
                    </div>
                  )}

                  {!loading && hasSearched && results.length === 0 ? (
                    <button
                      type="button"
                      onClick={handleSuggestNew}
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--primary)',
                        fontWeight: '700',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(232, 153, 81, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Đề xuất quán mới
                    </button>
                  ) : (
                    results.map((res) => (
                      <div
                        key={res.id}
                        onClick={() => selectRestaurant(res)}
                        style={{
                          padding: '12px 18px',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(232, 153, 81, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{res.name}</strong>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{res.address || 'Chưa cập nhật địa chỉ'}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
