import React from 'react';

const COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

function getAvatarColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

function getInitials(name) {
  if (!name) return 'U';
  
  // If it's an email, extract the username part
  let cleanName = name;
  if (cleanName.includes('@')) {
    cleanName = cleanName.split('@')[0];
  }
  
  // Split by common separators: space, dot, underscore, dash
  const parts = cleanName.trim().split(/[\s._-]+/);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}

export default function UserAvatar({ src, name, size = 40, className = '', style = {} }) {
  // Check if src is a valid image URL and not a random/default placeholder
  const hasValidImage = src && 
    src.trim() !== '' && 
    !src.includes('pravatar.cc');

  if (hasValidImage) {
    return (
      <img
        src={src}
        alt={name || 'User Avatar'}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Display initials avatar
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name || initials);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: `${size * 0.4}px`,
        textTransform: 'uppercase',
        userSelect: 'none',
        flexShrink: 0,
        ...style
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
