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
  "1. All Cheques / Demand Drafts in payment of bills should be drawn in favour of CHOLAMANDAL CARGO CONNECTIONS on Chennai Banks only and should be crossed A/c. Payee only.",
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
    const PAGE_MARGIN = 24;
    const doc = new PDFDocument({
      size: [595.28, 841.89], // Exact A4 Portrait: 210 mm × 297 mm
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      autoFirstPage: true,
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    writeStream.on("finish", () => resolve(outputPath));
    writeStream.on("error", reject);
    doc.on("error", reject);

    const left = PAGE_MARGIN;
    const top = PAGE_MARGIN;
    const width = 595.28 - PAGE_MARGIN * 2; // 547.28 pt
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
    const headerHeight = 84;
    drawBox(left, curY, width, headerHeight);

    // Left: CCC Logo Box
    const logoBoxWidth = 84;
    drawBox(left, curY, logoBoxWidth, headerHeight);
    if (cccLogoBuffer) {
      try {
        doc.image(cccLogoBuffer, left + 6, curY + 6, {
          fit: [logoBoxWidth - 12, headerHeight - 12],
          align: "center",
          valign: "center",
        });
      } catch (err) {
        doc.font("Helvetica-Bold").fontSize(18).fillColor("#1e3a8a");
        doc.text("CCC", left, curY + 32, { width: logoBoxWidth, align: "center" });
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(18).fillColor("#1e3a8a");
      doc.text("CCC", left, curY + 32, { width: logoBoxWidth, align: "center" });
    }

    // Middle: Company Info
    const rightBoxWidth = 90;
    const midWidth = width - logoBoxWidth - rightBoxWidth;
    const midX = left + logoBoxWidth;

    doc.fillColor("#000000");
    doc.font("Helvetica-Bold").fontSize(13.5);
    doc.text(COMPANY_NAME, midX, curY + 8, { width: midWidth, align: "center" });

    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#4b5563");
    doc.text(COMPANY_SUB, midX, curY + 28, { width: midWidth, align: "center" });

    doc.font("Helvetica").fontSize(7.5).fillColor("#374151");
    doc.text(COMPANY_ADDR, midX, curY + 44, { width: midWidth, align: "center" });
    doc.text(COMPANY_CELL, midX, curY + 59, { width: midWidth, align: "center" });

    // Right: IATA Logo Box
    const rightX = left + width - rightBoxWidth;
    drawBox(rightX, curY, rightBoxWidth, headerHeight);
    if (iataLogoBuffer) {
      try {
        doc.image(iataLogoBuffer, rightX + 6, curY + 6, {
          fit: [rightBoxWidth - 12, headerHeight - 12],
          align: "center",
          valign: "center",
        });
      } catch (err) {
        doc.font("Helvetica-Bold").fontSize(13).fillColor("#1e3a8a");
        doc.text("IATA", rightX, curY + 34, { width: rightBoxWidth, align: "center" });
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#1e3a8a");
      doc.text("IATA", rightX, curY + 34, { width: rightBoxWidth, align: "center" });
    }

    curY += headerHeight;

    // ================= 2. PAN / GST =================
    const panHeight = 20;
    drawBox(left, curY, width, panHeight);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#000000");
    doc.text(`PAN NO: ${COMPANY_PAN}`, left + 8, curY + 5.5, { width: width / 2 - 12 });
    doc.text(`GST NO : ${COMPANY_GST}`, left + width / 2 + 8, curY + 5.5, {
      width: width / 2 - 12,
    });
    curY += panHeight;

    // ================= 3. TAX INVOICE TITLE =================
    const titleHeight = 20;
    drawFilledBox(left, curY, width, titleHeight, "#f3f4f6");
    drawBox(left, curY, width, titleHeight);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827");
    doc.text("TAX INVOICE", left, curY + 4.5, { width: width, align: "center" });
    curY += titleHeight;

    // ================= 4. SHIPPER & CONSIGNEE DETAILS =================
    const partiesHeight = 80;
    const colHalf = width / 2;

    drawBox(left, curY, colHalf, partiesHeight);
    drawBox(left + colHalf, curY, colHalf, partiesHeight);

    // Shipper
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#000000");
    doc.text("SHIPPER DETAILS", left + 8, curY + 6, { width: colHalf - 16 });
    doc.font("Helvetica").fontSize(7.5).fillColor("#1f2937");
    const shipperText = [
      data.shipper_name || "-",
      data.shipper_address || "",
      data.shipper_gst ? `GST: ${data.shipper_gst}` : "",
      data.shipper_invoice_no ? `Shipper Inv: ${data.shipper_invoice_no}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    doc.text(shipperText, left + 8, curY + 20, { width: colHalf - 16, height: partiesHeight - 24, lineGap: 1.5 });

    // Consignee
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#000000");
    doc.text("CONSIGNEE DETAILS", left + colHalf + 8, curY + 6, { width: colHalf - 16 });
    doc.font("Helvetica").fontSize(7.5).fillColor("#1f2937");
    const consigneeText = [
      data.consignee_name || "-",
      data.consignee_address || "",
    ]
      .filter(Boolean)
      .join("\n");
    doc.text(consigneeText, left + colHalf + 8, curY + 20, {
      width: colHalf - 16,
      height: partiesHeight - 24,
      lineGap: 1.5,
    });

    curY += partiesHeight;

    // ================= 5. BILL DETAILS =================
    const billHeaderHeight = 16;
    drawFilledBox(left, curY, width, billHeaderHeight, "#e5e7eb");
    drawBox(left, curY, width, billHeaderHeight);
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#111827");
    doc.text("BILL DETAILS", left, curY + 4, { width: width, align: "center" });
    curY += billHeaderHeight;

    const rowH = 14.5;
    const billRowsCount = 7;
    const billBoxH = billRowsCount * rowH; // 101.5 pt
    drawBox(left, curY, width, billBoxH);

    const xLeftLabelW = 96;
    const xMidDivider = left + 358;
    const xRightLabelW = 50;
    const xRightValX = xMidDivider + xRightLabelW;

    for (let i = 1; i < billRowsCount; i++) {
      const y = curY + i * rowH;
      doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(left, y).lineTo(left + width, y).stroke().restore();
    }

    // Vertical line after left label (all 7 rows)
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(left + xLeftLabelW, curY).lineTo(left + xLeftLabelW, curY + billBoxH).stroke().restore();

    // Mid divider (rows 1-5 and row 7, leaving row 6 Remarks full width)
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xMidDivider, curY).lineTo(xMidDivider, curY + 5 * rowH).stroke().restore();
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xMidDivider, curY + 6 * rowH).lineTo(xMidDivider, curY + 7 * rowH).stroke().restore();

    // Right label divider (rows 1-5 and row 7)
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xRightValX, curY).lineTo(xRightValX, curY + 5 * rowH).stroke().restore();
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xRightValX, curY + 6 * rowH).lineTo(xRightValX, curY + 7 * rowH).stroke().restore();

    const xAwbDateDivider = left + xLeftLabelW + 116;
    doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(xAwbDateDivider, curY + 2 * rowH).lineTo(xAwbDateDivider, curY + 3 * rowH).stroke().restore();

    const invDateStr = formatToDDMMYYYY(data.inv_date);
    const awbDateStr = formatToDDMMYYYY(data.awb_date);

    // Row 1: INVOICE NO / PKGS
    let y = curY;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("INVOICE NO:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.invoice_no || "", left + xLeftLabelW + 6, y + 3.5, { width: xMidDivider - (left + xLeftLabelW) - 10 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("PKGS", xMidDivider + 6, y + 3.5, { width: xRightLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.pkgs || "", xRightValX + 6, y + 3.5, { width: width - (xRightValX - left) - 10 });

    // Row 2: REF.NO / GR WT
    y = curY + rowH;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("REF.NO:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica").fontSize(7).fillColor("#000000");
    doc.text(data.ref_no || "", left + xLeftLabelW + 6, y + 3.5, { width: xMidDivider - (left + xLeftLabelW) - 10 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("GR WT", xMidDivider + 6, y + 3.5, { width: xRightLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.gr_wt || "", xRightValX + 6, y + 3.5, { width: width - (xRightValX - left) - 10 });

    // Row 3: INV DATE / AWB DATE / C.WT
    y = curY + 2 * rowH;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("INV DATE:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(invDateStr, left + xLeftLabelW + 6, y + 3.5, { width: 108 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("AWB DATE", xAwbDateDivider + 6, y + 3.5, { width: 56 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(awbDateStr, xAwbDateDivider + 62, y + 3.5, { width: xMidDivider - (xAwbDateDivider + 62) - 6 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("C.WT", xMidDivider + 6, y + 3.5, { width: xRightLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.c_wt || "", xRightValX + 6, y + 3.5, { width: width - (xRightValX - left) - 10 });

    // Row 4: AWB NO / FROM
    y = curY + 3 * rowH;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("AWB NO:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.awb_no || "", left + xLeftLabelW + 6, y + 3.5, { width: xMidDivider - (left + xLeftLabelW) - 10 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("FROM", xMidDivider + 6, y + 3.5, { width: xRightLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.origin || "", xRightValX + 6, y + 3.5, { width: width - (xRightValX - left) - 10 });

    // Row 5: COMMODITY / TO
    y = curY + 4 * rowH;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("COMMODITY:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.commodity || "", left + xLeftLabelW + 6, y + 3.5, { width: xMidDivider - (left + xLeftLabelW) - 10 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("TO", xMidDivider + 6, y + 3.5, { width: xRightLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.destination || "", xRightValX + 6, y + 3.5, { width: width - (xRightValX - left) - 10 });

    // Row 6: REMARKS
    y = curY + 5 * rowH;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("REMARKS:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica").fontSize(7).fillColor("#000000");
    doc.text(data.remarks || "", left + xLeftLabelW + 6, y + 3.5, {
      width: width - xLeftLabelW - 12,
      height: rowH - 4,
    });

    // Row 7: SHIPPER INVOICE NO / SB NO (Directly below Remarks)
    y = curY + 6 * rowH;
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("SHIPPER INV NO:", left + 6, y + 3.5, { width: xLeftLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(data.shipper_invoice_no || "", left + xLeftLabelW + 6, y + 3.5, { width: xMidDivider - (left + xLeftLabelW) - 10 });

    const sbDisplay = data.sb_no
      ? `${data.sb_no}${data.sb_date ? ` (${formatToDDMMYYYY(data.sb_date)})` : ""}`
      : "";
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("SB NO:", xMidDivider + 6, y + 3.5, { width: xRightLabelW - 8 });
    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#000000");
    doc.text(sbDisplay, xRightValX + 6, y + 3.5, { width: width - (xRightValX - left) - 10 });

    curY += billBoxH;

    // ================= 6. CHARGES DETAILS SECTION =================
    const cols = [
      { name1: "CHARGES DETAILS", name2: "", w: 168.28, align: "left" },
      { name1: "FREIGHT", name2: "RATE", w: 41, align: "center" },
      { name1: "HSN", name2: "CODE", w: 41, align: "center" },
      { name1: "TAXABLE", name2: "AMOUNT", w: 65, align: "right" },
      { name1: "IGST", name2: "18%", w: 56, align: "right" },
      { name1: "CGST", name2: "9%", w: 56, align: "right" },
      { name1: "SGST", name2: "9%", w: 56, align: "right" },
      { name1: "NON TAXABLE", name2: "AMOUNT", w: 64, align: "right" },
    ];

    const topHdrH = 13;
    const subHdrH = 16;
    const totalHdrH = topHdrH + subHdrH; // 29 pt

    drawFilledBox(left, curY, width, totalHdrH, "#f3f4f6");
    drawBox(left, curY, width, totalHdrH);

    // Horizontal divider between Top Header & Sub Header
    const taxColsStartX = left + 168.28 + 41 + 41;
    doc.save().lineWidth(0.4).strokeColor("#9ca3af").moveTo(taxColsStartX, curY + topHdrH).lineTo(left + width, curY + topHdrH).stroke().restore();

    // Top Header Titles
    const taxGroupW = 65 + 56 + 56 + 56;
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#111827");
    doc.text("TAXABLE AMOUNT", taxColsStartX, curY + 3.2, { width: taxGroupW, align: "center" });
    doc.text("GST", taxColsStartX + taxGroupW, curY + 3.2, { width: 64, align: "center" });

    // Vertical column lines in header
    let cxHdr = left;
    cols.forEach((c, i) => {
      if (i > 0) {
        const lineTop = i <= 3 ? curY : curY + topHdrH;
        doc.save().lineWidth(0.4).strokeColor("#9ca3af").moveTo(cxHdr, lineTop).lineTo(cxHdr, curY + totalHdrH).stroke().restore();
      }
      cxHdr += c.w;
    });

    // Sub Header Titles
    let cxSubHdr = left;
    cols.forEach((c, i) => {
      doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#111827");
      if (i === 0) {
        doc.text(c.name1, cxSubHdr + 6, curY + 11, { width: c.w - 10, align: c.align });
      } else {
        doc.text(c.name1, cxSubHdr + 2, curY + topHdrH + 2.2, { width: c.w - 4, align: c.align });
        if (c.name2) {
          doc.text(c.name2, cxSubHdr + 2, curY + topHdrH + 8.5, { width: c.w - 4, align: c.align });
        }
      }
      cxSubHdr += c.w;
    });

    curY += totalHdrH;

    // 14 Charges Rows
    const chargeRowH = 15;
    const totalChargeRowsH = finalCharges.length * chargeRowH; // 210 pt
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
        let fSize = 6.8;
        const cellPadX = col.align === "left" ? 5 : 3;
        const maxTextW = col.w - cellPadX * 2;

        if (i === 0) {
          while (fSize > 5.0 && doc.font("Helvetica").fontSize(fSize).widthOfString(rowVals[i].val) > maxTextW) {
            fSize -= 0.2;
          }
        }

        doc.font("Helvetica").fontSize(fSize).fillColor("#111827");
        doc.text(rowVals[i].val, cx + cellPadX, y + 4.2, {
          width: maxTextW,
          align: rowVals[i].align,
          lineBreak: false,
        });
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

    const subH = 17;
    drawFilledBox(left, curY, width, subH, "#f9fafb");
    drawBox(left, curY, width, subH);

    doc.font("Helvetica").fontSize(7).fillColor("#6b7280");
    doc.text("ROUND OFF", left + 6, curY + 4.5, { width: 80 });

    doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
    doc.text("SUB TOTAL", left + 140, curY + 4.5, { width: 100, align: "right" });

    let cxSub = left + 168.28 + 41 + 41;
    const subCols = [
      { val: formatNum(subTaxable), w: 65 },
      { val: formatNum(subIgst), w: 56 },
      { val: formatNum(subCgst), w: 56 },
      { val: formatNum(subSgst), w: 56 },
      { val: formatNum(subNonTax, true), w: 64 },
    ];

    subCols.forEach((sc) => {
      doc.save().lineWidth(0.3).strokeColor("#9ca3af").moveTo(cxSub, curY).lineTo(cxSub, curY + subH).stroke().restore();
      doc.font("Helvetica-Bold").fontSize(7.2).fillColor("#111827");
      doc.text(sc.val, cxSub + 2, curY + 4.5, { width: sc.w - 6, align: "right" });
      cxSub += sc.w;
    });

    curY += subH;

    // ================= 7. TOTAL IN RS & WORDS ROW =================
    const wordsH = 22;
    const rightAmountW = 95;
    const leftWordsW = width - rightAmountW;

    drawBox(left, curY, leftWordsW, wordsH);
    drawBox(left + leftWordsW, curY, rightAmountW, wordsH);

    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#000000");
    const amtWordsUpper = (data.amount_words || "").toUpperCase().trim();
    doc.text(`TOTAL IN RS:( ${amtWordsUpper || "ZERO RUPEES ONLY"} )`, left + 8, curY + 5.5, {
      width: leftWordsW - 16,
    });

    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#000000");
    doc.text(formatNum(declaredTotal), left + leftWordsW + 4, curY + 5, {
      width: rightAmountW - 10,
      align: "right",
    });

    curY += wordsH;

    // ================= 8. BANK DETAILS (LEFT) + GST SUMMARY (RIGHT) =================
    const bottomH = 96;
    const bankW = 348;
    const gstW = width - bankW; // 199.28 pt

    drawBox(left, curY, bankW, bottomH);
    drawBox(left + bankW, curY, gstW, bottomH);

    // Bank Details Header
    const bankHdrH = 16;
    doc.save().lineWidth(0.5).strokeColor("#000000").moveTo(left, curY + bankHdrH).lineTo(left + bankW, curY + bankHdrH).stroke().restore();

    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#000000");
    doc.text("Bank details are as follows:", left + 8, curY + 4);

    let bankY = curY + 19;
    BANK_LINES.forEach(([label, val]) => {
      doc.font("Helvetica").fontSize(7.2).fillColor("#111827");
      doc.text(label, left + 8, bankY, { width: 82 });

      doc.text(":", left + 92, bankY, { width: 10 });

      doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000");
      doc.text(val, left + 104, bankY, { width: bankW - 112 });

      bankY += 12.2;
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
    const gstRowH = bottomH / summaryRows.length; // 16 pt
    summaryRows.forEach(([lbl, val, isBold], idx) => {
      if (idx > 0) {
        doc.save().lineWidth(0.4).strokeColor("#000000").moveTo(left + bankW, gstY).lineTo(left + width, gstY).stroke().restore();
      }
      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(7.2).fillColor("#000000");
      doc.text(lbl, left + bankW + 8, gstY + 4, { width: gstW * 0.58 - 12 });

      doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(isBold ? 8.5 : 7.2).fillColor("#000000");
      doc.text(val, gstDividerX + 4, gstY + (isBold ? 3.5 : 4), {
        width: gstW * 0.42 - 10,
        align: "right",
      });
      gstY += gstRowH;
    });

    curY += bottomH;

    // ================= 9. NOTES (LEFT) + FOR CCC & SIGNATORY (RIGHT) =================
    // Height dynamically fills the remaining printable A4 page height (109.89 pt)
    const notesH = 841.89 - PAGE_MARGIN - curY; // exactly 109.89 pt
    const notesW = 348;
    const sigW = width - notesW;

    drawBox(left, curY, notesW, notesH);
    drawBox(left + notesW, curY, sigW, notesH);

    // Notes (Left) with sufficient inner padding and clean non-overlapping spacing
    const notePaddingX = 8;
    const notePaddingTop = 8;
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000000");
    doc.text("NOTE:", left + notePaddingX, curY + notePaddingTop);

    let noteY = curY + 20;
    const noteAvailableW = notesW - notePaddingX * 2;
    NOTES.forEach((n) => {
      doc.font("Helvetica").fontSize(6.8).fillColor("#1f2937");
      const noteTextHeight = doc.heightOfString(n, { width: noteAvailableW, lineGap: 1.5 });
      doc.text(n, left + notePaddingX, noteY, {
        width: noteAvailableW,
        lineGap: 1.5,
      });
      noteY += noteTextHeight + 3.2;
    });

    // Right: FOR CHOLAMANDAL CARGO CONNECTIONS + Signature Space
    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#000000");
    doc.text("FOR CHOLAMANDAL CARGO CONNECTIONS", left + notesW + 6, curY + 8, {
      width: sigW - 12,
      align: "center",
    });

    doc.font("Helvetica-Bold").fontSize(7.8).fillColor("#000000");
    doc.text("AUTHORISED SIGNATORY", left + notesW + 6, curY + notesH - 16, {
      width: sigW - 12,
      align: "center",
    });

    // Footer removed as required
    doc.end();
  });
}

module.exports = {
  DEFAULT_CHARGES_LIST,
  generateInvoicePdf,
};
