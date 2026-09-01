import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF documents are supported.');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      toast.error('File size exceeds the 20MB limit.');
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning('Please select a cargo invoice PDF to upload.');
      return;
    }

    setUploading(true);
    try {
      const invoice = await api.uploadInvoice(file);
      toast.success('Invoice uploaded and fields extracted successfully!');
      setFile(null);
      onUploadSuccess(invoice);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to process the uploaded PDF.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;
    setFile(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Cargo Invoice / Air Waybill"
      subtitle="PDF digital extraction and field parsing"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            loading={uploading}
            icon={Sparkles}
          >
            {uploading ? 'Extracting Fields...' : 'Upload & Extract'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Dropzone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
              : file
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50/80 bg-slate-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0])}
          />

          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm ${
              file
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-brand-50 text-brand-600'
            }`}
          >
            {file ? <FileText className="w-7 h-7" /> : <UploadCloud className="w-7 h-7" />}
          </div>

          {file ? (
            <div>
              <p className="text-sm font-bold text-slate-800 break-all">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Ready for extraction
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="mt-3 text-xs font-semibold text-rose-600 hover:underline"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Drag and drop your PDF here, or <span className="text-brand-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports scanned or digital cargo invoices & Air Waybills (Max 20MB)
              </p>
            </div>
          )}
        </div>

        {/* Processing Indicator */}
        {uploading && (
          <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200 text-brand-900 flex items-center gap-3 animate-fade-in">
            <Spinner size="md" className="text-brand-600" />
            <div className="text-xs">
              <span className="font-semibold block">Analyzing document...</span>
              <span className="text-brand-700">
                Extracting Shipper, Consignee, AWB details, and line-item charges.
              </span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
