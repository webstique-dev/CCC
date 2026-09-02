import React from 'react';
import { Skeleton } from './Skeleton';

/**
 * Reusable SkeletonStatCard component matching StatCard.jsx.
 *
 * @param {Object} props
 * @param {string} [props.className=''] - Additional container classes
 */
export function SkeletonStatCard({ className = '' }) {
  return (
    <div
      className={`bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Label placeholder */}
          <Skeleton variant="text" className="w-16 sm:w-20 h-3 mb-1.5" />
          {/* Big number placeholder */}
          <Skeleton variant="text" className="w-10 sm:w-14 h-6 sm:h-8 !rounded-lg" />
        </div>
        {/* Icon box placeholder */}
        <Skeleton variant="rounded" className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 !rounded-xl" />
      </div>
      {/* Subtitle placeholder */}
      <Skeleton variant="text" className="w-20 sm:w-24 h-2.5 sm:h-3 mt-2 sm:mt-2.5" />
    </div>
  );
}
