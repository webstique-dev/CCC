import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    hint,
    required = false,
    options = [],
    className = '',
    containerClassName = '',
    value,
    onChange,
    children,
    ...props
  },
  ref
) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </span>
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          className={`w-full appearance-none rounded-xl border bg-white px-3.5 py-2 pr-9 text-sm text-slate-800 transition duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-50 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
      </div>
      {error && <p className="text-xs font-medium text-rose-600 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
});
