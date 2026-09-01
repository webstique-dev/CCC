import React from 'react';
import {
  Search,
  FileText,
  Edit3,
  Eye,
  Trash2,
  FileDown,
  Sparkles,
  ArrowUpDown,
  FileQuestion,
  RefreshCw,
  RotateCcw,
  Archive,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { formatCurrency, formatDate } from '../utils/formatters';

export function InvoiceTable({
  invoices = [],
  loading = false,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'All',
  onStatusFilterChange,
  onEdit,
  onPreviewPdf,
  onGeneratePdf,
  onDelete,
  onRefresh,
  isTrashView = false,
  onToggleTrashView,
  trashCount = 0,
  onRestore,
  onPermanentDelete,
}) {
  const statusOptions = ['All', 'Draft', 'Processing', 'Completed', 'Failed'];

  const formatDeletedDate = (dateVal) => {
    if (!dateVal) return '-';
    try {
      const dt = new Date(dateVal);
      if (isNaN(dt.getTime())) return '-';
      const d = String(dt.getDate()).padStart(2, '0');
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const y = dt.getFullYear();
      let hours = dt.getHours();
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${d}/${m}/${y} ${hours}:${minutes} ${ampm}`;
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left Side: Search or Trash Back Button */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {isTrashView && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={onToggleTrashView}
              className="shrink-0 font-semibold"
            >
              Active Invoices
            </Button>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isTrashView
                  ? 'Search trash by invoice #, AWB #, shipper...'
                  : 'Search by invoice #, AWB #, shipper, consignee...'
              }
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills, Trash Toggle & Refresh */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 justify-between sm:justify-end">
          {!isTrashView ? (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusFilterChange(status)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    statusFilter === status
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl">
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Trash Bin</span>
            </div>
          )}

          {/* Trash Toggle Button in Normal View */}
          {!isTrashView && onToggleTrashView && (
            <button
              type="button"
              onClick={onToggleTrashView}
              title="Open Trash"
              className="relative p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition border border-transparent hover:border-amber-200"
            >
              <Trash2 className="w-4 h-4" />
              {trashCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {trashCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            title="Refresh List"
            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Invoice #</th>
              <th className="py-3.5 px-4">AWB & Route</th>
              <th className="py-3.5 px-4">Shipper & Consignee</th>
              <th className="py-3.5 px-4 text-right">Total Amount</th>
              <th className="py-3.5 px-4">{isTrashView ? 'Deleted At' : 'Status'}</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading && invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-brand-500" />
                    <span>{isTrashView ? 'Loading trash...' : 'Loading invoices...'}</span>
                  </div>
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      {isTrashView ? <Archive className="w-6 h-6" /> : <FileQuestion className="w-6 h-6" />}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {isTrashView ? 'Trash is empty' : 'No invoices found'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {isTrashView
                        ? 'No deleted invoices found in the trash.'
                        : searchTerm || statusFilter !== 'All'
                        ? 'Try adjusting your search query or filter.'
                        : 'Upload a cargo invoice PDF to get started.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const d = inv.data || {};
                const isCompleted = inv.status === 'Completed';

                return (
                  <tr
                    key={inv.id}
                    className={`transition duration-150 group ${
                      isTrashView ? 'hover:bg-amber-50/40 bg-slate-50/30' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Invoice Info */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl transition ${
                            isTrashView
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-brand-50 text-brand-600 group-hover:bg-brand-100'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block font-mono text-xs sm:text-sm">
                            {d.invoice_no || `Draft #${inv.id}`}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {d.inv_date || formatDate(inv.created_at)}
                            {d.ref_no && ` • Ref: ${d.ref_no}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* AWB & Route */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs font-medium text-slate-800">
                        {d.awb_no || '-'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {d.origin || d.destination ? (
                          <span className="font-semibold text-brand-700">
                            {d.origin || 'MAA'} &rarr; {d.destination || '-'}
                          </span>
                        ) : (
                          d.commodity || 'Cargo'
                        )}
                      </div>
                    </td>

                    {/* Shipper & Consignee */}
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {d.shipper_name || '-'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {d.consignee_name ? `To: ${d.consignee_name}` : 'Consignee pending'}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(d.total)}
                    </td>

                    {/* Status or Deleted Date */}
                    <td className="py-3.5 px-4">
                      {isTrashView ? (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center text-[11px] font-semibold text-amber-700">
                            {formatDeletedDate(inv.deletedAt || inv.deleted_at)}
                          </span>
                          <span className="text-[10px] text-slate-400">Soft-deleted</span>
                        </div>
                      ) : (
                        <Badge status={inv.status} />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      {isTrashView ? (
                        /* Trash Actions: Restore & Permanent Delete */
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRestore && onRestore(inv)}
                            title="Restore invoice to active list"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onPermanentDelete && onPermanentDelete(inv)}
                            title="Permanently erase from database"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Forever</span>
                          </button>
                        </div>
                      ) : (
                        /* Active Invoice Actions: Edit, Preview/Generate, Soft-Delete */
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit(inv)}
                            title="Edit Invoice Details"
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={() => onPreviewPdf(inv)}
                              title="Preview Generated Tax Invoice"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onGeneratePdf(inv)}
                              title="Generate Tax Invoice PDF"
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDelete(inv)}
                            title="Move to Trash"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
