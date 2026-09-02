import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { MetricsBar } from './components/MetricsBar';
import { InvoiceTable } from './components/InvoiceTable';
import { UploadModal } from './components/UploadModal';
import { InvoiceEditorModal } from './components/InvoiceEditorModal';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LoginView } from './components/LoginView';
import { Spinner } from './components/ui/Spinner';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [trashInvoices, setTrashInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isTrashView, setIsTrashView] = useState(false);

  // Modal States
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      if (isTrashView) {
        const trashData = await api.getTrash(searchTerm, statusFilter);
        setTrashInvoices(trashData || []);
      } else {
        const [activeData, trashData] = await Promise.all([
          api.getInvoices(searchTerm, statusFilter),
          api.getTrash('', 'All'),
        ]);
        setInvoices(activeData || []);
        setTrashInvoices(trashData || []);
      }
    } catch (err) {
      toast.error('Failed to load invoices list.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isTrashView, searchTerm, statusFilter, toast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Handlers
  const handleUploadSuccess = (newInvoice) => {
    fetchInvoices();
    if (newInvoice) {
      setSelectedInvoice(newInvoice);
      setEditModalOpen(true);
    }
  };

  const handleEdit = (invoice) => {
    if (invoice.deletedAt || invoice.deleted_at) {
      toast.error('Cannot edit a deleted invoice. Restore it first.');
      return;
    }
    setSelectedInvoice(invoice);
    setEditModalOpen(true);
  };

  const handlePreviewPdf = (invoice) => {
    if (invoice.deletedAt || invoice.deleted_at) {
      toast.error('Cannot preview a deleted invoice. Restore it first.');
      return;
    }
    setSelectedInvoice(invoice);
    setPreviewModalOpen(true);
  };

  const handleGenerateDirect = async (invoice) => {
    if (invoice.deletedAt || invoice.deleted_at) {
      toast.error('Cannot generate PDF for a deleted invoice. Restore it first.');
      return;
    }
    try {
      const completed = await api.generatePdf(invoice.id);
      toast.success('Tax Invoice PDF generated successfully!');
      fetchInvoices();
      setSelectedInvoice(completed);
      setPreviewModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'Validation error. Please review the invoice first.');
      setSelectedInvoice(invoice);
      setEditModalOpen(true);
    }
  };

  // Prompt soft delete (Move to Trash)
  const handleDeletePrompt = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPermanentDelete(false);
    setDeleteModalOpen(true);
  };

  // Prompt permanent delete from Trash
  const handlePermanentDeletePrompt = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPermanentDelete(true);
    setDeleteModalOpen(true);
  };

  // Restore invoice from Trash
  const handleRestoreInvoice = async (invoice) => {
    try {
      await api.restoreInvoice(invoice.id);
      toast.success('Invoice restored to active list.');
      fetchInvoices();
    } catch (err) {
      toast.error(err.message || 'Failed to restore invoice.');
    }
  };

  const handleDeleteSuccess = () => {
    fetchInvoices();
  };

  const handleEditorSaved = (updated) => {
    fetchInvoices();
  };

  const handleEditorGenerated = (completed) => {
    fetchInvoices();
    setSelectedInvoice(completed);
    setPreviewModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" className="text-brand-500" />
          <span className="text-sm font-medium text-slate-400">Loading portal...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const currentList = isTrashView ? trashInvoices : invoices;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar onOpenUpload={() => setUploadModalOpen(true)} />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metrics & Filter Cards (only on active view) */}
        {!isTrashView && (
          <MetricsBar
            invoices={invoices}
            loading={loading}
            activeStatus={statusFilter}
            onSelectStatus={(status) => setStatusFilter(status)}
          />
        )}

        {/* Invoices List Table */}
        <InvoiceTable
          invoices={currentList}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={handleEdit}
          onPreviewPdf={handlePreviewPdf}
          onGeneratePdf={handleGenerateDirect}
          onDelete={handleDeletePrompt}
          onRefresh={fetchInvoices}
          isTrashView={isTrashView}
          onToggleTrashView={() => setIsTrashView((prev) => !prev)}
          trashCount={trashInvoices.length}
          onRestore={handleRestoreInvoice}
          onPermanentDelete={handlePermanentDeletePrompt}
        />
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Review & Edit Modal */}
      <InvoiceEditorModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        invoice={selectedInvoice}
        onSaveSuccess={handleEditorSaved}
        onGenerateSuccess={handleEditorGenerated}
      />

      {/* PDF Canvas Preview Modal */}
      <PdfPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        invoice={selectedInvoice}
      />

      {/* Delete Confirmation Modal (Soft Delete & Permanent Delete) */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        invoice={selectedInvoice}
        isPermanent={isPermanentDelete}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
