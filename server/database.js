const fs = require("fs");
const mongoose = require("mongoose");
const auth = require("./auth");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, default: "" },
  password_hash: { type: String, required: true },
  created_at: { type: Number, default: () => Date.now() / 1000 },
});

const InvoiceSequenceSchema = new mongoose.Schema({
  financial_year: { type: String, required: true, unique: true, index: true },
  last_sequence: { type: Number, required: true, default: 489 },
});

const InvoiceSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["Draft", "Processing", "Completed", "Failed"],
    default: "Draft",
    index: true,
  },
  source_filename: { type: String, default: "" },
  error_message: { type: String, default: null },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  generated_pdf_path: { type: String, default: null },
  created_by: { type: String, default: "" },
  created_at: { type: Number, default: () => Date.now() / 1000, index: true },
  updated_at: { type: Number, default: () => Date.now() / 1000 },
  deleted_at: { type: Date, default: null, index: true },
});

// Format document to standard object with `id` and `deletedAt`
function formatDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  if (!obj.data) obj.data = {};
  obj.deletedAt = obj.deleted_at ? obj.deleted_at.toISOString() : null;
  obj.deleted_at = obj.deletedAt;
  return obj;
}

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const InvoiceSequence = mongoose.models.InvoiceSequence || mongoose.model("InvoiceSequence", InvoiceSequenceSchema);
const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

let isConnected = false;
const inMemorySequences = new Map();
const inMemoryInvoices = new Map();

// --------------------------------------------------------------------------
// Financial Year and Sequential Invoice Number Generator
// Format: CCC/26-27/490
// Financial year: April 1 to March 31 of following year
// --------------------------------------------------------------------------
function parseDateForFY(dateVal) {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) return dateVal;
  if (typeof dateVal === "string") {
    const ddmmyyyy = dateVal.trim().match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      const dt = new Date(year, month, day);
      if (!isNaN(dt.getTime())) return dt;
    }
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function getFinancialYear(dateVal = new Date()) {
  const dt = parseDateForFY(dateVal);
  const year = dt.getFullYear();
  const month = dt.getMonth() + 1; // 1 to 12
  // Financial year starts in April (month 4) and ends in March of next year
  const startYear = month >= 4 ? year : year - 1;
  const endYear = startYear + 1;
  const startShort = String(startYear).slice(-2);
  const endShort = String(endYear).slice(-2);
  return `${startShort}-${endShort}`;
}

async function getNextInvoiceNumber(dateVal = new Date()) {
  const fy = getFinancialYear(dateVal);

  if (mongoose.connection.readyState === 1) {
    try {
      // 1. Check highest existing sequence in database for this financial year (including soft-deleted)
      const regex = new RegExp(`^CCC\/${fy}\/(\\d+)$`, "i");
      const existingDocs = await Invoice.find(
        { "data.invoice_no": { $regex: regex } },
        { "data.invoice_no": 1 }
      );

      let maxExistingSeq = 489;
      for (const inv of existingDocs) {
        const invNo = inv.data?.invoice_no;
        if (invNo) {
          const match = invNo.match(regex);
          if (match && match[1]) {
            const seq = parseInt(match[1], 10);
            if (!isNaN(seq) && seq > maxExistingSeq) {
              maxExistingSeq = seq;
            }
          }
        }
      }

      // 2. Synchronize sequence tracker
      let seqDoc = await InvoiceSequence.findOne({ financial_year: fy });
      if (!seqDoc) {
        seqDoc = await InvoiceSequence.create({
          financial_year: fy,
          last_sequence: Math.max(489, maxExistingSeq),
        });
      } else if (seqDoc.last_sequence < maxExistingSeq) {
        seqDoc.last_sequence = maxExistingSeq;
        await seqDoc.save();
      }

      // 3. Atomically increment sequence
      const updatedDoc = await InvoiceSequence.findOneAndUpdate(
        { financial_year: fy },
        { $inc: { last_sequence: 1 } },
        { new: true, upsert: true }
      );

      let nextSeq = updatedDoc ? updatedDoc.last_sequence : maxExistingSeq + 1;
      if (nextSeq < 490) {
        nextSeq = 490;
        if (updatedDoc) {
          updatedDoc.last_sequence = 490;
          await updatedDoc.save();
        }
      }

      return `CCC/${fy}/${nextSeq}`;
    } catch (err) {
      console.warn("MongoDB sequence lookup fallback:", err.message);
    }
  }

  // In-memory sequence counter fallback
  let currentSeq = inMemorySequences.get(fy) || 489;
  currentSeq += 1;
  inMemorySequences.set(fy, currentSeq);
  return `CCC/${fy}/${currentSeq}`;
}

async function initDb(seedUser = true) {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cargo_invoice";

  try {
    if (mongoose.connection.readyState === 0) {
      console.log(`[MongoDB] Connecting to ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 4000,
      });
      isConnected = true;
      console.log("[MongoDB] Connected successfully.");
    }

    if (seedUser && mongoose.connection.readyState === 1) {
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const existingAdmin = await User.findOne({ username: adminUsername });
      if (!existingAdmin) {
        await User.create({
          username: adminUsername,
          full_name: "Administrator",
          password_hash: auth.hashPassword(adminPassword),
          created_at: Date.now() / 1000,
        });
        console.log(`[MongoDB] Initialized secure admin user (${adminUsername}).`);
      }
    }
  } catch (err) {
    console.warn(`[MongoDB] Connection notice: ${err.message}. Server is ready and will connect once valid MONGODB_URI is provided in .env`);
  }
}

async function getUser(username) {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ username });
      return formatDoc(user);
    }
    return null;
  } catch (err) {
    console.error("getUser error:", err.message);
    return null;
  }
}

async function createInvoice(data = {}, status = "Draft", sourceFilename = "", createdBy = "", errorMessage = null) {
  const now = Date.now() / 1000;
  
  // Ensure invoice_no follows CCC/FY/SEQ
  if (!data.invoice_no || !String(data.invoice_no).trim()) {
    data.invoice_no = await getNextInvoiceNumber(data.inv_date || new Date());
  }

  if (mongoose.connection.readyState === 1) {
    const doc = await Invoice.create({
      status: status || "Draft",
      source_filename: sourceFilename,
      error_message: errorMessage,
      data: data,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
    return doc._id.toString();
  } else {
    const fakeId = "inv_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const mockDoc = {
      id: fakeId,
      status: status || "Draft",
      source_filename: sourceFilename,
      error_message: errorMessage,
      data: data,
      created_by: createdBy,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      deletedAt: null,
    };
    inMemoryInvoices.set(fakeId, mockDoc);
    return fakeId;
  }
}

async function getInvoice(invoiceId, includeDeleted = false) {
  if (!invoiceId) return null;
  try {
    if (mongoose.connection.readyState === 1) {
      const isObjectId = mongoose.Types.ObjectId.isValid(invoiceId);
      const query = isObjectId ? { _id: invoiceId } : { "data.invoice_no": invoiceId };
      if (!includeDeleted) {
        query.deleted_at = null;
      }
      const doc = await Invoice.findOne(query);
      return formatDoc(doc);
    } else {
      return inMemoryInvoices.get(invoiceId) || null;
    }
  } catch (err) {
    return null;
  }
}

async function updateInvoice(invoiceId, { data, status, generatedPdfPath, errorMessage } = {}) {
  if (!invoiceId) return null;
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await Invoice.findOne({ _id: invoiceId, deleted_at: null });
      if (!doc) return null;

      if (data !== undefined && data !== null) {
        const mergedData = { ...(doc.data || {}), ...data };
        if (!mergedData.invoice_no || !String(mergedData.invoice_no).trim()) {
          mergedData.invoice_no = await getNextInvoiceNumber(mergedData.inv_date || new Date());
        }
        doc.data = mergedData;
        doc.markModified("data");
      }

      if (status !== undefined && status !== null) {
        doc.status = status;
      }

      if (generatedPdfPath !== undefined && generatedPdfPath !== null) {
        doc.generated_pdf_path = generatedPdfPath;
      }

      if (errorMessage !== undefined) {
        doc.error_message = errorMessage;
      }

      doc.updated_at = Date.now() / 1000;
      await doc.save();
      return formatDoc(doc);
    } else {
      const existing = inMemoryInvoices.get(invoiceId);
      if (!existing) return null;
      if (data) existing.data = { ...(existing.data || {}), ...data };
      if (status) existing.status = status;
      if (generatedPdfPath) existing.generated_pdf_path = generatedPdfPath;
      if (errorMessage !== undefined) existing.error_message = errorMessage;
      existing.updated_at = Date.now() / 1000;
      inMemoryInvoices.set(invoiceId, existing);
      return existing;
    }
  } catch (err) {
    return null;
  }
}

async function listInvoices(search = null, status = null, trashOnly = false) {
  try {
    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (trashOnly) {
        query.deleted_at = { $ne: null };
      } else {
        query.deleted_at = null;
      }

      if (status && status !== "All") {
        query.status = status;
      }

      const docs = await Invoice.find(query).sort({ created_at: -1 });
      let result = docs.map(formatDoc);

      if (search) {
        const s = search.toLowerCase();
        result = result.filter((r) => {
          const d = r.data || {};
          const haystack = [
            d.invoice_no || "",
            d.ref_no || "",
            d.sb_no || "",
            d.shipper_invoice_no || "",
            d.awb_no || "",
            d.shipper_name || "",
            d.consignee_name || "",
            d.commodity || "",
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(s);
        });
      }

      return result;
    } else {
      let result = Array.from(inMemoryInvoices.values());
      if (trashOnly) {
        result = result.filter((r) => r.deleted_at !== null);
      } else {
        result = result.filter((r) => r.deleted_at === null);
      }
      if (status && status !== "All") {
        result = result.filter((r) => r.status === status);
      }
      return result;
    }
  } catch (err) {
    console.error("listInvoices error:", err.message);
    return [];
  }
}

async function softDeleteInvoice(invoiceId) {
  if (!invoiceId) return false;
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await Invoice.findById(invoiceId);
      if (!doc) return false;
      doc.deleted_at = new Date();
      doc.updated_at = Date.now() / 1000;
      await doc.save();
      return true;
    } else {
      const item = inMemoryInvoices.get(invoiceId);
      if (!item) return false;
      item.deleted_at = new Date();
      item.deletedAt = item.deleted_at.toISOString();
      return true;
    }
  } catch (err) {
    return false;
  }
}

async function restoreInvoice(invoiceId) {
  if (!invoiceId) return null;
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await Invoice.findById(invoiceId);
      if (!doc) return null;
      doc.deleted_at = null;
      doc.updated_at = Date.now() / 1000;
      await doc.save();
      return formatDoc(doc);
    } else {
      const item = inMemoryInvoices.get(invoiceId);
      if (!item) return null;
      item.deleted_at = null;
      item.deletedAt = null;
      return item;
    }
  } catch (err) {
    return null;
  }
}

async function permanentDeleteInvoice(invoiceId) {
  if (!invoiceId) return false;
  try {
    if (mongoose.connection.readyState === 1) {
      const doc = await Invoice.findById(invoiceId);
      if (!doc) return false;
      if (doc.generated_pdf_path && fs.existsSync(doc.generated_pdf_path)) {
        try {
          fs.unlinkSync(doc.generated_pdf_path);
        } catch (e) {}
      }
      await Invoice.findByIdAndDelete(invoiceId);
      return true;
    } else {
      return inMemoryInvoices.delete(invoiceId);
    }
  } catch (err) {
    return false;
  }
}

async function deleteInvoice(invoiceId) {
  return await softDeleteInvoice(invoiceId);
}

module.exports = {
  initDb,
  getUser,
  createInvoice,
  updateInvoice,
  getInvoice,
  listInvoices,
  softDeleteInvoice,
  restoreInvoice,
  permanentDeleteInvoice,
  deleteInvoice,
  getFinancialYear,
  getNextInvoiceNumber,
  User,
  Invoice,
  InvoiceSequence,
};
