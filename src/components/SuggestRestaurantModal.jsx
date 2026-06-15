import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { toast } from './Toast.jsx';

const CATEGORIES = [
  { value: 'nha-hang', label: 'Nhà hàng' },
  { value: 'quan-nhau', label: 'Quán nhậu' },
  { value: 'quan-an', label: 'Quán ăn' },
  { value: 'cafe', label: 'Cafe' }
];

const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bạc Liêu", "Bắc Giang", "Bắc Kạn",
  "Bắc Ninh", "Bến Tre", "Bình Dương", "Bình Định", "Bình Phước",
  "Bình Thuận", "Cà Mau", "Cao Bằng", "Cần Thơ", "Đà Nẵng",
  "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
  "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội", "Hà Tĩnh",
  "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hồ Chí Minh",
  "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
  "Lạng Sơn", "Lào Cai", "Lâm Đồng", "Long An", "Nam Định",
  "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên",
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh", "Quảng Trị",
  "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên",
  "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", "Tuyên Quang",
  "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

export default function SuggestRestaurantModal({ onClose }) {
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const { addRestaurant } = useRestaurants();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: CATEGORIES[0].value,
    priceRange: '$$',
    city: localStorage.getItem('ff_user_city') || 'Hà Nội',
    address: '',
    phone: '',
    hours: '08:00 - 22:00',
    specialties: '',
    tags: '',
    description: '',
    image: ''
  });

  const handleImageUpload = async (e) => {
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
      setForm(prev => ({ ...prev, image: data.url }));
      toast('Tải ảnh quán ăn lên thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Lỗi khi tải ảnh quán ăn lên.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Tải hiệu ứng trượt mượt mà bằng cách tách biệt overlay và modal content
  useGSAP(
    () => {
      gsap.set(overlayRef.current, { willChange: 'opacity' });
      gsap.set(modalRef.current, { willChange: 'transform, opacity' });

      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { 
          opacity: 1, 
          duration: 0.2, 
          ease: 'power2.out',
          force3D: true
        }
      );
      gsap.fromTo(
        modalRef.current,
        { y: 30, scale: 0.98, opacity: 0 },
        { 
          y: 0, 
          scale: 1, 
          opacity: 1, 
          duration: 0.25, 
          ease: 'power3.out', 
          delay: 0.02,
          force3D: true
        }
      );
    },
    { scope: containerRef }
  );

  // Đóng modal kèm theo chuyển động trượt đi rồi mới unmount
  const handleClose = () => {
    gsap.to(modalRef.current, {
      y: 20,
      scale: 0.98,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      force3D: true
    });
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: onClose,
      force3D: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const res = await addRestaurant(form);
    if (res.ok) {
      toast('Đã thêm quán ăn thành công! Mọi người có thể vào review.', 'success');
      handleClose();
    } else {
      setError(res.error);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '100px 20px 40px 20px',
        overflowY: 'auto'
      }}
    >
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(42, 29, 25, 0.45)', // Warm coffee overlay
          backdropFilter: 'blur(4px)',
          zIndex: -1
        }}
        onClick={handleClose}
      />
      <div
        ref={modalRef}
        className="panel glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '30px',
          position: 'relative',
          borderRadius: '4px', // Geometric border radius
          boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)'
        }}
        onClick={(e) => e.stopPropagation()} // Ngăn chặn nổi bọt sự kiện tắt modal
      >
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            border: 'none',
            background: 'rgba(42, 29, 25, 0.05)',
            width: '32px',
            height: '32px',
            borderRadius: '2px', // Sharp border radius
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-muted)'
          }}
          aria-label="Đóng"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', margin: '0 0 8px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
          Đề xuất quán mới
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 24px' }}>
          Bạn vừa khám phá ra địa điểm ăn uống ngon? Hãy đóng góp ngay thông tin vào danh bạ mở của cộng đồng nhé.
        </p>

        {error && <p className="form__error" style={{ marginBottom: '16px' }}>{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          <label className="form__field">
            <span>Tên quán ăn *</span>
            <input
              type="text"
              placeholder="Ví dụ: Phở Gia Truyền Hà Nội"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label className="form__field">
              <span>Danh mục *</span>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="select"
                style={{ width: '100%', borderRadius: '2px', border: '2px solid var(--border)', padding: '14px 18px', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                required
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form__field">
              <span>Mức giá *</span>
              <select
                value={form.priceRange}
                onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                className="select"
                style={{ width: '100%', borderRadius: '2px', border: '2px solid var(--border)', padding: '14px 18px', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                required
              >
                <option value="$">$ (Bình dân)</option>
                <option value="$$">$$ (Tầm trung)</option>
                <option value="$$$">$$$ (Sang trọng)</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '16px' }}>
            <label className="form__field">
              <span>Tỉnh / Thành phố *</span>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="select"
                style={{ width: '100%', borderRadius: '2px', border: '2px solid var(--border)', padding: '14px 18px', background: 'var(--bg-light)', color: 'var(--text-dark)' }}
                required
              >
                {VIETNAM_PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </label>

            <label className="form__field">
              <span>Địa chỉ chi tiết *</span>
              <input
                type="text"
                placeholder="Ví dụ: 123 Nguyễn Thị Minh Khai, Quận 1"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label className="form__field">
              <span>Giờ hoạt động</span>
              <input
                type="text"
                placeholder="Ví dụ: 07:00 - 22:00"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
              />
            </label>

            <label className="form__field">
              <span>Số điện thoại</span>
              <input
                type="text"
                placeholder="Ví dụ: 0909 123 456"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
          </div>

          <label className="form__field">
            <span>Món đặc trưng (phân cách bằng dấu phẩy)</span>
            <input
              type="text"
              placeholder="Ví dụ: Phở tái nạm, Bánh quẩy, Trà đá"
              value={form.specialties}
              onChange={(e) => setForm({ ...form, specialties: e.target.value })}
            />
          </label>

          <label className="form__field">
            <span>Hashtag bổ sung (phân cách bằng dấu phẩy)</span>
            <input
              type="text"
              placeholder="Ví dụ: pho, truyenthong, anbuongsang"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </label>

          <label className="form__field">
            <span>Ảnh bìa quán</span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
              {form.image && (
                <img 
                  src={form.image} 
                  alt="Restaurant preview" 
                  style={{ width: '60px', height: '40px', borderRadius: '2px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                style={{ fontSize: '13px' }}
              />
            </div>
            {uploading && <span style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px', display: 'block' }}>Đang tải ảnh lên...</span>}
          </label>

          <label className="form__field">
            <span>Giới thiệu ngắn gọn</span>
            <textarea
              placeholder="Chia sẻ một chút thông tin về không gian hoặc điểm nổi bật của quán..."
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <div className="form__actions" style={{ marginTop: '12px' }}>
            <button type="button" className="btn btn--ghost" onClick={handleClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn--primary">
              Đăng quán ăn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
