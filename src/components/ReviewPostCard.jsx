import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useRestaurants } from '../context/RestaurantsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';
import ReportModal from './ReportModal.jsx';
import ReviewImageLightbox from './ReviewImageLightbox.jsx';
import LoginPromptModal from './LoginPromptModal.jsx';
import CommentItem from './CommentItem.jsx';
import UserAvatar from './UserAvatar.jsx';


// Parser for review.image_urls supporting semicolon separated, array, JSON formats
const parseImageUrls = (imageUrls) => {
  if (!imageUrls) return [];

  if (Array.isArray(imageUrls)) {
    return imageUrls.flatMap(item => typeof item === 'string' ? item.split(';') : item).filter(Boolean);
  }

  if (typeof imageUrls === 'string') {
    let cleaned = imageUrls.trim();
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      try {
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
          return parsed.flatMap(item => typeof item === 'string' ? item.split(';') : item).filter(Boolean);
        }
      } catch (e) {
        cleaned = cleaned.slice(1, -1);
      }
    }
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned.split(/;|,/).map(url => url.trim().replace(/^['"\\s]+|['"\\s]+$/g, '')).filter(Boolean);
  }

  return [];
};

export default function ReviewPostCard({ review }) {
  const { toggleLikeReview, addCommentToReview } = useReviews();
  const { getRestaurant } = useRestaurants();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const parsedImages = review.images 
    ? (Array.isArray(review.images) ? review.images.map(img => typeof img === 'string' ? img : img.url) : [])
    : parseImageUrls(review.image_urls);
  const totalCount = parsedImages.length;
  const displayImages = parsedImages.slice(0, 4);

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const commentFileRef = useRef(null);

  const handleCommentImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
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
      setCommentImage(data.url);
      toast('Tải ảnh bình luận thành công!', 'success');
    } catch (err) {
      console.error(err);
      toast('Tải ảnh thất bại.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const [restaurant, setRestaurant] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [loginPrompt, setLoginPrompt] = useState(false);

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
      setLoginPrompt(true);
      return;
    }

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
      setLoginPrompt(true);
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
      setLoginPrompt(true);
      return;
    }
    if (!commentText.trim()) return;

    const res = await addCommentToReview(review.id, {
      userName: currentUser.name || currentUser.full_name,
      userAvatar: currentUser.avatar,
      content: commentText.trim(),
      imageUrl: commentImage
    });

    if (res.ok) {
      setCommentText('');
      setCommentImage(null);
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

  // Mark as seen when visible
  const cardRef = useRef(null);
  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    if (!token) return;

    let timeoutId;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // If it stays visible for 1.5 seconds, mark as seen
          timeoutId = setTimeout(() => {
            fetch(`/api/v1/reviews/${review.id}/view`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ duration: 1 })
            }).catch(() => {});
            
            // Stop observing once marked
            if (cardRef.current) {
              observer.unobserve(cardRef.current);
            }
          }, 1500);
        } else {
          clearTimeout(timeoutId);
        }
      },
      { threshold: 0.5 } // 50% of the card must be visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [review.id]);

  return (
    <div ref={cardRef} className="panel glass-panel review-post" style={{ marginBottom: '20px', padding: '24px' }}>
      {/* 1. Header: Thông tin người viết, số sao (trái) và tên quán ăn (phải) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: (review.userId || review.user_id) ? 'pointer' : 'default' }}
          onClick={() => {
            const uId = review.userId || review.user_id;
            if (uId) navigate(`/profile/${uId}`);
          }}
        >
          <UserAvatar
            src={review.userAvatar}
            name={review.userName}
            size={42}
            style={{ borderRadius: '2px' }}
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
                maxWidth: '240px',
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

      {/* ── Review Images ── */}
      {totalCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {displayImages.map((imgUrl, idx) => {
            const showOverlay = idx === 3 && totalCount > 4;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '2px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  position: 'relative',
                  cursor: 'pointer',
                  width: '80px',
                  height: '80px',
                  flexShrink: 0
                }}
                role="button"
                tabIndex={0}
                onClick={() => setLightboxIndex(idx)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setLightboxIndex(idx);
                  }
                }}
              >
                <img
                  src={imgUrl}
                  alt={`Review attachment ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                {showOverlay && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: '800',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    +{totalCount - 3}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ReviewImageLightbox
        images={parsedImages}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
      />

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
      {showComments && (() => {
        const topComments = (review.comments || []).filter(c => !c.parentId && !c.parent_id);
        return (
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              {topComments.length > 0 ? (
                topComments.map((comment) => (
                  <CommentItem key={comment.id} comment={comment} reviewId={review.id} depth={0} />
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 8px', textAlign: 'center' }}>
                  Chưa có bình luận nào. Hãy bắt đầu cuộc hội thoại! 💬
                </p>
              )}
            </div>

            {/* Attached Image Preview */}
            {commentImage && (
              <div style={{ position: 'relative', display: 'inline-block', margin: '0 0 10px 42px' }}>
                <img 
                  src={commentImage} 
                  alt="Preview" 
                  style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setCommentImage(null)}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Hộp viết bình luận mới */}
            <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <UserAvatar
                src={currentUser?.avatar}
                name={currentUser?.name || currentUser?.full_name}
                size={32}
                style={{ border: '2px solid var(--border)' }}
              />
              <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={currentUser ? 'Viết bình luận...' : 'Đăng nhập để bình luận...'}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!currentUser}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    borderRadius: '20px',
                    border: '2px solid var(--border)',
                    fontSize: '13.5px',
                    outline: 'none',
                    background: currentUser ? 'white' : '#f9fafb',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                {currentUser && (
                  <>
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => commentFileRef.current?.click()}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '4px 8px', display: 'grid', placeItems: 'center' }}
                      title="Đính kèm hình ảnh"
                    >
                      {uploadingImage ? '⏳' : '📷'}
                    </button>
                    <input
                      type="file"
                      ref={commentFileRef}
                      accept="image/*"
                      onChange={handleCommentImageUpload}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
                <button
                  type="submit"
                  disabled={!currentUser || (!commentText.trim() && !commentImage)}
                  className="btn btn--primary"
                  style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '20px', flexShrink: 0 }}
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {showReportModal && (
        <ReportModal
          targetType="review"
          targetId={review.id}
          restaurantId={review.restaurantId}
          onClose={() => setShowReportModal(false)}
        />
      )}

      <LoginPromptModal
        open={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        message="Bạn cần đăng nhập để sử dụng tính năng này."
      />
    </div>
  );
}
