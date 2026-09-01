import React, { useState } from 'react';
import {
  Search,
  FileText,
  Edit3,
  Eye,
  Trash2,
  Sparkles,
  FileQuestion,
  RefreshCw,
  RotateCcw,
  Archive,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
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
  const [expandedIds, setExpandedIds] = useState(new Set());
  const statusOptions = ['All', 'Draft', 'Processing', 'Completed', 'Failed'];

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
      <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left Side: Search or Trash Back Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-full sm:max-w-md">
          {isTrashView && (
            <Button
              variant="outline"
              size="sm"
              icon={ArrowLeft}
              onClick={onToggleTrashView}
              className="shrink-0 font-semibold text-xs sm:text-sm px-2.5 sm:px-3"
            >
              <span className="hidden xs:inline">Active Invoices</span>
              <span className="xs:hidden">Back</span>
            </Button>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isTrashView
                  ? 'Search trash by invoice #, AWB...'
                  : 'Search by invoice #, AWB, shipper...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills, Trash Toggle & Refresh */}
        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end flex-wrap sm:flex-nowrap">
          {!isTrashView ? (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar max-w-full">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusFilterChange(status)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl shrink-0">
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Trash Bin</span>
            </div>
          )}

          {/* Trash Toggle Button & Refresh */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isTrashView && onToggleTrashView && (
              <button
                type="button"
                onClick={onToggleTrashView}
                title="Open Trash Bin"
                className="relative inline-flex items-center justify-center p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition border border-slate-200 hover:border-amber-200 bg-white"
              >
                <Trash2 className="w-4 h-4" />
                {trashCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white leading-none">
                    {trashCount > 99 ? '99+' : trashCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              title="Refresh List"
              className="inline-flex items-center justify-center p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-xl transition border border-slate-200 bg-white"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading & Empty States (Shared) */}
      {loading && invoices.length === 0 ? (
        <div className="py-16 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-7 h-7 animate-spin text-brand-500" />
            <span className="text-sm font-medium">{isTrashView ? 'Loading trash...' : 'Loading invoices...'}</span>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="py-14 text-center px-4">
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
        </div>
      ) : (
        <>
          {/* ================= 1. DESKTOP & TABLET TABLE VIEW (hidden on mobile) ================= */}
          <div className="hidden md:block overflow-x-auto">
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
                {invoices.map((inv) => {
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
                })}
              </tbody>
            </table>
          </div>

          {/* ================= 2. MOBILE ACCORDION CARDS VIEW (visible on < md screens) ================= */}
          <div className="block md:hidden divide-y divide-slate-100">
            {invoices.map((inv) => {
              const d = inv.data || {};
              const isCompleted = inv.status === 'Completed';
              const isExpanded = expandedIds.has(inv.id);

              return (
                <div
                  key={inv.id}
                  className={`transition duration-150 ${
                    isTrashView ? 'bg-amber-50/20' : 'bg-white'
                  }`}
                >
                  {/* Accordion Card Header (Clickable) */}
                  <div
                    onClick={() => toggleExpand(inv.id)}
                    className="p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/80 transition flex flex-col gap-2.5 select-none"
                  >
                    {/* Header Row: Invoice # & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isTrashView
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-brand-50 text-brand-600'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm truncate">
                          {d.invoice_no || `Draft #${inv.id}`}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isTrashView ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full">
                            In Trash
                          </span>
                        ) : (
                          <Badge status={inv.status} />
                        )}
                        <div className="p-1 text-slate-400 hover:text-slate-600 transition">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-brand-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: AWB / Route + Total Amount */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <div className="text-slate-600 font-medium flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-semibold text-slate-800">
                          {d.awb_no ? `AWB ${d.awb_no}` : 'No AWB'}
                        </span>
                        {(d.origin || d.destination) && (
                          <span className="text-[10px] text-brand-700 font-bold bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200/50">
                            {d.origin || 'MAA'} &rarr; {d.destination || '-'}
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-sm text-slate-900 text-right">
                        {formatCurrency(d.total)}
                      </div>
                    </div>

                    {/* Bottom Row: Date & Shipper teaser */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100/80 pt-2">
                      <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        {d.inv_date || formatDate(inv.created_at)}
                      </span>
                      <span className="truncate max-w-[170px] text-right font-medium text-slate-600 text-[10px] sm:text-[11px]">
                        {d.shipper_name ? `From: ${d.shipper_name}` : 'Shipper pending'}
                      </span>
                    </div>
                  </div>

                  {/* Accordion Expanded Content */}
                  {isExpanded && (
                    <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 bg-slate-50/70 border-t border-slate-100 space-y-2.5">
                      {/* Shipper & Consignee Box */}
                      <div className="grid grid-cols-1 gap-2 bg-white p-3 rounded-xl border border-slate-200/80 text-xs shadow-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Shipper Details
                          </span>
                          <span className="font-semibold text-slate-800 block">
                            {d.shipper_name || '-'}
                          </span>
                          {d.shipper_address && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {d.shipper_address}
                            </span>
                          )}
                          {d.shipper_gst && (
                            <span className="text-[10px] font-mono text-brand-700 block mt-0.5">
                              GST: {d.shipper_gst}
                            </span>
                          )}
                          {d.shipper_invoice_no && (
                            <span className="text-[10px] font-mono text-slate-600 block mt-0.5">
                              Shipper Inv: {d.shipper_invoice_no}
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Consignee Details
                          </span>
                          <span className="font-semibold text-slate-800 block">
                            {d.consignee_name || 'Pending'}
                          </span>
                          {d.consignee_address && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {d.consignee_address}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cargo & Shipment Specs */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Packages (PKGS)</span>
                          <span className="font-semibold font-mono text-slate-800">{d.pkgs || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Commodity</span>
                          <span className="font-semibold text-slate-800 truncate block">{d.commodity || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Gross Wt (GR.WT)</span>
                          <span className="font-semibold font-mono text-slate-800">{d.gr_wt ? `${d.gr_wt} kg` : '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Chargeable Wt (C.WT)</span>
                          <span className="font-semibold font-mono text-brand-700">{d.c_wt ? `${d.c_wt} kg` : '-'}</span>
                        </div>
                        {d.sb_no && (
                          <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-medium">SB No</span>
                            <span className="font-mono font-semibold text-brand-700 text-xs">
                              {d.sb_no} {d.sb_date ? `(${d.sb_date})` : ''}
                            </span>
                          </div>
                        )}
                        {d.ref_no && (
                          <div className="col-span-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Ref No</span>
                            <span className="font-medium text-slate-700">{d.ref_no}</span>
                          </div>
                        )}
                        {d.remarks && (
                          <div className="col-span-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 block font-medium">Remarks</span>
                            <span className="text-[11px] text-slate-600 italic">{d.remarks}</span>
                          </div>
                        )}
                        {isTrashView && (
                          <div className="col-span-2 pt-1 border-t border-slate-100 bg-amber-50/50 p-1.5 rounded">
                            <span className="text-[10px] text-amber-800 font-bold block">Deleted On:</span>
                            <span className="text-xs text-amber-900 font-medium">
                              {formatDeletedDate(inv.deletedAt || inv.deleted_at)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Buttons (Touch-Optimized) */}
                      <div className="pt-1">
                        {isTrashView ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestore && onRestore(inv);
                              }}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition border border-emerald-200 shadow-sm active:scale-98"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPermanentDelete && onPermanentDelete(inv);
                              }}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200 shadow-sm active:scale-98"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Forever</span>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(inv);
                              }}
                              className="flex items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-sm active:scale-98"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                              <span>Edit</span>
                            </button>

                            {isCompleted ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreviewPdf(inv);
                                }}
                                className="flex items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition shadow-sm active:scale-98"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onGeneratePdf(inv);
                                }}
                                className="flex items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl border border-brand-200 transition shadow-sm active:scale-98"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                                <span>Generate</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(inv);
                              }}
                              className="flex items-center justify-center gap-1 py-2.5 px-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition shadow-sm active:scale-98"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Trash</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
