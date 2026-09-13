# PROJECT CONTEXT — Themefisher Admin Tools (Finance Tools Suite)

> **Purpose of this file:** This is the single source of truth for all AI agents and developers working on this project. It tracks architecture, business rules, development history, and known constraints so that context is never lost across devices, sessions, or agents. **Update this file after every significant change.**

---

## 1. Project Overview

**Name:** Finance Tools Suite (Themefisher Admin Tools)
**Repo:** https://github.com/tftuhin/Themefisher-admin-tools
**Deployed:** Vercel (auto-deploys from `main` branch)
**Database:** Supabase (PostgreSQL)
**Framework:** Next.js 16.3.4 (App Router, Turbopack)
**Styling:** Tailwind CSS v4
**Language:** TypeScript 5

A unified internal tool for [Themefisher](https://themefisher.com) that handles:
1. **Invoice Tools** — Create invoices, manage clients, generate Bangladesh Bank Form-C for inward remittances.
2. **SCB Tools** — Generate Standard Chartered Bank bulk transaction Excel files, manage vendors/receivers and debit accounts.

---

## 2. Tech Stack & Key Dependencies

| Package | Purpose |
|---|---|
| `next` 16.3.4 | App framework (App Router) |
| `react` 19.2.8 | UI library |
| `@supabase/supabase-js` | Database client |
| `react-hook-form` | Form state management (invoice creation) |
| `react-select` | Searchable/creatable dropdowns (bank/branch select) |
| `react-to-print` | Print invoices & Form-C to PDF |
| `xlsx` | Generate SCB bulk transaction Excel exports |
| `lucide-react` | Icon library |
| `date-fns` | Date formatting utilities |

---

## 3. Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Dashboard home (tool selector)
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Global styles
│   ├── api/                              # API routes (currently empty)
│   ├── invoice-tools/
│   │   ├── layout.tsx                    # Invoice tools layout with sidebar
│   │   ├── page.tsx                      # Invoice list & Form-C generation
│   │   ├── create-invoice/page.tsx       # Create invoice form + PDF parsing
│   │   ├── clients/page.tsx              # Client management (CRUD)
│   │   └── settings/                     # Payment account settings
│   └── scb-tools/
│       ├── layout.tsx                    # SCB tools layout with sidebar
│       ├── page.tsx                      # Bulk transaction generator
│       ├── vendors/page.tsx              # Vendor management (CRUD)
│       └── debit-accounts/              # Debit account management
├── components/
│   ├── BankBranchSelect.tsx              # Searchable bank/branch dropdown with routing auto-fill
│   ├── BankInvoice.tsx                   # Invoice print template
│   ├── CForm.tsx                         # Bangladesh Bank Form-C template
│   ├── EditClientModal.tsx               # Client edit modal
│   ├── EditInvoiceModal.tsx              # Invoice edit modal
│   ├── InvoiceSidebar.tsx                # Invoice tools sidebar navigation
│   ├── SCBSidebar.tsx                    # SCB tools sidebar navigation
│   ├── SearchableClientSelect.tsx        # Client search/select for invoice creation
│   └── SearchableVendorSelect.tsx        # Vendor search/select for SCB transactions
├── lib/
│   └── supabase.ts                       # Supabase client initialization
└── types/
    └── index.ts                          # All TypeScript interfaces
```

---

## 4. Database Schema (Supabase)

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `clients` | Invoice recipients (foreign companies) | `name`, `address`, `tax_id`, `bank_name`, `bank_address` |
| `invoices` | All invoices issued | `client_id` (FK), `invoice_number` (UNIQUE), `invoice_date`, `amount`, `received_amount`, `description`, `currency`, `payment_methods[]` |
| `payment_accounts` | Themefisher's bank accounts for receiving payments | `bank_name`, `account_number`, `name_on_account`, `bic_swift` |
| `vendors` | SCB payment receivers | `receiver_name`, `account_number`, `bank_name`, `branch_name`, `routing_number` |
| `debit_accounts` | SCB debit accounts for outgoing payments | `account_number`, `account_label`, `bank_name`, `is_default` |
| `bank_branches` | 10,976 Bangladesh bank branches (read-only reference) | `bank_code`, `bank_name`, `district_name`, `branch_name`, `routing_number` (UNIQUE) |

### Row Level Security (RLS)
- All tables have RLS enabled.
- `bank_branches`: Public read + insert policies (insert was needed for initial data migration).
- Other tables: Configured via Supabase dashboard.

### Full schema: `supabase_schema.sql` (committed to repo root)

---

## 5. Business Rules & Logic

### Invoice Tools
- **Invoice Number Format:** `TF-YYYY-MM-DD-XX` (auto-generated, user can modify).
- **Duplicate Prevention:** Invoice numbers are UNIQUE in the database. The form blocks submission if the number already exists (checked against local state).
- **Description Default:** Pre-filled with `"Web development services"` — user can modify.
- **PDF Parsing:** Users can upload a password-protected PDF (password: `T137101`) to auto-fill invoice fields.
  - **Invoice Date** = Value Date from PDF minus 7 days.
  - **Remitted Amount:** If left empty, defaults to the invoice amount. If a custom amount is entered, that value is used and appears on the Form-C.
- **Form-C:** Bangladesh Bank inward remittance form, generated from invoice data for printing.

### SCB Tools
- **Vendor Bank Selection:** Uses `BankBranchSelect` component — searchable dropdown backed by 10,976 bank branches in Supabase. Selecting bank → filters branches → auto-fills routing number.
- **Custom Entry:** If bank/branch isn't in the official list, user can type custom values (CreatableSelect).
- **Debit Account:** The default SCB debit account number is stored in `process.env.NEXT_PUBLIC_SCB_DEBIT_ACCOUNT` (never hardcoded in source).
- **Excel Export:** Generates `.xlsx` file formatted for SCB bulk transaction upload.

---

## 6. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
NEXT_PUBLIC_SCB_DEBIT_ACCOUNT=<scb-debit-account-number>
```

> ⚠️ **Security:** The SCB debit account number must NEVER be hardcoded in source code or README. It is only stored in `.env.local` (gitignored) and Vercel environment variables.

---

## 7. Known Constraints & Gotchas

1. **Supabase 1000-row limit:** All Supabase queries return max 1000 rows by default. Pagination is required for large datasets (e.g., `BankBranchSelect` paginates through all 11K bank branches).
2. **`canvas` package:** Required for `pdfjs-dist` PDF parsing. `next.config.ts` has special Webpack alias (`canvas: false`) and `serverExternalPackages: ["canvas"]` to handle this.
3. **Module format:** `package.json` must NOT have `"type": "commonjs"` — it breaks `react-select` and other ESM packages with Next.js Turbopack.
4. **PDF password:** The fixed password for parsing bank PDFs is `T137101`.
5. **Dynamic imports:** `BankBranchSelect` is loaded via `next/dynamic` with `ssr: false` to avoid hydration issues with `react-select`.

---

## 8. Development History (Changelog)

### 2026-09-10 — Initial Setup & Core Features
- Initial commit: Unified Invoice + Form-C tools and SCB Transaction Generator into a single Next.js app.
- Configured Supabase database with `clients`, `invoices`, `payment_accounts`, `vendors`, `debit_accounts` tables.
- Built dashboard home page with tool selector cards.
- Added comprehensive README.
- Configured OpenGraph metadata and image.
- Renamed sidebar items and fixed layout shift bug.

### 2026-09-10 — PDF Auto-Fill & Invoice Enhancements
- Added PDF upload and parsing for auto-filling invoice fields from bank remittance PDFs.
- Implemented custom alert modal (centered, matching app design).
- Scrubbed hardcoded SCB debit account numbers from codebase (moved to env vars).
- Code sanitization: removed unused PDF parser API route, formatted codebase.

### 2026-09-13 — Duplicate Prevention & Defaults
- Added duplicate invoice number prevention (blocks form submission).
- Added warning when PDF-parsed invoice number already exists.
- Set default description to "Web development services" (pre-filled, user-editable).

### 2026-09-13 — Bank Branch Routing Number Integration
- Uploaded complete Bangladesh bank branch dataset (10,976 records) to Supabase `bank_branches` table.
- Created `BankBranchSelect` component with `react-select/creatable`:
  - Searchable bank name dropdown (fetches all unique banks with pagination).
  - Dynamic branch dropdown (filters by selected bank, shows district).
  - Auto-fills routing number on branch selection.
  - Supports custom bank/branch entry for unlisted banks.
- Integrated into vendor Add and Edit forms.
- Cleaned up: removed temp scripts, unused SVGs, and data files.
- Fixed `package.json` module format conflict (removed `"type": "commonjs"`).

---

## 9. Deployment

- **Platform:** Vercel
- **Auto-deploy:** Push to `main` branch triggers deployment.
- **Environment:** Variables configured in Vercel dashboard.
- **Build command:** `next build`
- **Dev server:** `npm run dev` (runs on localhost:3000)

---

## 10. How to Continue Development

1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in Supabase credentials + SCB debit account.
3. Run `npm run dev` to start the dev server.
4. The Supabase database is shared — no local DB setup needed.
5. **After making changes:** Update this `CONTEXT.md` file with what you changed, then commit and push.

---

*Last updated: 2026-09-13*
