import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useReviews } from '../context/ReviewsContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from './Toast.jsx';
import ReportModal from './ReportModal.jsx';
import LoginPromptModal from './LoginPromptModal.jsx';
import UserAvatar from './UserAvatar.jsx';

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

export default function CommentItem({ comment, reviewId, depth = 0 }) {
  const { addReplyToComment, toggleLikeComment } = useReviews();
  const { currentUser } = useAuth();

  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [localReplies, setLocalReplies] = useState(comment.replies || []);
  const repliesRef = useRef(null);

  useEffect(() => {
    setLocalReplies(comment.replies || []);
  }, [comment.replies]);

  const replies = localReplies || [];

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

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    if (!replyText.trim()) return;

    const tempReply = {
      id: `temp-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name || currentUser.full_name || currentUser.email || 'Tôi',
      userAvatar: currentUser.avatar,
      content: replyText.trim(),
      likeCount: 0,
      createdAt: new Date().toISOString(),
      replies: []
    };

    // Optimistic UI update
    setLocalReplies(prev => [...prev, tempReply]);
    setReplyText('');
    setReplying(false);
    setShowReplies(true);

    // Call API in the background
    addReplyToComment(reviewId, comment.id, tempReply.content).then(res => {
      if (res.ok) {
        toast('Đã gửi phản hồi!', 'success');
      } else {
        // Rollback optimistic reply on error
        setLocalReplies(prev => prev.filter(r => r.id !== tempReply.id));
        toast(res.error || 'Phản hồi thất bại.', 'error');
      }
    }).catch(err => {
      console.error(err);
      setLocalReplies(prev => prev.filter(r => r.id !== tempReply.id));
      toast('Lỗi kết nối máy chủ.', 'error');
    });
  };

  const handleLikeComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    const res = await toggleLikeComment(comment.id, currentUser.id);
    if (!res.ok) {
      toast(res.error, 'error');
    }
  };

  const handleReportComment = (e) => {
    e.preventDefault();
    if (!currentUser) {
      setLoginPrompt(true);
      return;
    }
    setShowReportModal(true);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <UserAvatar
        src={comment.userAvatar}
        name={comment.userName}
        size={depth === 0 ? 32 : 26}
        style={{ marginTop: '2px', border: '2px solid var(--border)' }}
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
          {(comment.imageUrl || comment.image_url) && (
            <div style={{ marginTop: '8px' }}>
              <img 
                src={comment.imageUrl || comment.image_url} 
                alt="Ảnh đính kèm" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '140px', 
                  borderRadius: 'var(--radius-md)', 
                  objectFit: 'cover',
                  border: '1px solid var(--border)'
                }} 
              />
            </div>
          )}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '5px', paddingLeft: '4px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {formatDate(comment.createdAt || comment.created_at, false)}
          </span>

          <button
            onClick={handleLikeComment}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: '700',
              color: comment.likedByUser ? 'var(--primary)' : 'var(--text-muted)',
              padding: '0', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill={comment.likedByUser ? "currentColor" : "none"} 
              stroke="currentColor" 
              strokeWidth="2.5" 
              style={{ width: '12px', height: '12px' }}
            >
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            <span>{comment.likeCount || comment.like_count || 0}</span>
          </button>

          <button
            onClick={handleReportComment}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)',
              padding: '0'
            }}
          >
            Báo cáo
          </button>

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
            <UserAvatar
              src={currentUser?.avatar}
              name={currentUser?.name || currentUser?.full_name}
              size={26}
              style={{ border: '2px solid var(--border)' }}
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

      <LoginPromptModal
        open={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        message="Bạn cần đăng nhập để tương tác."
      />
      {showReportModal && (
        <ReportModal
          targetType="comment"
          targetId={comment.id}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
