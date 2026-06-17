import { useState } from 'react';
import { toast } from './Toast.jsx';

export default function ClaimModal({ restaurantId, restaurantName, onClose }) {
  const [proofDocument, setProofDocument] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proofDocument.trim()) {
      toast.error('Vui lòng cung cấp link hoặc nội dung minh chứng.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('ff_token');
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/owner/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          restaurant_name: restaurantName,
          proof_document: proofDocument
        })
      });

      if (res.ok) {
        toast.success('Đã gửi yêu cầu xác thực sở hữu thành công! Vui lòng chờ Admin duyệt.');
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Có lỗi xảy ra khi gửi yêu cầu.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <button className="modal-close" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <h2 style={{ marginBottom: '15px', color: 'var(--primary)', fontWeight: '800' }}>Nhận Sở Hữu Cửa Hàng</h2>
        <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.5' }}>
          Bạn đang yêu cầu nhận quyền sở hữu cho nhà hàng: <strong>{restaurantName}</strong>.
          Vui lòng cung cấp minh chứng (link bài đăng facebook, link website, số điện thoại chủ quán...) để Admin xác thực.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', fontSize: '14px' }}>Thông tin minh chứng <span style={{ color: 'red' }}>*</span></label>
            <textarea
              className="form-input"
              value={proofDocument}
              onChange={(e) => setProofDocument(e.target.value)}
              placeholder="Nhập thông tin minh chứng ở đây..."
              rows={4}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
