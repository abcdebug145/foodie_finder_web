import { useState } from 'react';
import { toast } from './Toast.jsx';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam / Quảng cáo trái phép' },
  { value: 'inappropriate', label: 'Ngôn từ thô tục / Phản cảm' },
  { value: 'fake', label: 'Đánh giá ảo / Giả mạo' },
  { value: 'incorrect', label: 'Thông tin không chính xác' },
  { value: 'other', label: 'Lý do khác' }
];

export default function ReportModal({ targetType, targetId, restaurantId, onClose }) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('ff_token');
    if (!token) {
      toast('Vui lòng đăng nhập để gửi báo cáo.', 'error');
      return;
    }

    setSubmitting(true);

    const payload = {
      target_type: targetType,
      reason: REPORT_REASONS.find(r => r.value === reason)?.label || reason,
      description: description.trim() || null,
      restaurant_id: targetType === 'restaurant' ? targetId : (restaurantId || null),
      review_id: targetType === 'review' ? targetId : null
    };

    try {
      const res = await fetch('/api/v1/reports/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast('Gửi báo cáo thành công. Ban quản trị sẽ kiểm duyệt sớm nhất có thể.', 'success');
        onClose();
      } else {
        const err = await res.json();
        toast(err.detail || 'Gửi báo cáo thất bại.', 'error');
      }
    } catch (e) {
      toast('Đã xảy ra lỗi kết nối với máy chủ.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(42, 29, 25, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'grid',
      placeItems: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'var(--bg-light)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '2px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-subtle)'
        }}>
          <h3 style={{ margin: 0, fontWeight: 900, textTransform: 'uppercase', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
            ⚠️ Báo cáo vi phạm
          </h3>
          <button
            onClick={onClose}
            style={{
              border: 'none', background: 'transparent',
              color: 'var(--text-dark)', cursor: 'pointer',
              fontSize: 14, fontWeight: '700'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dark)' }}>
              Lý do báo cáo
            </span>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                fontFamily: 'var(--font)',
                fontSize: '14px',
                padding: '10px 12px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                outline: 'none',
                color: 'var(--text-dark)'
              }}
            >
              {REPORT_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dark)' }}>
              Mô tả chi tiết (Tùy chọn)
            </span>
            <textarea
              placeholder="Vui lòng cung cấp thêm thông tin chi tiết về báo cáo này để chúng tôi dễ dàng xử lý..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              style={{
                fontFamily: 'var(--font)',
                fontSize: '14px',
                padding: '12px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                outline: 'none',
                resize: 'none',
                color: 'var(--text-dark)'
              }}
            />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn--ghost"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn--primary"
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
