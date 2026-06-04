import { useState } from 'react';

export default function StarRating({ value = 0, onChange, size = 20, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const displayValue = value > 5 ? value / 2 : value;
  const display = hover || displayValue;

  return (
    <div
      className={`stars ${readOnly ? 'stars--readonly' : ''}`}
      style={{ fontSize: size }}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`Xếp hạng ${value}/5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`stars__btn ${n <= display ? 'is-on' : ''}`}
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(n)}
          aria-label={`${n} sao`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: readOnly ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: n <= display ? 'var(--primary)' : '#e5e7eb',
            outline: 'none'
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={n <= display ? 'var(--primary)' : 'none'}
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      ))}
    </div>
  );
}
