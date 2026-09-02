import React from 'react';
import { Skeleton } from './Skeleton';

/**
 * Reusable SkeletonMobileCard component matching the mobile invoice accordion card.
 *
 * @param {Object} props
 * @param {string} [props.className=''] - Additional card classes
 */
export function SkeletonMobileCard({ className = '' }) {
  return (
    <div className={`p-3.5 sm:p-4 bg-white space-y-2.5 ${className}`}>
      {/* Header Row: Invoice #, Status, Amount, Chevron */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Icon */}
          <Skeleton variant="rounded" className="w-7 h-7 shrink-0 !rounded-lg" />
          {/* Invoice number */}
          <Skeleton variant="text" className="w-24 h-4" />
          {/* Status pill */}
          <Skeleton variant="pill" className="w-16 h-5 shrink-0" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Amount */}
          <Skeleton variant="text" className="w-14 h-4" />
          {/* Chevron */}
          <Skeleton variant="rounded" className="w-4 h-4 !rounded" />
        </div>
      </div>

      {/* Details Row: Route & Consignee */}
      <div className="pl-9 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Skeleton variant="text" className="w-14 h-3" />
          <Skeleton variant="text" className="w-2.5 h-2.5 !rounded-full" />
          <Skeleton variant="text" className="w-14 h-3" />
        </div>
        <Skeleton variant="text" className="w-3/4 h-3" />
      </div>
    </div>
  );
}
