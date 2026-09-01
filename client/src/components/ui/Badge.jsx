import React from 'react';

export function Badge({ children, status, variant = 'default', size = 'sm', className = '' }) {
  const statusStyles = {
    Draft: 'bg-slate-100 text-slate-700 border-slate-300',
    Processing: 'bg-brand-50 text-brand-700 border-brand-300 animate-pulse',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    Failed: 'bg-rose-50 text-rose-700 border-rose-300',
  };

  const statusDots = {
    Draft: 'bg-slate-400',
    Processing: 'bg-brand-500',
    Completed: 'bg-emerald-500',
    Failed: 'bg-rose-500',
  };

  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    navy: 'bg-navy-900 text-white border-navy-800',
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  const appliedClass = status
    ? statusStyles[status] || statusStyles.Draft
    : variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${appliedClass} ${sizes[size]} ${className}`}
    >
      {status && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${statusDots[status] || 'bg-slate-400'}`}
        />
      )}
      {children || status}
    </span>
  );
}
