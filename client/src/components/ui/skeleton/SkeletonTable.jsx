import React from 'react';
import { SkeletonTableRow } from './SkeletonTableRow';
import { Skeleton } from './Skeleton';

/**
 * Reusable full SkeletonTable component.
 *
 * @param {Object} props
 * @param {number} [props.rows=5] - Number of skeleton rows to display
 * @param {Array<string>} [props.headers] - Optional header titles
 * @param {string} [props.variant='invoice'] - Table row variant
 * @param {string} [props.className=''] - Container class
 */
export function SkeletonTable({
  rows = 5,
  headers,
  variant = 'invoice',
  className = '',
}) {
  const defaultHeaders = headers || [
    'Invoice #',
    'AWB & Route',
    'Shipper & Consignee',
    'Total Amount',
    'Status',
    'Actions',
  ];

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {defaultHeaders.map((header, idx) => (
              <th
                key={idx}
                className={`py-3.5 px-4 ${idx === 0 ? 'sm:px-6' : ''} ${
                  idx === 3 || idx === defaultHeaders.length - 1 ? 'text-right' : ''
                }`}
              >
                {typeof header === 'string' ? (
                  header
                ) : (
                  <Skeleton variant="text" className="w-16 h-3" />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonTableRow
              key={index}
              variant={variant}
              columns={defaultHeaders.length}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
