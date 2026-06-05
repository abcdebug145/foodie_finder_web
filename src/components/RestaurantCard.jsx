import { useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatCategory } from "../utils/category.js";
import gsap from "gsap";
import { useFavorites } from "../context/FavoritesContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useReviews } from "../context/ReviewsContext.jsx";

export default function RestaurantCard({ restaurant }) {
  const imgs = [
    "https://i.pinimg.com/1200x/0b/bf/82/0bbf82ad3048d5c3c9addcef66758ab5.jpg",
    "https://i.pinimg.com/736x/e6/0d/51/e60d513d635ef5e27643977bba7d571e.jpg",
    "https://i.pinimg.com/736x/50/67/68/5067686b2c89c2536216225d39f738f6.jpg",
    "https://i.pinimg.com/1200x/03/e9/d4/03e9d45b915a4e795a8c57352b7403dd.jpg",
    "https://i.pinimg.com/736x/75/b2/95/75b29515e19ae98543baa190ec94828e.jpg",
    "https://i.pinimg.com/1200x/52/2c/5d/522c5d969669408a65414ab642285d81.jpg",
    "https://i.pinimg.com/736x/ae/37/26/ae3726799c839061ec01226fd28aeb1c.jpg",
    'https://i.pinimg.com/control1/736x/ee/8c/81/ee8c81a4d967297182971e053888f8e8.jpg',
    'https://i.pinimg.com/control1/1200x/a2/0a/62/a20a629e71be40967d7215cf35e68e1f.jpg',
    'https://i.pinimg.com/control1/1200x/4a/bd/68/4abd6856dbf30081efc8d8bd629a7f1f.jpg',
    'https://i.pinimg.com/control1/736x/c3/c5/99/c3c599c6615049e52748cb34841fe0ac.jpg',
    'https://i.pinimg.com/1200x/6f/14/63/6f14637bdb2deaa34363b3c98c177075.jpg',
    'https://i.pinimg.com/control1/736x/77/2f/41/772f414e5f29bd8b205a668d28ffc92b.jpg'
  ];

  const randomImg = useMemo(() => {
    if (!restaurant.id) return imgs[0];
    let hash = 0;
    for (let i = 0; i < restaurant.id.length; i++) {
      hash = restaurant.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % imgs.length;
    return imgs[index];
  }, [restaurant.id]);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { currentUser } = useAuth();
  const { getAverageRating, getReviewsByRestaurant } = useReviews();
  const navigate = useNavigate();
  const cardRef = useRef(null);

  const faved = isFavorite(restaurant.id);
  const avg = getAverageRating(restaurant.id) || restaurant.rating;
  const reviewCount = getReviewsByRestaurant(restaurant.id).length;

  // Hiệu ứng tương tác 3D Tilt khi di chuột
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();

    // Tính toán tọa độ chuột tương đối với tâm thẻ
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Chuyển đổi thành góc quay (tối đa 8 độ)
    const rotateX = -(y / (rect.height / 2)) * 8;
    const rotateY = (x / (rect.width / 2)) * 8;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      scale: 1.02,
      boxShadow: "0 12px 28px rgba(232, 153, 81, 0.2)",
      duration: 0.3,
      ease: "power2.out",
      force3D: true,
    });
  };

  // Reset lại trạng thái ban đầu khi chuột rời đi
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    gsap.to(cardRef.current, {
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
      duration: 0.5,
      ease: "power2.out",
      force3D: true,
    });
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    toggleFavorite(restaurant.id);
  };

  console.log(restaurant);

  return (
    <div className="card-perspective-wrap">
      <Link
        ref={cardRef}
        to={`/restaurants/${restaurant.id}`}
        className="card tilt-active"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card__media">
          <img
            src={randomImg}
            alt={restaurant.name}
            loading="lazy"
          />
          <span className="card__price">{restaurant.priceRange}</span>
          <button
            className={`card__like ${faved ? "is-liked" : ""}`}
            onClick={handleLike}
            aria-label={faved ? "Bỏ yêu thích" : "Yêu thích"}
            aria-pressed={faved}
            style={{ display: 'grid', placeItems: 'center' }}
          >
            {faved ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--danger)" stroke="var(--danger)" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px' }}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            )}
          </button>
        </div>
        <div className="card__body">
          <div className="card__meta">
            <span className="badge">{formatCategory(restaurant.category)}</span>
            <span className="card__rating">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '14px', height: '14px', color: 'var(--primary-dark)', marginRight: '2px' }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {avg.toFixed(1)}
              <small>({reviewCount})</small>
            </span>
          </div>
          <h3 className="card__title">{restaurant.name}</h3>
          <p className="card__address">{restaurant.address}</p>
          <div className="card__tags">
            {restaurant.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
