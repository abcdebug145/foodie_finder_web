import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ReviewPostCard from '../components/ReviewPostCard.jsx';
import { toast } from '../components/Toast.jsx';

export default function Feed() {
  const { currentUser } = useAuth();
  const [feedType, setFeedType] = useState('global'); // 'global' or 'following'
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    const token = localStorage.getItem('ff_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let url = '/api/v1/reviews/?limit=30';
      if (feedType === 'following') {
        url = '/api/v1/community/feed?limit=30';
      }
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải feed:', err);
      toast('Không thể kết nối máy chủ để tải bảng tin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [feedType]);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: 'var(--text-dark)' }}>Cộng Đồng</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--text-muted)' }}>Xem đánh giá thực tế và tương tác cùng các Foodies</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid var(--border)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setFeedType('global')}
          style={{
            background: feedType === 'global' ? 'var(--primary)' : 'transparent',
            color: feedType === 'global' ? 'var(--bg-dark)' : 'var(--text-muted)',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 20px',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Mọi người
        </button>
        {currentUser && (
          <button
            onClick={() => setFeedType('following')}
            style={{
              background: feedType === 'following' ? 'var(--primary)' : 'transparent',
              color: feedType === 'following' ? 'var(--bg-dark)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 20px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Đang theo dõi
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="panel skeleton" style={{ height: '200px', borderRadius: '12px' }} />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {reviews.map(review => (
            <ReviewPostCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="panel" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '12px' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>Empty Feed 📭</span>
          <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>
            {feedType === 'following' 
              ? 'Chưa có hoạt động nào từ những người bạn theo dõi.' 
              : 'Chưa có bài viết đánh giá nào.'}
          </h3>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            {feedType === 'following' 
              ? 'Thử chuyển sang tab "Mọi người" và follow thêm một số foodies nhé!' 
              : 'Hãy chia sẻ trải nghiệm ẩm thực đầu tiên của bạn!'}
          </p>
        </div>
      )}
    </div>
  );
}
