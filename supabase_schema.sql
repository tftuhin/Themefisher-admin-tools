-- =========================================================
-- Unified Business Finance & Banking Suite Database Schema
-- Consolidates:
--   1. Form-C & Bank Invoice Generator (clients, payment_accounts, invoices)
--   2. SCB Bulk Transaction Generator (vendors, debit_accounts)
--
-- Instructions: Run this script in your Supabase SQL Editor:
--   Dashboard -> SQL Editor -> New query -> Paste & Run
-- =========================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 1. Clients Table (Form-C & Invoices)
-- =========================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  tax_id TEXT,
  bank_name TEXT,
  bank_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on clients" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on clients" ON clients FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on clients" ON clients FOR DELETE USING (true);

-- =========================================================
-- 2. Payment Accounts Table (Form-C & Invoices)
-- =========================================================
CREATE TABLE IF NOT EXISTS payment_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_name TEXT NOT NULL,
  bank_address TEXT,
  name_on_account TEXT NOT NULL,
  bic_swift TEXT,
  account_number TEXT NOT NULL,
  account_name TEXT,
  account_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS bank_address TEXT;
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS name_on_account TEXT;
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS bic_swift TEXT;
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE payment_accounts ADD COLUMN IF NOT EXISTS account_details TEXT;

ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on payment_accounts" ON payment_accounts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on payment_accounts" ON payment_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on payment_accounts" ON payment_accounts FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on payment_accounts" ON payment_accounts FOR DELETE USING (true);

-- =========================================================
-- 3. Invoices Table (Form-C & Invoices)
-- =========================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE,
  currency TEXT DEFAULT 'USD',
  amount NUMERIC,
  description TEXT,
  received_amount NUMERIC,
  payment_methods JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on invoices" ON invoices FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on invoices" ON invoices FOR DELETE USING (true);

-- =========================================================
-- 4. Vendors Table (SCB Beneficiary Pool)
-- =========================================================
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receiver_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  routing_number TEXT NOT NULL,
  is_employee BOOLEAN DEFAULT false,
  salary NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_employee BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS salary NUMERIC DEFAULT 0;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on vendors" ON vendors FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on vendors" ON vendors FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on vendors" ON vendors FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on vendors" ON vendors FOR DELETE USING (true);

-- =========================================================
-- 5. Debit Accounts Table (SCB Funding Sources)
-- =========================================================
CREATE TABLE IF NOT EXISTS debit_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_number TEXT NOT NULL,
  account_label TEXT DEFAULT 'Main SCB Account',
  bank_name TEXT DEFAULT 'Standard Chartered Bank',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE debit_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on debit_accounts" ON debit_accounts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on debit_accounts" ON debit_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on debit_accounts" ON debit_accounts FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on debit_accounts" ON debit_accounts FOR DELETE USING (true);

-- Seed default SCB debit account if not already present
INSERT INTO debit_accounts (account_number, account_label, bank_name, is_default)
VALUES ('0000000000000', 'Main SCB Account', 'Standard Chartered Bank', true)
ON CONFLICT DO NOTHING;

-- Index optimizations
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_vendors_receiver_name ON vendors(receiver_name);
CREATE TABLE IF NOT EXISTS public.bank_branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_code text,
  bank_name text NOT NULL,
  district_code text,
  district_name text,
  branch_code text,
  branch_name text NOT NULL,
  routing_number text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up row level security
ALTER TABLE public.bank_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to bank_branches"
ON public.bank_branches FOR SELECT
USING (true);

-- We don't need public insert/update/delete for branches since it's a static list
