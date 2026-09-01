import React, { useState, useEffect } from 'react';
import { Download, Printer, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export function PdfPreviewModal({ isOpen, onClose, invoice }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const toast = useToast();

  const loadPdf = async () => {
    if (!invoice || !isOpen) {
      setPdfUrl(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const blob = await api.getPdfBlob(invoice.id);
      const url = URL.createObjectURL(blob);
      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return url;
      });
    } catch (err) {
      const msg = err.message || 'Failed to load generated PDF document.';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && invoice) {
      loadPdf();
    } else {
      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      setLoadError(null);
    }

    return () => {
      setPdfUrl((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
    };
  }, [invoice?.id, isOpen]);

  if (!invoice) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    const cleanNo = (invoice.data?.invoice_no || `invoice_${invoice.id}`).replace(/[\/\\]/g, '-');
    a.download = `${cleanNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-600 shrink-0" />
          <span className="truncate">Tax Invoice PDF &mdash; {invoice.data?.invoice_no || `Invoice #${invoice.id}`}</span>
        </div>
      }
      subtitle="Cholamandal Cargo Connections official tax invoice template"
      size="3xl"
      className="h-[88vh] max-h-[88vh]"
      bodyClassName="p-1.5 sm:p-2.5 flex-1 min-h-0 flex flex-col overflow-hidden no-scrollbar"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <span className="text-[11px] sm:text-xs text-slate-500 truncate max-w-xs text-center sm:text-left">
            {invoice.source_filename ? `Converted from: ${invoice.source_filename}` : 'Generated PDF Document'}
          </span>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-initial">
              Close
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!pdfUrl} className="flex-1 sm:flex-initial">
              Print
            </Button>
            <Button variant="primary" icon={Download} onClick={handleDownload} disabled={!pdfUrl} className="flex-1 sm:flex-initial font-semibold">
              Download PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full flex-1 min-h-0 h-full flex flex-col items-center justify-center rounded-xl overflow-hidden border border-slate-200 no-scrollbar bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center gap-3 p-8 text-slate-500">
            <Spinner size="lg" className="text-brand-600" />
            <span className="text-sm font-medium">Rendering tax invoice...</span>
          </div>
        ) : loadError ? (
          <div className="p-6 sm:p-8 max-w-md text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Failed to load generated PDF</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{loadError}</p>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadPdf}
              className="mt-2"
            >
              Retry Loading PDF
            </Button>
          </div>
        ) : pdfUrl ? (
          <PdfCanvasViewer pdfBlobUrl={pdfUrl} />
        ) : (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm font-semibold">No generated PDF available.</p>
            <p className="text-xs text-slate-400 mt-1">
              Please click "Generate Tax Invoice" in the editor first.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
