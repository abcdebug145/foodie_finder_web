import { useState } from 'react';
import StarRating from './StarRating.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useReviews } from '../context/ReviewsContext.jsx';
import { Link } from 'react-router-dom';

export default function ReviewForm({ restaurantId }) {
  const { currentUser } = useAuth();
  const { addReview } = useReviews();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!currentUser) {
    return (
      <div className="review-form review-form--guest">
        <p>
          Vui lòng <Link to="/login">đăng nhập</Link> để chia sẻ cảm nhận của bạn.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await addReview({ restaurantId, user: currentUser, rating, content });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setRating(0);
    setContent('');
    setSuccess('Cảm ơn bạn đã chia sẻ đánh giá!');
    setTimeout(() => setSuccess(''), 2500);
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <div className="review-form__head">
        <img src={currentUser.avatar} alt={currentUser.name} />
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
