const fs = require("fs");
const mongoose = require("mongoose");
const auth = require("./auth");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  full_name: { type: String, default: "" },
  password_hash: { type: String, required: true },
  created_at: { type: Number, default: () => Date.now() / 1000 },
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
const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);

let isConnected = false;

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

    if (seedUser) {
      const adminUser = await User.findOne({ username: "admin" });
      if (!adminUser) {
        await User.create({
          username: "admin",
          full_name: "Administrator",
          password_hash: auth.hashPassword("admin123"),
          created_at: Date.now() / 1000,
        });
        console.log("[MongoDB] Seeded default admin user.");
      }

      const operatorUser = await User.findOne({ username: "operator" });
      if (!operatorUser) {
        await User.create({
          username: "operator",
          full_name: "Invoice Operator",
          password_hash: auth.hashPassword("operator123"),
          created_at: Date.now() / 1000,
        });
        console.log("[MongoDB] Seeded default operator user.");
      }
    }
  } catch (err) {
    console.warn(`[MongoDB] Connection notice: ${err.message}. Server is ready and will connect once valid MONGODB_URI is provided in .env`);
  }
}

async function getUser(username) {
  try {
    const user = await User.findOne({ username });
    return formatDoc(user);
  } catch (err) {
    console.error("getUser error:", err.message);
    return null;
  }
}

async function createInvoice(data, status, sourceFilename, createdBy, errorMessage = null) {
  const now = Date.now() / 1000;
  const doc = await Invoice.create({
    status: status || "Draft",
    source_filename: sourceFilename,
    error_message: errorMessage,
    data: data || {},
    created_by: createdBy,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  });
  return doc._id.toString();
}

async function getInvoice(invoiceId, includeDeleted = false) {
  if (!invoiceId) return null;
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(invoiceId);
    const query = isObjectId ? { _id: invoiceId } : { "data.invoice_no": invoiceId };
    if (!includeDeleted) {
      query.deleted_at = null;
    }
    const doc = await Invoice.findOne(query);
    return formatDoc(doc);
  } catch (err) {
    return null;
  }
}

async function updateInvoice(invoiceId, { data, status, generatedPdfPath, errorMessage } = {}) {
  if (!invoiceId) return null;
  try {
    const doc = await Invoice.findOne({ _id: invoiceId, deleted_at: null });
    if (!doc) return null;

    if (data !== undefined && data !== null) {
      doc.data = { ...(doc.data || {}), ...data };
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
  } catch (err) {
    return null;
  }
}

async function listInvoices(search = null, status = null, trashOnly = false) {
  try {
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
  } catch (err) {
    console.error("listInvoices error:", err.message);
    return [];
  }
}

async function softDeleteInvoice(invoiceId) {
  if (!invoiceId) return false;
  try {
    const doc = await Invoice.findById(invoiceId);
    if (!doc) return false;
    doc.deleted_at = new Date();
    doc.updated_at = Date.now() / 1000;
    await doc.save();
    return true;
  } catch (err) {
    return false;
  }
}

async function restoreInvoice(invoiceId) {
  if (!invoiceId) return null;
  try {
    const doc = await Invoice.findById(invoiceId);
    if (!doc) return null;
    doc.deleted_at = null;
    doc.updated_at = Date.now() / 1000;
    await doc.save();
    return formatDoc(doc);
  } catch (err) {
    return null;
  }
}

async function permanentDeleteInvoice(invoiceId) {
  if (!invoiceId) return false;
  try {
    const doc = await Invoice.findById(invoiceId);
    if (!doc) return false;
    if (doc.generated_pdf_path && fs.existsSync(doc.generated_pdf_path)) {
      try {
        fs.unlinkSync(doc.generated_pdf_path);
      } catch (e) {}
    }
    await Invoice.findByIdAndDelete(invoiceId);
    return true;
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
  User,
  Invoice,
};
