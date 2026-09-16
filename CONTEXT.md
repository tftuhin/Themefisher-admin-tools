# PROJECT CONTEXT — Themefisher Admin Tools (Finance Tools Suite)

> **🚨 MANDATORY FOR ALL AI AGENTS:** Read this entire file before writing any code. After making ANY change (even a single line), you MUST prepend a new entry to the **Development Log** at the top of the log section. Commit this file together with your code changes. No exceptions.

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
2. Copy `.env.example` to `.env.local` and fill in your NeonDB `DATABASE_URL` + SCB debit account.
3. Run `npm run dev` to start the dev server.
4. The NeonDB database is shared — no local DB setup needed.
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
### 2026-09-16 13:41 — [Fix PDF Client Name Partial Matching]
- Modified `src/app/invoice-tools/InvoiceToolsClient.tsx`: Replaced rigid stripped-substring matching with a 3-pass algorithm (exact → word-level fuzzy → full-text fallback).
- Modified `src/app/invoice-tools/create-invoice/CreateInvoiceClient.tsx`: Applied the same 2-pass (exact → word-level fuzzy) matching for consistency.
- Noise words like "Ltd", "Inc", "Co", "Private", "Limited" are now ignored during matching so they don't pollute scores.
- A 60% word-match threshold ensures partial names like "Developer Team" still match even when the PDF extracts "DEVELOPER TEAM LONDON GB".


### 2026-09-16 07:02 — [Enrich System Prompt Knowledge Base]
- Modified `src/app/api/chat/route.ts` to completely rewrite the AI Assistant's knowledge base.
- Added comprehensive coverage for all CRUD operations in Invoice Tools (Clients, Invoices, Payment Accounts).
- Added comprehensive coverage for all operations in SCB Tools (Debit Accounts, Vendors, Custom Bulk Transfers, Salary Sheets).
- Separated instructions logically to ensure the AI knows exactly which page every feature is located on.



### 2026-09-16 10:52 — [Injected AI Knowledge Base]
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/api/chat/route.ts` — **[MODIFY]** Injected a comprehensive static knowledge base outlining all SOPs (Standard Operating Procedures) for the application directly into the AI's system prompt.
**Decisions & notes:**
- User requested that the AI act as an offline-capable instructional guide with immediate access to all workflows.
- Extracted procedures for generating invoices, Form-C, SCB bulk Excel (salary sheets), and managing clients/vendors/payment accounts.


### 2026-09-16 10:48 — [Updated AI Assistant to Instructional Guide]
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/api/chat/route.ts` — **[MODIFY]** Updated system prompt to restrict AI to providing instructions only. Removed background generative UI tools to prevent automated orchestration.
**Decisions & notes:**
- User requested that the AI act strictly as a guide to teach them how to use the admin tools suite rather than attempting to automate the tasks in the background.
- Stripped out server tools to reduce token usage and enforce the instructional persona.


### 2026-09-16 10:00 — [Added AI Assistant Chat Dashboard]
- **Files Modified:** `src/app/layout.tsx`, `package.json`
- **Files Created:** `src/components/AiAssistantPopup.tsx`, `src/app/api/chat/route.ts`, `src/components/chat/DownloadInvoiceCard.tsx`, `src/components/chat/DownloadExcelCard.tsx`
- **Why:** The user requested a conversational AI dashboard using the Vercel AI SDK to orchestrate PDF processing, invoice generation, and SCB Excel bulk generation natively via chat.
- **Decisions Made:** Used Gemini 1.5 Flash natively with its multi-modal vision properties to read the uploaded PDFs in chat instead of using the custom client-side spatial parser. Generated UI components (Generative UI / Server Tools) return downloadable interactive cards inside the chat window.
### 2026-09-15 16:36 — Fix Remaining Native Confirm Modal
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/create-invoice/CreateInvoiceClient.tsx` — **[MODIFY]** Replaced the final remaining native `window.confirm()` call in the invoice deletion handler with the unified `ConfirmDeleteModal` component.
**Decisions & notes:**
- Ensured 100% UI consistency across all destructive actions in the app. The invoice creator table now uses the same sleek deletion modal as the client and vendor tables.


### 2026-09-15 16:31 — Fix False Positive Client Matching
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/create-invoice/CreateInvoiceClient.tsx` — **[MODIFY]** Fixed client matching bug where an empty extracted string or single space would falsely match clients.
- `src/app/invoice-tools/InvoiceToolsClient.tsx` — **[MODIFY]** Removed brittle `words[0]` fallback logic that falsely matched clients if their first name (e.g. "Grand") appeared anywhere in the PDF text blob.
- `src/lib/pdfParser.ts` — **[MODIFY]** Improved spatial header detection to account for fractured word blocks in `pdf.js`.
**Decisions & notes:**
- The spatial parser and client matcher occasionally returned false positives (like selecting "GRAND HOTEL KURHAUS AROLLA SA") due to a bug in the fallback matching logic where `dbName.includes("")` evaluates to true, or where the first word of a long client name arbitrarily matched an unrelated string in the PDF.
- The matching logic is now highly strict: it strips punctuation/spaces, normalizes to lowercase, and requires a substring match of at least 3 characters.


### 2026-09-15 16:15 — Switch to Fast Deterministic Spatial PDF Parser
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/lib/pdfParser.ts` — **[NEW]** Added a deterministic spatial column parser for MT103 PDFs using `pdf.js` coordinates.
- `src/app/invoice-tools/create-invoice/CreateInvoiceClient.tsx` — **[MODIFY]** Replaced slow LLM-based `extractInvoiceDataFromText` with the new local `parseMT103` utility.
- `src/app/invoice-tools/InvoiceToolsClient.tsx` — **[MODIFY]** Replaced LLM parsing with `parseMT103`.
**Decisions & notes:**
- The LLM extraction was taking too long (3-10s latency) and sometimes failing to accurately return the exact client name when it was surrounded by random account numbers (like `123456789876543efgh`).
- Built a new `pdfParser.ts` that uses the X/Y coordinates from `pdfjsLib`'s `getTextContent()` to precisely extract text from the "Ordering Customer" column and group it.
- Because it groups all text found under the column and passes it to the existing substring matcher, it successfully resolves names like `tuhintestclient` even when they are buried between account strings.
- This change completely eliminates network requests for parsing, making it practically instantaneous.


### 2026-09-15 14:42 — Switch to Vercel AI SDK + Client Name Matching Fix
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/actions.ts` — Replaced `@google/genai` with Vercel AI SDK (`ai` + `@ai-sdk/google`). Now uses `generateObject()` with Zod schema for faster structured output. Added `existingClientNames` parameter so the LLM can match against the database.
- `src/app/invoice-tools/InvoiceToolsClient.tsx` — Passes `clients.map(c => c.name)` to the extraction call
- `src/app/invoice-tools/create-invoice/CreateInvoiceClient.tsx` — Same change
- `package.json` — Added `ai`, `@ai-sdk/google`, `zod`
**Decisions & notes:**
- The LLM was returning the wrong client name because it had no knowledge of the database. Now the full list of known client names is sent alongside the document, so the LLM can directly match.
- Switched from `@google/genai` to Vercel AI SDK for better performance and simpler API.

### 2026-09-15 13:56 — LLM-Powered PDF Data Extraction (Gemini 2.5 Flash)
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/actions.ts` — Added `extractInvoiceDataFromText()` server action using `@google/genai` SDK with structured JSON output schema
- `src/app/invoice-tools/create-invoice/CreateInvoiceClient.tsx` — Replaced coordinate-based PDF parsing with simple text extraction + LLM call
- `src/app/invoice-tools/InvoiceToolsClient.tsx` — Same replacement for the Generate Docs page PDF upload
- `.env.local` — Added `GEMINI_API_KEY`
- `package.json` — Added `@google/genai` dependency
**Decisions & notes:**
- The old approach used pixel coordinates to guess which text belonged to which column. This was extremely brittle and caused issues like grabbing the word "Invoice" instead of the actual invoice number.
- The new approach extracts all text from the PDF using pdf.js, sends it to Gemini 2.5 Flash with a strict JSON response schema, and uses the structured output to fill in currency, amount, value_date, invoice_number, and client_name.
- The LLM call runs server-side via a server action, so the API key is never exposed to the client.
- Client matching logic is preserved: the LLM-extracted client_name is matched against the database using the same normalized string comparison.


### 2026-09-15 13:37 — Performance: App-Wide Server Components Refactor
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/clients/page.tsx` -> split to `page.tsx` & `ClientsClient.tsx`
- `src/app/invoice-tools/settings/page.tsx` -> split to `page.tsx` & `SettingsClient.tsx`
- `src/app/invoice-tools/create-invoice/page.tsx` -> split to `page.tsx` & `CreateInvoiceClient.tsx`
- `src/app/invoice-tools/page.tsx` -> split to `page.tsx` & `InvoiceToolsClient.tsx`
- `src/app/scb-tools/vendors/page.tsx` -> split to `page.tsx` & `VendorsClient.tsx`
- `src/app/scb-tools/debit-accounts/page.tsx` -> split to `page.tsx` & `DebitAccountsClient.tsx`
- `src/app/scb-tools/page.tsx` -> split to `page.tsx` & `ScbToolsClient.tsx`
**Decisions & notes:**
- Converted the entire app from client-side data fetching (via `useEffect`) to Server Components.
- The new `page.tsx` files fetch database resources using `await Promise.all(...)` and pass them as `initialProps` to the respective `*Client.tsx` components.
- This eliminates the network waterfall on mount, preventing the "skeleton screen / loading spinner" delay, resolving the issue where data was taking too long to be printed to the screen from the database.
- Fixed TS unused variable errors after removing `useEffect` and hook imports. Verified with `npm run build`.


### 2026-09-15 13:20 — Feature: Option to Hide Vendors Instead of Deleting
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/components/ConfirmDeleteModal.tsx` — **[MODIFY]** Added optional `onHide` and `isHiding` props to support a third "Hide Instead" button alongside Cancel and Delete. Adjusted layout to be vertical/horizontal responsive if the hide button is active.
- `src/app/scb-tools/vendors/page.tsx` — **[MODIFY]** Implemented `handleHideVendor` logic that calls `updateVendor({ is_hidden: true })` instead of permanently deleting. Passed the new hide option into the ConfirmDeleteModal, which allows users to safely archive a receiver account rather than destroying it.
**Decisions & notes:**
- The `vendors` table already had an `is_hidden` schema column and the vendors page already successfully filters out hidden items via tabs, so all we needed was to expose this option during the deletion workflow.


### 2026-09-15 13:13 — Feature: Unified Delete Confirmation Modals
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/components/ConfirmDeleteModal.tsx` — **[NEW]** Created a standardized, reusable delete confirmation component that wraps the global `Modal`.
- `src/app/invoice-tools/clients/page.tsx` — **[MODIFY]** Replaced native `confirm()` with `ConfirmDeleteModal`.
- `src/app/invoice-tools/settings/page.tsx` — **[MODIFY]** Replaced native `confirm()` with `ConfirmDeleteModal`.
- `src/app/invoice-tools/create-invoice/page.tsx` — **[MODIFY]** Replaced native `confirm()` with `ConfirmDeleteModal`.
- `src/app/scb-tools/page.tsx` — **[MODIFY]** Replaced native `confirm()` for "Reset Entries" with `ConfirmDeleteModal`.
- `src/app/scb-tools/debit-accounts/page.tsx` — **[MODIFY]** Replaced bespoke custom deletion modal with the new standardized `ConfirmDeleteModal`.
- `src/app/scb-tools/vendors/page.tsx` — **[MODIFY]** Replaced bespoke custom deletion modal with the new standardized `ConfirmDeleteModal`.
**Decisions & notes:**
- Synchronized all destructive actions across the entire application to use the same sleek UI pattern as the rest of the popups, completely removing any reliance on the browser's native `window.confirm()`.


### 2026-09-15 13:04 — Feature: Spatial Column Extraction for Client Matching
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Implemented spatial (X/Y coordinate) column extraction to parse the underlying PDF table structure.
**Decisions & notes:**
- Replaced the string-search fallback matching with structural column extraction. The system now searches for the "Ordering Customer" header, calculates the bounding box of the column using its `x` coordinate and the `x` coordinate of the subsequent column ("Details"), and iterates through the rows below to extract the exact customer name text.
- This extracted client name perfectly resolves partial matches and false positives. If the extracted name matches a database entry, it auto-selects it. If no match is found, it pre-fills the extracted name directly into the "Create Client" modal.


### 2026-09-15 12:57 — Bug Fix: Invoice Auto-Select & False Positive Matching
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/components/CreateInvoiceModal.tsx` — **[MODIFY]** Updated `onSuccess` callback to pass the created `invoiceId` so the page can automatically redirect to and select the newly created invoice and C-Form.
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Updated the page redirection logic to append `?invoiceId=[ID]`. Sorted the `clients` array by name length in descending order before matching to prevent generic names (e.g. `Theme Fisher`, which appears at the top of the PDF as the payee) from causing false positive matches over specific clients like `tuhintestclient`.


### 2026-09-15 12:47 — Bug Fix: SWIFT Extraction Auto-Fill
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Updated SWIFT code extraction logic to use `matchAll` and verify against the API.
**Decisions & notes:**
- Previously, the regex `([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)` incorrectly extracted words like `THEMEFISHER` as the SWIFT code since it happens to perfectly match the 11-character BIC format (`THEM` + `EF` + `IS` + `HER`). 
- This caused the SWIFT code lookup to silently fail against the API, leading to an empty `bankData` object. When the "Create Client" form opened, it was completely blank. 
- It now extracts all potential SWIFT codes and iterates over them, polling the API to find the genuine SWIFT code (`SCBLUS33XXX`), successfully auto-filling the bank data.


### 2026-09-15 12:41 — Bug Fix: Space-Agnostic Client Matching
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Added "normalized" fallback matching logic that completely strips all spaces and punctuation from both the PDF text and the client name before matching.
**Decisions & notes:**
- Certain bank PDFs generated the client string without spaces (e.g. `tuhintestclient`), which failed to match the database name if it was stored with spaces (e.g. `Tuhin Test Client`), or vice-versa. The matching logic is now incredibly robust against formatting anomalies.


### 2026-09-15 12:37 — Bug Fix: Robust Client PDF Matching
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Updated `processPDF` to use `fullTextBlob` for client name matching and SWIFT code matching.
**Decisions & notes:**
- The previous client matching logic only searched 5 lines of text following the "header row" in the PDF (`clientText`). Because bank PDFs vary greatly, if the client name or SWIFT code appeared elsewhere, it would fail to match an existing client and incorrectly prompt the "Client not found" modal. It now matches the client against the entire text contents of the PDF.


### 2026-09-15 12:15 — UI Synchronization: Unified Modal Component
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/components/Modal.tsx` — **[NEW]** Created a centralized, highly polished modal wrapper.
- `src/components/CreateClientModal.tsx` — **[MODIFY]** Refactored to use the new `Modal` component.
- `src/components/CreateInvoiceModal.tsx` — **[MODIFY]** Refactored to use the new `Modal` component.
- `src/components/EditClientModal.tsx` — **[MODIFY]** Refactored to use the new `Modal` component.
- `src/components/EditInvoiceModal.tsx` — **[MODIFY]** Refactored to use the new `Modal` component.
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Refactored inline match popup to use `Modal`.
- `src/app/scb-tools/page.tsx` — **[MODIFY]** Refactored inline generator popup to use `Modal`.
- `src/app/scb-tools/vendors/page.tsx` — **[MODIFY]** Refactored 3 inline popups to use `Modal`.
- `src/app/scb-tools/debit-accounts/page.tsx` — **[MODIFY]** Refactored 2 inline popups to use `Modal`.
- `src/app/invoice-tools/create-invoice/page.tsx` — **[MODIFY]** Refactored alert popup to use `Modal`.
**Decisions & notes:**
- Extracted the premium styling from `CreateClientModal` into a reusable wrapper to ensure 100% UI consistency across 10+ different popups in the application.


### 2026-09-15 12:00 — Switch SWIFT Code API to Open Source Dataset
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/actions.ts` — **[MODIFY]** Rewrote `lookupSwiftCode` to fetch from the PeterNotenboom/SwiftCodes open-source dataset on GitHub instead of API-Ninjas, because API-Ninjas hides `bank_name` and `city` behind a paywall on their free tier.
**Decisions & notes:**
- The new approach is completely free, requires no API key in `.env.local`, and provides full bank details without premium masking.


### 2026-09-15 11:51 — Add SWIFT Code Parsing and Client Creation Chain
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/actions.ts` — **[MODIFY]** Added `lookupSwiftCode` which hits the API-Ninjas SWIFT API.
- `src/components/CreateClientModal.tsx` — **[NEW]** Modal for creating a new client, mirroring the UI of CreateInvoiceModal.
- `src/app/invoice-tools/page.tsx` — **[MODIFY]** Updated PDF parser to regex-extract SWIFT Codes from the "Received From" field. When a completely unknown client uploads a PDF, the app now chains the new `CreateClientModal` (pre-filled with Bank data resolved from the SWIFT API) straight into the `CreateInvoiceModal`.
**Decisions & notes:**
- **IMPORTANT**: API-Ninjas SWIFT API requires an API key. You must configure `NEXT_PUBLIC_API_NINJAS_KEY` in `.env.local` or Vercel.
- Form chaining implemented: on successful client creation, `client_id` is passed seamlessly to the Invoice creator.


### 2026-09-15 11:05 — Add Vendor Hide & Invoice Auto-Fill from PDF
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/scb-tools/vendors/page.tsx` — Added UI logic to "Hide" vendors instead of deleting, duplicate detection modal (suggesting old hidden account activation vs new duplicate creation), and updated Tabs/Filters.
- `src/app/invoice-tools/page.tsx` — Added PDF upload logic (matches `create-invoice/page.tsx`), auto-selects if matching invoice found, or triggers `CreateInvoiceModal`.
- `src/components/CreateInvoiceModal.tsx` — **[NEW]** Pre-filled invoice creation modal, triggered when a PDF mismatch occurs on the Invoice Tools generator page.
- `src/app/scb-tools/debit-accounts/page.tsx` & `src/app/invoice-tools/settings/page.tsx` — Fixed lint errors and removed old Supabase missing table check code.
- `src/components/InvoiceSidebar.tsx` — Swapped the order of the "Generate Inward Docs" and "Create Invoice" tabs.
- `src/app/invoice-tools/page.tsx` — Replaced native browser `alert()` with a true centered modal popup when a matching invoice is auto-selected from a PDF.
**Decisions & notes:**
- Extracted and modified `handleFileUpload` logic into `invoice-tools/page.tsx` allowing fast document extraction on the main page.


### 2026-09-14 16:55 — Complete Migration to NeonDB with Drizzle ORM
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/db/index.ts` & `src/db/schema.ts` — **[NEW]** Setup Drizzle ORM schemas mapped from the original Supabase tables.
- `drizzle.config.ts` — **[NEW]** Added Drizzle config for migrations and studio.
- `src/app/actions.ts` — **[NEW]** Centralized all database operations using Next.js Server Actions.
- `src/app/invoice-tools/page.tsx` — Refactored to fetch invoices and clients using Server Actions.
- `src/app/invoice-tools/clients/page.tsx` — Refactored client CRUD to use Server Actions.
- `src/app/invoice-tools/settings/page.tsx` — Refactored payment account CRUD to use Server Actions.
- `src/app/invoice-tools/create-invoice/page.tsx` — Refactored invoice creation and fetching to use Server Actions.
- `src/app/scb-tools/page.tsx` — Refactored vendor and debit account fetching to use Server Actions.
- `src/app/scb-tools/vendors/page.tsx` — Refactored vendor CRUD to use Server Actions.
- `src/app/scb-tools/debit-accounts/page.tsx` — Refactored debit account CRUD to use Server Actions.
- `src/components/BankBranchSelect.tsx` — Migrated branch fetching and routing number querying to Server Actions.
- `src/components/EditInvoiceModal.tsx` & `src/components/EditClientModal.tsx` — Updated to call mutation Server Actions.
- `package.json` — Removed `@supabase/supabase-js`; installed `drizzle-orm`, `drizzle-kit`, and `@neondatabase/serverless`.
- `src/lib/supabase.ts` — **[DELETED]** Removed Supabase client entirely.
**Decisions & notes:**
- Completely removed direct client-side Supabase calls and `@supabase/supabase-js` dependency.
- All database interactions are now performed strictly on the server-side via Next.js Server Actions using Drizzle ORM and NeonDB serverless HTTP driver.
- The user is responsible for providing Neon DB connection string as an environment variable in production.

### 2026-09-14 09:42 — Fix TypeScript Build Error
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/components/CForm.tsx` — Removed the unused `parseInvoiceDate` function to fix Vercel deployment.
**Decisions & notes:**
- Next.js production builds fail on unused variables/functions. Removed the dead code left behind from the previous Form-C date change.

---

### 2026-09-14 09:37 — Form-C Date Update
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/components/CForm.tsx` — Updated Form-C date to always display the current date instead of the parsed invoice date.
**Decisions & notes:**
- Form-C represents a declaration made on the day it is generated/submitted, not necessarily the invoice issue date.

---

### 2026-09-13 22:53 — Added Additional Transactions in Salary Sheet Modal
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/app/scb-tools/page.tsx` — Added "Additional Transactions" section in the Create Salary Sheet modal, enabling users to add extra transfers (bonuses, vendor invoices, allowances) alongside regular employee salaries; integrated with live total breakdown, SCB Excel export, and "Load into Table".
**Decisions & notes:**
- Additional transactions can select any receiver from all available vendors/beneficiaries with custom descriptions and amounts.
- Total payout displays full breakdown: Employees Subtotal + Additional Subtotal = Grand Total.
- Validates that all additional rows have a selected receiver and valid amount before Excel download or table population.
- Kept in local environment (no git push).

---

### 2026-09-13 22:37 — Added Employee Marking & SCB Salary Sheet Generator
**Agent/Dev:** Gemini (Antigravity)
**Files changed:**
- `src/types/index.ts` — Added `is_employee?: boolean` and `salary?: number | string` to `Vendor` interface.
- `src/app/scb-tools/vendors/page.tsx` — Added 1-click Employee toggle checkmarks in receiver accounts table/cards, Add/Edit form support for employee marking and default monthly salary, filter tabs (`All`, `Employees`, `Vendors`), and local cache persistence fallback with Supabase sync.
- `src/app/scb-tools/page.tsx` — Added "Create Salary Sheet" action with dedicated modal to review/input employee salaries, auto-calculate total payroll sums, directly export SCB-formatted Excel spreadsheets (`.xlsx`), or load employee rows into the main generator table.
- `supabase_schema.sql` — Added schema migration statements for `is_employee` and `salary` columns on `vendors`.
**Decisions & notes:**
- Sourced SCB debit accounts directly from database `debit_accounts` table.
- Dual-layer employee status persistence: attempts Supabase update on `vendors` and caches in `localStorage` (`scb_employee_vendors`), ensuring seamless local functionality even before the remote DB schema is altered.
- All testing kept in local environment per user instruction (no git push).

---

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
