import React from 'react';
import { Skeleton } from './Skeleton';

/**
 * Reusable SkeletonTableRow component for data tables.
 *
 * @param {Object} props
 * @param {string} [props.variant='invoice'] - 'invoice' | 'custom'
 * @param {number} [props.columns=6] - Number of columns if variant='custom'
 * @param {string} [props.className=''] - Custom row classes
 */
export function SkeletonTableRow({
  variant = 'invoice',
  columns = 6,
  className = '',
}) {
  if (variant === 'invoice') {
    return (
      <tr className={`border-b border-slate-100/90 hover:bg-slate-50/50 transition-colors ${className}`}>
        {/* 1. Invoice # */}
        <td className="py-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" className="w-9 h-9 shrink-0 !rounded-xl" />
            <div className="space-y-1.5 flex-1 min-w-0 max-w-[140px]">
              <Skeleton variant="text" className="w-24 h-4" />
              <Skeleton variant="text" className="w-16 h-3" />
            </div>
          </div>
        </td>

        {/* 2. AWB & Route */}
        <td className="py-4 px-4">
          <div className="space-y-1.5 max-w-[150px]">
            <Skeleton variant="text" className="w-20 h-3.5" />
            <div className="flex items-center gap-1.5">
              <Skeleton variant="text" className="w-12 h-3" />
              <Skeleton variant="text" className="w-3 h-3 !rounded-full" />
              <Skeleton variant="text" className="w-12 h-3" />
            </div>
          </div>
        </td>

        {/* 3. Shipper & Consignee */}
        <td className="py-4 px-4">
          <div className="space-y-1.5 max-w-[180px]">
            <Skeleton variant="text" className="w-32 h-3.5" />
            <Skeleton variant="text" className="w-24 h-3" />
          </div>
        </td>

        {/* 4. Total Amount */}
        <td className="py-4 px-4 text-right">
          <div className="flex flex-col items-end space-y-1.5 ml-auto max-w-[110px]">
            <Skeleton variant="text" className="w-20 h-4" />
            <Skeleton variant="text" className="w-14 h-3" />
          </div>
        </td>

        {/* 5. Status Badge */}
        <td className="py-4 px-4">
          <div className="flex items-center justify-start">
            <Skeleton variant="pill" className="w-24 h-6" />
          </div>
        </td>

        {/* 6. Actions */}
        <td className="py-4 px-4 sm:px-6 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <Skeleton variant="rounded" className="w-8 h-8 !rounded-xl" />
            <Skeleton variant="rounded" className="w-8 h-8 !rounded-xl" />
            <Skeleton variant="rounded" className="w-8 h-8 !rounded-xl" />
          </div>
        </td>
      </tr>
    );
  }

  // Generic custom column row
  return (
    <tr className={`border-b border-slate-100 ${className}`}>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="py-4 px-4">
          <Skeleton variant="text" className="w-3/4 h-4" />
        </td>
      ))}
    </tr>
  );
}
