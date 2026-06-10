import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showAdminChoiceModal, setShowAdminChoiceModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    
    try {
      const rawUser = localStorage.getItem('ff_current_user');
      const user = rawUser ? JSON.parse(rawUser) : null;
      if (user && user.is_admin) {
        setShowAdminChoiceModal(true);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Chào mừng trở lại</h1>
        <p className="auth__subtitle">
          Đăng nhập để lưu nhà hàng yêu thích và viết đánh giá của bạn.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="form__field">
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </label>
          <label className="form__field">
            <span>Mật khẩu</span>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="form__error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block">
            Đăng nhập
          </button>
        </form>

        <p className="auth__switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
      <div className="auth__side" aria-hidden>
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
          alt=""
        />
        <div className="auth__side-overlay">
          <blockquote>
            “Ẩm thực là thứ ngôn ngữ mà ai cũng hiểu được.”
          </blockquote>
        </div>
      </div>

      {/* Choice Modal for Admin users */}
      {showAdminChoiceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div 
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(42, 29, 25, 0.45)', backdropFilter: 'blur(4px)' }} 
            onClick={() => {
              setShowAdminChoiceModal(false);
              navigate(redirectTo, { replace: true });
            }}
          />
          <div 
            className="panel glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '420px', 
              padding: '30px', 
              position: 'relative', 
              borderRadius: '4px', 
              boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)', 
              textAlign: 'center', 
              zIndex: 1 
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', margin: '0 0 10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Lựa chọn quyền truy cập
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '0 0 24px', lineHeight: '1.5' }}>
              Tài khoản của bạn có quyền Quản trị viên. Hãy chọn giao diện bạn muốn truy cập.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowAdminChoiceModal(false);
                  navigate('/admin', { replace: true });
                }}
                className="btn btn--primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                Truy cập Quản trị viên
              </button>
              
              <button
                onClick={() => {
                  setShowAdminChoiceModal(false);
                  navigate(redirectTo, { replace: true });
                }}
                className="btn btn--ghost"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Truy cập Người dùng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
