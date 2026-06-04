import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container section" style={{ textAlign: 'center' }}>
      <div className="empty empty--large" style={{ borderRadius: '4px' }}>
        <div className="empty__icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
            <path d="M7 2v20" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
          </svg>
        </div>
        <h2 style={{ fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>404 — Không tìm thấy trang</h2>
        <p>Có vẻ bạn đã lạc vào một nhà hàng không tồn tại.</p>
        <Link to="/" className="btn btn--primary" style={{ borderRadius: '2px' }}>Về trang chủ</Link>
      </div>
    </div>
  );
}
