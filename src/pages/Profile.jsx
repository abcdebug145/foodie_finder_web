import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { Link } from 'react-router-dom';
import PreferenceSelectorModal from '../components/PreferenceSelectorModal.jsx';
import { toast } from '../components/Toast.jsx';

function ProfileReviewItem({ review }) {
  const { getRestaurant } = useRestaurants();
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    let active = true;
    getRestaurant(review.restaurantId).then(res => {
      if (active) setRestaurant(res);
    });
    return () => { active = false; };
  }, [review.restaurantId, getRestaurant]);

  const ratingStars = Math.max(0, Math.min(5, Math.round(review.rating || 0)));

  const renderStars = (count) => (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <svg
          key={idx}
          width="13" height="13"
          viewBox="0 0 24 24"
          fill={idx < count ? "var(--primary)" : "none"}
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '2px' }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );

  if (!restaurant) {
    return (
      <li>
        <div className="my-reviews__item" style={{ opacity: 0.7 }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(42, 29, 25, 0.05)', borderRadius: '2px', border: '1px solid var(--border)', flexShrink: 0 }} />
          <div>
            <h4>Đang tải quán ăn...</h4>
            <div className="my-reviews__rating">
              {renderStars(ratingStars)}
            </div>
            <p className="my-reviews__content">{review.content}</p>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link to={`/restaurants/${restaurant.id}`} className="my-reviews__item">
        <img src={restaurant.image} alt={restaurant.name} style={{ borderRadius: '2px' }} />
        <div>
          <h4>{restaurant.name}</h4>
          <div className="my-reviews__rating">
            {renderStars(ratingStars)}
          </div>
          <p className="my-reviews__content">{review.content}</p>
        </div>
      </Link>
    </li>
  );
}

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const { favorites } = useFavorites();
  const { reviews } = useReviews();
  const myReviews = reviews.filter((r) => r.userId === currentUser.id);

  const [editing, setEditing] = useState(false);
  const [openPref, setOpenPref] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: currentUser.name,
    bio: currentUser.bio || '',
    avatar: currentUser.avatar
  });

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    const token = localStorage.getItem('ff_token');
    try {
      const response = await fetch('/api/v1/media/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setForm(f => ({ ...f, avatar: data.url }));
      toast('Tải ảnh đại diện thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Có lỗi xảy ra khi tải ảnh lên.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Hiệu ứng xuất hiện cho trang cá nhân
  useGSAP(
    () => {
      gsap.from('.profile__card', {
        opacity: 0,
        x: -30,
        duration: 0.6,
        ease: 'power3.out',
      });
      gsap.from('.profile__main', {
        opacity: 0,
        x: 30,
        duration: 0.6,
        ease: 'power3.out',
      });
    },
    { scope: containerRef }
  );

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.ok) {
      toast('Cập nhật hồ sơ thành công!', 'success');
      setEditing(false);
    } else {
      toast(res.error || 'Cập nhật thất bại', 'error');
    }
  };

  return (
    <div className="container section" ref={containerRef}>
      {openPref && <PreferenceSelectorModal onClose={() => setOpenPref(false)} />}
      <div className="profile">
        {/* Áp dụng class glass-panel cho profile card */}
        <div className="profile__card glass-panel">
          <div 
            className={`profile__avatar-container ${editing ? 'profile__avatar-container--editing' : ''}`}
            onClick={editing ? () => fileInputRef.current?.click() : undefined}
            title={editing ? "Nhấp để tải ảnh đại diện mới" : undefined}
          >
            <img 
              src={editing ? form.avatar : currentUser.avatar} 
              alt={currentUser.name} 
              className="profile__avatar" 
            />
            {editing && (
              <div className="profile__avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>{uploading ? 'Đang tải...' : 'Tải ảnh mới'}</span>
              </div>
            )}
            {editing && uploading && (
              <div className="profile__avatar-loading">
                <div className="spinner"></div>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {!editing ? (
            <>
              <h2>{currentUser.name}</h2>
              <p className="profile__email">{currentUser.email}</p>
              <p className="profile__bio">{currentUser.bio}</p>

              {/* Culinary Preferences display */}
              <div className="profile__preferences" style={{ margin: '16px 0 24px', textAlign: 'left' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px', fontSize: '14px', color: 'var(--text-dark)', fontWeight: '600' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                  Sở thích ẩm thực:
                </h4>
                {currentUser.preferences && currentUser.preferences.length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {currentUser.preferences.map((cat) => (
                      <span 
                        key={cat} 
                        className="chip" 
                        style={{ 
                          padding: '4px 12px', 
                          fontSize: '11px',
                          background: 'rgba(232, 153, 81, 0.1)',
                          color: 'var(--text-dark)',
                          border: '1px solid rgba(232, 153, 81, 0.3)',
                          fontWeight: '700',
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    Chưa thiết lập sở thích ẩm thực.
                  </p>
                )}
                
                <button 
                  type="button"
                  className="btn btn--ghost" 
                  onClick={() => setOpenPref(true)}
                  style={{ 
                    marginTop: '12px', 
                    padding: '6px 12px', 
                    fontSize: '12px', 
                    width: '100%',
                    borderRadius: '2px'
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>Cập nhật sở thích</span>
                  </span>
                </button>
              </div>

              <button 
                className="btn btn--ghost" 
                onClick={() => {
                  setForm({
                    name: currentUser.name,
                    bio: currentUser.bio || '',
                    avatar: currentUser.avatar
                  });
                  setEditing(true);
                }}
              >
                Chỉnh sửa hồ sơ
              </button>
            </>
          ) : (
            <form className="form" onSubmit={handleSave}>
              <label className="form__field">
                <span>Họ tên</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </label>
              <label className="form__field">
                <span>Giới thiệu</span>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </label>
              <div className="form__actions">
                <button 
                  type="button" 
                  className="btn btn--ghost" 
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: currentUser.name,
                      bio: currentUser.bio || '',
                      avatar: currentUser.avatar
                    });
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}

          <div className="profile__stats">
            <div>
              <strong>{favorites.length}</strong>
              <span>Yêu thích</span>
            </div>
            <div>
              <strong>{myReviews.length}</strong>
              <span>Đánh giá</span>
            </div>
          </div>
        </div>

        <div className="profile__main">
          {/* Áp dụng class glass-panel cho panel chính */}
          <section className="panel glass-panel">
            <h3 className="panel__title">Đánh giá của tôi</h3>
            {myReviews.length === 0 ? (
              <p className="empty">Bạn chưa viết đánh giá nào. Hãy chia sẻ trải nghiệm của bạn!</p>
            ) : (
              <ul className="my-reviews">
                {myReviews.map((rv) => (
                  <ProfileReviewItem key={rv.id} review={rv} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
