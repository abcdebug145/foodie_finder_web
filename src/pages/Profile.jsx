import { useState, useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { Link, useParams, useNavigate } from 'react-router-dom';
import PreferenceSelectorModal from '../components/PreferenceSelectorModal.jsx';
import { toast } from '../components/Toast.jsx';
import UserAvatar from '../components/UserAvatar.jsx';

function ProfileReviewItem({ review }) {
  const { getRestaurant } = useRestaurants();
  const [restaurant, setRestaurant] = useState(null);
  const restaurantId = review.restaurant_id || review.restaurantId;

  useEffect(() => {
    let active = true;
    if (restaurantId) {
      getRestaurant(restaurantId).then(res => {
        if (active) setRestaurant(res);
      });
    }
    return () => { active = false; };
  }, [restaurantId, getRestaurant]);

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
            <p className="my-reviews__content">{review.text || review.content}</p>
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
          <p className="my-reviews__content">{review.text || review.content}</p>
        </div>
      </Link>
    </li>
  );
}

function ProfileBookingItem({ b, handleCancelBooking }) {
  const { getRestaurant } = useRestaurants();
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    let active = true;
    if (b.restaurant_id) {
      getRestaurant(b.restaurant_id).then(res => {
        if (active) setRestaurant(res);
      });
    }
    return () => { active = false; };
  }, [b.restaurant_id, getRestaurant]);

  return (
    <div 
      style={{ 
        border: '1.5px solid var(--border)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '18px', 
        background: 'var(--bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Booking Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)' }}>
            Đặt bàn tại: {restaurant ? restaurant.name : `Quán #${b.restaurant_id}`}
          </h4>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Mã đặt bàn: FF-{b.id} • Đặt ngày: {new Date(b.created_at || Date.now()).toLocaleDateString('vi-VN')}
          </span>
        </div>
        <span 
          style={{ 
            padding: '4px 10px', 
            fontSize: '12px', 
            fontWeight: '800', 
            borderRadius: '4px',
            background: b.status === 'confirmed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
            color: b.status === 'confirmed' ? '#059669' : '#dc2626',
            textTransform: 'uppercase'
          }}
        >
          {b.status === 'confirmed' ? 'ĐÃ XÁC NHẬN' : b.status === 'cancelled' ? 'ĐÃ HỦY' : b.status}
        </span>
      </div>

      {/* Booking Info Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', background: 'white', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Ngày đến</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{b.booking_date}</strong>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Giờ đến</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{b.booking_time}</strong>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Số lượng khách</span>
          <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>{b.party_size} người</strong>
        </div>
      </div>

      {/* Pre-order menu items */}
      {b.items && b.items.length > 0 && (
        <div>
          <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-dark)', textTransform: 'uppercase', marginBottom: '8px' }}>Món ăn đã chọn trước:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'white', padding: '12px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
            {b.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-dark)' }}>
                  {item.item_name} <small style={{ color: 'var(--text-muted)' }}>x{item.quantity}</small>
                </span>
                <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                  {item.unit_price ? `${(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ` : '0đ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {b.note && (
        <div style={{ fontSize: '13px', background: 'white', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Ghi chú của bạn</span>
          <p style={{ margin: 0, color: 'var(--text-dark)' }}>{b.note}</p>
        </div>
      )}

      {/* Cancel button */}
      {b.status === 'confirmed' && (
        <button
          onClick={() => handleCancelBooking(b.id)}
          className="btn btn--ghost"
          style={{
            alignSelf: 'flex-end',
            borderColor: 'var(--danger)',
            color: 'var(--danger)',
            padding: '6px 14px',
            fontSize: '12px',
            borderRadius: '4px',
            background: 'white'
          }}
        >
          Hủy đặt bàn
        </button>
      )}
    </div>
  );
}

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const { favorites } = useFavorites();
  const { reviews } = useReviews();
  const { userId } = useParams();
  const navigate = useNavigate();

  const isMe = !userId || parseInt(userId) === currentUser.id;

  const [profileUser, setProfileUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [openPref, setOpenPref] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Bookings list state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Tab control for me: 'reviews' vs 'bookings'
  const [activeTab, setActiveTab] = useState('reviews');

  // Followers / Following Modals
  const [modalUsers, setModalUsers] = useState([]);
  const [showModal, setShowModal] = useState(null); // 'followers' | 'following' | null
  const [modalLoading, setModalLoading] = useState(false);

  // Profile reviews from API
  const [profileReviews, setProfileReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    bio: '',
    avatar: ''
  });

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch profile details
  const fetchProfile = async () => {
    setProfileLoading(true);
    const token = localStorage.getItem('ff_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      if (isMe) {
        const res = await fetch('/api/v1/auth/me', { headers });
        if (res.ok) {
          const userData = await res.json();
          const mapped = {
            id: userData.id,
            name: userData.full_name || userData.email,
            email: userData.email,
            avatar: userData.avatar || '',
            bio: userData.bio || 'Thành viên của Foodie Homie.',
            total_points: userData.total_points || 0,
            follower_count: userData.follower_count || 0,
            following_count: userData.following_count || 0,
            preferences: userData.preferences || []
          };
          setProfileUser(mapped);
          setForm({
            name: mapped.name,
            bio: mapped.bio,
            avatar: mapped.avatar
          });
        } else {
          setProfileUser(currentUser);
        }
      } else {
        const res = await fetch(`/api/v1/users/${userId}`, { headers });
        if (res.ok) {
          const userData = await res.json();
          setProfileUser({
            id: userData.id,
            name: userData.full_name || userData.email,
            email: userData.email,
            avatar: userData.avatar || '',
            bio: userData.bio || 'Thành viên của Foodie Homie.',
            total_points: userData.total_points || 0,
            follower_count: userData.follower_count || 0,
            following_count: userData.following_count || 0,
            is_following: userData.is_following,
            preferences: userData.preferences || []
          });
        } else {
          toast('Không tìm thấy người dùng này.', 'error');
          navigate('/404');
        }
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi tải thông tin hồ sơ.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch reviews for profile
  const fetchProfileReviews = async () => {
    setReviewsLoading(true);
    try {
      const targetId = isMe ? currentUser.id : userId;
      const res = await fetch(`/api/v1/reviews/?user_id=${targetId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setProfileReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch bookings (if isMe)
  const fetchBookings = async () => {
    if (!isMe) return;
    setBookingsLoading(true);
    const token = localStorage.getItem('ff_token');
    try {
      const res = await fetch('/api/v1/bookings/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchProfileReviews();
    fetchBookings();
  }, [userId, currentUser, reviews]);

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('ff_token');
    if (!token) {
      toast('Vui lòng đăng nhập để theo dõi!', 'error');
      navigate('/login');
      return;
    }

    const action = profileUser.is_following ? 'unfollow' : 'follow';
    try {
      const res = await fetch(`/api/v1/community/${action}/${profileUser.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast(profileUser.is_following ? `Đã bỏ theo dõi ${profileUser.name}` : `Đang theo dõi ${profileUser.name}`, 'success');
        setProfileUser(prev => ({
          ...prev,
          is_following: !prev.is_following,
          follower_count: prev.follower_count + (prev.is_following ? -1 : 1)
        }));
      } else {
        const err = await res.json();
        toast(err.detail || 'Thao tác thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi máy chủ.', 'error');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt bàn này không?')) return;
    const token = localStorage.getItem('ff_token');
    try {
      const res = await fetch(`/api/v1/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast('Hủy đặt bàn thành công!', 'success');
        fetchBookings();
      } else {
        const err = await res.json();
        toast(err.detail || 'Không thể hủy đặt bàn.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Lỗi kết nối máy chủ.', 'error');
    }
  };

  const handleOpenListModal = async (type) => {
    setShowModal(type);
    setModalLoading(true);
    const token = localStorage.getItem('ff_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      const targetId = isMe ? currentUser.id : userId;
      const res = await fetch(`/api/v1/community/${type}/${targetId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setModalUsers(data);
      }
    } catch (err) {
      console.error(err);
      toast('Không thể tải danh sách.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

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

  // Appear animation
  useGSAP(
    () => {
      if (!profileLoading) {
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
      }
    },
    { dependencies: [profileLoading], scope: containerRef }
  );

  const handleSave = async (e) => {
    e.preventDefault();
    const res = await updateProfile(form);
    if (res.ok) {
      toast('Cập nhật hồ sơ thành công!', 'success');
      setEditing(false);
      fetchProfile();
    } else {
      toast(res.error || 'Cập nhật thất bại', 'error');
    }
  };

  if (profileLoading) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <circle cx="12" cy="12" r="10" stroke="rgba(42, 29, 25, 0.2)" strokeDasharray="32" strokeDashoffset="8" />
          </svg>
          <span>Đang tải thông tin cá nhân...</span>
        </div>
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="container section" ref={containerRef}>
      {openPref && <PreferenceSelectorModal onClose={() => { setOpenPref(false); fetchProfile(); }} />}
      
      <div className="profile">
        {/* Profile Card */}
        <div className="profile__card glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div 
            className={`profile__avatar-container ${editing ? 'profile__avatar-container--editing' : ''}`}
            onClick={editing ? () => fileInputRef.current?.click() : undefined}
            title={editing ? "Nhấp để tải ảnh đại diện mới" : undefined}
          >
            <UserAvatar 
              src={editing ? form.avatar : profileUser.avatar} 
              name={profileUser.name} 
              className="profile__avatar" 
              size={120}
              style={{ borderRadius: 'var(--radius-md)' }}
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
              <h2 style={{ margin: '12px 0 4px', fontSize: '22px', fontWeight: '900', color: 'var(--text-dark)' }}>{profileUser.name}</h2>
              {isMe && <p className="profile__email" style={{ margin: '0 0 8px', fontSize: '13.5px', color: 'var(--text-muted)' }}>{profileUser.email}</p>}
              <p className="profile__bio" style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--text-muted)' }}>{profileUser.bio}</p>

              {/* Point section if me */}
              {isMe && (
                <div style={{ background: 'rgba(232, 153, 81, 0.08)', border: '1px solid rgba(232, 153, 81, 0.25)', borderRadius: '6px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '18px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-dark)', textTransform: 'uppercase' }}>Điểm Foodie:</span>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{profileUser.total_points} pts</span>
                </div>
              )}

              {/* Follow button if not me */}
              {!isMe && (
                <button
                  onClick={handleFollowToggle}
                  className={`btn btn--block ${profileUser.is_following ? 'btn--ghost' : 'btn--primary'}`}
                  style={{ marginBottom: '18px', padding: '10px 20px', fontSize: '13px' }}
                >
                  {profileUser.is_following ? 'Hủy theo dõi' : 'Theo dõi'}
                </button>
              )}

              {/* Culinary Preferences display */}
              <div className="profile__preferences" style={{ width: '100%', margin: '10px 0 20px', textAlign: 'left' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px', fontSize: '13px', color: 'var(--text-dark)', fontWeight: '700', textTransform: 'uppercase' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  Khẩu vị:
                </h4>
                {profileUser.preferences && profileUser.preferences.length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {profileUser.preferences.map((cat) => (
                      <span 
                        key={cat} 
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '11px',
                          background: 'rgba(232, 153, 81, 0.08)',
                          color: 'var(--text-dark)',
                          border: '1px solid rgba(232, 153, 81, 0.2)',
                          borderRadius: '2px',
                          fontWeight: '700',
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
                
                {isMe && (
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
                    Cập nhật sở thích
                  </button>
                )}
              </div>

              {isMe && (
                <button 
                  className="btn btn--ghost btn--block" 
                  onClick={() => {
                    setForm({
                      name: profileUser.name,
                      bio: profileUser.bio,
                      avatar: profileUser.avatar
                    });
                    setEditing(true);
                  }}
                >
                  Chỉnh sửa hồ sơ
                </button>
              )}
            </>
          ) : (
            <form className="form" onSubmit={handleSave} style={{ width: '100%', textAlign: 'left' }}>
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
              <div className="form__actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn--ghost" 
                  style={{ flex: 1, padding: '10px' }}
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: profileUser.name,
                      bio: profileUser.bio,
                      avatar: profileUser.avatar
                    });
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn--primary" style={{ flex: 1, padding: '10px' }}>
                  Lưu
                </button>
              </div>
            </form>
          )}

          {/* Followers and Following counters */}
          <div className="profile__stats" style={{ width: '100%', marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => handleOpenListModal('followers')}>
              <strong style={{ fontSize: '18px', display: 'block' }}>{profileUser.follower_count}</strong>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Followers</span>
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => handleOpenListModal('following')}>
              <strong style={{ fontSize: '18px', display: 'block' }}>{profileUser.following_count}</strong>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Following</span>
            </div>
            <div>
              <strong style={{ fontSize: '18px', display: 'block' }}>{profileReviews.length}</strong>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reviews</span>
            </div>
          </div>
        </div>

        {/* Profile Main Content */}
        <div className="profile__main">
          {isMe && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  background: activeTab === 'reviews' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'reviews' ? 'var(--bg-dark)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Đánh giá của tôi
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                style={{
                  background: activeTab === 'bookings' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'bookings' ? 'var(--bg-dark)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Lịch sử đặt bàn ({bookings.length})
              </button>
            </div>
          )}

          {activeTab === 'reviews' ? (
            <section className="panel glass-panel">
              <h3 className="panel__title">Đánh giá {isMe ? 'của tôi' : `của ${profileUser.name}`}</h3>
              {reviewsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải bài viết...</div>
              ) : profileReviews.length === 0 ? (
                <p className="empty">Không có bài viết đánh giá nào.</p>
              ) : (
                <ul className="my-reviews">
                  {profileReviews.map((rv) => (
                    <ProfileReviewItem key={rv.id} review={rv} />
                  ))}
                </ul>
              )}
            </section>
          ) : (
            /* Bookings Tab (only for isMe) */
            <section className="panel glass-panel">
              <h3 className="panel__title">Lịch sử đặt bàn</h3>
              {bookingsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải lịch sử đặt bàn...</div>
              ) : bookings.length === 0 ? (
                <p className="empty">Bạn chưa thực hiện cuộc đặt bàn nào.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {bookings.map((b) => (
                    <ProfileBookingItem key={b.id} b={b} handleCancelBooking={handleCancelBooking} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Followers / Following List Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(42, 29, 25, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'grid',
            placeItems: 'center',
            padding: '24px'
          }} 
          onClick={() => setShowModal(null)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '450px',
              background: 'var(--bg-light)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '80vh',
              overflow: 'hidden'
            }} 
            onClick={e => e.stopPropagation()}
          >
            <div 
              style={{ 
                padding: '16px 20px', 
                borderBottom: '2px solid var(--border)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'var(--bg-subtle)' 
              }}
            >
              <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '14px', color: 'var(--text-dark)' }}>
                {showModal === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
              </h3>
              <button 
                onClick={() => setShowModal(null)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: '800', color: 'var(--text-dark)' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải danh sách...</div>
              ) : modalUsers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {modalUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <UserAvatar 
                          src={u.avatar} 
                          name={u.full_name || u.email} 
                          size={40}
                          style={{ borderRadius: '2px', border: '1px solid var(--border)' }}
                        />
                        <div>
                          <strong style={{ fontSize: '13.5px', color: 'var(--text-dark)' }}>{u.full_name || u.email}</strong>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.bio || 'Thành viên của Foodie Homie.'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setShowModal(null);
                          navigate(`/profile/${u.id}`);
                        }}
                        className="btn btn--ghost"
                        style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: 'var(--radius-md)' }}
                      >
                        Ghé thăm
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                  {showModal === 'followers' ? 'Chưa có ai theo dõi người dùng này.' : 'Người dùng này chưa theo dõi ai.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
