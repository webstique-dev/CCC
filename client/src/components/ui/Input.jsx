import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    required = false,
    icon: Icon,
    className = '',
    containerClassName = '',
    type = 'text',
    uppercase = false,
    onChange,
    value,
    ...props
  },
  ref
) {
  const handleChange = (e) => {
    if (uppercase && e.target.value) {
      e.target.value = e.target.value.toUpperCase();
    }
    if (onChange) onChange(e);
  };

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
        {Icon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          value={value ?? ''}
          onChange={handleChange}
          className={`w-full rounded-xl border bg-white text-sm text-slate-800 placeholder-slate-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-9 pr-3.5 py-2' : 'px-3.5 py-2'
          } ${
            error
              ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20'
              : 'border-slate-300 hover:border-slate-400'
          } ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs font-medium text-rose-600 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
});
