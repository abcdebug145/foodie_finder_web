import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(true);
  const [cursorType, setCursorType] = useState('default'); // default, button, link
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const containerRef = useRef(null);

  // Danh sách các emoji tương ứng với trạng thái
  const emojiMap = {
    default: '🥑',
    button: '🌶️', // Thả tim/nút bấm tạo tương tác cay nồng
    link: '🍔'     // Khám phá địa điểm ăn uống đầy đặn
  };

  // 1. Kiểm tra xem thiết bị có phải di động/màn hình cảm ứng không
  useEffect(() => {
    const checkDevice = () => {
      const hasTouch = window.matchMedia('(pointer: coarse)').matches;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(hasTouch || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 2. Lập trình chuyển động bám đuổi chuột bằng GSAP quickTo (Hiệu năng cao nhất)
  useGSAP(
    () => {
      if (isMobile) return;

      // quickTo giúp cập nhật trực tiếp thuộc tính CSS mà không cần tạo tween mới liên tục (tiết kiệm RAM)
      const xDotTo = gsap.quickTo(dotRef.current, 'x', { duration: 0.08, ease: 'power3' });
      const yDotTo = gsap.quickTo(dotRef.current, 'y', { duration: 0.08, ease: 'power3' });
      const xRingTo = gsap.quickTo(ringRef.current, 'x', { duration: 0.25, ease: 'power3' });
      const yRingTo = gsap.quickTo(ringRef.current, 'y', { duration: 0.25, ease: 'power3' });

      const handleMouseMove = (e) => {
        // Trừ đi một nửa kích thước của con trỏ để canh giữa
        xDotTo(e.clientX - 10);
        yDotTo(e.clientY - 12);
        xRingTo(e.clientX - 20);
        yRingTo(e.clientY - 20);
      };

      // 3. Lắng nghe hành vi di chuột qua nút/link để đổi emoji
      const handleMouseOver = (e) => {
        const target = e.target;
        if (!target) return;

        // Nếu di chuột qua nút bấm hoặc select
        if (target.closest('button, select, .chip, .card__like')) {
          setCursorType('button');
          gsap.to(ringRef.current, { scale: 1.3, borderColor: 'var(--primary)', borderWidth: '2px', duration: 0.2 });
          gsap.to(dotRef.current, { scale: 1.2, duration: 0.2 });
        } 
        // Nếu di chuột qua liên kết hoặc thẻ nhà hàng
        else if (target.closest('a, .card, .navbar__brand')) {
          setCursorType('link');
          gsap.to(ringRef.current, { scale: 1.5, borderColor: 'var(--accent)', borderWidth: '1.5px', duration: 0.2 });
          gsap.to(dotRef.current, { scale: 1.3, duration: 0.2 });
        }
      };

      // Reset lại con trỏ chuột mặc định khi rời khỏi các thẻ tương tác
      const handleMouseOut = (e) => {
        const target = e.target;
        if (!target) return;

        if (target.closest('button, select, .chip, a, .card, .navbar__brand')) {
          setCursorType('default');
          gsap.to(ringRef.current, { scale: 1, borderColor: 'rgba(175, 255, 0, 0.4)', borderWidth: '1.5px', duration: 0.3 });
          gsap.to(dotRef.current, { scale: 1, duration: 0.3 });
        }
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseover', handleMouseOver);
      window.addEventListener('mouseout', handleMouseOut);

      // Thêm thuộc tính ẩn con trỏ chuột mặc định của trình duyệt
      document.body.style.cursor = 'none';

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseover', handleMouseOver);
        window.removeEventListener('mouseout', handleMouseOut);
        document.body.style.cursor = 'default';
      };
    },
    { dependencies: [isMobile], scope: containerRef }
  );

  if (isMobile) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999999, // Đảm bảo luôn nằm trên cùng mọi nội dung
      }}
    >
      {/* 1. Vòng tròn lớn bám đuổi trễ (Magnetic Ring) */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '1.5px solid rgba(175, 255, 0, 0.4)',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)'
        }}
      />

      {/* 2. Emoji trung tâm di chuyển tức thời theo chuột */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          fontSize: '18px',
          width: '20px',
          height: '20px',
          display: 'grid',
          placeItems: 'center',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          userSelect: 'none'
        }}
      >
        {emojiMap[cursorType]}
      </div>
    </div>
  );
}
