import React, { useState, useEffect } from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export function PdfPreviewModal({ isOpen, onClose, invoice }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let activeBlobUrl = null;

    async function loadPdf() {
      if (!invoice || !isOpen) {
        setPdfUrl(null);
        return;
      }

      setLoading(true);
      try {
        const blob = await api.getPdfBlob(invoice.id);
        const url = URL.createObjectURL(blob);
        activeBlobUrl = url;
        setPdfUrl(url);
      } catch (err) {
        toast.error('Failed to load generated PDF document.');
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      if (activeBlobUrl) {
        URL.revokeObjectURL(activeBlobUrl);
      }
    };
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    const cleanNo = (invoice.data?.invoice_no || `invoice_${invoice.id}`).replace(/\//g, '-');
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
          <FileText className="w-5 h-5 text-brand-600" />
          <span>Tax Invoice PDF &mdash; {invoice.data?.invoice_no || `Invoice #${invoice.id}`}</span>
        </div>
      }
      subtitle="Cholamandal Cargo Connections official tax invoice template"
      size="3xl"
      className="h-[92vh] max-h-[92vh]"
      bodyClassName="overflow-hidden p-2 sm:p-3 flex-1 flex flex-col no-scrollbar"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">
            {invoice.source_filename ? `Converted from: ${invoice.source_filename}` : 'Generated PDF Document'}
          </span>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" icon={Printer} onClick={handlePrint} disabled={!pdfUrl}>
              Print
            </Button>
            <Button variant="primary" icon={Download} onClick={handleDownload} disabled={!pdfUrl}>
              Download PDF
            </Button>
          </div>
        </div>
      }
    >
      <div className="w-full flex-1 h-full min-h-[560px] flex flex-col items-center justify-center rounded-xl overflow-hidden border border-slate-200 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center gap-3 p-8 text-slate-500">
            <Spinner size="lg" className="text-brand-600" />
            <span className="text-sm font-medium">Loading PDF document...</span>
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
