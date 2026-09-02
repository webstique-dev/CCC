import React from 'react';
import { Skeleton } from './Skeleton';

/**
 * Reusable SkeletonCard component matching the application's Card design.
 *
 * @param {Object} props
 * @param {boolean} [props.hasHeader=true] - Whether to render card header skeleton
 * @param {boolean} [props.hasFooter=false] - Whether to render card footer skeleton
 * @param {number} [props.lines=3] - Number of content text skeleton lines
 * @param {string} [props.className=''] - Additional container classes
 */
export function SkeletonCard({
  hasHeader = true,
  hasFooter = false,
  lines = 3,
  className = '',
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" className="w-9 h-9 shrink-0 !rounded-xl" />
            <div className="space-y-1.5 min-w-[120px]">
              <Skeleton variant="text" className="w-28 h-4" />
              <Skeleton variant="text" className="w-20 h-3" />
            </div>
          </div>
          <Skeleton variant="rounded" className="w-16 h-7 !rounded-lg" />
        </div>
      )}

      <div className="p-5 space-y-3">
        {Array.from({ length: lines }).map((_, idx) => {
          const widthClasses = ['w-full', 'w-5/6', 'w-3/4', 'w-2/3', 'w-1/2'];
          const widthClass = widthClasses[idx % widthClasses.length];
          return (
            <Skeleton
              key={idx}
              variant="text"
              className={`${widthClass} h-3.5`}
            />
          );
        })}
      </div>

      {hasFooter && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="rounded" className="w-20 h-8 !rounded-xl" />
        </div>
      )}
    </div>
  );
}
