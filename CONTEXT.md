# PROJECT CONTEXT — Themefisher Admin Tools (Finance Tools Suite)

> **🚨 MANDATORY FOR ALL AI AGENTS:** Read this entire file before writing any code. After making ANY change (even a single line), you MUST append a new entry to the **Development Log** at the bottom of this file. Commit this file together with your code changes. No exceptions.

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

## 8. Deployment

- **Platform:** Vercel
- **Auto-deploy:** Push to `main` branch triggers deployment.
- **Environment:** Variables configured in Vercel dashboard.
- **Build command:** `next build`
- **Dev server:** `npm run dev` (runs on localhost:3000)

---

## 9. How to Continue Development

1. Clone the repo and run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in Supabase credentials + SCB debit account.
3. Run `npm run dev` to start the dev server.
4. The Supabase database is shared — no local DB setup needed.
5. **Read this entire `CONTEXT.md` before making any changes.**
6. **After every change:** Prepend a log entry (see format below), then commit.

---

## Development Log

> **Format for new entries (prepend at the top, newest first):**
> ```
> ### YYYY-MM-DD HH:MM — [Short Summary]
> **Agent/Dev:** [Agent name or "Manual"]
> **Files changed:**
> - `path/to/file.tsx` — what changed and why
> **Decisions & notes:**
> - Any new constraints, business rules, or architectural decisions
> ```

---

<!-- NEW LOG ENTRIES GO BELOW THIS LINE -->

### 2026-09-13 11:47 — Added CONTEXT.md & Agent Rules
**Agent/Dev:** Claude (Opus 4.6)
**Files changed:**
- `CONTEXT.md` — **[NEW]** Comprehensive project context and development log
- `AGENTS.md` — Added mandatory rules for reading `CONTEXT.md` and updating the development log
**Decisions & notes:**
- Every AI agent must read `CONTEXT.md` before coding and append a log entry after every change
- Log format includes: timestamp, agent name, files changed, decisions & notes
- This ensures continuity across devices, agents, and sessions

---

### 2026-09-13 11:25 — Bank Branch Routing Number Integration
**Agent/Dev:** Gemini (Antigravity) + Claude (Opus 4.6)
**Files changed:**
- `src/components/BankBranchSelect.tsx` — **[NEW]** Searchable bank/branch dropdown with routing auto-fill using `react-select/creatable`
- `src/app/scb-tools/vendors/page.tsx` — Replaced plain text inputs with `BankBranchSelect` in both Add and Edit forms
- `supabase_schema.sql` — Added `bank_branches` table schema
- `package.json` — Added `react-select` dependency; removed accidental `"type": "commonjs"`
**Decisions & notes:**
- Uploaded 10,976 Bangladesh bank branch records to Supabase `bank_branches` table
- RLS: public read + insert policies on `bank_branches`
- Supabase returns max 1000 rows per query — `BankBranchSelect` paginates to fetch all unique bank names
- `BankBranchSelect` loaded via `next/dynamic` with `ssr: false` (avoids hydration mismatch)
- Users can enter custom bank/branch names not in the official list (CreatableSelect)
- Cleaned up: removed temp migration scripts, unused Next.js boilerplate SVGs, `src/data/` directory

---

### 2026-09-13 10:30 — Duplicate Invoice Prevention & Description Default
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/create-invoice/page.tsx` — Added duplicate invoice number check (blocks submission if number exists in local state); set default description to "Web development services" (pre-filled via `useForm` defaultValues + `setValue` on mount)
**Decisions & notes:**
- Invoice numbers are UNIQUE in database — no two invoices can share the same number
- Description is pre-filled but user-editable
- PDF parsing also warns if parsed invoice number already exists

---

### 2026-09-10 14:00 — PDF Auto-Fill & Security Hardening
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/create-invoice/page.tsx` — Added PDF upload/parsing to auto-fill invoice fields from bank remittance PDFs
- `src/components/BankInvoice.tsx` — Invoice print template
- `src/components/CForm.tsx` — Form-C template for inward remittance
- `next.config.ts` — Added Webpack alias for `canvas: false` and `serverExternalPackages: ["canvas"]`
**Decisions & notes:**
- PDF password is fixed: `T137101`
- Invoice Date = Value Date (from PDF) minus 7 days
- Remitted Amount: defaults to invoice amount if left empty; custom entry overrides
- Scrubbed all hardcoded SCB debit account numbers — moved to `NEXT_PUBLIC_SCB_DEBIT_ACCOUNT` env var
- Removed unused PDF parser API route (`src/app/api/`) for performance
- Custom alert modal implemented (centered, matches app design)

---

### 2026-09-10 09:00 — Initial Project Setup
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/page.tsx` — Dashboard home with tool selector cards
- `src/app/layout.tsx` — Root layout with metadata
- `src/app/invoice-tools/*` — Invoice creation, client management, settings
- `src/app/scb-tools/*` — SCB transaction generator, vendor management, debit accounts
- `src/components/*` — All shared components (sidebars, modals, forms, templates)
- `src/lib/supabase.ts` — Supabase client initialization
- `src/types/index.ts` — All TypeScript interfaces
- `supabase_schema.sql` — Complete database schema
**Decisions & notes:**
- Unified two separate tools (Invoice/Form-C + SCB) into a single Next.js app
- Supabase chosen for database (shared across all environments)
- Tables created: `clients`, `invoices`, `payment_accounts`, `vendors`, `debit_accounts`
- OpenGraph image and metadata configured
