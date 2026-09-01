import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'brand',
  active = false,
  onClick,
}) {
  const colorMap = {
    brand: {
      bg: 'bg-brand-50',
      text: 'text-brand-600',
      border: active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'hover:border-brand-300',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: active ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: active ? 'border-amber-500 ring-2 ring-amber-500/20' : 'hover:border-amber-300',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: active ? 'border-rose-500 ring-2 ring-rose-500/20' : 'hover:border-rose-300',
    },
    slate: {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: active ? 'border-slate-500 ring-2 ring-slate-500/20' : 'hover:border-slate-300',
    },
  };

  const scheme = colorMap[color] || colorMap.brand;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 ${scheme.border} ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate block">
            {title}
          </span>
          <div className="text-xl sm:text-3xl font-bold text-slate-900 mt-0.5 sm:mt-1">{value}</div>
        </div>
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${scheme.bg} ${scheme.text}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>
      {subtitle && <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 truncate">{subtitle}</p>}
    </div>
  );
}
