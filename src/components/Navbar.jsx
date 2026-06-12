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
            <svg viewBox="0 0 356.276 356.277" fill="currentColor" style={{ width: '28px', height: '28px', color: 'var(--primary)', filter: 'drop-shadow(0 0 4px rgba(232,153,81,0.4))' }}>
              <g>
                <path d="M194.743,58.626c-65.891,0-119.508,53.618-119.508,119.512c0,65.891,53.618,119.512,119.508,119.512 c65.897,0,119.519-53.621,119.519-119.512C314.262,112.245,260.652,58.626,194.743,58.626z M194.743,278.945 c-55.578,0-100.803-45.219-100.803-100.807S139.165,77.333,194.743,77.333c55.582,0,100.812,45.224,100.812,100.806 S250.325,278.945,194.743,278.945z"/>
                <path d="M195.401,114.446c-0.22,0-0.438,0-0.658,0c-16.77,0-32.583,6.445-44.566,18.2c-12.15,11.911-18.943,27.834-19.11,44.854 c-0.055,5.163,4.089,9.389,9.252,9.443c0.04,0,0.07,0,0.1,0c5.118,0,9.298-4.128,9.353-9.262 c0.125-12.014,4.914-23.263,13.5-31.679c8.467-8.299,19.629-12.857,31.472-12.857c0.159,0,0.323,0,0.476,0 c12.02,0.125,23.267,4.92,31.676,13.506c8.415,8.58,12.981,19.927,12.854,31.95c-0.127,12.014-4.913,23.267-13.499,31.682 c-8.464,8.294-19.632,12.854-31.481,12.854c-0.188,0-0.401,0.006-0.56,0c-5.121,0-9.305,4.128-9.354,9.262 c-0.061,5.163,4.092,9.396,9.25,9.444c0.225,0,0.444,0,0.663,0c16.764,0,32.577-6.449,44.561-18.201 c12.154-11.91,18.943-27.833,19.114-44.84c0.177-17.02-6.29-33.083-18.2-45.233C228.344,121.403,212.414,114.613,195.401,114.446z"/>
                <path d="M23.383,170.195v95.237c0,5.17,4.189,9.354,9.353,9.354s9.353-4.184,9.353-9.354v-95.807 c5.581-1.139,11.679-3.179,18.271-6.533l5.112-2.601V123.58c0-5.17-4.189-9.353-9.353-9.353s-9.353,4.183-9.353,9.353v25.166 c-1.62,0.649-3.172,1.167-4.676,1.608V123.58c0-5.17-4.189-9.353-9.353-9.353s-9.353,4.183-9.353,9.353v27.636 c-1.882-0.469-3.462-1.054-4.677-1.623V123.58c0-5.17-4.189-9.353-9.353-9.353S0,118.41,0,123.58v35.411l3.182,2.792 C3.684,162.227,10.9,168.28,23.383,170.195z"/>
                <path d="M343.574,101.619c-1.047,0.399-2.021,1.005-2.898,1.797c-0.049,0.036-0.104,0.048-0.146,0.094 c-0.913,0.847-22.128,21.081-22.561,48.324c-0.243,15.5,6.12,29.854,18.938,42.66c0.2,0.201,0.456,0.268,0.663,0.444v70.494 c0,5.17,4.189,9.354,9.354,9.354s9.353-4.184,9.353-9.354V110.33c0-0.106-0.048-0.201-0.055-0.305 c-0.036-0.916-0.188-1.827-0.481-2.707c-0.042-0.113-0.066-0.238-0.109-0.35c-0.401-1.035-0.998-2.006-1.783-2.88 c-0.043-0.049-0.056-0.113-0.104-0.162c-0.025-0.027-0.049-0.034-0.074-0.058c-0.84-0.871-1.802-1.54-2.837-2.012 c-0.067-0.024-0.116-0.07-0.171-0.094c-1.029-0.448-2.131-0.679-3.245-0.737c-0.098-0.006-0.188-0.024-0.292-0.03 c-0.067,0-0.128-0.018-0.201-0.018c-1.065,0-2.07,0.219-3.021,0.542C343.807,101.555,343.685,101.583,343.574,101.619z M336.67,152.238c0.03-2.588,0.377-5.108,0.913-7.532v15.567C336.956,157.63,336.639,154.951,336.67,152.238z"/>
              </g>
            </svg>
          </span>
          <span>
            Foodie<span className="navbar__brand-accent">Homie</span>
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
          <NavLink to="/feed" onClick={() => setOpen(false)}>
            Cộng đồng
          </NavLink>
          <NavLink to="/vouchers" onClick={() => setOpen(false)}>
            Ưu đãi
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
                  color: scrolled ? 'var(--text-light)' : 'var(--text-dark)',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'var(--text-light)' : 'var(--text-dark)'}
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
              <div className="navbar__user-menu">
                <Link
                  to="/profile"
                  className="navbar__avatar-link"
                  onClick={() => setOpen(false)}
                >
                  <img src={currentUser.avatar} alt={currentUser.name} />
                  <span>{currentUser.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="navbar__chevron"
                    style={{ width: '12px', height: '12px', marginLeft: '6px', opacity: 0.8 }}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </Link>
                <div className="navbar__dropdown">
                  <Link
                    to="/profile"
                    className="navbar__dropdown-item"
                    onClick={() => setOpen(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Trang cá nhân
                  </Link>
                  {currentUser.is_admin && (
                    <Link
                      to="/admin"
                      className="navbar__dropdown-item"
                      onClick={() => setOpen(false)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ width: '16px', height: '16px' }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                      </svg>
                      Quản trị viên
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="navbar__dropdown-item logout-btn"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: '16px', height: '16px' }}
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </div>
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
