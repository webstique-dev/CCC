import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export function DeleteConfirmModal({
  isOpen,
  onClose,
  invoice,
  isPermanent = false,
  onDeleteSuccess,
}) {
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  if (!invoice) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (isPermanent) {
        await api.permanentDeleteInvoice(invoice.id);
        toast.success('Invoice permanently deleted from database.');
      } else {
        await api.deleteInvoice(invoice.id);
        toast.success('Invoice moved to Trash.');
      }
      if (onDeleteSuccess) onDeleteSuccess(invoice.id);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to delete invoice.');
    } finally {
      setDeleting(false);
    }
  };

  const invoiceLabel = invoice.data?.invoice_no || `AWB #${invoice.data?.awb_no || invoice.id}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPermanent ? 'Permanently Delete Invoice' : 'Move Invoice to Trash'}
      size="sm"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={deleting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleting}
            icon={Trash2}
            className="w-full sm:w-auto"
          >
            {isPermanent ? 'Delete Forever' : 'Move to Trash'}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-3 sm:gap-3.5">
        <div className={`p-2 sm:p-2.5 rounded-2xl flex-shrink-0 ${isPermanent ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            {isPermanent ? 'Permanent Deletion Warning' : 'Move to Trash?'}
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            {isPermanent ? (
              <>
                Are you sure you want to permanently erase invoice{' '}
                <span className="font-semibold text-slate-900 font-mono">{invoiceLabel}</span>?
                This will delete all records and stored PDF files. <span className="font-bold text-rose-600">This action cannot be undone.</span>
              </>
            ) : (
              <>
                Move invoice <span className="font-semibold text-slate-900 font-mono">{invoiceLabel}</span> to Trash?
                You can view or restore it anytime from the Trash section.
              </>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}
