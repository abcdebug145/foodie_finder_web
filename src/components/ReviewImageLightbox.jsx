import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export default function ReviewImageLightbox({ images = [], initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const total = images.length;

  // Sync index when a new lightbox opens (different initialIndex)
  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, images]);

  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);

  useEffect(() => {
    if (!total) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [total, onClose, prev, next]);

  if (initialIndex < 0 || !total) return null;

  const imageUrl = images[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(10, 14, 25, 0.80)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        animation: 'lightbox-in 0.18s ease',
      }}
    >
      {/* ── Close ── */}
      <button
        type="button"
        aria-label="Đóng ảnh"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.14)',
          color: '#fff',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(8px)',
          transition: 'background 0.15s',
          zIndex: 100000,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.26)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* ── Image row (prev btn + img + next btn) ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '100%',
        }}
      >
        {/* Prev */}
        {total > 1 && (
          <button
            type="button"
            aria-label="Ảnh trước"
            onClick={e => { e.stopPropagation(); prev(); }}
            style={navBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.26)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Main image */}
        <img
          key={imageUrl}
          src={imageUrl}
          alt={`Ảnh ${index + 1} / ${total}`}
          style={{
            maxWidth: 'min(1080px, 82vw)',
            maxHeight: '80vh',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: '10px',
            boxShadow: '0 32px 96px rgba(0,0,0,0.55)',
            background: '#111',
            display: 'block',
            animation: 'lightbox-in 0.15s ease',
          }}
        />

        {/* Next */}
        {total > 1 && (
          <button
            type="button"
            aria-label="Ảnh tiếp theo"
            onClick={e => { e.stopPropagation(); next(); }}
            style={navBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.26)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Dot indicators ── */}
      {total > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '20px',
            alignItems: 'center',
          }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Xem ảnh ${i + 1}`}
              onClick={e => { e.stopPropagation(); setIndex(i); }}
              style={{
                width: i === index ? '10px' : '8px',
                height: i === index ? '10px' : '8px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                background: i === index ? '#ffffff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes lightbox-in {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}

const navBtnStyle = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.14)',
  color: '#fff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  backdropFilter: 'blur(8px)',
  transition: 'background 0.15s',
};
