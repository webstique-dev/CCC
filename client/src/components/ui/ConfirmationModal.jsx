import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  LogOut,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from './Button';

/**
 * Reusable Confirmation Popup / Dialog component.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the popup is visible
 * @param {Function} props.onClose - Called when dismissed (Cancel, backdrop, escape, X button)
 * @param {Function} props.onConfirm - Called when the Confirm action is triggered (can be async)
 * @param {string} [props.title='Are you sure?'] - Header title
 * @param {React.ReactNode} [props.message] - Main explanation / body text
 * @param {string} [props.confirmText='Confirm'] - Label for confirm button
 * @param {string} [props.cancelText='Cancel'] - Label for cancel button
 * @param {'danger' | 'warning' | 'primary' | 'navy' | 'success'} [props.variant='danger'] - Visual style theme
 * @param {React.ElementType} [props.icon] - Custom icon component (defaults based on variant)
 * @param {React.ElementType} [props.confirmIcon] - Icon to display inside the Confirm button
 * @param {boolean} [props.loading] - External loading state (optional)
 * @param {boolean} [props.showCloseButton=true] - Whether to show the top-right X button
 * @param {string} [props.size='sm'] - 'sm' | 'md'
 * @param {string} [props.className=''] - Custom classes for modal card
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon: CustomIcon,
  confirmIcon,
  loading: externalLoading,
  showCloseButton = true,
  size = 'sm',
  className = '',
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!onConfirm || isLoading) return;
    try {
      const result = onConfirm();
      if (result && typeof result.then === 'function') {
        setInternalLoading(true);
        await result;
      }
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  // Theme configurations for icons and colors
  const themes = {
    danger: {
      defaultIcon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      buttonVariant: 'danger',
    },
    warning: {
      defaultIcon: AlertCircle,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      buttonVariant: 'primary',
    },
    primary: {
      defaultIcon: HelpCircle,
      iconBg: 'bg-brand-50 text-brand-600 border-brand-100',
      buttonVariant: 'primary',
    },
    navy: {
      defaultIcon: LogOut,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      buttonVariant: 'navy',
    },
    success: {
      defaultIcon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      buttonVariant: 'success',
    },
  };

  const currentTheme = themes[variant] || themes.danger;
  const IconComponent = CustomIcon || currentTheme.defaultIcon;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${sizeClasses[size] || sizeClasses.sm} bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 p-5 sm:p-6 z-10 animate-fade-in ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        {/* Optional Close Button */}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition disabled:opacity-40"
            aria-label="Close popup"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-3.5 sm:gap-4">
          {/* Icon Badge */}
          {IconComponent && (
            <div
              className={`p-2.5 sm:p-3 rounded-2xl border shrink-0 ${currentTheme.iconBg}`}
            >
              <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}

          {/* Text Content */}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3
              id="confirm-dialog-title"
              className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
            >
              {title}
            </h3>
            {message && (
              <div className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {message}
              </div>
            )}
            {children && <div className="mt-2 text-xs sm:text-sm text-slate-600">{children}</div>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto font-medium"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={currentTheme.buttonVariant}
            onClick={handleConfirm}
            loading={isLoading}
            icon={confirmIcon}
            className="w-full sm:w-auto font-semibold shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
