import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';
import ReportModal from './ReportModal.jsx';

export default function ReviewPostCard({ review }) {
  const { toggleLikeReview, addCommentToReview } = useReviews();
  const { getRestaurant } = useRestaurants();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [restaurant, setRestaurant] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const heartRef = useRef(null);
  const commentsWrapperRef = useRef(null);

  // Tải thông tin quán ăn bất đồng bộ và tận dụng cache
  useEffect(() => {
    let active = true;
    if (review.restaurantId) {
      getRestaurant(review.restaurantId).then((res) => {
        if (active) setRestaurant(res);
      });
    }
    return () => { active = false; };
  }, [review.restaurantId, getRestaurant]);

  const hasLiked = currentUser ? review.likes?.includes(currentUser.id) : false;
  const likesCount = review.likes?.length || 0;
  const commentsCount = review.comments?.length || 0;
  const starsCount = Math.max(0, Math.min(5, review.rating > 5 ? Math.round(review.rating / 2) : Math.round(review.rating)));

  // Hiệu ứng nảy tim khi click thích dùng GSAP
  const handleLike = (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Bạn cần đăng nhập để thả tim.', 'error');
      navigate('/login');
      return;
    }

    // Chạy timeline nảy tim nhanh
    if (!hasLiked && heartRef.current) {
      gsap.timeline()
        .to(heartRef.current, { scale: 1.4, duration: 0.15, ease: 'power1.out' })
        .to(heartRef.current, { scale: 0.9, duration: 0.15 })
        .to(heartRef.current, { scale: 1, duration: 0.1, ease: 'power1.inOut' });
    }

    toggleLikeReview(review.id, currentUser.id);
  };

  // Mở/đóng mượt mà khung bình luận
  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleReportClick = (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Bạn cần đăng nhập để báo cáo vi phạm.', 'error');
      navigate('/login');
      return;
    }
    setShowReportModal(true);
  };

  useGSAP(() => {
    if (showComments && commentsWrapperRef.current) {
      gsap.fromTo(
        commentsWrapperRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [showComments]);

  // Gửi bình luận mới
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Bạn cần đăng nhập để bình luận.', 'error');
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;

    const res = await addCommentToReview(review.id, {
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: commentText
    });

    if (res.ok) {
      setCommentText('');
      toast('Đăng bình luận thành công!', 'success');
    } else {
      toast(res.error, 'error');
    }
  };



  // Định dạng ngày hiển thị dễ thương
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Mới đây';
    try {
      let parsed;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split('/');
        parsed = new Date(`${y}-${m}-${d}`);
      } else {
        parsed = new Date(dateStr);
      }
      if (isNaN(parsed.getTime())) return dateStr;
      return parsed.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="panel glass-panel review-post" style={{ marginBottom: '20px', padding: '24px' }}>
      {/* 1. Header: Thông tin người viết, số sao (trái) và tên quán ăn (phải) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={review.userAvatar || 'https://i.pravatar.cc/150'}
            alt={review.userName}
            style={{ width: '42px', height: '42px', borderRadius: '2px', objectFit: 'cover' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700' }}>{review.userName}</h4>
              
              {/* Số sao đánh giá nằm ngay cạnh tên người dùng ở bên trái */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <svg
                    key={idx}
                    width="13" height="13"
                    viewBox="0 0 24 24"
                    fill={idx < starsCount ? "var(--primary)" : "none"}
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '1px' }}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
            </div>
            <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {formatDate(review.createdAt)}
            </span>
          </div>
        </div>
        
        {/* Tên quán ăn nằm bên phải */}
        <div>
          {restaurant ? (
            <Link
              to={`/restaurants/${restaurant.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '800',
                fontSize: '12px',
                color: 'var(--text-dark)',
                background: 'rgba(232, 153, 81, 0.1)',
                border: '1px solid rgba(232, 153, 81, 0.3)',
                padding: '4px 10px',
                borderRadius: '2px',
                textDecoration: 'none',
                maxWidth: '240px', // Dài thêm xíu nữa
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                overflow: 'hidden'
              }}
              title={restaurant.name}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{restaurant.name}</span>
            </Link>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Địa điểm ẩn</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Nội dung bình luận chính */}
      <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: '1.6', color: '#374151' }}>
        {review.content}
      </p>

      {/* 4. Footer: Nút tương tác */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border)',
          paddingTop: '14px',
          fontSize: '14px'
        }}
      >
        {/* Nút Thích (Like) */}
        <button
          onClick={handleLike}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: hasLiked ? 'var(--danger)' : 'var(--text-muted)',
            fontWeight: hasLiked ? '700' : '500',
            fontSize: '14px',
            padding: '4px 0'
          }}
        >
          <span ref={heartRef} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={hasLiked ? "var(--danger)" : "none"}
              stroke={hasLiked ? "var(--danger)" : "currentColor"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          <span>{likesCount} Thích</span>
        </button>

        {/* Nút Bình luận */}
        <button
          onClick={handleToggleComments}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: showComments ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: showComments ? '700' : '500',
            fontSize: '14px',
            padding: '4px 0'
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span>{commentsCount} Bình luận</span>
        </button>

        {/* Nút Báo cáo */}
        <button
          onClick={handleReportClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontWeight: '500',
            fontSize: '14px',
            padding: '4px 0'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
              <line x1="4" y1="22" x2="4" y2="11"></line>
            </svg>
          </span>
          <span>Báo cáo</span>
        </button>
      </div>

      {/* 5. Khung bình luận (Collapsible Panel) */}
      {showComments && (
        <div
          ref={commentsWrapperRef}
          style={{
            borderTop: '1px dashed var(--border)',
            marginTop: '14px',
            paddingTop: '14px',
            overflow: 'hidden'
          }}
        >
          {/* Danh sách các bình luận hiện tại */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            {review.comments && review.comments.length > 0 ? (
              review.comments.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <img
                    src={comment.userAvatar || 'https://i.pravatar.cc/150'}
                    alt={comment.userName}
                    style={{ width: '28px', height: '28px', borderRadius: '2px', objectFit: 'cover', marginTop: '2px' }}
                  />
                  <div
                    style={{
                      background: 'var(--bg-subtle, #f3f4f6)',
                      border: '1px solid var(--border)',
                      borderRadius: '2px',
                      padding: '8px 14px',
                      flex: 1,
                      fontSize: '13.5px'
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '2px', fontSize: '13px' }}>
                      {comment.userName}
                    </strong>
                    <span style={{ color: '#374151' }}>{comment.content}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '6px 0', textAlign: 'center' }}>
                Chưa có bình luận nào. Hãy bắt đầu cuộc hội thoại!
              </p>
            )}
          </div>

          {/* Hộp viết bình luận mới */}
          <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder={currentUser ? 'Viết bình luận của bạn...' : 'Đăng nhập để viết bình luận...'}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={!currentUser}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '2px',
                border: '2px solid var(--border)',
                fontSize: '13.5px',
                outline: 'none',
                background: currentUser ? 'white' : '#f9fafb'
              }}
            />
            <button
              type="submit"
              disabled={!currentUser || !commentText.trim()}
              className="btn btn--primary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '2px' }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
      {showReportModal && (
        <ReportModal
          targetType="review"
          targetId={review.id}
          restaurantId={review.restaurantId}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
