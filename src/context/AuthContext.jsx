import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const CURRENT_USER_KEY = 'ff_current_user';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Verify token on mount and load real /me info
  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Invalid token");
      })
      .then(userData => {
        const user = {
          id: userData.id,
          name: userData.full_name || userData.email,
          email: userData.email,
          avatar: userData.avatar || '',
          bio: userData.bio || (userData.is_admin ? 'Quản trị viên hệ thống.' : userData.is_owner ? 'Chủ nhà hàng.' : 'Thành viên của Foodie Homie.'),
          is_admin: userData.is_admin,
          is_owner: userData.is_owner,
          total_points: userData.total_points || 0,
          follower_count: userData.follower_count || 0,
          following_count: userData.following_count || 0,
          preferences: userData.preferences || []
        };
        setCurrentUser(user);
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      })
      .catch(() => {
        localStorage.removeItem('ff_token');
        localStorage.removeItem(CURRENT_USER_KEY);
        setCurrentUser(null);
      });
    }
  }, []);

  const login = async ({ email, password }) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { ok: false, error: errorData.detail || 'Email hoặc mật khẩu không đúng.' };
      }

      const { access_token } = await response.json();
      localStorage.setItem('ff_token', access_token);

      // Fetch user profile info
      const meResponse = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });
      if (!meResponse.ok) {
        return { ok: false, error: 'Không thể lấy thông tin người dùng.' };
      }

      const userData = await meResponse.json();
      const user = {
        id: userData.id,
        name: userData.full_name || userData.email,
        email: userData.email,
        avatar: userData.avatar || '',
        bio: userData.bio || (userData.is_admin ? 'Quản trị viên hệ thống.' : userData.is_owner ? 'Chủ nhà hàng.' : 'Thành viên của Foodie Homie.'),
        is_admin: userData.is_admin,
        is_owner: userData.is_owner,
        total_points: userData.total_points || 0,
        follower_count: userData.follower_count || 0,
        following_count: userData.following_count || 0,
        preferences: userData.preferences || []
      };
      
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối với máy chủ.' };
    }
  };

  const register = async ({ name, email, password }) => {
    if (!name || !email || !password) {
      return { ok: false, error: 'Vui lòng điền đầy đủ thông tin.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' };
    }

    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          full_name: name.trim(),
          is_active: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { ok: false, error: errorData.detail || 'Đăng ký thất bại. Email có thể đã tồn tại.' };
      }

      // Log in immediately after registration
      return await login({ email, password });
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Đã xảy ra lỗi kết nối với máy chủ.' };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('ff_token');
    if (token) {
      try {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error("Logout API error", e);
      }
    }
    localStorage.removeItem('ff_token');
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return { ok: false, error: 'Chưa đăng nhập' };
    const token = localStorage.getItem('ff_token');
    if (!token) return { ok: false, error: 'Chưa đăng nhập' };

    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: updates.name,
          bio: updates.bio,
          avatar: updates.avatar
        })
      });

      if (!response.ok) {
        const err = await response.json();
        return { ok: false, error: err.detail || 'Cập nhật hồ sơ thất bại' };
      }

      const userData = await response.json();
      const updatedUser = {
        ...currentUser,
        name: userData.full_name || userData.email,
        bio: userData.bio || (userData.is_admin ? 'Quản trị viên hệ thống.' : userData.is_owner ? 'Chủ nhà hàng.' : 'Thành viên của Foodie Homie.'),
        avatar: userData.avatar || '',
        total_points: userData.total_points || 0,
        follower_count: userData.follower_count || 0,
        following_count: userData.following_count || 0,
        preferences: userData.preferences || []
      };

      setCurrentUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Lỗi kết nối máy chủ' };
    }
  };

  const value = useMemo(
    () => ({ currentUser, login, register, logout, updateProfile }),
    [currentUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
