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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate(redirectTo, { replace: true });
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
    </div>
  );
}
