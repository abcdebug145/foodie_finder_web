import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    const res = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <h1 className="auth__title">Tạo tài khoản mới</h1>
        <p className="auth__subtitle">
          Tham gia cộng đồng foodie và chia sẻ những trải nghiệm ẩm thực của bạn.
        </p>

        <form onSubmit={handleSubmit} className="form">
          <label className="form__field">
            <span>Họ tên</span>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </label>
          <label className="form__field">
            <span>Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
            />
          </label>
          <label className="form__field">
            <span>Mật khẩu</span>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Ít nhất 6 ký tự"
            />
          </label>
          <label className="form__field">
            <span>Xác nhận mật khẩu</span>
            <input
              type="password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Nhập lại mật khẩu"
            />
          </label>

          {error && <p className="form__error">{error}</p>}

          <button type="submit" className="btn btn--primary btn--block">
            Đăng ký
          </button>
        </form>

        <p className="auth__switch">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </div>
      <div className="auth__side" aria-hidden>
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1000&q=80"
          alt=""
        />
        <div className="auth__side-overlay">
          <blockquote>“Hãy chia sẻ hương vị, lan tỏa cảm xúc.”</blockquote>
        </div>
      </div>
    </div>
  );
}
