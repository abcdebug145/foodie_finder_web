import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';
const CATEGORIES = ['nha-hang', 'quan-nhau', 'quan-an', 'cafe'];

const CATEGORY_LABELS = {
  'nha-hang': 'Nhà hàng',
  'quan-nhau': 'Quán nhậu',
  'quan-an': 'Quán ăn',
  'cafe': 'Cafe'
};

const CATEGORY_ICONS = {
  'nha-hang': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
  'quan-nhau': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M5 8h12v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z" />
      <line x1="5" y1="11" x2="17" y2="11" />
      <line x1="5" y1="15" x2="17" y2="15" />
    </svg>
  ),
  'quan-an': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20c0 4.4-3.6 8-8 8h-4c-4.4 0-8-3.6-8-8z" />
      <path d="M12 2v6" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  'cafe': (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <path d="M6 2v3" />
      <path d="M10 2v3" />
      <path d="M14 2v3" />
    </svg>
  )
};

export default function PreferenceSelectorModal({ onClose, forceMode = false }) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const { currentUser, updateProfile } = useAuth();
  
  // Load initial preferences
  const getInitialPreferences = () => {
    if (currentUser && currentUser.preferences) {
      return Array.isArray(currentUser.preferences) 
        ? currentUser.preferences 
        : [];
    }
    const local = localStorage.getItem('ff_guest_preferences');
    return local ? JSON.parse(local) : [];
  };

  const [selected, setSelected] = useState(getInitialPreferences);

  // GSAP animation for opening modal
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
      
      // Animate options grid
      gsap.from('.pref-modal__item', {
        opacity: 0,
        y: 10,
        scale: 0.95,
        duration: 0.25,
        stagger: 0.03,
        ease: 'power2.out',
        delay: 0.1,
        force3D: true
      });
    },
    { scope: containerRef }
  );

  // Close animation before unmounting
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

  const handleToggle = (cat) => {
    setSelected(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleSave = () => {
    // Save preferences
    if (currentUser) {
      updateProfile({ preferences: selected });
      toast('Đã lưu sở thích ẩm thực của bạn vào tài khoản!', 'success');
    } else {
      localStorage.setItem('ff_guest_preferences', JSON.stringify(selected));
      toast('Đã lưu sở thích ẩm thực của bạn làm khách!', 'success');
    }
    
    // Set flag that preferences have been chosen so modal won't auto-pop up again
    localStorage.setItem('ff_pref_set', 'true');
    handleClose();
  };

  const handleSkip = () => {
    localStorage.setItem('ff_pref_set', 'true');
    handleClose();
  };

  const filteredCategories = CATEGORIES;

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
          backgroundColor: 'rgba(42, 29, 25, 0.45)', // Warm coffee overlay
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
          maxWidth: '520px',
          padding: '30px',
          position: 'relative',
          borderRadius: '4px', // Geometric corners
          boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!forceMode && (
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              border: 'none',
              background: 'rgba(42, 29, 25, 0.05)',
              width: '30px',
              height: '30px',
              borderRadius: '2px', // Sharp close button
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
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: '0 0 10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
          Sở thích ẩm thực
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px', lineHeight: '1.5' }}>
          {currentUser 
            ? "Chọn các món ăn yêu thích để chúng tôi tối ưu hóa gợi ý dành riêng cho bạn."
            : "Đăng nhập để lưu vĩnh viễn, hoặc chọn ngay để cá nhân hóa nhanh trải nghiệm của bạn."}
        </p>

        {/* Categories Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
          gap: '12px', 
          marginBottom: '30px' 
        }}>
          {filteredCategories.map((cat) => {
            const isSelected = selected.includes(cat);
            const icon = CATEGORY_ICONS[cat] || (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
              </svg>
            );
            return (
              <button
                key={cat}
                className="pref-modal__item"
                onClick={() => handleToggle(cat)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 12px',
                  borderRadius: '2px', // Sharp corners
                  border: isSelected ? '2px solid var(--primary)' : '2px solid rgba(42, 29, 25, 0.12)',
                  background: isSelected 
                    ? 'var(--primary)' 
                    : '#ffffff',
                  color: isSelected ? 'var(--bg-dark)' : 'var(--text-dark)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
                  boxShadow: isSelected ? '0 4px 12px rgba(232, 153, 81, 0.25)' : 'none',
                  outline: 'none',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  if (!isSelected) e.currentTarget.style.borderColor = 'var(--primary-dark)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(42, 29, 25, 0.12)';
                }}
              >
                <div style={{ color: isSelected ? 'var(--bg-dark)' : 'var(--primary)' }}>{icon}</div>
                <span>{CATEGORY_LABELS[cat] || cat}</span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn btn--ghost" 
            style={{ minWidth: '110px' }}
            onClick={handleSkip}
          >
            Bỏ qua
          </button>
          <button 
            type="button" 
            className="btn btn--primary" 
            style={{ minWidth: '150px' }}
            onClick={handleSave}
          >
            Lưu sở thích
          </button>
        </div>
      </div>
    </div>
  );
}
