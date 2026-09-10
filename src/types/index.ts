// ==========================================
// Invoice & Form-C Tool Types
// ==========================================
export interface Client {
  id: string;
  name: string;
  address: string;
  tax_id?: string;
  bank_name: string;
  bank_address: string;
  created_at?: string;
}

export interface ClientFormData {
  name: string;
  address: string;
  tax_id?: string;
  bank_name: string;
  bank_address: string;
}

export interface PaymentAccount {
  id: string;
  bank_name: string;
  bank_address?: string;
  name_on_account: string;
  bic_swift?: string;
  account_number: string;
  account_name?: string;
  account_details?: string;
  created_at?: string;
}

export interface PaymentAccountFormData {
  bank_name: string;
  bank_address?: string;
  name_on_account: string;
  bic_swift?: string;
  account_number: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  currency?: string;
  amount: number;
  description: string;
  received_amount: number;
  payment_methods: string[];
  created_at?: string;
}

export interface InvoiceFormData {
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  currency?: string;
  amount: string | number;
  description: string;
  received_amount?: string | number;
  payment_methods?: string | string[];
}

// ==========================================
// SCB Bulk Transaction Tool Types
// ==========================================
export interface Vendor {
  id: string;
  receiver_name: string;
  account_number: string;
  bank_name: string;
  branch_name: string;
  routing_number: string;
  created_at?: string;
}

export interface DebitAccount {
  id: string;
  account_number: string;
  account_label: string;
  bank_name: string;
  is_default: boolean;
  created_at?: string;
}

export interface TransferRow {
  id: string;
  vendorId: string | null;
  amount: string;
  description: string;
  transferDate: string;
}
