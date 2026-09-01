const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const db = require("./database");
const auth = require("./auth");
const extraction = require("./extraction");
const pdfTemplate = require("./pdf_template");

const app = express();
const PORT = process.env.PORT || 8000;

// Storage directories
const BASE_STORAGE = path.join(__dirname, "storage");
const UPLOAD_DIR = path.join(BASE_STORAGE, "uploads");
const GENERATED_DIR = path.join(BASE_STORAGE, "generated");

[BASE_STORAGE, UPLOAD_DIR, GENERATED_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// CORS configuration
const rawClientOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((s) => s.trim())
  : [];

const allowedOrigins = [
  ...rawClientOrigins,
  "http://localhost:5500",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static files for generated PDFs
app.use("/storage", express.static(BASE_STORAGE));

// Multer for upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
});

const VALID_STATUSES = new Set(["Draft", "Processing", "Completed", "Failed"]);

function validateInvoiceData(data) {
  const errors = {};
  if (!data) return { general: "Invoice data is required." };

  if (!data.invoice_no || !String(data.invoice_no).trim()) {
    errors.invoice_no = "Invoice number is required.";
  }
  if (!data.inv_date || !String(data.inv_date).trim()) {
    errors.inv_date = "Invoice date is required.";
  }
  if (!data.awb_no || !String(data.awb_no).trim()) {
    errors.awb_no = "AWB number is required.";
  }
  if (!data.shipper_name || !String(data.shipper_name).trim()) {
    errors.shipper_name = "Shipper name is required.";
  }
  if (!data.consignee_name || !String(data.consignee_name).trim()) {
    errors.consignee_name = "Consignee name is required.";
  }

  const total = parseFloat(data.total);
  if (isNaN(total) || total <= 0) {
    errors.total = "Total amount must be greater than zero.";
  }

  return errors;
}

// --------------------------------------------------------------------------
// Auth endpoints
// --------------------------------------------------------------------------
const handleLogin = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ detail: "Username and password required." });
  }

  try {
    const user = await db.getUser(username);
    if (!user) {
      return res.status(401).json({ detail: "Invalid credentials." });
    }

    const valid = auth.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ detail: "Invalid credentials." });
    }

    const token = auth.createAccessToken(user.username);
    return res.json({
      token: token,
      access_token: token,
      token_type: "bearer",
      username: user.username,
      full_name: user.full_name,
      user: {
        username: user.username,
        full_name: user.full_name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ detail: "Internal authentication error." });
  }
};

app.post("/api/auth/token", handleLogin);
app.post("/api/auth/login", handleLogin);

app.get("/api/auth/me", auth.authMiddleware, async (req, res) => {
  try {
    const user = await db.getUser(req.user);
    if (!user) {
      return res.status(404).json({ detail: "User not found." });
    }
    return res.json({
      username: user.username,
      full_name: user.full_name,
    });
  } catch (err) {
    return res.status(500).json({ detail: "Internal server error." });
  }
});

// --------------------------------------------------------------------------
// Invoice CRUD & Soft-Delete Trash Endpoints
// --------------------------------------------------------------------------
app.get("/api/invoices", auth.authMiddleware, async (req, res) => {
  const { search, status } = req.query;
  try {
    const invoices = await db.listInvoices(search, status, false);
    return res.json(invoices);
  } catch (err) {
    console.error("Error listing invoices:", err);
    return res.status(500).json({ detail: "Failed to list invoices." });
  }
});

// Trash: list soft-deleted invoices
app.get("/api/invoices/trash", auth.authMiddleware, async (req, res) => {
  const { search, status } = req.query;
  try {
    const trash = await db.listInvoices(search, status, true);
    return res.json(trash);
  } catch (err) {
    console.error("Error listing trash:", err);
    return res.status(500).json({ detail: "Failed to list trash." });
  }
});

// Restore soft-deleted invoice
app.post("/api/invoices/:id/restore", auth.authMiddleware, async (req, res) => {
  try {
    const restored = await db.restoreInvoice(req.params.id);
    if (!restored) {
      return res.status(404).json({ detail: "Invoice not found in trash." });
    }
    return res.json(restored);
  } catch (err) {
    return res.status(500).json({ detail: "Failed to restore invoice." });
  }
});

// Permanent delete from trash
app.delete("/api/invoices/:id/permanent", auth.authMiddleware, async (req, res) => {
  try {
    const deleted = await db.permanentDeleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(404).json({ detail: "Invoice not found." });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ detail: "Failed to permanently delete invoice." });
  }
});

app.get("/api/invoices/:id", auth.authMiddleware, async (req, res) => {
  try {
    const inv = await db.getInvoice(req.params.id, false);
    if (!inv) {
      return res.status(404).json({ detail: "Invoice not found or has been moved to trash." });
    }
    return res.json(inv);
  } catch (err) {
    return res.status(500).json({ detail: "Failed to fetch invoice." });
  }
});

app.put("/api/invoices/:id", auth.authMiddleware, async (req, res) => {
  const invoiceId = req.params.id;
  const { data, status } = req.body || {};

  if (status && !VALID_STATUSES.has(status)) {
    return res
      .status(400)
      .json({ detail: `Invalid status. Must be one of ${Array.from(VALID_STATUSES).join(", ")}` });
  }

  const errors = validateInvoiceData(data);
  if (Object.keys(errors).length > 0 && status === "Completed") {
    return res.status(422).json({
      detail: { message: "Validation failed", errors },
    });
  }

  try {
    const updated = await db.updateInvoice(invoiceId, { data, status });
    if (!updated) {
      return res.status(404).json({ detail: "Invoice not found or has been deleted." });
    }
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ detail: "Failed to update invoice." });
  }
});

// Soft delete
app.delete("/api/invoices/:id", auth.authMiddleware, async (req, res) => {
  try {
    const ok = await db.softDeleteInvoice(req.params.id);
    if (!ok) {
      return res.status(404).json({ detail: "Invoice not found." });
    }
    return res.json({ ok: true, message: "Invoice moved to trash." });
  } catch (err) {
    return res.status(500).json({ detail: "Failed to delete invoice." });
  }
});

// --------------------------------------------------------------------------
// Next Sequence Invoice Number
// --------------------------------------------------------------------------
app.get("/api/invoices/next-number", auth.authMiddleware, async (req, res) => {
  try {
    const invoiceNo = await db.getNextInvoiceNumber(req.query.date || new Date());
    const fy = db.getFinancialYear(req.query.date || new Date());
    return res.json({ invoice_no: invoiceNo, financial_year: fy });
  } catch (err) {
    return res.status(500).json({ detail: "Failed to generate next invoice number." });
  }
});

// --------------------------------------------------------------------------
// Upload + Extraction
// --------------------------------------------------------------------------
app.post(
  "/api/invoices/upload",
  auth.authMiddleware,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ detail: "No file uploaded." });
    }

    const originalName = req.file.originalname;
    if (!originalName.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ detail: "Only PDF files are supported." });
    }

    const fileBytes = req.file.buffer;
    if (!fileBytes || fileBytes.length === 0) {
      return res.status(400).json({ detail: "The uploaded file is empty." });
    }

    const uniquePrefix = crypto.randomBytes(16).toString("hex");
    const storedName = `${uniquePrefix}_${originalName}`;
    const storedPath = path.join(UPLOAD_DIR, storedName);

    fs.writeFileSync(storedPath, fileBytes);

    let invoiceId = null;
    try {
      invoiceId = await db.createInvoice(
        {},
        "Processing",
        originalName,
        req.user
      );
    } catch (err) {
      return res.status(500).json({ detail: "Failed to create invoice record." });
    }

    try {
      const extracted = await extraction.runExtraction(fileBytes);
      const autoInvoiceNo = await db.getNextInvoiceNumber(extracted.inv_date || new Date());
      // If extracted had an external bill/invoice number, retain it in ref_no if ref_no is blank
      if (extracted.invoice_no && !extracted.ref_no) {
        extracted.ref_no = extracted.invoice_no;
      }
      extracted.invoice_no = autoInvoiceNo;
      await db.updateInvoice(invoiceId, { data: extracted, status: "Draft" });
    } catch (exc) {
      await db.updateInvoice(invoiceId, {
        status: "Failed",
        errorMessage: exc.message || String(exc),
      });
      return res.status(422).json({
        detail: `Extraction failed: ${exc.message || exc}`,
      });
    }

    const saved = await db.getInvoice(invoiceId);
    return res.json(saved);
  }
);

// --------------------------------------------------------------------------
// Validation
// --------------------------------------------------------------------------
app.post("/api/invoices/:id/validate", auth.authMiddleware, async (req, res) => {
  try {
    const inv = await db.getInvoice(req.params.id, false);
    if (!inv) {
      return res.status(404).json({ detail: "Invoice not found or is in trash." });
    }

    const errors = validateInvoiceData(inv.data);
    return res.json({
      valid: Object.keys(errors).length === 0,
      errors,
    });
  } catch (err) {
    return res.status(500).json({ detail: "Failed to validate invoice." });
  }
});

// --------------------------------------------------------------------------
// PDF generation / preview / download
// --------------------------------------------------------------------------
app.post("/api/invoices/:id/generate", auth.authMiddleware, async (req, res) => {
  const invoiceId = req.params.id;
  let inv = null;
  try {
    inv = await db.getInvoice(invoiceId, false);
  } catch (err) {
    return res.status(500).json({ detail: "Failed to load invoice." });
  }

  if (!inv) {
    return res.status(404).json({ detail: "Invoice not found or has been deleted. Restore it before generating." });
  }

  const errors = validateInvoiceData(inv.data);
  if (Object.keys(errors).length > 0) {
    return res.status(422).json({
      detail: {
        message: "Fix validation errors before generating.",
        errors,
      },
    });
  }

  const uniqueSuffix = crypto.randomBytes(4).toString("hex");
  const outputName = `invoice_${invoiceId}_${uniqueSuffix}.pdf`;
  const outputPath = path.join(GENERATED_DIR, outputName);

  try {
    await pdfTemplate.generateInvoicePdf(inv.data, outputPath);
  } catch (exc) {
    await db.updateInvoice(invoiceId, {
      status: "Failed",
      errorMessage: exc.message || String(exc),
    });
    return res
      .status(500)
      .json({ detail: `PDF generation failed: ${exc.message || exc}` });
  }

  const updated = await db.updateInvoice(invoiceId, {
    status: "Completed",
    generatedPdfPath: outputPath,
  });

  return res.json(updated);
});

app.get("/api/invoices/:id/pdf", auth.authMiddleware, async (req, res) => {
  try {
    const inv = await db.getInvoice(req.params.id, false);
    if (!inv) {
      return res.status(404).json({ detail: "Invoice not found or has been moved to trash." });
    }

    let filePath = inv.generated_pdf_path;
    if (!filePath || !fs.existsSync(filePath)) {
      // Auto-generate on-demand so PDF preview never fails on fresh/restarted instances
      const uniqueSuffix = crypto.randomBytes(4).toString("hex");
      const outputName = `invoice_${inv.id}_${uniqueSuffix}.pdf`;
      filePath = path.join(GENERATED_DIR, outputName);
      await pdfTemplate.generateInvoicePdf(inv.data || {}, filePath);
      await db.updateInvoice(inv.id, {
        status: inv.status === "Draft" ? "Draft" : "Completed",
        generatedPdfPath: filePath,
      });
    }

    const safeInvoiceNo = (inv.data?.invoice_no || String(inv.id)).replace(/[\/\\]/g, "-");
    const filename = `${safeInvoiceNo}.pdf`;
    const stat = fs.statSync(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", stat.size);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error("PDF streaming error:", err);
    return res.status(500).json({ detail: `Failed to stream PDF: ${err.message || err}` });
  }
});

// --------------------------------------------------------------------------
// Health Check
// --------------------------------------------------------------------------
app.get("/api/health", (req, res) => {
  return res.json({
    status: "ok",
    service: "cargo-invoice-server",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Start server and initialize database
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Cargo Invoice Server] Server running on http://0.0.0.0:${PORT}`);
  db.initDb();
});

module.exports = app;
