import { useState } from 'react';
import StarRating from './StarRating.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useReviews } from '../context/ReviewsContext.jsx';
import { Link } from 'react-router-dom';
import { toast } from './Toast.jsx';
import UserAvatar from './UserAvatar.jsx';
import FileUpload from './FileUpload.jsx';

export default function ReviewForm({ restaurantId, onSubmitSuccess }) {
  const { currentUser } = useAuth();
  const { addReview } = useReviews();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reviewImage, setReviewImage] = useState('');

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setError('');
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
      setReviewImage(data.url);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải hình ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="review-form review-form--guest">
        <p>
          Vui lòng <Link to="/login">đăng nhập</Link> để chia sẻ cảm nhận của bạn.
        </p>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!content?.trim()) {
      setError('Vui lòng nhập nội dung đánh giá.');
      return;
    }
    if (!rating || rating < 1) {
      setError('Vui lòng chọn số sao.');
      return;
    }

    addReview({ 
      restaurantId, 
      user: currentUser, 
      rating, 
      content: content.trim(),
      imageUrls: reviewImage || null
    }).then((res) => {
      if (!res.ok) {
        toast(`Đăng đánh giá thất bại: ${res.error}`, 'error');
      } else {
        toast('Cảm ơn bạn đã chia sẻ đánh giá!', 'success');
      }
    }).catch((err) => {
      console.error(err);
      toast('Lỗi khi đăng đánh giá.', 'error');
    });

    setRating(0);
    setContent('');
    setReviewImage('');

    if (onSubmitSuccess) {
      onSubmitSuccess();
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form__head">
        <UserAvatar src={currentUser.avatar} name={currentUser.name} size={40} />
        <div>
          <strong>{currentUser.name}</strong>
          <p>Đánh giá trải nghiệm của bạn</p>
        </div>
      </div>
      <StarRating value={rating} onChange={setRating} size={28} />
      <textarea
        placeholder="Chia sẻ cảm nhận của bạn về nhà hàng này..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />
      
      {/* Đính kèm hình ảnh món ăn */}
      <div style={{ margin: '14px 0', fontSize: '13px' }}>
        <label style={{ display: 'block', fontWeight: '700', marginBottom: '6px', color: 'var(--text-dark)' }}>
          Đính kèm hình ảnh món ăn
        </label>
        <FileUpload 
          onFileSelect={handlePhotoUpload}
          uploading={uploading}
          preview={reviewImage}
          label="Tải ảnh món ăn của bạn (nếu có)"
        />
      </div>

      {error && <p className="form__error">{error}</p>}
      {success && <p className="form__success">{success}</p>}
      <div className="review-form__actions">
        <button type="submit" className="btn btn--primary">
          Đăng đánh giá
        </button>
      </div>
    </form>
  );
}
