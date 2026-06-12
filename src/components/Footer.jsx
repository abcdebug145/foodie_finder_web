import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" style={{ background: 'var(--bg-dark)', color: 'rgba(255, 255, 255, 0.7)', borderTop: '2px solid var(--primary)' }}>
      <div className="container footer__inner" style={{ padding: '64px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px' }}>
        
        {/* Brand Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 className="footer__title" style={{ fontFamily: 'var(--font)', fontWeight: 900, fontSize: '24px', color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
            Foodie<span className="navbar__brand-accent">Homie</span>
          </h4>
          <p className="footer__text" style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
            Vũ trụ review và săn lùng quán ngon đỉnh nóc kịch trần dành riêng cho thế hệ Foodie Gen Z.
          </p>
        </div>

        {/* Links Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h5 className="footer__subtitle" style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Điều hướng</h5>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link to="/" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}>Khám phá quán ăn</Link>
            <Link to="/favorites" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}>Quán ăn yêu thích</Link>
            <Link to="/profile" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', textDecoration: 'none', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}>Trang cá nhân</Link>
          </nav>
        </div>

        {/* Contact/Social Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h5 className="footer__subtitle" style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Liên hệ & Connect</h5>
          <p className="footer__text" style={{ margin: 0, fontSize: '14px' }}>Email: yo@foodiefinder.vn</p>
          <div className="footer__social" style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}>Facebook</a>
            <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}>Instagram</a>
            <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = 'var(--primary)'} onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.7)'}>TikTok</a>
          </div>
        </div>

        {/* Newsletter Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h5 className="footer__subtitle" style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Newsletter</h5>
          <p className="footer__text" style={{ margin: 0, fontSize: '13px' }}>Nhập email để săn code giảm giá & quán hot mỗi tuần bồ tèo ơi!</p>
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <input 
              type="email" 
              placeholder="Email của bồ..." 
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(255, 255, 255, 0.1)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                color: '#ffffff',
                outline: 'none',
                fontSize: '13px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 10px rgba(232, 153, 81, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button className="btn btn--primary" style={{ padding: '10px 16px', fontSize: '11px' }}>Săn</button>
          </form>
        </div>

      </div>
      
      <div className="footer__bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: 'rgba(255, 255, 255, 0.4)', fontFamily: 'var(--font-mono)' }}>
        <span>© {new Date().getFullYear()} FOODIE HOMIE. ALL RIGHTS RESERVED.</span>
        <span>DESIGNED FOR GEN Z BY ANTIGRAVITY</span>
      </div>
    </footer>
  );
}
