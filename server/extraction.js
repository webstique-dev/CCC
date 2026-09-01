/**
 * Extraction pipeline for uploaded cargo invoices / air waybills.
 * Uses pdf-parse to extract digital text, then runs label-aware regex rules
 * to extract all fields required by the Cholamandal Cargo Connections invoice template.
 */
const pdfParse = require("pdf-parse");

const STANDARD_CHARGES_TEMPLATE = [
  { description: "AIR FREIGHT CHARGES", freight_rate: "", hsn_code: "996531", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "AMS", freight_rate: "", hsn_code: "996713", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "AWB CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 150.00, igst: 0, cgst: 13.50, sgst: 13.50, non_taxable: 0 },
  { description: "PCA CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 250.00, igst: 0, cgst: 22.50, sgst: 22.50, non_taxable: 0 },
  { description: "LOADING & UNLOADING CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 725.00, igst: 0, cgst: 65.25, sgst: 65.25, non_taxable: 0 },
  { description: "STICKER CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 290.00, igst: 0, cgst: 26.10, sgst: 26.10, non_taxable: 0 },
  { description: "TERMINAL CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 1189.10, igst: 0, cgst: 107.02, sgst: 107.02, non_taxable: 0 },
  { description: "DEMURRAGE", freight_rate: "", hsn_code: "", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "SHUT OUT CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "VAN PASS", freight_rate: "", hsn_code: "", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "EXTRA LOADING", freight_rate: "", hsn_code: "", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "OT CHARGES", freight_rate: "", hsn_code: "", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "MISQ", freight_rate: "", hsn_code: "", taxable_amount: 0, igst: 0, cgst: 0, sgst: 0, non_taxable: 0 },
  { description: "SERVICE CHARGES AND CUSTOMS CLERENCE", freight_rate: "", hsn_code: "", taxable_amount: 2500.00, igst: 0, cgst: 225.00, sgst: 225.00, non_taxable: 0 },
];

function firstMatch(patterns, text) {
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m && m[1]) {
      return m[1].replace(/^[\s:\t\r\n]+|[\s:\t\r\n]+$/g, "").trim();
    }
  }
  return "";
}

function cleanNumber(raw) {
  if (!raw) return 0;
  const str = String(raw).replace(/,/g, "").trim();
  const m = str.match(/-?\d+(\.\d+)?/);
  if (!m) return 0;
  const val = parseFloat(m[0]);
  return isNaN(val) ? 0 : val;
}

function parseFields(text) {
  const t = text || "";
  const extracted_keys = [];

  // 1. Shipper Invoice Number
  const shipper_invoice_no = firstMatch(
    [
      /SHIPPER\s*(?:INVOICE|INV)\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /EXPORTER\s*(?:INVOICE|INV)\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /COMMERCIAL\s*INVOICE\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /SUPPLIER\s*INV(?:OICE)?\s*(?:NO\.?)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /INVOICE\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+?)(?=\s*(?:PKGS|REF|INV|DATE|\b|\r|\n|$))/i,
      /INV\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+?)(?=\s*(?:PKGS|REF|INV|DATE|\b|\r|\n|$))/i,
      /BILL\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+?)(?=\s*(?:PKGS|REF|INV|DATE|\b|\r|\n|$))/i,
    ],
    t
  );
  if (shipper_invoice_no) extracted_keys.push("shipper_invoice_no");

  // 2. Shipping Bill (SB No & SB Date)
  const sb_no = firstMatch(
    [
      /S\.?B\.?\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /SHIPPING\s*BILL\s*(?:NO\.?|NUMBER)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /S\/B\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /SB\s*NUM(?:BER)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /S\/BILL\s*(?:NO\.?)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
      /EXPORT\s*SB\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
    ],
    t
  );
  if (sb_no) extracted_keys.push("sb_no");

  const sb_date = firstMatch(
    [
      /S\.?B\.?\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /SHIPPING\s*BILL\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /S\/B\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /S\.?B\.?\s*DT\.?\s*[:\-]?\s*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})/i,
    ],
    t
  );
  if (sb_date) extracted_keys.push("sb_date");

  // 3. Reference Number
  const ref_no = firstMatch(
    [
      /REF\.?\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+?)(?=\s*(?:GR|WT|PKGS|INV|\b|\r|\n|$))/i,
      /REFERENCE\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+?)(?=\s*(?:GR|WT|PKGS|INV|\b|\r|\n|$))/i,
      /JOB\s*NO\.?\s*[:\-]?\s*([A-Z0-9/\-]+?)(?=\s*(?:GR|WT|PKGS|INV|\b|\r|\n|$))/i,
      /OUR\s*REF\s*[:\-]?\s*([A-Z0-9/\-]+)/i,
    ],
    t
  );
  if (ref_no) extracted_keys.push("ref_no");

  // 4. Invoice Date
  const inv_date = firstMatch(
    [
      /INV\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /INV\s*DT\.?\s*[:\-]?\s*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})/i,
      /INVOICE\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
    ],
    t
  );
  if (inv_date) extracted_keys.push("inv_date");

  // 5. AWB Date
  const awb_date = firstMatch(
    [
      /AWB\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /AWB\s*DT\.?\s*[:\-]?\s*([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})/i,
      /FLIGHT\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
      /EXECUTION\s*DATE\s*[:\-]?\s*([0-9]{1,2}[-/.][A-Za-z0-9]{2,9}[-/.][0-9]{2,4})/i,
    ],
    t
  );
  if (awb_date) extracted_keys.push("awb_date");

  // 6. AWB No
  const awb_no = firstMatch(
    [
      /AWB\s*NO\.?\s*[:\-]?\s*([0-9\-]{8,})/i,
      /AIR\s*WAYBILL\s*(?:NO\.?)?\s*[:\-]?\s*([0-9\-]{8,})/i,
      /MAWB\s*NO\.?\s*[:\-]?\s*([0-9\-]{8,})/i,
      /HAWB\s*NO\.?\s*[:\-]?\s*([0-9\-]{8,})/i,
      /\b([0-9]{3}[-\s][0-9]{8})\b/,
    ],
    t
  );
  if (awb_no) extracted_keys.push("awb_no");

  // 7. Packages (PKGS)
  const pkgs = firstMatch(
    [
      /PKGS\.?\s*[:\-]?\s*([0-9,]+)/i,
      /NO\.?\s*OF\s*PIECES\s*[:\-]?\s*([0-9,]+)/i,
      /PIECES\s*[:\-]?\s*([0-9,]+)/i,
      /TOTAL\s*PIECES\s*[:\-]?\s*([0-9,]+)/i,
      /\bRCP\b\s*([0-9,]+)/i,
    ],
    t
  );
  if (pkgs) extracted_keys.push("pkgs");

  // 8. Gross Weight (GR WT)
  const gr_wt = firstMatch(
    [
      /GR\.?\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
      /GROSS\s*WEIGHT\s*[:\-]?\s*([0-9,.]+)/i,
      /GROSS\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
      /G\.?\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
    ],
    t
  );
  if (gr_wt) extracted_keys.push("gr_wt");

  // 9. Chargeable Weight (C WT)
  const c_wt = firstMatch(
    [
      /C\.?\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
      /CHARGEABLE\s*WEIGHT\s*[:\-]?\s*([0-9,.]+)/i,
      /CHG\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
      /CH\.?\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
      /CHG\.\s*WT\.?\s*[:\-]?\s*([0-9,.]+)/i,
    ],
    t
  );
  if (c_wt) extracted_keys.push("c_wt");

  // 10. Origin Airport
  const origin = firstMatch(
    [
      /\bFROM\s*[:\-]?\s*([A-Z]{3})\b/i,
      /AIRPORT\s*OF\s*DEPARTURE\s*[:\-]?\s*([A-Z]{3})\b/i,
      /ORIGIN\s*[:\-]?\s*([A-Z]{3})\b/i,
      /POL\s*[:\-]?\s*([A-Z]{3})\b/i,
    ],
    t
  );
  if (origin) extracted_keys.push("origin");

  // 11. Destination Airport
  const destination = firstMatch(
    [
      /\bTO\s*[:\-]?\s*([A-Z]{3})\b/i,
      /AIRPORT\s*OF\s*DESTINATION\s*[:\-]?\s*([A-Z]{3})\b/i,
      /DESTINATION\s*[:\-]?\s*([A-Z]{3})\b/i,
      /POD\s*[:\-]?\s*([A-Z]{3})\b/i,
    ],
    t
  );
  if (destination) extracted_keys.push("destination");

  // 12. Commodity
  const commodity = firstMatch(
    [
      /COMMODITY\s*[:\-]?\s*([A-Za-z0-9 ,/&_\-]+?)(?=\s*(?:TO|FROM|\r|\n|$))/i,
      /NATURE\s*AND\s*QUANTITY\s*OF\s*GOODS\s*[:\-]?\s*\n?\s*([A-Za-z0-9 ,/&_\-]+)/i,
      /DESCRIPTION\s*OF\s*GOODS\s*[:\-]?\s*([A-Za-z0-9 ,/&_\-]+)/i,
      /GOODS\s*DESCRIPTION\s*[:\-]?\s*([A-Za-z0-9 ,/&_\-]+)/i,
    ],
    t
  );
  if (commodity) extracted_keys.push("commodity");

  // 13. Remarks
  const remarks = firstMatch(
    [
      /REMARKS\s*[:\-]?\s*([^\r\n]+)/i,
      /SPECIAL\s*HANDLING\s*INFORMATION\s*[:\-]?\s*([^\r\n]+)/i,
      /HANDLING\s*INFO\s*[:\-]?\s*([^\r\n]+)/i,
    ],
    t
  );
  if (remarks) extracted_keys.push("remarks");

  // 14. Shipper Details (Name, Address, GST)
  const shipper_name = firstMatch(
    [
      /SHIPPER\s*DETAILS\s*[:\-]?\s*\n+([A-Z0-9 &.,'\-]+)\n/i,
      /SHIPPER'?S\s*NAME(?:\s*AND\s*ADDRESS)?\s*\n+([A-Z0-9 &.,'\-]+)\n/i,
      /SHIPPER\s*[:\-]\s*([A-Z0-9 &.,'\-]+)/i,
      /CONSIGNOR\s*(?:NAME)?\s*[:\-]?\s*\n*([A-Z0-9 &.,'\-]+)/i,
      /EXPORTER\s*(?:NAME)?\s*[:\-]?\s*\n*([A-Z0-9 &.,'\-]+)/i,
    ],
    t
  );
  if (shipper_name) extracted_keys.push("shipper_name");

  // Extract multi-line Shipper Address if present in block
  let shipper_address = "";
  const shipperBlockMatch = t.match(/SHIPPER(?:'?S)?\s*(?:NAME\s*AND\s*ADDRESS|DETAILS)?\s*[:\-]?\s*\n+([^\n]+(?:\n[^\n]+){1,4})/i);
  if (shipperBlockMatch && shipperBlockMatch[1]) {
    const lines = shipperBlockMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && !l.match(/^(?:GST|GSTIN|TEL|PHONE|FAX|EMAIL|CONSIGNEE)/i));
    if (lines.length > 1) {
      shipper_address = lines.slice(1).join(", ");
    }
  }

  const shipper_gst = firstMatch(
    [
      /SHIPPER\s*GST\s*[:\-]?\s*([0-9A-Z]{15})/i,
      /GSTIN?\s*[:\-]?\s*([0-9A-Z]{15})/i,
      /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/,
    ],
    t
  );
  if (shipper_gst) extracted_keys.push("shipper_gst");

  // 15. Consignee Details (Name, Address)
  const consignee_name = firstMatch(
    [
      /CONS[IE]{1,2}NEE\s*DETAILS\s*[:\-]?\s*\n+([A-Z0-9 &.,'\-]+)\n/i,
      /CONS[IE]{1,2}NEE'?S\s*NAME(?:\s*AND\s*ADDRESS)?\s*\n+([A-Z0-9 &.,'\-]+)\n/i,
      /CONSIGNEE\s*[:\-]\s*([A-Z0-9 &.,'\-]+)/i,
      /BUYER\s*(?:NAME)?\s*[:\-]?\s*\n*([A-Z0-9 &.,'\-]+)/i,
      /NOTIFY\s*PARTY\s*[:\-]?\s*\n*([A-Z0-9 &.,'\-]+)/i,
    ],
    t
  );
  if (consignee_name) extracted_keys.push("consignee_name");

  let consignee_address = "";
  const consigneeBlockMatch = t.match(/CONS[IE]{1,2}NEE(?:'?S)?\s*(?:NAME\s*AND\s*ADDRESS|DETAILS)?\s*[:\-]?\s*\n+([^\n]+(?:\n[^\n]+){1,4})/i);
  if (consigneeBlockMatch && consigneeBlockMatch[1]) {
    const lines = consigneeBlockMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 2 && !l.match(/^(?:TEL|PHONE|FAX|EMAIL|NOTIFY|ISSUING)/i));
    if (lines.length > 1) {
      consignee_address = lines.slice(1).join(", ");
    }
  }

  // 16. Freight Rate
  const freight_rate_match = firstMatch(
    [
      /RATE\s*[/]?\s*CHARGE\s*[:\-]?\s*([0-9,.]+)/i,
      /FREIGHT\s*RATE\s*[:\-]?\s*([0-9,.]+)/i,
    ],
    t
  );

  // Initialize standard charges with prefilled values
  const charges = STANDARD_CHARGES_TEMPLATE.map((row) => ({ ...row }));

  // If rate and c_wt extracted, compute air freight
  const cwtNum = parseFloat(c_wt) || 0;
  const rateNum = parseFloat(freight_rate_match) || 0;
  if (rateNum > 0 && cwtNum > 0) {
    charges[0].freight_rate = freight_rate_match;
    charges[0].taxable_amount = Math.round(cwtNum * rateNum * 100) / 100;
    charges[0].cgst = Math.round(charges[0].taxable_amount * 0.09 * 100) / 100;
    charges[0].sgst = Math.round(charges[0].taxable_amount * 0.09 * 100) / 100;
  }

  // Calculate totals
  let subTaxable = 0;
  let subCgst = 0;
  let subSgst = 0;
  let subIgst = 0;
  let subNonTax = 0;
  for (const c of charges) {
    subTaxable += c.taxable_amount || 0;
    subCgst += c.cgst || 0;
    subSgst += c.sgst || 0;
    subIgst += c.igst || 0;
    subNonTax += c.non_taxable || 0;
  }

  const computedTotal = subTaxable + subCgst + subSgst + subIgst + subNonTax;

  return {
    invoice_no: "", // Auto-assigned by server as CCC/26-27/490
    shipper_invoice_no: shipper_invoice_no || "",
    sb_no: sb_no || "",
    sb_date: sb_date || "",
    ref_no: ref_no || "",
    inv_date: inv_date || "",
    awb_date: awb_date || "",
    awb_no: awb_no || "",
    pkgs: pkgs || "",
    gr_wt: gr_wt || "",
    c_wt: c_wt || "",
    origin: origin || "",
    destination: destination || "",
    commodity: commodity ? commodity.trim() : "",
    remarks: remarks || "",
    shipper_name: shipper_name || "",
    shipper_address: shipper_address || "",
    shipper_gst: shipper_gst || "",
    consignee_name: consignee_name || "",
    consignee_address: consignee_address || "",
    total: computedTotal > 0 ? computedTotal : "",
    amount_words: "",
    charges,
    extracted_keys,
  };
}

async function extractTextFromPdf(fileBuffer) {
  try {
    const parsed = await pdfParse(fileBuffer);
    const nativeText = (parsed.text || "").trim();
    return { text: nativeText, usedOcr: false };
  } catch (err) {
    return { text: "", usedOcr: false };
  }
}

async function runExtraction(fileBuffer) {
  const { text, usedOcr } = await extractTextFromPdf(fileBuffer);
  if (!text || text.trim().length < 5) {
    throw new Error(
      "No readable text could be extracted from this PDF. Please verify the document."
    );
  }
  const fields = parseFields(text);
  fields._used_ocr = usedOcr;
  fields._raw_text_preview = text.slice(0, 4000);
  return fields;
}

module.exports = {
  STANDARD_CHARGES_TEMPLATE,
  extractTextFromPdf,
  parseFields,
  runExtraction,
};
