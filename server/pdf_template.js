/**
 * Renders confirmed invoice data into the company's exact layout:
 * CHOLAMANDAL CARGO CONNECTIONS - TAX INVOICE
 * Optimized for single-page A4 full page fit with zero text overlap.
 */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const COMPANY_NAME = "CHOLAMANDAL CARGO CONNECTIONS";
const COMPANY_SUB = "INTERNATIONAL FREIGHT FORWARDERS";
const COMPANY_ADDR =
  "REGD OFFICE NO.1/2,25TH STREET KORATTUR,CHENNAI-600080,TAMILNADU INDIA";
const COMPANY_CELL = "CELL:9751488777,7548881677";
const COMPANY_PAN = "AIOPH1007Q";
const COMPANY_GST = "33AIOPH1007Q1Z6";

const CCC_LOGO_URL =
  "https://res.cloudinary.com/rlokioxu/image/upload/v1788252768/CCC-Logo_dzceec.png";
const IATA_LOGO_URL =
  "https://res.cloudinary.com/rlokioxu/image/upload/v1788252873/IATA_Logo_dbohu5.png";

const LOCAL_CCC_LOGO = path.join(__dirname, "assets", "ccc_logo.png");
const LOCAL_IATA_LOGO = path.join(__dirname, "assets", "iata_logo.png");

let imageCache = {};

async function getImageBuffer(localPath, remoteUrl) {
  if (imageCache[remoteUrl]) return imageCache[remoteUrl];

  if (fs.existsSync(localPath)) {
    try {
      const buffer = fs.readFileSync(localPath);
      imageCache[remoteUrl] = buffer;
      return buffer;
    } catch (e) {}
  }

  try {
    const res = await fetch(remoteUrl);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageCache[remoteUrl] = buffer;
      return buffer;
    }
  } catch (err) {
    console.warn(`[PDF Image] Failed to load ${remoteUrl}:`, err.message);
  }

  return null;
}

const DEFAULT_CHARGES_LIST = [
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

const BANK_LINES = [
  ["Account  name", "Cholamandal cargo connections"],
  ["Bank", "Bank of India"],
  ["Branch", "AMBATTUR BRANCH"],
  ["Account no", "Acc no:822130110000182"],
  ["Account type", "CASH CREDIT ACCOUNT"],
  ["IFSC", "IFSC BKID0008221"],
];

const NOTES = [
  "1. All Cheques / Demand Drafts in payment of bills should be drawn in favour of",
  "CHOLAMANDAL CARGO CONNECTIONS on Chennai Banks only and should be crossed A/c. Payee only.",
  "2. No receipt is valid unless on the company's printed receipt signed and stamped.",
  "3. Subject to chennai jurisdiction",
  "4. Interested at 24% per annum will be charged if the amount is not paid within 15days.",
];

function formatNum(v, fallbackDash = false) {
  if (v === null || v === undefined || v === "") return fallbackDash ? "-" : "0.00";
  const num = parseFloat(v);
  if (isNaN(num)) return fallbackDash ? "-" : "0.00";
  if (num === 0 && fallbackDash) return "-";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatToDDMMYYYY(str) {
  if (!str) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(str).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  let match = s.match(/^(\d{1,2})[\-\/\.](\d{1,2})[\-\/\.](\d{2,4})$/);
  if (match) {
    const d = match[1].padStart(2, "0");
    const m = match[2].padStart(2, "0");
    let y = match[3];
    if (y.length === 2) y = "20" + y;
    return `${d}/${m}/${y}`;
  }

  const monthMap = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  match = s.match(/^(\d{1,2})[\-\/\s]([A-Za-z]{3})[\-\/\s](\d{2,4})$/i);
  if (match) {
    const d = match[1].padStart(2, "0");
    const mon = match[2].toLowerCase();
    const m = monthMap[mon] || "01";
    let y = match[3];
    if (y.length === 2) y = "20" + y;
    return `${d}/${m}/${y}`;
  }

  return s;
}

function sumKey(charges, key) {
  let total = 0.0;
  for (const c of charges || []) {
    const val = parseFloat(c[key]);
    if (!isNaN(val)) total += val;
  }
  return total;
}

async function generateInvoicePdf(data, outputPath) {
  const [cccLogoBuffer, iataLogoBuffer] = await Promise.all([
    getImageBuffer(LOCAL_CCC_LOGO, CCC_LOGO_URL),
    getImageBuffer(LOCAL_IATA_LOGO, IATA_LOGO_URL),
  ]);

  const chargesMap = new Map();
  if (Array.isArray(data.charges)) {
    data.charges.forEach((c) => {
      if (c && c.description) {
        chargesMap.set(c.description.trim().toUpperCase(), c);
      }
    });
  }

  const finalCharges = DEFAULT_CHARGES_LIST.map((templateRow) => {
    const key = templateRow.description.toUpperCase();
    const existing = chargesMap.get(key);
    if (existing) {
      return {
        ...templateRow,
        ...existing,
        description: templateRow.description,
        freight_rate: existing.freight_rate !== undefined ? existing.freight_rate : templateRow.freight_rate,
        hsn_code: existing.hsn_code !== undefined ? existing.hsn_code : templateRow.hsn_code,
        taxable_amount: parseFloat(existing.taxable_amount) || 0,
        cgst: parseFloat(existing.cgst) || 0,
        sgst: parseFloat(existing.sgst) || 0,
        igst: parseFloat(existing.igst) || 0,
        non_taxable: parseFloat(existing.non_taxable) || 0,
      };
    }
    return { ...templateRow };
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 18, bottom: 16, left: 26, right: 26 },
      autoFirstPage: true,
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    writeStream.on("finish", () => resolve(outputPath));
    writeStream.on("error", reject);
    doc.on("error", reject);

    const left = 26;
    const top = 18;
    const width = 543; // A4 595.28 - 52 margins
    let curY = top;

    const drawBox = (x, y, w, h, strokeColor = "#000000", lineWidth = 0.75) => {
      doc.save();
      doc.lineWidth(lineWidth).strokeColor(strokeColor).rect(x, y, w, h).stroke();
      doc.restore();
    };

    const drawFilledBox = (x, y, w, h, fillColor = "#f3f4f6") => {
      doc.save();
      doc.rect(x, y, w, h).fill(fillColor);
      doc.restore();
    };

    // ================= 1. HEADER =================
    const headerHeight = 62;
    drawBox(left, curY, width, headerHeight);

    // Left: CCC Logo
    const logoBoxWidth = 76;
    drawBox(left, curY, logoBoxWidth, headerHeight);
    if (cccLogoBuffer) {
      try {
        doc.image(cccLogoBuffer, left + 4, curY + 4, {
          fit: [logoBoxWidth - 8, headerHeight - 8],
          align: "center",
          valign: "center",
        });
      } catch (err) {
        doc.font("Helvetica-Bold").fontSize(18).fillColor("#1e3a8a");
        doc.text("CCC", left, curY + 22, { width: logoBoxWidth, align: "center" });
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#1e3a8a");
      doc.text("CCC", left, curY + 22, { width: logoBoxWidth, align: "center" });
    }

    // Middle: Company Info
    const rightBoxWidth = 82;
    const midWidth = width - logoBoxWidth - rightBoxWidth;
    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(12.5);
    doc.text(COMPANY_NAME, left + logoBoxWidth, curY + 5, { width: midWidth, align: "center" });

    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#4b5563");
    doc.text(COMPANY_SUB, left + logoBoxWidth, curY + 20, { width: midWidth, align: "center" });

    doc.font("Helvetica").fontSize(6.8).fillColor("#374151");
    doc.text(COMPANY_ADDR, left + logoBoxWidth, curY + 33, { width: midWidth, align: "center" });
    doc.text(COMPANY_CELL, left + logoBoxWidth, curY + 46, { width: midWidth, align: "center" });

    // Right: IATA Logo
    const rightX = left + width - rightBoxWidth;
    drawBox(rightX, curY, rightBoxWidth, headerHeight);
    if (iataLogoBuffer) {
      try {
        doc.image(iataLogoBuffer, rightX + 4, curY + 4, {
          fit: [rightBoxWidth - 8, headerHeight - 8],
          align: "center",
          valign: "center",
        });
      } catch (err) {
        doc.font("Helvetica-Bold").fontSize(12).fillColor("#1e3a8a");
        doc.text("IATA", rightX, curY + 24, { width: rightBoxWidth, align: "center" });
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#1e3a8a");
      doc.text("IATA", rightX, curY + 24, { width: rightBoxWidth, align: "center" });
    }

    curY += headerHeight;

    // ================= 2. PAN / GST =================
    const panHeight = 15;
    drawBox(left, curY, width, panHeight);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000");
    doc.text(`PAN NO: ${COMPANY_PAN}`, left + 8, curY + 3.5, { width: width / 2 - 10 });
    doc.text(`GST NO : ${COMPANY_GST}`, left + width / 2 + 8, curY + 3.5, {
      width: width / 2 - 10,
    });
    curY += panHeight;

    // ================= 3. TAX INVOICE TITLE =================
    const titleHeight = 16;
    drawFilledBox(left, curY, width, titleHeight, "#f3f4f6");
    drawBox(left, curY, width, titleHeight);
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#111827");
    doc.text("TAX INVOICE", left, curY + 3, { width: width, align: "center" });
    curY += titleHeight;

    // ================= 4. SHIPPER & CONSIGNEE DETAILS =================
    const partiesHeight = 60;
    const colHalf = width / 2;

    drawBox(left, curY, colHalf, partiesHeight);
    drawBox(left + colHalf, curY, colHalf, partiesHeight);

    // Shipper
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000");
    doc.text("SHIPPER DETAILS", left + 6, curY + 4, { width: colHalf - 12 });
    doc.font("Helvetica").fontSize(7).fillColor("#1f2937");
    const shipperText = [
      data.shipper_name || "-",
      data.shipper_address || "",
      data.shipper_gst ? `GST: ${data.shipper_gst}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    doc.text(shipperText, left + 6, curY + 15, { width: colHalf - 12, height: partiesHeight - 17 });

    // Consignee
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000");
    doc.text("CONSIGNEE DETAILS", left + colHalf + 6, curY + 4, { width: colHalf - 12 });
    doc.font("Helvetica").fontSize(7).fillColor("#1f2937");
    const consigneeText = [
      data.consignee_name || "-",
      data.consignee_address || "",
    ]
      .filter(Boolean)
      .join("\n");
    doc.text(consigneeText, left + colHalf + 6, curY + 15, {
      width: colHalf - 12,
      height: partiesHeight - 17,
    });

    curY += partiesHeight;

    // ================= 5. BILL DETAILS =================
    const billHeaderHeight = 12.5;
    drawFilledBox(left, curY, width, billHeaderHeight, "#e5e7eb");
    drawBox(left, curY, width, billHeaderHeight);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#111827");
    doc.text("BILL DETAILS", left, curY + 2.5, { width: width, align: "center" });
    curY += billHeaderHeight;

    const rowH = 12;
    const billRowsCount = 6;
    const billBoxH = billRowsCount * rowH;
    drawBox(left, curY, width, billBoxH);

    const xLeftLabelW = 95;
    const xMidDivider = left + 355;
    const xRightLabelW = 46;
    const xRightValX = xMidDivider + xRightLabelW;

    for (let i = 1; i < billRowsCount; i++) {
      const y = curY + i * rowH;
      doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(left, y).lineTo(left + width, y).stroke().restore();
    }

    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(left + xLeftLabelW, curY).lineTo(left + xLeftLabelW, curY + billBoxH).stroke().restore();
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xMidDivider, curY).lineTo(xMidDivider, curY + 5 * rowH).stroke().restore();
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xRightValX, curY).lineTo(xRightValX, curY + 5 * rowH).stroke().restore();

    const xAwbDateDivider = left + xLeftLabelW + 115;
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xAwbDateDivider, curY + 2 * rowH).lineTo(xAwbDateDivider, curY + 3 * rowH).stroke().restore();

    const invDateStr = formatToDDMMYYYY(data.inv_date);
    const awbDateStr = formatToDDMMYYYY(data.awb_date);

    // Row 1
    let y = curY;
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("INVOICE NO:", left + 4, y + 2.5, { width: xLeftLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.invoice_no || "", left + xLeftLabelW + 4, y + 2.5, { width: xMidDivider - (left + xLeftLabelW) - 8 });

    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("PKGS", xMidDivider + 4, y + 2.5, { width: xRightLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.pkgs || "", xRightValX + 4, y + 2.5, { width: width - (xRightValX - left) - 8 });

    // Row 2
    y = curY + rowH;
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("REF.NO:", left + 4, y + 2.5, { width: xLeftLabelW - 6 });
    doc.font("Helvetica").fontSize(6.8).fillColor("#000000");
    doc.text(data.ref_no || "", left + xLeftLabelW + 4, y + 2.5, { width: xMidDivider - (left + xLeftLabelW) - 8 });

    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("GR WT", xMidDivider + 4, y + 2.5, { width: xRightLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.gr_wt || "", xRightValX + 4, y + 2.5, { width: width - (xRightValX - left) - 8 });

    // Row 3
    y = curY + 2 * rowH;
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("INV DATE:", left + 4, y + 2.5, { width: xLeftLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(invDateStr, left + xLeftLabelW + 4, y + 2.5, { width: 108 });

    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("AWB DATE", xAwbDateDivider + 4, y + 2.5, { width: 56 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(awbDateStr, xAwbDateDivider + 60, y + 2.5, { width: xMidDivider - (xAwbDateDivider + 60) - 4 });

    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("C.WT", xMidDivider + 4, y + 2.5, { width: xRightLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.c_wt || "", xRightValX + 4, y + 2.5, { width: width - (xRightValX - left) - 8 });

    // Row 4
    y = curY + 3 * rowH;
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("AWB NO:", left + 4, y + 2.5, { width: xLeftLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.awb_no || "", left + xLeftLabelW + 4, y + 2.5, { width: xMidDivider - (left + xLeftLabelW) - 8 });

    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("FROM", xMidDivider + 4, y + 2.5, { width: xRightLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.origin || "", xRightValX + 4, y + 2.5, { width: width - (xRightValX - left) - 8 });

    // Row 5
    y = curY + 4 * rowH;
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("COMMODITY:", left + 4, y + 2.5, { width: xLeftLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.commodity || "", left + xLeftLabelW + 4, y + 2.5, { width: xMidDivider - (left + xLeftLabelW) - 8 });

    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("TO", xMidDivider + 4, y + 2.5, { width: xRightLabelW - 6 });
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#000000");
    doc.text(data.destination || "", xRightValX + 4, y + 2.5, { width: width - (xRightValX - left) - 8 });

    // Row 6: REMARKS
    y = curY + 5 * rowH;
    doc.font("Helvetica-Bold").fontSize(6.8).fillColor("#111827");
    doc.text("REMARKS:", left + 4, y + 2.5, { width: xLeftLabelW - 6 });
    doc.font("Helvetica").fontSize(6.5).fillColor("#000000");
    doc.text(data.remarks || "", left + xLeftLabelW + 4, y + 2.5, {
      width: width - xLeftLabelW - 8,
      height: rowH - 3,
    });

    curY += billBoxH;

    // ================= 6. CHARGES DETAILS SECTION =================
    const cols = [
      { name1: "CHARGES DETAILS", name2: "", w: 155, align: "left" },
      { name1: "FREIGHT", name2: "RATE", w: 44, align: "center" },
      { name1: "HSN", name2: "CODE", w: 44, align: "center" },
      { name1: "TAXABLE", name2: "AMOUNT", w: 65, align: "right" },
      { name1: "IGST", name2: "18%", w: 56, align: "right" },
      { name1: "CGST", name2: "9%", w: 56, align: "right" },
      { name1: "SGST", name2: "9%", w: 56, align: "right" },
      { name1: "NON TAXABLE", name2: "AMOUNT", w: 67, align: "right" },
    ];

    const topHdrH = 12;
    const subHdrH = 14;
    const totalHdrH = topHdrH + subHdrH;

    drawFilledBox(left, curY, width, totalHdrH, "#f3f4f6");
    drawBox(left, curY, width, totalHdrH);

    // Horizontal divider between Top Header & Sub Header
    doc.save().lineWidth(0.4).strokeColor("#9ca3af").moveTo(left + 155 + 44 + 44, curY + topHdrH).lineTo(left + width, curY + topHdrH).stroke().restore();

    // Top Header Titles
    const taxGroupW = 65 + 56 + 56 + 56;
    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#111827");
    doc.text("TAXABLE AMOUNT", left + 155 + 44 + 44, curY + 2.8, { width: taxGroupW, align: "center" });
    doc.text("GST", left + 155 + 44 + 44 + taxGroupW, curY + 2.8, { width: 67, align: "center" });

    // Vertical column lines in header
    let cxHdr = left;
    cols.forEach((c, i) => {
      if (i > 0) {
        const lineTop = i <= 3 ? curY : curY + topHdrH;
        doc.save().lineWidth(0.4).strokeColor("#9ca3af").moveTo(cxHdr, lineTop).lineTo(cxHdr, curY + totalHdrH).stroke().restore();
      }
      cxHdr += c.w;
    });

    // Sub Header Titles (with proper non-overlapping Y positioning)
    let cxSubHdr = left;
    cols.forEach((c, i) => {
      doc.font("Helvetica-Bold").fontSize(6).fillColor("#111827");
      if (i === 0) {
        doc.text(c.name1, cxSubHdr + 4, curY + 9, { width: c.w - 8, align: c.align });
      } else {
        doc.text(c.name1, cxSubHdr + 1, curY + topHdrH + 1.8, { width: c.w - 2, align: c.align });
        if (c.name2) {
          doc.text(c.name2, cxSubHdr + 1, curY + topHdrH + 7.5, { width: c.w - 2, align: c.align });
        }
      }
      cxSubHdr += c.w;
    });

    curY += totalHdrH;

    // 14 Charges Rows
    const chargeRowH = 11.5;
    const totalChargeRowsH = finalCharges.length * chargeRowH;
    drawBox(left, curY, width, totalChargeRowsH);

    let cxCol = left;
    cols.forEach((c, i) => {
      if (i > 0) {
        doc.save().lineWidth(0.3).strokeColor("#e5e7eb").moveTo(cxCol, curY).lineTo(cxCol, curY + totalChargeRowsH).stroke().restore();
      }
      cxCol += c.w;
    });

    finalCharges.forEach((ch, idx) => {
      const y = curY + idx * chargeRowH;
      if (idx > 0) {
        doc.save().lineWidth(0.25).strokeColor("#f3f4f6").moveTo(left, y).lineTo(left + width, y).stroke().restore();
      }

      let cx = left;
      const rateDisplay = ch.freight_rate ? String(ch.freight_rate) : "";
      const hsnDisplay = ch.hsn_code ? String(ch.hsn_code) : "";

      const rowVals = [
        { val: ch.description, align: "left" },
        { val: rateDisplay, align: "center" },
        { val: hsnDisplay, align: "center" },
        { val: formatNum(ch.taxable_amount, true), align: "right" },
        { val: formatNum(ch.igst, true), align: "right" },
        { val: formatNum(ch.cgst, true), align: "right" },
        { val: formatNum(ch.sgst, true), align: "right" },
        { val: formatNum(ch.non_taxable, true), align: "right" },
      ];

      cols.forEach((col, i) => {
        doc.font("Helvetica").fontSize(6).fillColor("#111827");
        doc.text(rowVals[i].val, cx + 2, y + 2.5, { width: col.w - 4, align: rowVals[i].align });
        cx += col.w;
      });
    });

    curY += totalChargeRowsH;

    // Subtotals and Round Off
    const subTaxable = sumKey(finalCharges, "taxable_amount");
    const subIgst = sumKey(finalCharges, "igst");
    const subCgst = sumKey(finalCharges, "cgst");
    const subSgst = sumKey(finalCharges, "sgst");
    const subNonTax = sumKey(finalCharges, "non_taxable");
    const declaredTotal = parseFloat(data.total) || (subTaxable + subIgst + subCgst + subSgst + subNonTax);
    const roundOff = declaredTotal - (subTaxable + subIgst + subCgst + subSgst + subNonTax);

    const subH = 13.5;
    drawFilledBox(left, curY, width, subH, "#f9fafb");
    drawBox(left, curY, width, subH);

    doc.font("Helvetica").fontSize(6).fillColor("#6b7280");
    doc.text("ROUND OFF", left + 4, curY + 3.5, { width: 80 });

    doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#111827");
    doc.text("SUB TOTAL", left + 140, curY + 3.5, { width: 97, align: "right" });

    let cxSub = left + 155 + 44 + 44;
    const subCols = [
      { val: formatNum(subTaxable), w: 65 },
      { val: formatNum(subIgst), w: 56 },
      { val: formatNum(subCgst), w: 56 },
      { val: formatNum(subSgst), w: 56 },
      { val: formatNum(subNonTax, true), w: 67 },
    ];

    subCols.forEach((sc) => {
      doc.save().lineWidth(0.3).strokeColor("#9ca3af").moveTo(cxSub, curY).lineTo(cxSub, curY + subH).stroke().restore();
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#111827");
      doc.text(sc.val, cxSub + 2, curY + 3.5, { width: sc.w - 4, align: "right" });
      cxSub += sc.w;
    });

    curY += subH;

    // ================= 7. TOTAL IN RS & WORDS ROW =================
    const wordsH = 16;
    const rightAmountW = 90;
    const leftWordsW = width - rightAmountW;

    drawBox(left, curY, leftWordsW, wordsH);
    drawBox(left + leftWordsW, curY, rightAmountW, wordsH);

    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000");
    const amtWordsUpper = (data.amount_words || "").toUpperCase().trim();
    doc.text(`TOTAL IN RS:( ${amtWordsUpper || "ZERO RUPEES ONLY"} )`, left + 5, curY + 4, {
      width: leftWordsW - 10,
    });

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000000");
    doc.text(formatNum(declaredTotal), left + leftWordsW + 2, curY + 3.5, {
      width: rightAmountW - 6,
      align: "right",
    });

    curY += wordsH;

    // ================= 8. BANK DETAILS (LEFT) + GST SUMMARY (RIGHT) =================
    const bottomH = 78;
    const bankW = 345;
    const gstW = width - bankW; // 198

    drawBox(left, curY, bankW, bottomH);
    drawBox(left + bankW, curY, gstW, bottomH);

    // Bank Details Header
    const bankHdrH = 14;
    drawFilledBox(left, curY, bankW, bankHdrH, "#f2ede4");
    doc.save().lineWidth(0.5).strokeColor("#000000").moveTo(left, curY + bankHdrH).lineTo(left + bankW, curY + bankHdrH).stroke().restore();

    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000");
    doc.text("Bank details are as follows:", left + 6, curY + 3.5);

    let bankY = curY + 16.5;
    BANK_LINES.forEach(([label, val]) => {
      doc.font("Helvetica").fontSize(6.8).fillColor("#111827");
      doc.text(label, left + 6, bankY, { width: 80 });

      doc.text(":", left + 90, bankY, { width: 10 });

      doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000");
      doc.text(val, left + 105, bankY, { width: bankW - 110 });

      bankY += 9.8;
    });

    // GST Tax Summary Table (Right)
    const summaryRows = [
      ["TAXABLE AMOUNT", formatNum(subTaxable)],
      ["STATE GST 9%", formatNum(subSgst)],
      ["CENTRAL GST 9%", formatNum(subCgst)],
      ["IGST @ 18%", formatNum(subIgst)],
      ["ROUND OFF", roundOff < 0 ? `(${formatNum(Math.abs(roundOff))})` : formatNum(roundOff)],
      ["TOTAL", formatNum(declaredTotal), true],
    ];

    const gstDividerX = left + bankW + gstW * 0.58;
    doc.save().lineWidth(0.5).strokeColor("#000000").moveTo(gstDividerX, curY).lineTo(gstDividerX, curY + bottomH).stroke().restore();

    let gstY = curY;
    const gstRowH = bottomH / summaryRows.length;
    summaryRows.forEach(([lbl, val, isBold], idx) => {
      if (idx > 0) {
        doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(left + bankW, gstY).lineTo(left + width, gstY).stroke().restore();
      }
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(6.8).fillColor("#000000");
      doc.text(lbl, left + bankW + 6, gstY + 3.5, { width: gstW * 0.58 - 8 });

      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 8 : 6.8).fillColor("#000000");
      doc.text(val, gstDividerX + 2, gstY + (isBold ? 2.5 : 3.5), {
        width: gstW * 0.42 - 6,
        align: "right",
      });
      gstY += gstRowH;
    });

    curY += bottomH;

    // ================= 9. NOTES (LEFT) + FOR CCC & SIGNATORY (RIGHT) =================
    const notesH = 60;
    const notesW = 345;
    const sigW = width - notesW;

    drawBox(left, curY, notesW, notesH);
    drawBox(left + notesW, curY, sigW, notesH);

    // Notes (Left) with clean non-overlapping spacing
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000");
    doc.text("NOTE:", left + 6, curY + 3.5);
    let noteY = curY + 12.5;
    NOTES.forEach((n, i) => {
      doc.font("Helvetica").fontSize(5.8).fillColor("#111827");
      doc.text(n, left + 6, noteY, { width: notesW - 12 });
      noteY += (i === 0 ? 14 : 9.5);
    });

    // Right: FOR CHOLAMANDAL CARGO CONNECTIONS + Signature Space
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000");
    doc.text("FOR CHOLAMANDAL CARGO CONNECTIONS", left + notesW + 4, curY + 5, {
      width: sigW - 8,
      align: "center",
    });

    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000");
    doc.text("AUTHORISED SIGNATORY", left + notesW + 4, curY + notesH - 12, {
      width: sigW - 8,
      align: "center",
    });

    curY += notesH + 6;

    // ================= 10. FOOTER =================
    doc.font("Helvetica").fontSize(6.5).fillColor("#9ca3af");
    doc.text(
      `Invoice #${data.invoice_no || ""}  |  Cholamandal Cargo Connections Portal`,
      left,
      curY,
      { width: width, align: "center" }
    );

    doc.end();
  });
}

module.exports = {
  DEFAULT_CHARGES_LIST,
  generateInvoicePdf,
};
