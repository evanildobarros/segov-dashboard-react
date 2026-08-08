import { useState } from 'react';

export function Button({ children, variant = 'secondary', onClick, disabled, style = {}, className = '', ...props }) {
  const baseStyle = {
    padding: '8px 14px',
    border: '1px solid #dde3ea',
    background: '#fff',
    borderRadius: '7px',
    fontSize: '12.5px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: '#22313f',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    ...style
  };

  const variants = {
    primary: { background: '#0b3c5d', color: '#fff', borderColor: '#0b3c5d' },
    secondary: { background: '#fff', color: '#22313f', borderColor: '#dde3ea' },
    green: { background: '#1b9e5a', color: '#fff', borderColor: '#1b9e5a' },
    danger: { background: '#fff', color: '#c0392b', borderColor: 'rgba(192,57,43,0.3)' }
  };

  const variantStyle = variants[variant] || variants.secondary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...baseStyle, ...variantStyle }}
      {...props}
    >
      {children}
    </button>
  );
}