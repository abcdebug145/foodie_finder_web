import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function AppLoader({ onComplete }) {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        onComplete: () => {
          // Trượt loader lên trên nhanh hơn (giảm từ 0.8s xuống 0.5s)
          gsap.to(containerRef.current, {
            yPercent: -100,
            duration: 0.5,
            ease: 'power3.inOut',
            onComplete: onComplete, // Gọi callback để unmount loader
          });
        },
      });

      // 1. Phân tán các icon ẩm thực xung quanh làm nền (nhanh hơn)
      const decors = containerRef.current.querySelectorAll('.app-loader__bg-decor');
      decors.forEach((decor) => {
        const angle = gsap.utils.random(0, 360);
        const distance = gsap.utils.random(100, 250);
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * distance;
        const y = Math.sin(rad) * distance;

        gsap.set(decor, {
          x: 0,
          y: 0,
          scale: 0,
          opacity: 0,
        });

        tl.to(
          decor,
          {
            x: x,
            y: y,
            scale: gsap.utils.random(0.7, 1.3),
            opacity: 0.15,
            duration: 0.5,
            ease: 'back.out(1.2)',
          },
          0.05
        );
      });

      // 2. Animation Logo phóng to nhẹ (giảm từ 1.0s xuống 0.6s)
      tl.from(
        '.app-loader__logo',
        {
          scale: 0,
          rotation: -180,
          duration: 0.6,
          ease: 'back.out(1.4)',
        },
        0
      );

      // 3. Hiệu ứng khói bốc lên nhanh hơn (giảm số lần lặp và thời lượng)
      tl.to(
        '.app-loader__steam',
        {
          y: -30,
          opacity: 0.6,
          scale: 1.2,
          duration: 0.5,
          stagger: 0.15,
          repeat: 1,
          ease: 'power1.out',
        },
        0.2
      );

      // 4. Tiêu đề và phụ đề trượt lên mượt mà (giảm từ 0.6s xuống 0.4s)
      tl.from(
        ['.app-loader__title', '.app-loader__subtitle'],
        {
          y: 15,
          opacity: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.out',
        },
        0.2
      );

      // 5. Chạy thanh tải trang nhanh hơn nhiều (giảm từ 1.5s xuống 0.7s)
      tl.to(
        '.app-loader__bar',
        {
          width: '100%',
          duration: 0.7,
          ease: 'power2.inOut',
        },
        0.2
      );

      // 6. Thu nhỏ nội dung chính trước khi slide out (giảm từ 0.4s xuống 0.25s)
      tl.to(
        '.app-loader__content',
        {
          scale: 0.92,
          opacity: 0,
          duration: 0.25,
          ease: 'power2.in',
        },
        '+=0.05'
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="app-loader">
      {/* Các icon nền ngẫu nhiên */}
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2zM12 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM9 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v12M6 12h12"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 2v3M10 2v3M14 2v3"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7zm0 0c0-3 3-5 7-5s7 2 7 5"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 8.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm8 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm-4 4a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm-4 4a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm8 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/></svg>
      </span>
      <span className="app-loader__bg-decor" style={{ position: 'absolute', display: 'flex' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c4.97 0 9-3.03 9-8 0-4.5-3-6-9-6s-9 1.5-9 6c0 4.97 4.03 8 9 8z"/><path d="M12 8V5c0-1.66 1-3 3-3"/></svg>
      </span>

      <div className="app-loader__content">
        <div className="app-loader__logo-container">
          <span className="app-loader__steam" style={{ left: '30%', display: 'inline-flex', color: 'var(--primary)' }}>
            <svg width="12" height="20" viewBox="0 0 10 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 20s3-4 3-6-3-4-3-6 3-4 3-6" />
            </svg>
          </span>
          <span className="app-loader__steam" style={{ left: '50%', display: 'inline-flex', color: 'var(--primary)' }}>
            <svg width="12" height="20" viewBox="0 0 10 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 20s3-4 3-6-3-4-3-6 3-4 3-6" />
            </svg>
          </span>
          <span className="app-loader__steam" style={{ left: '70%', display: 'inline-flex', color: 'var(--primary)' }}>
            <svg width="12" height="20" viewBox="0 0 10 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 20s3-4 3-6-3-4-3-6 3-4 3-6" />
            </svg>
          </span>
          <span className="app-loader__logo" role="img" aria-label="Bowl Icon" style={{ display: 'inline-flex', color: 'var(--primary)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12h20c0 4.4-3.6 8-8 8h-4c-4.4 0-8-3.6-8-8z" />
              <path d="M12 2v6" />
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </span>
        </div>

        <h2 className="app-loader__title">
          Foodie<span>Homie</span>
        </h2>

        <div className="app-loader__bar-container">
          <div className="app-loader__bar" />
        </div>

        <p className="app-loader__subtitle">
          Đăng nhập để có trải nghiệm tốt hơn
        </p>
      </div>
    </div>
  );
}
