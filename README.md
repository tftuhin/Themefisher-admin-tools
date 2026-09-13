# Business Finance & Banking Suite

A unified Next.js application that brings together international inward remittance billing, Bangladesh Bank Form-C generation, and Standard Chartered Bank (SCB) bulk transaction Excel export into a single repository, single deployment, and single database.

---

## 🎯 Key Capabilities

### 1. Central Tools Dashboard (`/`)
- Interactive cards/tiles for each specialized financial tool.
- Real-time live status metrics (Clients, Invoices, Payment Accounts, Vendors, Debit Accounts).
- Quick-action shortcuts directly into tool sub-features.
- One-click instant navigation with dedicated **"← Dashboard Hub"** home buttons in every tool.

### 2. Invoice & Form-C Generator (`/invoice-tools`)
- **Official Form-C (ICT)**: Bangladesh Bank declaration format for inward remittance exceeding USD 10,000.
- **Bank Invoice**: Clean invoice layout with remitter/beneficiary details and client details.
- **Pixel-Perfect A4 Printing**: Embedded `@media print` engine with one-click print and PDF export.
- **Auto-Numbered Invoicing**: Sequential invoice generator (`TF-YYYY-MM-DD-XX`).
- **Client & Payment Directory**: Manage international clients with overseas bank details and tax IDs.

### 3. SCB Bulk Transection Generator (`/scb-tools`)
- **Bulk Excel (.xlsx) Export**: Produces bank transfer sheets compliant with SCB format specifications.
- **Beneficiary Vendor Pool**: Full CRUD directory for vendor bank accounts, branches, and 9-digit routing codes.
- **Multi-Account Debit Sources**: Maintain funding accounts with default account auto-selection.
- **Multi-Row Batch Grid**: Add, delete, and duplicate transfer entries with autocomplete receiver search.

---

## 🚀 Quick Start

### 1. Configure Environment Variables
Create `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SCB_DEBIT_ACCOUNT=your-scb-debit-account-number
```

### 2. Setup Database (Single SQL Script)
Run the consolidated script [`supabase_schema.sql`](./supabase_schema.sql) in your **Supabase SQL Editor** (SQL Editor -> New query -> Paste & Run).

It will create all 5 tables with Row Level Security (RLS) and index optimizations:
- `clients`
- `payment_accounts`
- `invoices`
- `vendors`
- `debit_accounts`

### 3. Run Locally
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Architecture & Structure

```
finance-tools-suite/
├── public/                     # Static assets (logos, signatures, icons)
│   ├── themefisher_logo.png    # Official invoice logo
│   └── signature.png           # Form-C authorized signature
├── src/
│   ├── app/
│   │   ├── page.tsx            # Main Tools Dashboard
│   │   ├── layout.tsx          # Root Application Layout
│   │   ├── globals.css         # Tailwind & A4 Print Media Queries
│   │   ├── invoice-tools/      # Tool 1: Invoice & Form-C Suite
│   │   │   ├── layout.tsx      # Tool layout with InvoiceSidebar
│   │   │   ├── page.tsx        # Document previewer & printer
│   │   │   ├── create-invoice/ # Invoice creator & list
│   │   │   ├── clients/        # Client manager
│   │   │   └── settings/       # Bank payout accounts
│   │   └── scb-tools/          # Tool 2: SCB Transaction Generator
│   │       ├── layout.tsx      # Tool layout with SCBSidebar
│   │       ├── page.tsx        # Multi-row transfer editor & XLSX exporter
│   │       ├── vendors/        # Beneficiary vendor pool
│   │       └── debit-accounts/ # SCB debit accounts manager
│   ├── components/
│   │   ├── InvoiceSidebar.tsx  # Sidebar + "← Dashboard Hub" button
│   │   ├── SCBSidebar.tsx      # Sidebar + "← Dashboard Hub" button
│   │   ├── BankInvoice.tsx     # Printable bank invoice component
│   │   ├── CForm.tsx           # Printable Form-C component
│   │   ├── SearchableClientSelect.tsx
│   │   ├── SearchableVendorSelect.tsx
│   │   ├── EditInvoiceModal.tsx
│   │   └── EditClientModal.tsx
│   ├── lib/
│   │   └── supabase.ts         # Unified Supabase client
│   └── types/
│       └── index.ts            # Consolidated TypeScript types
├── supabase_schema.sql         # Consolidated database DDL
├── package.json
└── tsconfig.json
```

---

## 📄 License
MIT
