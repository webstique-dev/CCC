import React from 'react';

export function Card({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  bodyClassName = 'p-5',
  headerClassName = 'px-5 py-4 border-b border-slate-100',
  footer,
  footerClassName = 'px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl',
  ...props
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-200 ${className}`}
      {...props}
    >
      {(title || subtitle || action || Icon) && (
        <div className={`flex items-center justify-between gap-4 ${headerClassName}`}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
      {footer && <div className={footerClassName}>{footer}</div>}
    </div>
  );
}
