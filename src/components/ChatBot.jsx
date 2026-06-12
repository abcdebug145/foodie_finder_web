import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatCategory } from '../utils/category.js';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// ── Aspect display config ─────────────────────────────────────────────────────
const ASPECT_LABELS = {
  food_quality: { label: 'Món ăn',    icon: '🍽️' },
  service:      { label: 'Dịch vụ',   icon: '🙋' },
  ambience:     { label: 'Không gian',icon: '✨' },
  food_prices:  { label: 'Giá cả',    icon: '💰' },
  food_style:   { label: 'Đa dạng',   icon: '🌈' },
  drinks:       { label: 'Đồ uống',   icon: '🥤' },
  location:     { label: 'Vị trí',    icon: '📍' },
  restaurant:   { label: 'Tổng thể',  icon: '🏠' },
};

// ── Markdown Parser Helpers ──────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      const ListTag = isNumberedList ? 'ol' : 'ul';
      elements.push(
        <ListTag 
          key={`list-${elements.length}`} 
          style={{ 
            margin: '6px 0', 
            paddingLeft: '20px', 
            listStyleType: isNumberedList ? 'decimal' : 'disc' 
          }}
        >
          {currentList.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '4px', lineHeight: '1.5' }}>
              {renderBold(item)}
            </li>
          ))}
        </ListTag>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Match bullet lists
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
    // Match numbered lists (1. item)
    const numberMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);

    if (bulletMatch) {
      if (currentList.length > 0 && isNumberedList) {
        flushList();
      }
      isNumberedList = false;
      currentList.push(bulletMatch[2]);
    } else if (numberMatch) {
      if (currentList.length > 0 && !isNumberedList) {
        flushList();
      }
      isNumberedList = true;
      currentList.push(numberMatch[2]);
    } else {
      flushList();
      if (trimmed === '') {
        elements.push(<div key={`space-${i}`} style={{ height: '6px' }} />);
      } else {
        elements.push(
          <div key={`p-${i}`} style={{ margin: '3px 0', lineHeight: '1.5' }}>
            {renderBold(line)}
          </div>
        );
      }
    }
  }

  flushList();
  return elements;
}

function renderBold(text) {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} style={{ fontWeight: '800' }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '10px 14px',
      background: 'var(--bg-subtle)',
      borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
      width: 'fit-content',
      border: '1px solid var(--border)',
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--primary)',
          display: 'inline-block',
          animation: `chatBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function AspectBar({ label, icon, pos, neg, total }) {
  if (!total) return null;
  const posW = Math.round((pos / total) * 100);
  const negW = Math.round((neg / total) * 100);
  const neuW = 100 - posW - negW;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10.5, fontWeight: 700, color: 'var(--text-dark)',
        marginBottom: 3,
      }}>
        <span>{icon} {label}</span>
        <span style={{ color: posW >= 60 ? '#10b981' : posW <= 30 ? '#ef4444' : '#f59e0b' }}>
          {posW}% tốt
        </span>
      </div>
      <div style={{
        display: 'flex', height: 4, borderRadius: 4, overflow: 'hidden',
        background: 'rgba(42, 29, 25, 0.08)',
      }}>
        <div style={{ width: `${posW}%`, background: '#10b981', transition: 'width 0.8s ease' }} />
        <div style={{ width: `${neuW}%`, background: 'rgba(42, 29, 25, 0.15)' }} />
        <div style={{ width: `${negW}%`, background: '#ef4444', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant }) {
  const [expanded, setExpanded] = useState(false);
  const rating = restaurant.avg_rating || 0;
  const stars = Math.round(rating / 2); // convert from /10 to /5

  const aspectEntries = Object.entries(restaurant.aspect_summary || {})
    .filter(([, asp]) => asp.total > 0)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 4);

  return (
    <div style={{
      flexShrink: 0,
      width: 220,
      background: 'var(--bg-light)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(232,153,81,0.08) 0%, rgba(42,29,25,0.04) 100%)',
        padding: '12px 14px 10px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: 4 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: 'var(--primary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {formatCategory(restaurant.category)}
          </div>
          {restaurant.is_verified === false && (
            <span style={{
              fontSize: '8px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              padding: '1px 4px',
              background: 'rgba(236,182,95,0.15)',
              color: 'var(--accent)',
              border: '1px solid rgba(236,182,95,0.3)',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
            }}>
              Chưa duyệt
            </span>
          )}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 800, color: 'var(--text-dark)', lineHeight: 1.3,
          marginBottom: 6,
        }}>
          {restaurant.name}
        </div>
        {/* Stars + rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', gap: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} width={10} height={10} viewBox="0 0 24 24"
                fill={i < stars ? 'var(--primary)' : 'transparent'}
                stroke="var(--primary)" strokeWidth="2.5"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
            {rating.toFixed(1)}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            ({restaurant.review_count} đánh giá)
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px' }}>
        {/* Address */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 10, marginTop: 1 }}>📍</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {restaurant.address}
          </span>
        </div>

        {/* Distance if available */}
        {restaurant.distance !== undefined && restaurant.distance !== null && (
          <div style={{ display: 'flex', gap: 5, marginBottom: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10 }}>🚗</span>
            <span style={{ fontSize: 11, fontWeight: '700', color: 'var(--primary)' }}>
              Cách bồ {restaurant.distance < 1 
                ? `${Math.round(restaurant.distance * 1000)}m` 
                : `${restaurant.distance.toFixed(1)} km`}
            </span>
          </div>
        )}

        {/* Aspects */}
        {aspectEntries.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {aspectEntries.map(([key, asp]) => (
              <AspectBar
                key={key}
                icon={ASPECT_LABELS[key]?.icon || '•'}
                label={ASPECT_LABELS[key]?.label || key}
                pos={asp.pos}
                neg={asp.neg}
                total={asp.total}
              />
            ))}
          </div>
        )}

        {/* Expand reviews */}
        {restaurant.top_reviews?.length > 0 && (
          <>
            <button
              onClick={() => setExpanded(p => !p)}
              style={{
                border: 'none', background: 'rgba(42, 29, 25, 0.05)',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: 10, fontWeight: 700, padding: '4px 8px',
                borderRadius: 'var(--radius-md)', marginBottom: expanded ? 8 : 0,
                letterSpacing: '0.4px', textTransform: 'uppercase',
                transition: 'background 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(42, 29, 25, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(42, 29, 25, 0.05)'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {expanded ? 'Ẩn review' : 'Xem review'}
            </button>
            {expanded && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {restaurant.top_reviews.slice(0, 2).map((rv, i) => (
                  <div key={i} style={{
                    fontSize: 10.5, color: 'var(--text-muted)',
                    fontStyle: 'italic', lineHeight: 1.5,
                    padding: '6px 8px',
                    background: 'rgba(42, 29, 25, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '2px solid var(--primary)',
                  }}>
                    "{rv.length > 120 ? rv.slice(0, 120) + '...' : rv}"
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Detail link */}
        <Link
          to={`/restaurants/${restaurant.id}`}
          style={{
            display: 'flex', marginTop: 10, justifyContent: 'center', alignItems: 'center',
            fontSize: 10.5, fontWeight: 800, color: 'var(--primary)',
            padding: '6px 0',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            transition: 'background 0.2s',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.4px',
            gap: '4px',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(232, 153, 81, 0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Xem chi tiết
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isBot ? 'flex-start' : 'flex-end',
      gap: 8,
      marginBottom: 16,
    }}>
      {/* Bubble */}
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: isBot
          ? 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)'
          : 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)',
        background: isBot
          ? 'var(--bg-subtle)'
          : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
        border: isBot ? '1px solid var(--border)' : 'none',
        fontSize: 13.5,
        lineHeight: 1.6,
        color: isBot ? 'var(--text-dark)' : '#fff',
        boxShadow: isBot ? 'none' : '0 2px 12px rgba(232,153,81,0.2)',
      }}>
        {renderMarkdown(msg.content)}
      </div>

      {/* Restaurant suggestion cards */}
      {isBot && msg.restaurants?.length > 0 && (
        <div 
          ref={el => {
            if (el && !el.__hasWheelListener) {
              el.__hasWheelListener = true;
              el.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                  e.preventDefault();
                  el.scrollLeft += e.deltaY * 1.2;
                }
              }, { passive: false });
            }
          }}
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            paddingBottom: 6,
            width: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--primary) transparent',
          }}>
          {msg.restaurants.map(r => (
            <RestaurantCard key={r.id} restaurant={r} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ChatBot component ────────────────────────────────────────────────────

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 0,
      role: 'assistant',
      content: 'Xin chào! 👋 Mình là Foodie Bot – trợ lý ẩm thực của Foodie Homie.\n\nBạn đang thèm gì? Hỏi mình đi, mình sẽ gợi ý nhà hàng ngon đúng gu cho bồ tèo nha! 🍜',
      restaurants: [],
    }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const panelRef   = useRef(null);
  const btnRef     = useRef(null);
  const messagesEl = useRef(null);
  const inputRef   = useRef(null);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEl.current) {
      messagesEl.current.scrollTop = messagesEl.current.scrollHeight;
    }
  }, [messages, loading]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Panel open/close animation
  useGSAP(() => {
    if (!panelRef.current) return;
    if (open) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
      );
    }
  }, { dependencies: [open] });

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: q, restaurants: [] };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const activeCity = localStorage.getItem('ff_user_city') || 'Hà Nội';
    const activeLat = localStorage.getItem('ff_user_lat') ? parseFloat(localStorage.getItem('ff_user_lat')) : null;
    const activeLon = localStorage.getItem('ff_user_lon') ? parseFloat(localStorage.getItem('ff_user_lon')) : null;
    const activeAddress = localStorage.getItem('ff_user_address') || null;

    try {
      const res = await fetch('/api/v1/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: q, 
          history: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          city: activeCity,
          latitude: activeLat,
          longitude: activeLon,
          address: activeAddress
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.answer,
          restaurants: data.restaurants || [],
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: 'Ủa, mình gặp lỗi kết nối rồi. Bạn thử lại sau nhé! 😅',
          restaurants: [],
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick suggestion chips
  const QUICK_SUGGESTIONS = [
    'Tôi muốn ăn đồ Hàn 🇰🇷',
    'Nhà hàng có không gian đẹp?',
    'Quán phở ngon nhất?',
    'Ăn gì ngon mà rẻ?',
  ];

  return (
    <>
      {/* ── Inject keyframe animation ──────────────────────────────── */}
      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-6px); }
        }
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232,153,81,0.5); }
          50%       { box-shadow: 0 0 0 10px rgba(232,153,81,0); }
        }
        @keyframes chatFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>

      {/* ── Chat Panel ─────────────────────────────────────────────── */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            bottom: 90,
            right: 24,
            width: 420,
            maxWidth: 'calc(100vw - 32px)',
            height: 600,
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: 'var(--bg-light)',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow-lg), 0 0 0 1px var(--border)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(232,153,81,0.1) 0%, rgba(42, 29, 25, 0.05) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            <img
              src="/Gemini_Generated_Image_9vesi09vesi09ves.png"
              alt="Foodie Bot"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid var(--border)',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.2px' }}>
                Foodie Bot
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                AI gợi ý nhà hàng • Powered by RAG
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                border: 'none', background: 'rgba(42, 29, 25, 0.05)',
                color: 'var(--text-dark)', cursor: 'pointer',
                width: 30, height: 30, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(42, 29, 25, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(42, 29, 25, 0.05)'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesEl}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--primary) transparent',
            }}
          >
            {messages.map(msg => (
              <ChatMessage key={msg.id} msg={msg} />
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16 }}>
                <TypingIndicator />
              </div>
            )}
          </div>

          {/* Quick suggestions (only show on first interaction) */}
          {messages.length === 1 && (
            <div style={{
              padding: '8px 14px',
              display: 'flex', gap: 6, flexWrap: 'wrap',
              borderTop: '1px solid var(--border)',
            }}>
              {QUICK_SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-dark)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--bg-subtle)';
                    e.currentTarget.style.color = 'var(--text-dark)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
            background: 'var(--bg-subtle)',
            flexShrink: 0,
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Hỏi mình về nhà hàng đi... (Enter để gửi)"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                background: 'var(--bg-light)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-dark)',
                padding: '9px 12px',
                fontSize: 13,
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                minHeight: 40,
                maxHeight: 100,
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
                scrollbarWidth: 'none',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                border: 'none',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
                  : 'rgba(42, 29, 25, 0.05)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'grid', placeItems: 'center',
                transition: 'all 0.2s',
                flexShrink: 0,
                boxShadow: input.trim() && !loading
                  ? '0 4px 12px rgba(232,153,81,0.2)'
                  : 'none',
              }}
              onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() && !loading ? '#fff' : 'var(--text-muted)'}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ width: 16, height: 16 }}
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Scroll To Top Widget ────────────────────────────────────── */}
      <button
        onClick={scrollToTop}
        title="Cuộn lên đầu trang"
        style={{
          position: 'fixed',
          bottom: open ? 702 : 92,
          right: 32,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--bg-light)',
          border: '2px solid var(--border)',
          color: 'var(--primary)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'var(--shadow)',
          opacity: showScrollTop ? 1 : 0,
          transform: showScrollTop ? 'scale(1)' : 'scale(0.8)',
          pointerEvents: showScrollTop ? 'auto' : 'none',
          zIndex: 9998,
          transition: 'bottom 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease, transform 0.3s ease, background-color 0.2s, color 0.2s, border-color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--primary)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--bg-light)';
          e.currentTarget.style.color = 'var(--primary)';
          e.currentTarget.style.borderColor = 'var(--border)';
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* ── Floating trigger button wrapper ─────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 10000,
        animation: open ? 'none' : 'chatFloat 3s ease-in-out infinite',
      }}>
        <button
          ref={btnRef}
          onClick={() => setOpen(p => !p)}
          title="Foodie Bot – Hỏi gợi ý nhà hàng"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: 'none',
            background: open
              ? 'var(--bg-dark)'
              : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            boxShadow: open
              ? 'var(--shadow-lg)'
              : '0 4px 20px rgba(232,153,81,0.4)',
            animation: open ? 'none' : 'chatPulse 2.5s ease-in-out infinite',
            transition: 'background 0.3s, box-shadow 0.3s, transform 0.2s ease',
            fontSize: 24,
            padding: 0,
            overflow: 'hidden',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 22, height: 22 }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <img
              src="/Gemini_Generated_Image_9vesi09vesi09ves.png"
              alt="Foodie Bot Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}
        </button>
      </div>
    </>
  );
}
