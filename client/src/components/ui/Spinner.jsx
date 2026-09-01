import React from 'react';

export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-7 h-7 border-3',
    xl: 'w-10 h-10 border-4',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${sizes[size] || sizes.md} ${className}`}
      role="status"
      aria-label="loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
