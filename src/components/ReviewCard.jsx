import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';

// ── Aspect label map ────────────────────────────────────────────────────────
const ASPECT_LABELS = {
  aspect_food_quality:             { label: 'Chất lượng món', icon: '🍽️' },
  aspect_food_prices:              { label: 'Giá món ăn',     icon: '💰' },
  aspect_food_style_options:       { label: 'Sự đa dạng',    icon: '🌈' },
  aspect_service_general:          { label: 'Dịch vụ',        icon: '🙋' },
  aspect_ambience_general:         { label: 'Không gian',     icon: '✨' },
  aspect_restaurant_general:       { label: 'Quán tổng thể',  icon: '🏠' },
  aspect_restaurant_prices:        { label: 'Giá quán',       icon: '🏷️' },
  aspect_restaurant_miscellaneous: { label: 'Tiện ích khác',  icon: '🔧' },
  aspect_location_general:         { label: 'Vị trí',         icon: '📍' },
  aspect_drinks_quality:           { label: 'Đồ uống',        icon: '🥤' },
  aspect_drinks_prices:            { label: 'Giá đồ uống',    icon: '💵' },
  aspect_drinks_style_options:     { label: 'Menu đồ uống',   icon: '🍹' },
};

const SENTIMENT_STYLE = {
  positive: { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.3)', dot: '#10b981' },
  negative: { bg: 'rgba(239,68,68,0.10)',  color: '#dc2626', border: 'rgba(239,68,68,0.25)', dot: '#ef4444' },
  neutral:  { bg: 'rgba(107,114,128,0.1)', color: '#6b7280', border: 'rgba(107,114,128,0.2)', dot: '#9ca3af' },
};

// ── Single Comment (supports reply-level display) ───────────────────────────
function CommentItem({ comment, reviewId, depth = 0 }) {
  const { addReplyToComment } = useReviews();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const repliesRef = useRef(null);

  const replies = comment.replies || [];

  const handleToggleReplies = () => {
    setShowReplies(prev => !prev);
  };

  useGSAP(() => {
    if (showReplies && repliesRef.current) {
      gsap.fromTo(repliesRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [showReplies]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Bạn cần đăng nhập để phản hồi.', 'error');
      navigate('/login');
      return;
    }
    if (!replyText.trim()) return;
    const res = await addReplyToComment(reviewId, comment.id, replyText.trim());
    if (res.ok) {
      setReplyText('');
      setReplying(false);
      setShowReplies(true);
      toast('Đã gửi phản hồi!', 'success');
    } else {
      toast(res.error, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <img
        src={comment.userAvatar || `https://i.pravatar.cc/150?u=${comment.userId}`}
        alt={comment.userName}
        style={{
          width: depth === 0 ? '32px' : '26px',
          height: depth === 0 ? '32px' : '26px',
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          marginTop: '2px',
          border: '2px solid var(--border)'
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          background: depth === 0 ? 'var(--bg-subtle, rgba(243,244,246,0.8))' : 'rgba(232,153,81,0.05)',
          border: `1px solid ${depth === 0 ? 'var(--border)' : 'rgba(232,153,81,0.2)'}`,
          borderRadius: '12px',
          padding: '10px 14px',
          fontSize: '13.5px',
        }}>
          <strong style={{ display: 'block', marginBottom: '3px', fontSize: '13px', color: 'var(--text-dark)' }}>
            {comment.userName || 'Người dùng ẩn'}
          </strong>
          <span style={{ color: '#374151', lineHeight: '1.55' }}>{comment.content}</span>
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '5px', paddingLeft: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('vi-VN', { day:'numeric', month:'short' }) : ''}
          </span>
          {depth === 0 && (
            <button
              onClick={() => setReplying(r => !r)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '700', color: replying ? 'var(--primary)' : 'var(--text-muted)',
                padding: '0', letterSpacing: '0.01em'
              }}
            >
              {replying ? 'Hủy' : 'Phản hồi'}
            </button>
          )}
          {depth === 0 && replies.length > 0 && (
            <button
              onClick={handleToggleReplies}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: '700',
                color: showReplies ? 'var(--accent)' : 'var(--text-muted)',
                padding: '0', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showReplies ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {showReplies ? 'Ẩn' : 'Xem'} {replies.length} phản hồi
            </button>
          )}
        </div>

        {/* Reply input */}
        {replying && depth === 0 && (
          <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <img
              src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.id}`}
              alt=""
              style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }}
            />
            <input
              autoFocus
              type="text"
              placeholder={`Phản hồi ${comment.userName}...`}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              style={{
                flex: 1, padding: '7px 12px', borderRadius: '20px',
                border: '2px solid var(--border)', fontSize: '13px',
                outline: 'none', background: 'white'
              }}
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="btn btn--primary"
              style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '20px' }}
            >
              Gửi
            </button>
          </form>
        )}

        {/* Nested replies (level 2) — collapsible */}
        {depth === 0 && replies.length > 0 && showReplies && (
          <div
            ref={repliesRef}
            style={{ marginTop: '8px', paddingLeft: '12px', borderLeft: '2px solid rgba(232,153,81,0.3)', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden' }}
          >
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} reviewId={reviewId} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Aspect Badge ─────────────────────────────────────────────────────────────
function AspectBadge({ aspectKey, value }) {
  if (!value) return null;
  const meta = ASPECT_LABELS[aspectKey];
  if (!meta) return null;
  const style = SENTIMENT_STYLE[value] || SENTIMENT_STYLE.neutral;
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

// ── Main ReviewCard ───────────────────────────────────────────────────────────
export default function ReviewCard({ review, showRestaurantLink = false }) {
  const { toggleLikeReview, addCommentToReview } = useReviews();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAllAspects, setShowAllAspects] = useState(false);

  const heartRef = useRef(null);
  const commentsWrapperRef = useRef(null);

  const hasLiked = currentUser
    ? (Array.isArray(review.likes) ? review.likes.includes(currentUser.id) : false)
    : false;
  const likesCount = review.like_count ?? review.likes?.length ?? 0;
  const commentsCount = review.comment_count ?? review.comments?.length ?? 0;

  const starsCount = Math.max(0, Math.min(5,
    review.rating > 5 ? Math.round(review.rating / 2) : Math.round(review.rating)
  ));

  // Collect non-null aspects
  const aspects = Object.keys(ASPECT_LABELS)
    .map(k => ({ key: k, value: review[k] }))
    .filter(a => a.value && SENTIMENT_STYLE[a.value]);

  const visibleAspects = showAllAspects ? aspects : aspects.slice(0, 4);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleLike = useCallback((e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Bạn cần đăng nhập để thả tim.', 'error');
      navigate('/login');
      return;
    }
    if (!hasLiked && heartRef.current) {
      gsap.timeline()
        .to(heartRef.current, { scale: 1.45, duration: 0.12, ease: 'power1.out' })
        .to(heartRef.current, { scale: 0.88, duration: 0.12 })
        .to(heartRef.current, { scale: 1,    duration: 0.1,  ease: 'power1.inOut' });
    }
    toggleLikeReview(review.id, currentUser.id);
  }, [currentUser, hasLiked, review.id, toggleLikeReview, navigate]);

  const handleToggleComments = useCallback(() => {
    setShowComments(prev => !prev);
  }, []);

  useGSAP(() => {
    if (showComments && commentsWrapperRef.current) {
      gsap.fromTo(
        commentsWrapperRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [showComments]);

  const handleSendComment = useCallback(async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast('Bạn cần đăng nhập để bình luận.', 'error');
      navigate('/login');
      return;
    }
    if (!commentText.trim()) return;
    const res = await addCommentToReview(review.id, {
      userName: currentUser.name || currentUser.full_name,
      userAvatar: currentUser.avatar,
      content: commentText.trim()
    });
    if (res.ok) {
      setCommentText('');
      toast('Đã đăng bình luận!', 'success');
    } else {
      toast(res.error, 'error');
    }
  }, [currentUser, commentText, review.id, addCommentToReview, navigate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Mới đây';
    try {
      // Handle dd/MM/yyyy format from CSV
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [d, m, y] = dateStr.split('/');
        return new Date(`${y}-${m}-${d}`).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
      }
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  // Level-1 comments (no parent)
  const topComments = (review.comments || []).filter(c => !c.parentId && !c.parent_id);

  return (
    <article style={{ marginBottom: '20px', padding: '22px 24px', background: 'var(--surface, #fff)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={review.userAvatar || `https://i.pravatar.cc/150?u=${review.id}`}
            alt={review.userName}
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
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

          {/* New Comment Input */}
          <form onSubmit={handleSendComment} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <img
              src={currentUser?.avatar || `https://i.pravatar.cc/150?u=${currentUser?.id || 'guest'}`}
              alt=""
              style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }}
            />
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
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
              <button
                type="submit"
                disabled={!currentUser || !commentText.trim()}
                className="btn btn--primary"
                style={{ padding: '8px 18px', fontSize: '13px', borderRadius: '20px', flexShrink: 0 }}
              >
                Gửi
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}
