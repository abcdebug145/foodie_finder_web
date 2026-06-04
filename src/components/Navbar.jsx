import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import NotificationDropdown from './NotificationDropdown.jsx';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { favorites } = useFavorites();
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          <span className="navbar__logo" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', color: 'var(--primary)', filter: 'drop-shadow(0 0 4px rgba(232,153,81,0.4))' }}>
              <path d="M3 12h18" />
              <path d="M3 12a9 9 0 0 0 18 0" />
              <path d="M8 12V6" />
              <path d="M12 12V3" />
              <path d="M16 12V8" />
            </svg>
          </span>
          <span>
            Foodie<span className="navbar__brand-accent">Finder</span>
          </span>
        </Link>

        <button
          className="navbar__toggle"
          aria-label="Mở menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`navbar__nav ${open ? 'is-open' : ''}`}>
          <NavLink to="/" end onClick={() => setOpen(false)}>
            Khám phá
          </NavLink>
          {currentUser && (
            <NavLink to="/favorites" onClick={() => setOpen(false)}>
              Yêu thích
              {favorites.length > 0 && (
                <span className="navbar__badge">{favorites.length}</span>
              )}
            </NavLink>
          )}

          {currentUser && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', margin: '0 12px' }}>
              <style>{`
                @keyframes bellPulse {
                  0%, 100% { transform: scale(1); }
                  50%      { transform: scale(1.15); box-shadow: 0 0 8px var(--primary); }
                }
              `}</style>
              <button 
                onClick={() => setShowNotifications(p => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: scrolled ? 'var(--text-dark)' : 'rgba(255,255,255,0.9)',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'var(--text-dark)' : 'rgba(255,255,255,0.9)'}
                title="Thông báo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '16px',
                    height: '16px',
                    background: 'var(--primary)',
                    color: '#fff',
                    borderRadius: '50%',
                    fontSize: '9px',
                    fontWeight: '900',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '0 2px',
                    boxShadow: '0 0 0 2px var(--bg-light)',
                    animation: 'bellPulse 1.5s infinite',
                  }}>{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>
          )}

          {currentUser ? (
            <div className="navbar__user">
              <Link
                to="/profile"
                className="navbar__avatar-link"
                onClick={() => setOpen(false)}
              >
                <img src={currentUser.avatar} alt={currentUser.name} />
                <span>{currentUser.name}</span>
              </Link>
              <button className="btn btn--ghost" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="navbar__auth">
              <NavLink to="/login" className="btn btn--ghost" onClick={() => setOpen(false)}>
                Đăng nhập
              </NavLink>
              <NavLink to="/register" className="btn btn--primary" onClick={() => setOpen(false)}>
                Đăng ký
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
