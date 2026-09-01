import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Tag,
  Calculator,
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { DatePicker, getTodayFormatted, parseDateString, formatDateToDDMMYYYY } from './ui/DatePicker';
import { calculateTotals, numberToWords } from '../utils/calculations';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

const DEFAULT_CHARGES_TEMPLATE = [
  { description: 'AIR FREIGHT CHARGES', freight_rate: '', hsn_code: '996531', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'AMS', freight_rate: '', hsn_code: '996713', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'AWB CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 150.00, igst: 0, cgst: 13.50, sgst: 13.50, non_taxable: 0 },
  { description: 'PCA CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 250.00, igst: 0, cgst: 22.50, sgst: 22.50, non_taxable: 0 },
  { description: 'LOADING & UNLOADING CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 725.00, igst: 0, cgst: 65.25, sgst: 65.25, non_taxable: 0 },
  { description: 'STICKER CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 290.00, igst: 0, cgst: 26.10, sgst: 26.10, non_taxable: 0 },
  { description: 'TERMINAL CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 1189.10, igst: 0, cgst: 107.02, sgst: 107.02, non_taxable: 0 },
  { description: 'DEMURRAGE', freight_rate: '', hsn_code: '', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'SHUT OUT CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'VAN PASS', freight_rate: '', hsn_code: '', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'EXTRA LOADING', freight_rate: '', hsn_code: '', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'OT CHARGES', freight_rate: '', hsn_code: '', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'MISQ', freight_rate: '', hsn_code: '', taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: 'SERVICE CHARGES AND CUSTOMS CLERENCE', freight_rate: '', hsn_code: '', taxable_amount: 2500.00, igst: 0, cgst: 225.00, sgst: 225.00, non_taxable: 0 },
];

export function InvoiceEditorModal({
  isOpen,
  onClose,
  invoice,
  onSaveSuccess,
  onGenerateSuccess,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedCharges, setExpandedCharges] = useState(new Set([0])); // Air Freight open by default on mobile
  const toast = useToast();

  const toggleCharge = (idx) => {
    setExpandedCharges((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  useEffect(() => {
    if (invoice && invoice.data) {
      const existingMap = new Map();
      if (Array.isArray(invoice.data.charges)) {
        invoice.data.charges.forEach((c) => {
          if (c && c.description) {
            existingMap.set(c.description.trim().toUpperCase(), c);
          }
        });
      }

      const initialCharges = DEFAULT_CHARGES_TEMPLATE.map((templateRow) => {
        const key = templateRow.description.toUpperCase();
        const existing = existingMap.get(key);
        if (existing) {
          return {
            ...templateRow,
            ...existing,
            description: templateRow.description,
            freight_rate: existing.freight_rate !== undefined ? existing.freight_rate : templateRow.freight_rate,
            hsn_code: existing.hsn_code !== undefined ? existing.hsn_code : templateRow.hsn_code,
            taxable_amount: existing.taxable_amount !== undefined ? existing.taxable_amount : templateRow.taxable_amount,
            cgst: existing.cgst !== undefined ? existing.cgst : templateRow.cgst,
            sgst: existing.sgst !== undefined ? existing.sgst : templateRow.sgst,
            igst: existing.igst !== undefined ? existing.igst : templateRow.igst,
            non_taxable: existing.non_taxable !== undefined ? existing.non_taxable : templateRow.non_taxable,
          };
        }
        return { ...templateRow };
      });

      // Auto-compute Air Freight if rate and c_wt exist
      const cwtNum = parseFloat(invoice.data.c_wt) || 0;
      const rateNum = parseFloat(initialCharges[0].freight_rate) || 0;
      if (cwtNum > 0 && rateNum > 0 && (!initialCharges[0].taxable_amount || initialCharges[0].taxable_amount === 0)) {
        initialCharges[0].taxable_amount = Math.round(cwtNum * rateNum * 100) / 100;
        initialCharges[0].cgst = Math.round(initialCharges[0].taxable_amount * 0.09 * 100) / 100;
        initialCharges[0].sgst = Math.round(initialCharges[0].taxable_amount * 0.09 * 100) / 100;
      }

      const { grandTotal } = calculateTotals(initialCharges, invoice.data.total);

      // Default dates to today if empty, otherwise parse to DD/MM/YYYY
      const todayFormatted = getTodayFormatted();
      const normalizeDate = (raw) => {
        if (!raw) return todayFormatted;
        const parsed = parseDateString(raw);
        return parsed ? formatDateToDDMMYYYY(parsed) : raw;
      };

      setFormData({
        invoice_no: invoice.data.invoice_no || '',
        ref_no: invoice.data.ref_no || '',
        inv_date: normalizeDate(invoice.data.inv_date),
        awb_date: normalizeDate(invoice.data.awb_date),
        awb_no: invoice.data.awb_no || '',
        pkgs: invoice.data.pkgs || '',
        gr_wt: invoice.data.gr_wt || '',
        c_wt: invoice.data.c_wt || '',
        origin: invoice.data.origin || '',
        destination: invoice.data.destination || '',
        commodity: invoice.data.commodity || '',
        remarks: invoice.data.remarks || '',
        shipper_name: invoice.data.shipper_name || '',
        shipper_address: invoice.data.shipper_address || '',
        shipper_gst: invoice.data.shipper_gst || '',
        consignee_name: invoice.data.consignee_name || '',
        consignee_address: invoice.data.consignee_address || '',
        total: grandTotal > 0 ? grandTotal : '',
        amount_words: invoice.data.amount_words || numberToWords(grandTotal),
        charges: initialCharges,
      });

      setErrors({});
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'c_wt') {
        const cwtNum = parseFloat(value) || 0;
        const updatedCharges = [...(prev.charges || DEFAULT_CHARGES_TEMPLATE)];
        const rateNum = parseFloat(updatedCharges[0].freight_rate) || 0;

        if (cwtNum > 0 && rateNum > 0) {
          updatedCharges[0].taxable_amount = Math.round(cwtNum * rateNum * 100) / 100;
          updatedCharges[0].cgst = Math.round(updatedCharges[0].taxable_amount * 0.09 * 100) / 100;
          updatedCharges[0].sgst = Math.round(updatedCharges[0].taxable_amount * 0.09 * 100) / 100;
        }

        updated.charges = updatedCharges;
        const { grandTotal } = calculateTotals(updatedCharges);
        updated.total = grandTotal;
        updated.amount_words = numberToWords(grandTotal);
      }

      if (field === 'total') {
        const words = numberToWords(value);
        if (words) updated.amount_words = words;
      }

      return updated;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleChargeChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedCharges = [...(prev.charges || DEFAULT_CHARGES_TEMPLATE)];
      const target = { ...updatedCharges[index], [field]: value };

      if (field === 'freight_rate') {
        const cwtNum = parseFloat(prev.c_wt) || 0;
        const rateNum = parseFloat(value) || 0;
        if (cwtNum > 0 && rateNum > 0) {
          target.taxable_amount = Math.round(cwtNum * rateNum * 100) / 100;
          target.cgst = Math.round(target.taxable_amount * 0.09 * 100) / 100;
          target.sgst = Math.round(target.taxable_amount * 0.09 * 100) / 100;
          target.igst = 0;
        } else if (index === 0 && (!value || value === '')) {
          target.taxable_amount = 0;
          target.cgst = 0;
          target.sgst = 0;
        }
      }

      if (field === 'taxable_amount') {
        const taxVal = parseFloat(value) || 0;
        if (taxVal > 0 && (!target.cgst && !target.sgst && !target.igst)) {
          target.cgst = Math.round(taxVal * 0.09 * 100) / 100;
          target.sgst = Math.round(taxVal * 0.09 * 100) / 100;
        }
      }

      updatedCharges[index] = target;

      const { grandTotal } = calculateTotals(updatedCharges);
      const amountWords = numberToWords(grandTotal);

      return {
        ...prev,
        charges: updatedCharges,
        total: grandTotal,
        amount_words: amountWords,
      };
    });
  };

  const totals = calculateTotals(formData.charges || [], formData.total);

    const validateForm = () => {
    const errs = {};
    const required = [
      { key: 'inv_date', label: 'Invoice Date' },
      { key: 'awb_no', label: 'AWB No' },
      { key: 'c_wt', label: 'Chargeable Weight (C.WT)' },
      { key: 'shipper_name', label: 'Shipper Name' },
      { key: 'consignee_name', label: 'Consignee Name' },
    ];

    required.forEach(({ key, label }) => {
      if (!formData[key] || String(formData[key]).trim() === '') {
        errs[key] = `${label} is required.`;
      }
    });

    if (!formData.total || parseFloat(formData.total) <= 0) {
      errs.total = 'Total amount must be greater than zero.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const updated = await api.updateInvoice(invoice.id, {
        data: formData,
        status: 'Draft',
      });
      toast.success('Invoice draft saved successfully.');
      if (onSaveSuccess) onSaveSuccess(updated);
    } catch (err) {
      toast.error(err.message || 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields marked with *.');
      return;
    }

    setGenerating(true);
    try {
      await api.updateInvoice(invoice.id, {
        data: formData,
        status: 'Draft',
      });

      const generated = await api.generatePdf(invoice.id);
      toast.success('Tax Invoice generated successfully!');
      if (onGenerateSuccess) onGenerateSuccess(generated);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to generate Tax Invoice PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const renderField = ({
    label,
    fieldKey,
    type = 'text',
    placeholder = '',
    required = false,
    className = '',
  }) => {
    const hasError = Boolean(errors[fieldKey]);
    const val = formData[fieldKey] ?? '';

    return (
      <div className={`space-y-1 ${className}`}>
        <label className="block text-xs font-semibold text-slate-700">
          {label} {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        <input
          type={type}
          value={val}
          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl font-medium bg-white border transition focus:outline-none focus:ring-2 ${
            hasError
              ? 'border-rose-400 bg-rose-50/60 focus:ring-rose-400'
              : 'border-slate-300 text-slate-900 focus:border-brand-500 focus:ring-brand-500'
          }`}
        />
        {hasError && <p className="text-[10px] font-medium text-rose-600">{errors[fieldKey]}</p>}
      </div>
    );
  };

  const currentCharges = formData.charges || DEFAULT_CHARGES_TEMPLATE;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-brand-600 shrink-0" />
          <span className="truncate">Tax Invoice Details &mdash; {formData.invoice_no || `AWB #${formData.awb_no || invoice.id}`}</span>
        </div>
      }
      subtitle="Select or enter dates, review charges, and verify tax computations before generating PDF."
      size="3xl"
      bodyClassName="p-3 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto"
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 w-full">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button variant="secondary" icon={Save} loading={saving} onClick={handleSaveDraft} className="w-full sm:w-auto">
            Save Draft
          </Button>
          <Button
            variant="primary"
            icon={Sparkles}
            loading={generating}
            onClick={handleGenerateInvoice}
            className="w-full sm:w-auto font-semibold shadow-lg shadow-brand-600/30"
          >
            Generate Tax Invoice PDF
          </Button>
        </div>
      }
    >
      {/* 1. Shipper & Consignee Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Shipper Box */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
            Shipper Details
          </h3>
          {renderField({ label: 'Shipper Name', fieldKey: 'shipper_name', required: true })}
          {renderField({ label: 'Shipper Address', fieldKey: 'shipper_address' })}
          {renderField({ label: 'Shipper GSTIN', fieldKey: 'shipper_gst' })}
        </div>

        {/* Consignee Box */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
            Consignee Details
          </h3>
          {renderField({ label: 'Consignee Name', fieldKey: 'consignee_name', required: true })}
          {renderField({ label: 'Consignee Address', fieldKey: 'consignee_address' })}
        </div>
      </div>

      {/* 2. Bill Details */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl space-y-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
          Bill Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Auto-assigned Invoice No (Locked) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Invoice No
              </label>
              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200/80">
                Auto-Assigned
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={formData.invoice_no || 'Generating...'}
              title="Invoice number is automatically assigned based on financial year and sequence"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl font-mono font-bold bg-slate-100/90 text-slate-800 border border-slate-300 cursor-not-allowed select-all focus:outline-none"
            />
          </div>
          {renderField({ label: 'Ref No', fieldKey: 'ref_no', placeholder: 'e.g. REF-001' })}
          
          <DatePicker
            label="Invoice Date"
            value={formData.inv_date}
            onChange={(val) => handleFieldChange('inv_date', val)}
            required
            error={errors.inv_date}
          />

          {renderField({ label: 'AWB No', fieldKey: 'awb_no', required: true, placeholder: 'e.g. 123-45678901' })}
          
          <DatePicker
            label="AWB Date"
            value={formData.awb_date}
            onChange={(val) => handleFieldChange('awb_date', val)}
            error={errors.awb_date}
          />

          {renderField({ label: 'Packages (PKGS)', fieldKey: 'pkgs', placeholder: 'e.g. 10' })}

          {renderField({ label: 'Gross Weight (GR.WT)', fieldKey: 'gr_wt', placeholder: 'e.g. 250.00' })}
          {renderField({ label: 'Chargeable Weight (C.WT)', fieldKey: 'c_wt', required: true, placeholder: 'e.g. 275.00' })}
          {renderField({ label: 'Commodity', fieldKey: 'commodity', placeholder: 'e.g. ELECTRONICS' })}

          {renderField({ label: 'Origin Airport (FROM)', fieldKey: 'origin', placeholder: 'e.g. MAA' })}
          {renderField({ label: 'Destination Airport (TO)', fieldKey: 'destination', placeholder: 'e.g. DXB' })}
          {renderField({ label: 'Remarks', fieldKey: 'remarks', placeholder: 'Special instructions...' })}
        </div>
      </div>

      {/* 3. Complete Charges Details Section */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Charges Details & Tax Computations
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Enter freight rates, HSN codes, and taxable amounts. Taxes are computed automatically.
            </p>
          </div>
        </div>

        {/* ================= 3A. DESKTOP & TABLET CHARGES SPREADSHEET TABLE (hidden on mobile) ================= */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <th className="py-2.5 px-3">Charges Details</th>
                <th className="py-2.5 px-2 text-center w-24">Freight Rate</th>
                <th className="py-2.5 px-2 text-center w-20">HSN Code</th>
                <th className="py-2.5 px-2 text-right w-28">Taxable Amount</th>
                <th className="py-2.5 px-2 text-right w-24">IGST (18%)</th>
                <th className="py-2.5 px-2 text-right w-24">CGST (9%)</th>
                <th className="py-2.5 px-2 text-right w-24">SGST (9%)</th>
                <th className="py-2.5 px-2 text-right w-24">Non Taxable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentCharges.map((ch, idx) => {
                const isAirFreight = idx === 0;
                return (
                  <tr key={idx} className={isAirFreight ? 'bg-amber-50/40 hover:bg-amber-50/60 transition' : 'hover:bg-slate-50/80 transition'}>
                    <td className="p-2 font-medium text-slate-800 text-[11px]">
                      {ch.description}
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ch.freight_rate || ''}
                        onChange={(e) => handleChargeChange(idx, 'freight_rate', e.target.value)}
                        placeholder={isAirFreight ? 'e.g. 113' : ''}
                        className={`w-full px-2 py-1 text-center bg-white border rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none ${
                          isAirFreight ? 'border-brand-400 font-bold' : 'border-slate-300'
                        }`}
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="text"
                        value={ch.hsn_code || ''}
                        onChange={(e) => handleChargeChange(idx, 'hsn_code', e.target.value)}
                        placeholder={idx < 2 ? (idx === 0 ? '996531' : '996713') : ''}
                        className="w-full px-1.5 py-1 text-center bg-white border border-slate-200 rounded-lg text-[11px] font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ch.taxable_amount || ''}
                        onChange={(e) => handleChargeChange(idx, 'taxable_amount', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-2 py-1 text-right bg-white border border-slate-300 font-semibold rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ch.igst || ''}
                        onChange={(e) => handleChargeChange(idx, 'igst', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-1.5 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ch.cgst || ''}
                        onChange={(e) => handleChargeChange(idx, 'cgst', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-1.5 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ch.sgst || ''}
                        onChange={(e) => handleChargeChange(idx, 'sgst', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-1.5 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="p-1.5">
                      <input
                        type="number"
                        step="0.01"
                        value={ch.non_taxable || ''}
                        onChange={(e) => handleChargeChange(idx, 'non_taxable', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-1.5 py-1 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs">
                <td className="py-2.5 px-3 text-slate-800" colSpan={3}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-normal">ROUND OFF</span>
                    <span className="text-right">SUB TOTAL</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                  ₹{formatNumber(totals.taxableSum)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                  ₹{formatNumber(totals.igstSum)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                  ₹{formatNumber(totals.cgstSum)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                  ₹{formatNumber(totals.sgstSum)}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-slate-900">
                  ₹{formatNumber(totals.nonTaxableSum)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ================= 3B. MOBILE ACCORDION CHARGES CARDS (visible on < md screens) ================= */}
        <div className="block md:hidden space-y-2.5">
          {currentCharges.map((ch, idx) => {
            const isAirFreight = idx === 0;
            const isExpanded = expandedCharges.has(idx);
            const hasTaxable = parseFloat(ch.taxable_amount) > 0;
            const hasNonTax = parseFloat(ch.non_taxable) > 0;
            const hasRate = parseFloat(ch.freight_rate) > 0;

            return (
              <div
                key={idx}
                className={`rounded-xl border transition duration-150 overflow-hidden ${
                  isAirFreight
                    ? 'border-brand-300 bg-brand-50/30'
                    : isExpanded
                    ? 'border-slate-300 bg-white shadow-xs'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {/* Charge Card Header */}
                <div
                  onClick={() => toggleCharge(idx)}
                  className="p-3 cursor-pointer flex items-center justify-between gap-2 select-none hover:bg-slate-50/80 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {ch.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasTaxable ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        ₹{formatNumber(ch.taxable_amount)}
                      </span>
                    ) : hasNonTax ? (
                      <span className="text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-lg">
                        Non-Tax: ₹{formatNumber(ch.non_taxable)}
                      </span>
                    ) : hasRate ? (
                      <span className="text-[10px] font-mono font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-lg">
                        Rate: {ch.freight_rate}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">₹0.00</span>
                    )}

                    <div className="p-0.5 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-brand-600" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Charge Card Expanded Input Form */}
                {isExpanded && (
                  <div className="p-3 pt-1 border-t border-slate-100 bg-slate-50/60 space-y-3">
                    {isAirFreight && (
                      <p className="text-[10px] text-brand-700 bg-brand-50 p-2 rounded-lg border border-brand-200/60 font-medium">
                        💡 Tip: Entering Freight Rate auto-computes Taxable Amount based on C.WT ({formData.c_wt || '0'} kg).
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Freight Rate */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Freight Rate
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ch.freight_rate || ''}
                          onChange={(e) => handleChargeChange(idx, 'freight_rate', e.target.value)}
                          placeholder={isAirFreight ? 'e.g. 113' : '0.00'}
                          className={`w-full px-2.5 py-1.5 text-xs font-mono bg-white border rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none ${
                            isAirFreight ? 'border-brand-400 font-bold' : 'border-slate-300'
                          }`}
                        />
                      </div>

                      {/* HSN Code */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          HSN Code
                        </label>
                        <input
                          type="text"
                          value={ch.hsn_code || ''}
                          onChange={(e) => handleChargeChange(idx, 'hsn_code', e.target.value)}
                          placeholder={idx < 2 ? (idx === 0 ? '996531' : '996713') : 'Optional'}
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      {/* Taxable Amount */}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-800 uppercase mb-1">
                          Taxable Amount (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ch.taxable_amount || ''}
                          onChange={(e) => handleChargeChange(idx, 'taxable_amount', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      {/* CGST 9% */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          CGST (9%) ₹
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ch.cgst || ''}
                          onChange={(e) => handleChargeChange(idx, 'cgst', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      {/* SGST 9% */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          SGST (9%) ₹
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ch.sgst || ''}
                          onChange={(e) => handleChargeChange(idx, 'sgst', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      {/* IGST 18% */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          IGST (18%) ₹
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ch.igst || ''}
                          onChange={(e) => handleChargeChange(idx, 'igst', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>

                      {/* Non-Taxable */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Non-Taxable ₹
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={ch.non_taxable || ''}
                          onChange={(e) => handleChargeChange(idx, 'non_taxable', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Mobile Subtotals Summary Accordion Card */}
          <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300/80 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-1.5">
              <span>CHARGES SUB TOTALS</span>
              <span className="text-[10px] text-slate-500 font-normal">All 14 Items</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Taxable Sum:</span>
                <span className="font-mono font-bold text-slate-800">₹{formatNumber(totals.taxableSum)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST Sum:</span>
                <span className="font-mono font-bold text-slate-800">₹{formatNumber(totals.sgstSum)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST Sum:</span>
                <span className="font-mono font-bold text-slate-800">₹{formatNumber(totals.cgstSum)}</span>
              </div>
              <div className="flex justify-between">
                <span>IGST Sum:</span>
                <span className="font-mono font-bold text-slate-800">₹{formatNumber(totals.igstSum)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Financial Summary & Live Tax Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* Total in Words */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 sm:p-4 rounded-2xl space-y-2 flex flex-col justify-between shadow-xs">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              TOTAL IN RS (Amount in Words)
            </h4>
            <p className="text-xs font-semibold text-brand-950 mt-2 bg-white p-3 rounded-xl border border-slate-200 uppercase tracking-wide leading-relaxed">
              {formData.amount_words ? `( ${formData.amount_words} )` : '( ZERO RUPEES ONLY )'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Calculated automatically from Grand Total.
          </p>
        </div>

        {/* GST Tax Summary Breakdown */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl space-y-2 shadow-lg">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            Tax Breakdown & Total
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Taxable Amount:</span>
              <span className="font-mono text-slate-200">₹{formatNumber(totals.taxableSum)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>State GST (SGST 9%):</span>
              <span className="font-mono text-slate-200">₹{formatNumber(totals.sgstSum)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Central GST (CGST 9%):</span>
              <span className="font-mono text-slate-200">₹{formatNumber(totals.cgstSum)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Integrated GST (IGST 18%):</span>
              <span className="font-mono text-slate-200">₹{formatNumber(totals.igstSum)}</span>
            </div>
            {totals.roundOff !== 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Round Off:</span>
                <span className="font-mono text-slate-200">
                  {totals.roundOff < 0 ? `(${formatNumber(Math.abs(totals.roundOff))})` : formatNumber(totals.roundOff)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-brand-400 pt-2 border-t border-slate-800">
              <span>TOTAL (INR):</span>
              <span className="font-mono text-base text-white">₹{formatNumber(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
