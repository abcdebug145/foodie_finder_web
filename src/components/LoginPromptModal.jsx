import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

/**
 * LoginPromptModal
 * Props:
 *   open    {boolean}  - whether the modal is visible
 *   onClose {function} - callback to close/dismiss
 *   message {string}   - optional custom message shown under the title
 */
export default function LoginPromptModal({ open, onClose, message }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Yêu cầu đăng nhập"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(10, 14, 25, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'lp-in 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface, #fff)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '36px 32px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          textAlign: 'center',
          animation: 'lp-slide 0.2s ease',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '64px', height: '64px',
          borderRadius: '50%',
          background: 'rgba(232,153,81,0.12)',
          border: '2px solid rgba(232,153,81,0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="var(--primary, #E89951)" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>
          Bạn chưa đăng nhập
        </h3>
        <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
          {message || 'Vui lòng đăng nhập để sử dụng tính năng này.'}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: '12px',
              border: '1.5px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => { onClose(); navigate('/login'); }}
            style={{
              flex: 1,
              padding: '11px 0',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--primary, #E89951)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>

      <style>{`
        @keyframes lp-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lp-slide {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}
