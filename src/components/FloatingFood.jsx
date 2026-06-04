import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Danh sách các icon ẩm thực dạng SVG
const FOOD_ICONS = [
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2zM12 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM9 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><path d="M6 2v3M10 2v3M14 2v3"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20c0 4.4-3.6 8-8 8h-4c-4.4 0-8-3.6-8-8z"/><path d="M12 2v6M8 2v4M16 2v4"/><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7zm0 0c0-3 3-5 7-5s7 2 7 5"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 8.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm8 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm-4 4a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm-4 4a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm8 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v12M6 12h12"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1M5 8h12v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8z"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c4.97 0 9-3.03 9-8 0-4.5-3-6-9-6s-9 1.5-9 6c0 4.97 4.03 8 9 8z"/><path d="M12 8V5c0-1.66 1-3 3-3"/></svg>,
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18V6a4 4 0 0 1 8 0v12M18 18V9a4 4 0 0 0-8 0v9M3 18h18a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z"/></svg>
];

export default function FloatingFood({ count = 10 }) {
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const items = containerRef.current.querySelectorAll('.floating-food-item');
      
      items.forEach((item) => {
        // Lấy vị trí ngẫu nhiên ban đầu
        const startX = gsap.utils.random(5, 95); // tính theo %
        const startY = gsap.utils.random(5, 95); // tính theo %
        
        // Thiết lập vị trí ban đầu
        gsap.set(item, {
          left: `${startX}%`,
          top: `${startY}%`,
          scale: gsap.utils.random(0.6, 1.2),
          rotation: gsap.utils.random(-45, 45),
        });

        // Tạo animation trôi nổi ngẫu nhiên vô hạn (yoyo)
        gsap.to(item, {
          x: () => gsap.utils.random(-80, 80),
          y: () => gsap.utils.random(-80, 80),
          rotation: () => gsap.utils.random(-180, 180),
          duration: () => gsap.utils.random(15, 30),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          // Sử dụng force3D để tăng tốc phần cứng, tối ưu bộ nhớ
          force3D: true,
        });
      });
    },
    { scope: containerRef } // Giới hạn phạm vi trong container
  );

  // Tạo số lượng phần tử theo count
  const items = Array.from({ length: count }).map((_, i) => {
    const icon = FOOD_ICONS[i % FOOD_ICONS.length];
    return (
      <span key={i} className="floating-food-item" aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
    );
  });

  return (
    <div ref={containerRef} className="floating-food-container">
      {items}
    </div>
  );
}
