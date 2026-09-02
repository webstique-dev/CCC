import React from 'react';

/**
 * Primitive Skeleton component with pulse and shimmer animation.
 *
 * @param {Object} props
 * @param {string} [props.variant='rounded'] - 'text' | 'circular' | 'rounded' | 'pill' | 'rectangular'
 * @param {string|number} [props.width] - Optional explicit width (e.g. '100%', 40, '200px')
 * @param {string|number} [props.height] - Optional explicit height (e.g. 16, '2rem')
 * @param {boolean} [props.shimmer=true] - Whether to show the shimmer wave effect
 * @param {boolean} [props.pulse=true] - Whether to add pulse animation
 * @param {string} [props.className=''] - Additional CSS classes
 */
export function Skeleton({
  variant = 'rounded',
  width,
  height,
  shimmer = true,
  pulse = true,
  className = '',
  style = {},
  ...props
}) {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rounded: 'rounded-xl',
    pill: 'rounded-full',
    rectangular: 'rounded-none',
  };

  const computedStyle = {
    ...style,
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`bg-slate-200/85 ${shimmer ? 'animate-shimmer' : ''} ${
        pulse ? 'animate-pulse' : ''
      } ${variantStyles[variant] || variantStyles.rounded} ${className}`}
      style={computedStyle}
      {...props}
    />
  );
}
