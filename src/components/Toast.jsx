import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

// Hàm xuất ra ngoài để kích hoạt thông báo nổi từ bất kỳ tệp tin nào
export function toast(message, type = 'success') {
  const event = new CustomEvent('show-toast', { detail: { message, type } });
  window.dispatchEvent(event);
}

export default function ToastContainer() {
  const [toastData, setToastData] = useState(null);
  const toastRef = useRef(null);

  useEffect(() => {
    const handleShowToast = (e) => {
      setToastData(e.detail);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  useEffect(() => {
    if (!toastData || !toastRef.current) return;

    const el = toastRef.current;
    
    // Dọn dẹp animation cũ nếu có
    gsap.killTweensOf(el);
    
    const tl = gsap.timeline({
      onComplete: () => setToastData(null) // Xóa state khi chạy xong để ẩn hoàn toàn
    });

    // Chạy hiệu ứng trượt bay vào từ bên phải và mờ dần ra đi
    tl.fromTo(
      el,
      { x: 150, opacity: 0, scale: 0.9 },
      { x: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.5)' }
    ).to(
      el,
      { x: 80, opacity: 0, scale: 0.95, duration: 0.35, ease: 'power2.in' },
      '+=2.2' // Đợi 2.2 giây rồi biến mất
    );
  }, [toastData]);

  if (!toastData) return null;

  const isSuccess = toastData.type === 'success';

  return (
    <div
      ref={toastRef}
      className={`toast-notification ${isSuccess ? 'toast--success' : 'toast--error'}`}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 999999,
        padding: '12px 18px',
        borderRadius: '4px',
        background: isSuccess ? '#A5CF83' : '#E89951', // Sage green / Terracotta orange
        backdropFilter: 'blur(12px)',
        color: '#2A1D19', // Dark brown text for better contrast on warm backgrounds
        fontWeight: '700',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(42, 29, 25, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none',
        border: '1px solid rgba(42, 29, 25, 0.1)',
        fontFamily: 'var(--font-mono, monospace)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}
    >
      {isSuccess ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <span>{toastData.message}</span>
    </div>
  );
}
