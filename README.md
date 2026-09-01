# ✈️ Cholamandal Cargo Connections — Tax Invoice Portal

A full-stack, enterprise Cargo & Air Waybill (AWB) Tax Invoice generator portal built with **React (Vite)**, **Node.js/Express**, **PDFKit**, **pdfjs-dist**, and **MongoDB Atlas**.

---

## 📁 Project Structure

```text
cargo-invoice-app/
├── client/                     # Frontend (React + Vite + Tailwind CSS)
│   ├── public/                 # Favicons & static assets
│   ├── src/
│   │   ├── api/client.js       # Configured API client (reads VITE_API_BASE_URL)
│   │   ├── components/         # InvoiceTable, InvoiceEditorModal, DatePicker, PdfCanvasViewer
│   │   ├── context/            # AuthContext, ToastContext
│   │   └── utils/              # Calculation & formatter utilities
│   ├── .env.example            # Example frontend environment variables
│   ├── vercel.json             # Vercel SPA routing rewrite configuration
│   └── package.json            # Scripts: "dev", "build", "preview"
│
├── server/                     # Backend (Node.js + Express + MongoDB)
│   ├── assets/                 # Brand logo assets (CCC & IATA)
│   ├── storage/                # Uploads & generated PDF storage (gitignored)
│   ├── auth.js                 # JWT & bcrypt authentication
│   ├── database.js             # Mongoose connection & Soft-Delete operations
│   ├── extraction.js           # PDF & AWB text extraction pipeline
│   ├── pdf_template.js         # Single-page A4 Cholamandal Tax Invoice template
│   ├── seed.js                 # Default accounts seeder
│   ├── server.js               # Express API, CORS & Health check
│   ├── .env.example            # Example backend environment variables
│   └── package.json            # Scripts: "start", "dev", "seed"
│
├── .gitignore                  # Root gitignore (excludes secrets, node_modules, storage)
├── render.yaml                 # Render Blueprint deployment specification
└── README.md                   # Complete deployment & setup guide
```

---

## 🚀 Deployment Guide (GitHub ➔ Render ➔ Vercel)

### Step 1: Initialize Git & Push to GitHub

1. Open your terminal in the project root directory:
   ```bash
   cd c:\Users\SHAN\Downloads\cargo-invoice-app\cargo-invoice-app
   ```

2. Initialize Git (if not already done) and commit the project:
   ```bash
   git init
   git add .
   git commit -m "feat: complete cargo invoice app with soft delete and deployment configs"
   ```

3. Create a new repository on [GitHub](https://github.com/new) (e.g. `cargo-invoice-app`), then push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<your-username>/cargo-invoice-app.git
   git push -u origin main
   ```

---

### Step 2: Deploy Backend Server on Render

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`cargo-invoice-app`).
4. Configure the Web Service settings:
   - **Name**: `cargo-invoice-server`
   - **Region**: Closest to your users (e.g. Singapore or Frankfurt)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, add the following keys:
   | Key | Example Value | Description |
   |:---|:---|:---|
   | `NODE_ENV` | `production` | Production mode |
   | `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/cargo_invoice?retryWrites=true&w=majority` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `generate_a_random_32_character_string_here` | Strong secret for JWT signing |
   | `CLIENT_ORIGIN` | `http://localhost:5500` *(update after Step 3)* | Allowed frontend URL for CORS |
6. Click **Create Web Service**.
7. Once deployed, copy your backend URL:
   `https://cargo-invoice-server-xxxx.onrender.com`
8. Verify server health by opening in browser:
   `https://cargo-invoice-server-xxxx.onrender.com/api/health`

---

### Step 3: Deploy Frontend Client on Vercel

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project**.
3. Import your GitHub repository (`cargo-invoice-app`).
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)
5. Expand **Environment Variables** and add:
   | Key | Value |
   |:---|:---|
   | `VITE_API_BASE_URL` | `https://cargo-invoice-server-xxxx.onrender.com/api` *(Your Render backend URL + `/api`)* |
6. Click **Deploy**.
7. Once completed, copy your Vercel URL:
   `https://cargo-invoice-client.vercel.app`

---

### Step 4: Update Server CORS Origin on Render

1. Go back to your [Render Dashboard](https://dashboard.render.com/) ➔ Select `cargo-invoice-server` ➔ **Environment**.
2. Update the `CLIENT_ORIGIN` variable with your live Vercel domain:
   ```text
   CLIENT_ORIGIN = https://cargo-invoice-client.vercel.app
   ```
3. Render will automatically redeploy with the updated CORS policy.

---

## 🛠️ Local Development Setup

### 1. Server Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm install
npm run seed      # Seeds default accounts (admin, operator, accounts, operations)
npm run dev       # Starts server on http://localhost:8000
```

### 2. Client Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev       # Starts client on http://localhost:5500
```

### Default Login Accounts (Pre-seeded):
| Username | Password | Role |
|:---|:---|:---|
| `admin` | `admin123` | Administrator |
| `operator` | `operator123` | Invoice Operator |
| `accounts` | `accounts123` | Accounts Department |
| `operations` | `operations123` | Logistics & Operations |

---

## ✨ Features Included

1. **AI / PDF Extraction Pipeline**: Extracts all 12 Bill Details, Shipper, Consignee, and rates from uploaded cargo PDFs/AWBs.
2. **Exact Cholamandal Tax Invoice Template**: Single-page A4 PDF output with CCC Cloudinary logo, clean IATA logo, 14 predefined charges, bank details, notes, and authorized signatory.
3. **Automatic Calculations**:
   - `Taxable Amount = C.WT × Freight Rate`
   - Real-time 9% CGST + 9% SGST / 18% IGST computations.
   - Column Subtotals, Round Off, Grand Total, and Amount in Words.
4. **Interactive React DatePicker**: `DD/MM/YYYY` format, today's date default, manual typing, and month/year navigation.
5. **Soft-Delete & Trash Management**:
   - Soft-deleted items are safely moved to Trash with `deletedAt` timestamps.
   - One-click **Restore** and secure **Delete Forever** with confirmation dialogs.
   - Excluded from active counts, lists, and operations.
