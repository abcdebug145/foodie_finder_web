import React, { useRef, useState } from 'react';

export default function FileUpload({ 
  onFileSelect, 
  accept = "image/*", 
  disabled = false, 
  uploading = false, 
  preview = null,
  label = "Kéo thả ảnh vào đây hoặc click để tải lên"
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !uploading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || uploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Simulate an event object to pass back
      onFileSelect({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div 
      className={`file-upload-container ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: preview ? '10px' : '20px',
        textAlign: 'center',
        cursor: disabled || uploading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        backgroundColor: isDragging ? 'rgba(232,153,81,0.05)' : 'var(--bg-light)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileSelect} 
        accept={accept} 
        disabled={disabled || uploading} 
        style={{ display: 'none' }} 
      />
      
      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>Đang tải lên...</span>
        </div>
      ) : preview ? (
        <div style={{ position: 'relative', width: '100%' }}>
          <img 
            src={preview} 
            alt="Preview" 
            style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: '4px' }} 
          />
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', color: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            opacity: 0, transition: 'opacity 0.2s', borderRadius: '4px',
            fontSize: '13px', fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
          >
            Đổi ảnh khác
          </div>
        </div>
      ) : (
        <>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ fontSize: '13px', color: 'var(--text-dark)', fontWeight: '600' }}>
            {label}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Hỗ trợ: JPG, PNG, GIF
          </span>
        </>
      )}
      <style jsx="true">{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .file-upload-container:hover:not(.disabled) {
          border-color: var(--primary) !important;
          background-color: rgba(232,153,81,0.02) !important;
        }
      `}</style>
    </div>
  );
}
