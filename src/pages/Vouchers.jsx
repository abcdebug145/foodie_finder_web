import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from '../components/Toast.jsx';

export default function Vouchers() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('store'); // 'store', 'my', 'history'
  const [vouchers, setVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [pointsSummary, setPointsSummary] = useState({ total_points: 0, recent_transactions: [] });
  const [loading, setLoading] = useState(true);

  const fetchStoreData = async () => {
    setLoading(true);
    const token = localStorage.getItem('ff_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    try {
      // 1. Fetch available vouchers
      const vRes = await fetch('/api/v1/vouchers/', { headers });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVouchers(vData);
      }

      if (currentUser) {
        // 2. Fetch my redeemed vouchers
        const mvRes = await fetch('/api/v1/vouchers/my', { headers });
        if (mvRes.ok) {
          const mvData = await mvRes.json();
          setMyVouchers(mvData);
        }

        // 3. Fetch points summary
        const pRes = await fetch('/api/v1/vouchers/points/summary', { headers });
        if (pRes.ok) {
          const pData = await pRes.json();
          setPointsSummary(pData);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [currentUser]);

  const handleRedeem = async (voucherId) => {
    const token = localStorage.getItem('ff_token');
    if (!token) {
      toast('Vui lòng đăng nhập để đổi voucher!', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/v1/vouchers/${voucherId}/redeem`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast('Đổi voucher thành công! Hãy kiểm tra tab "Voucher của tôi".', 'success');
        fetchStoreData();
      } else {
        const errorData = await res.json();
        toast(errorData.detail || 'Đổi voucher thất bại.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Đã xảy ra lỗi kết nối.', 'error');
    }
  };

  const handleUseVoucher = async (userVoucherId) => {
    const token = localStorage.getItem('ff_token');
    try {
      const res = await fetch(`/api/v1/vouchers/my/${userVoucherId}/use`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        toast('Đã áp dụng voucher thành công!', 'success');
        fetchStoreData();
      } else {
        const errorData = await res.json();
        toast(errorData.detail || 'Không thể áp dụng voucher.', 'error');
      }
    } catch (err) {
      console.error(err);
      toast('Đã xảy ra lỗi.', 'error');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      {/* Point Card */}
      {currentUser && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'var(--bg-dark)',
          borderRadius: '16px',
          padding: '24px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          boxShadow: '0 10px 25px rgba(217, 119, 6, 0.25)',
        }}>
          <div>
            <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', opacity: 0.85 }}>Điểm tích lũy Foodie</span>
            <h2 style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: '900', fontFamily: 'var(--font-mono)' }}>
              {pointsSummary.total_points || 0} pts
            </h2>
          </div>
          <div style={{ fontSize: '13px', background: 'rgba(0,0,0,0.15)', padding: '8px 16px', borderRadius: '8px', fontWeight: '700' }}>
            Viết review nhận +10pts, Nhận like nhận +2pts
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-dark)' }}>Cửa hàng Voucher</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Đổi điểm tích lũy lấy ưu đãi giảm giá ẩm thực cực hot</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('store')}
          style={{
            background: activeTab === 'store' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'store' ? 'var(--bg-dark)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 20px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Tất cả ưu đãi
        </button>
        {currentUser && (
          <>
            <button
              onClick={() => setActiveTab('my')}
              style={{
                background: activeTab === 'my' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'my' ? 'var(--bg-dark)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Voucher của tôi ({myVouchers.filter(v => !v.is_used).length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                background: activeTab === 'history' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'history' ? 'var(--bg-dark)' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Lịch sử nhận điểm
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
      ) : activeTab === 'store' ? (
        vouchers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {vouchers.map(v => (
              <div key={v.id} className="panel" style={{ padding: '20px', borderRadius: '12px', border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(232, 153, 81, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '800', alignSelf: 'flex-start' }}>
                  CODE: {v.code}
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{v.title}</h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-muted)', flex: 1 }}>{v.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent)' }}>{v.points_required} pts</span>
                  <button
                    onClick={() => handleRedeem(v.id)}
                    className="btn btn--primary"
                    style={{ padding: '6px 16px', fontSize: '13px' }}
                  >
                    Đổi ngay
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Hiện tại chưa có ưu đãi nào khả dụng.</div>
        )
      ) : activeTab === 'my' ? (
        myVouchers.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {myVouchers.map(mv => (
              <div key={mv.id} className="panel" style={{ padding: '20px', borderRadius: '12px', border: '1.5px solid var(--border)', opacity: mv.is_used ? 0.6 : 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: mv.is_used ? '#9ca3af' : 'rgba(16, 185, 129, 0.1)', color: mv.is_used ? '#374151' : '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '800', alignSelf: 'flex-start' }}>
                  {mv.is_used ? 'ĐÃ SỬ DỤNG' : 'SẴN SÀNG'}
                </div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-dark)' }}>{mv.voucher?.title}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>{mv.voucher?.description}</p>
                {!mv.is_used && (
                  <button
                    onClick={() => handleUseVoucher(mv.id)}
                    className="btn btn--primary"
                    style={{ marginTop: '12px', alignSelf: 'stretch', padding: '8px 16px' }}
                  >
                    Sử dụng ngay
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Bạn chưa đổi voucher nào.</div>
        )
      ) : (
        /* History tab */
        pointsSummary.recent_transactions?.length > 0 ? (
          <div className="panel" style={{ borderRadius: '12px', padding: '16px 24px' }}>
            {pointsSummary.recent_transactions.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: 'var(--text-dark)' }}>
                    {t.reason === 'review_created' ? 'Viết đánh giá quán ăn' :
                     t.reason === 'like_received' ? 'Nhận được lượt thích' :
                     t.reason === 'comment_received' ? 'Nhận được bình luận' :
                     t.reason === 'voucher_redeemed' ? 'Đổi mã giảm giá' : t.reason}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(t.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: t.points > 0 ? '#10b981' : '#ef4444' }}>
                  {t.points > 0 ? `+${t.points}` : t.points} pts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có giao dịch điểm nào.</div>
        )
      )}
    </div>
  );
}
