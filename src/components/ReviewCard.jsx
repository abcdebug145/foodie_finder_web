import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';
import { getSessionId } from '../utils/session.js';
import ReportModal from './ReportModal.jsx';
import ReviewImageLightbox from './ReviewImageLightbox.jsx';
import LoginPromptModal from './LoginPromptModal.jsx';
import CommentItem from './CommentItem.jsx';
import StarRating from './StarRating.jsx';
import UserAvatar from './UserAvatar.jsx';

// ── Aspect label map ────────────────────────────────────────────────────────
const ASPECT_LABELS = {
  aspect_food_quality: {
    label: 'Chất lượng món',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M18 8V2M22 2v20M12 2v7a3 3 0 0 0 6 0V2" />
        <path d="M12 9v13" />
      </svg>
    )
  },
  aspect_food_prices: {
    label: 'Giá món ăn',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  },
  aspect_food_style_options: {
    label: 'Sự đa dạng',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    )
  },
  aspect_service_general: {
    label: 'Dịch vụ',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    )
  },
  aspect_ambience_general: {
    label: 'Không gian',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
      </svg>
    )
  },
  aspect_restaurant_general: {
    label: 'Tổng thể quán',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    )
  },
  aspect_restaurant_prices: {
    label: 'Giá cả',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    )
  },
  aspect_restaurant_miscellaneous: {
    label: 'Tiện ích khác',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    )
  },
  aspect_location_general: {
    label: 'Vị trí',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  },
  aspect_drinks_quality: {
    label: 'Đồ uống',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    )
  },
  aspect_drinks_prices: {
    label: 'Giá đồ uống',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <path d="M15 10H10a2 2 0 0 0 0 4h5" />
      </svg>
    )
  },
  aspect_drinks_style_options: {
    label: 'Menu đồ uống',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px' }}>
        <line x1="12" y1="15" x2="12" y2="22" />
        <line x1="8" y1="22" x2="16" y2="22" />
        <path d="M12 15l9-9H3l9 9z" />
      </svg>
    )
  },
};

const SENTIMENT_STYLE = {
  positive: { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.3)', dot: '#10b981' },
  negative: { bg: 'rgba(239,68,68,0.10)',  color: '#dc2626', border: 'rgba(239,68,68,0.25)', dot: '#ef4444' },
  neutral:  { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.2)', dot: '#9ca3af' },
};

// Helper to format date strings (handles DD/MM/YYYY and ISO formats)
const formatDate = (dateStr, includeYear = true) => {
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

    const options = includeYear
      ? { day: 'numeric', month: 'short', year: 'numeric' }
      : { day: 'numeric', month: 'short' };

    return parsed.toLocaleDateString('vi-VN', options);
  } catch {
    return dateStr;
  }
};

// CommentItem is now imported from './CommentItem.jsx'

// ── Aspect Badge ─────────────────────────────────────────────────────────────
function AspectBadge({ aspectKey, value }) {
  if (!value || typeof value !== 'string' || value.toLowerCase() === 'none') return null;
  const meta = ASPECT_LABELS[aspectKey];
  if (!meta) return null;
  const style = SENTIMENT_STYLE[value.toLowerCase()] || SENTIMENT_STYLE.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: style.bg, color: style.color,
      border: `1px solid ${style.border}`,
      borderRadius: '20px', padding: '3px 9px',
      fontSize: '11.5px', fontWeight: '600',
      whiteSpace: 'nowrap'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
      {meta.icon} {meta.label}
    </span>
  );
}

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

// ── Main ReviewCard ───────────────────────────────────────────────────────────
export default function ReviewCard({ review, showRestaurantLink = false, onReviewUpdate }) {
  const { toggleLikeReview, addCommentToReview, updateReview, deleteReview } = useReviews();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editContent, setEditContent] = useState(review.text || review.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const parsedImages = review.images 
    ? (Array.isArray(review.images) ? review.images.map(img => typeof img === 'string' ? img : img.url) : [])
    : parseImageUrls(review.image_urls);
  const totalCount = parsedImages.length;
  const displayImages = parsedImages.slice(0, 4);

  const [showComments, setShowComments] = useState(false);
  const [localComments, setLocalComments] = useState(review.comments || []);

  useEffect(() => {
    setLocalComments(review.comments || []);
  }, [review.comments]);

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

  const [showAllAspects, setShowAllAspects] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [loginPrompt, setLoginPrompt] = useState(false);

  const heartRef = useRef(null);
  const commentsWrapperRef = useRef(null);
  const cardRef = useRef(null);

  // Track continuous visibility of review card for 3 seconds to log it as "viewed"
  useEffect(() => {
    if (!review.id) return;

    let timer = null;
    let viewedLogged = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !viewedLogged) {
            timer = setTimeout(async () => {
              viewedLogged = true;
              const token = localStorage.getItem('ff_token');
              const sessionId = getSessionId();
              const headers = { 'Content-Type': 'application/json' };
              if (token) {
                headers['Authorization'] = `Bearer ${token}`;
              }
              try {
                await fetch(`/api/v1/reviews/${review.id}/view`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify({ duration: 3, session_id: sessionId })
                });
              } catch (err) {
                console.error('Error logging review view:', err);
              }
            }, 3000);
          } else {
            if (timer) {
              clearTimeout(timer);
              timer = null;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      observer.disconnect();
    };
  }, [review.id]);

  const hasLiked = currentUser
    ? (Array.isArray(review.likes) ? review.likes.includes(currentUser.id) : false)
    : false;
  const likesCount = review.like_count ?? review.likes?.length ?? 0;
  const commentsCount = localComments.length;

  const starsCount = Math.max(0, Math.min(5,
    review.rating > 5 ? Math.round(review.rating / 2) : Math.round(review.rating)
  ));

  // Collect non-null aspects
  const aspects = Object.keys(ASPECT_LABELS)
    .map(k => ({ key: k, value: review[k] }))
    .filter(a => a.value &&
                 typeof a.value === 'string' &&
                 a.value.toLowerCase() !== 'none' &&
                 SENTIMENT_STYLE[a.value.toLowerCase()]
    );

  const visibleAspects = showAllAspects ? aspects : aspects.slice(0, 4);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    if (!hasLiked && heartRef.current) {
      gsap.timeline()
        .to(heartRef.current, { scale: 1.45, duration: 0.12, ease: 'power1.out' })
        .to(heartRef.current, { scale: 0.88, duration: 0.12 })
        .to(heartRef.current, { scale: 1,    duration: 0.1,  ease: 'power1.inOut' });
    }
    const res = await toggleLikeReview(review.id, currentUser.id);
    if (res?.ok && res.review && onReviewUpdate) onReviewUpdate(res.review);
  }, [currentUser, hasLiked, review.id, toggleLikeReview, onReviewUpdate]);

  const handleToggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  const handleReportClick = useCallback((e) => {
    e.preventDefault();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    setShowReportModal(true);
  }, [currentUser]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteReview = async () => {
    setShowDeleteConfirm(false);
    const res = await deleteReview(review.id);
    if (res.ok) {
      toast("Đã xóa đánh giá thành công!", "success");
    } else {
      toast(res.error || "Lỗi khi xóa đánh giá.", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast("Vui lòng nhập nội dung đánh giá.", "error");
      return;
    }
    if (editRating < 1) {
      toast("Vui lòng chọn số sao.", "error");
      return;
    }

    const res = await updateReview(review.id, { rating: editRating, content: editContent.trim() });
    if (res.ok) {
      toast("Cập nhật đánh giá thành công!", "success");
      setIsEditing(false);
      if (res.review && onReviewUpdate) {
        onReviewUpdate(res.review);
      }
    } else {
      toast(res.error || "Lỗi khi cập nhật đánh giá.", "error");
    }
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

  const handleSendComment = useCallback((e) => {
    e.preventDefault();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    if (!commentText.trim()) return;

    const tempComment = {
      id: `temp-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.full_name || currentUser.email || 'Tôi',
      userAvatar: currentUser.avatar,
      content: commentText.trim(),
      imageUrl: commentImage || null,
      likeCount: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    // Optimistic UI update
    setLocalComments(prev => [...prev, tempComment]);
    setCommentText('');
    setCommentImage(null);

    // Call API in the background
    addCommentToReview(review.id, {
      userName: currentUser.name || currentUser.full_name,
      userAvatar: currentUser.avatar,
      content: tempComment.content,
      imageUrl: tempComment.imageUrl
    }).then(res => {
      if (res.ok) {
        toast('Đã đăng bình luận!', 'success');
        if (res.review && onReviewUpdate) onReviewUpdate(res.review);
      } else {
        // Rollback optimistic comment on error
        setLocalComments(prev => prev.filter(c => c.id !== tempComment.id));
        toast(res.error || 'Bình luận thất bại.', 'error');
      }
    }).catch(err => {
      console.error(err);
      setLocalComments(prev => prev.filter(c => c.id !== tempComment.id));
      toast('Lỗi kết nối máy chủ.', 'error');
    });
  }, [currentUser, commentText, commentImage, review.id, addCommentToReview, onReviewUpdate]);

  // Level-1 comments (no parent)
  const topComments = (localComments || []).filter(c => !c.parentId && !c.parent_id);

  if (isEditing) {
    return (
      <article ref={cardRef} style={{ marginBottom: '20px', padding: '22px 24px', background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
        <h5 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
          Chỉnh sửa đánh giá của bạn
        </h5>
        
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Đánh giá sao:</label>
          <StarRating value={editRating} onChange={setEditRating} size={24} />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>Nội dung đánh giá:</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border)',
              fontSize: '14px',
              fontFamily: 'var(--font)',
              outline: 'none',
              background: 'white',
              transition: 'border-color 0.2s',
              color: 'var(--text-dark)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setIsEditing(false);
              setEditRating(review.rating);
              setEditContent(review.text || review.content);
            }}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Hủy
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSaveEdit}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            Lưu thay đổi
          </button>
        </div>
      </article>
    );
  }

  return (
    <article ref={cardRef} style={{ marginBottom: '20px', padding: '22px 24px', background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: (review.userId || review.user_id) ? 'pointer' : 'default' }}
          onClick={() => {
            const uId = review.userId || review.user_id;
            if (uId) navigate(`/profile/${uId}`);
          }}
        >
          <UserAvatar
            src={review.userAvatar}
            name={review.userName || review.reviewer_name || 'Khách ẩn danh'}
            size={40}
            style={{ border: '2px solid var(--border)' }}
          />
          <div>
            <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '700', color: 'var(--text-dark)' }}>
              {review.userName || review.reviewer_name || 'Khách ẩn danh'}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatDate(review.review_date || review.createdAt)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <svg key={idx} width="13" height="13" viewBox="0 0 24 24"
                fill={idx < starsCount ? 'var(--primary)' : 'none'}
                stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dark)', marginLeft: '4px' }}>
              {review.rating ? Number(review.rating).toFixed(1) : ''}
            </span>
          </div>

          {/* Actions Dropdown Button (three-dots) */}
          {currentUser && (String(review.userId) === String(currentUser.id) || String(review.user_id) === String(currentUser.id)) && (
            <div 
              onMouseEnter={() => setIsMenuHovered(true)}
              onMouseLeave={() => setIsMenuHovered(false)}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
                aria-label="Tùy chọn"
              >
                •••
              </button>
              
              {isMenuHovered && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  backgroundColor: 'var(--bg-light)',
                  border: '1.5px solid var(--border)',
                  borderRadius: '4px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 50,
                  minWidth: '100px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setIsMenuHovered(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: 'var(--text-dark)',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(232, 153, 81, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleDelete();
                      setIsMenuHovered(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: 'var(--danger)',
                      transition: 'background-color 0.2s',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Review Title ── */}
      {review.title && (
        <h5 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>
          {review.title}
        </h5>
      )}

      {/* ── Review Content ── */}
      <p style={{ margin: '0 0 14px', fontSize: '14.5px', lineHeight: '1.65', color: '#374151' }}>
        {review.text || review.content}
      </p>

      {/* ── Review Images ── */}
      {totalCount > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {displayImages.map((imgUrl, idx) => {
            const showOverlay = idx === 3 && totalCount > 4;
            return (
              <div
                key={idx}
                style={{
                  borderRadius: '4px',
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

      {/* ── Aspect Badges ── */}
      {aspects.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {visibleAspects.map(({ key, value }) => (
              <AspectBadge key={key} aspectKey={key} value={value} />
            ))}
            {aspects.length > 4 && (
              <button
                onClick={() => setShowAllAspects(p => !p)}
                style={{
                  background: 'none', border: '1px dashed var(--border)',
                  borderRadius: '20px', padding: '3px 10px',
                  fontSize: '11.5px', color: 'var(--text-muted)',
                  cursor: 'pointer', fontWeight: '600'
                }}
              >
                {showAllAspects ? '− Thu gọn' : `+${aspects.length - 4} khác`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Footer Actions ── */}
      <div style={{
        display: 'flex', gap: '4px',
        borderTop: '1px solid var(--border)',
        paddingTop: '12px', marginTop: '4px'
      }}>
        {/* Like */}
        <button
          onClick={handleLike}
          style={{
            background: hasLiked ? 'rgba(239,68,68,0.08)' : 'none',
            border: hasLiked ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
            borderRadius: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: hasLiked ? '#dc2626' : 'var(--text-muted)',
            fontWeight: hasLiked ? '700' : '500',
            fontSize: '13px', padding: '5px 12px',
            transition: 'all 0.2s'
          }}
        >
          <span ref={heartRef} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24"
              fill={hasLiked ? '#dc2626' : 'none'}
              stroke={hasLiked ? '#dc2626' : 'currentColor'}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </span>
          {likesCount > 0 && <span>{likesCount}</span>}
          <span>Thích</span>
        </button>

        {/* Comment toggle */}
        <button
          onClick={handleToggleComments}
          style={{
            background: showComments ? 'rgba(232,153,81,0.08)' : 'none',
            border: showComments ? '1px solid rgba(232,153,81,0.25)' : '1px solid transparent',
            borderRadius: '20px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
            color: showComments ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: showComments ? '700' : '500',
            fontSize: '13px', padding: '5px 12px',
            transition: 'all 0.2s'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {commentsCount > 0 && <span>{commentsCount}</span>}
          <span>Bình luận</span>
        </button>

        {/* Nút báo cáo review */}
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
            fontSize: '13px',
            padding: '5px 12px',
            transition: 'color 0.2s',
            marginLeft: 'auto'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
            <line x1="4" y1="22" x2="4" y2="11"></line>
          </svg>
          <span>Báo cáo</span>
        </button>
      </div>

      {/* ── Comments Panel (Collapsible) ── */}
      {showComments && (
        <div
          ref={commentsWrapperRef}
          style={{ borderTop: '1px dashed var(--border)', marginTop: '14px', paddingTop: '16px', overflow: 'hidden' }}
        >
          {/* Comment List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
            {topComments.length > 0 ? (
              topComments.map(comment => (
                <CommentItem key={comment.id} comment={comment} reviewId={review.id} depth={0} />
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 8px', textAlign: 'center' }}>
                Chưa có bình luận nào. Hãy là người đầu tiên! 💬
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

          {/* New Comment Input */}
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
                onChange={e => setCommentText(e.target.value)}
                disabled={!currentUser}
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: '20px',
                  border: '2px solid var(--border)', fontSize: '13.5px',
                  outline: 'none', background: currentUser ? 'white' : '#f9fafb',
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
      )}

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

      {showDeleteConfirm && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(42, 29, 25, 0.45)',
              backdropFilter: 'blur(4px)',
              zIndex: -1
            }}
          />
          <div
            className="panel glass-panel"
            style={{
              width: '100%',
              maxWidth: '380px',
              padding: '24px',
              borderRadius: '4px',
              boxShadow: '0 12px 32px rgba(42, 29, 25, 0.18)',
              backgroundColor: 'var(--bg-light)',
              border: '2px solid var(--border)',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(231, 111, 81, 0.1)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
              color: 'var(--danger)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '900', color: 'var(--text-dark)', textTransform: 'uppercase' }}>
              Xác nhận xóa
            </h3>
            <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa bài đánh giá này không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn--primary"
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  fontSize: '12px',
                  backgroundColor: 'var(--danger)',
                  borderColor: 'var(--danger)',
                  boxShadow: 'none'
                }}
                onClick={confirmDeleteReview}
              >
                Xóa bài
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </article>
  );
}
