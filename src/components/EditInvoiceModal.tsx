"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Client, Invoice, PaymentAccount } from "@/types";
import { X, Save } from "lucide-react";
import SearchableClientSelect from "@/components/SearchableClientSelect";

interface EditInvoiceModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: Invoice) => void;
  clients: Client[];
  accounts: PaymentAccount[];
}

function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return "";
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // Try standard parse
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    try {
      return d.toISOString().split("T")[0];
    } catch {}
  }
  // Try format like 2-Sep-26 or 21-Jan-24
  const parts = dateStr.split(/[-/ ]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const month = months.indexOf(parts[1].toLowerCase());
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    }
  }
  return dateStr;
}

function EditInvoiceForm({
  invoice,
  onClose,
  onSaved,
  clients,
  accounts,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSaved: (updated: Invoice) => void;
  clients: Client[];
  accounts: PaymentAccount[];
}) {
  const [clientId, setClientId] = useState(invoice.client_id || "");
  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice.invoice_number || "",
  );
  const [invoiceDate, setInvoiceDate] = useState(
    formatDateForInput(invoice.invoice_date),
  );
  const [currency, setCurrency] = useState(invoice.currency || "USD");
  const [amount, setAmount] = useState(
    invoice.amount !== undefined ? String(invoice.amount) : "",
  );
  const [receivedAmount, setReceivedAmount] = useState(
    invoice.received_amount !== undefined
      ? String(invoice.received_amount)
      : "",
  );
  const [description, setDescription] = useState(invoice.description || "");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    invoice.payment_methods || [],
  );
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleAccount = (accId: string) => {
    setPaymentMethods((prev) =>
      prev.includes(accId)
        ? prev.filter((id) => id !== accId)
        : [...prev, accId],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setErrorMsg("Please select a client.");
      return;
    }

    const cleanInvoiceNumber = invoiceNumber.trim();
    if (!cleanInvoiceNumber) {
      setErrorMsg("Invoice number is required.");
      return;
    }

    const cleanDescription = description.trim();
    if (!cleanDescription) {
      setErrorMsg("Description is required.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid invoice amount greater than 0.");
      return;
    }

    const parsedReceived = receivedAmount ? parseFloat(receivedAmount) : 0;
    if (isNaN(parsedReceived) || parsedReceived < 0) {
      setErrorMsg("Received amount cannot be negative.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const updatePayload: Record<string, unknown> = {
      client_id: clientId,
      invoice_number: cleanInvoiceNumber,
      invoice_date: invoiceDate,
      currency: currency || "USD",
      amount: parsedAmount,
      description: cleanDescription,
      received_amount: parsedReceived,
      payment_methods: paymentMethods,
    };

    let { data, error } = await supabase
      .from("invoices")
      .update(updatePayload)
      .eq("id", invoice.id)
      .select();

    // Fallback if currency column issue
    if (
      error &&
      (error.code === "42703" || error.message?.includes("currency"))
    ) {
      delete updatePayload.currency;
      const fallback = await supabase
        .from("invoices")
        .update(updatePayload)
        .eq("id", invoice.id)
        .select();
      data = fallback.data;
      error = fallback.error;
    }

    setSaving(false);

    if (error) {
      console.error("Failed to update invoice:", error.message);
      setErrorMsg("Unable to update invoice. Please try again.");
    } else {
      const updatedItem =
        data && data[0]
          ? (data[0] as Invoice)
          : { ...invoice, ...updatePayload };
      onSaved(updatedItem);
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden my-auto">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
        <div className="min-w-0 pr-2">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Edit Invoice
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
            {invoice.invoice_number}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form
        onSubmit={handleSave}
        className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5"
      >
        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs sm:text-sm rounded-lg border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative z-20">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Client
            </label>
            <SearchableClientSelect
              clients={clients}
              value={clientId}
              onChange={(val) => setClientId(val)}
              placeholder="Select a client..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              maxLength={60}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              required
              className="w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Invoice Date
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              required
              className="w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="USD">USD ($ - US Dollar)</option>
              <option value="BDT">BDT (৳ - Bangladeshi Taka)</option>
              <option value="GBP">GBP (£ - British Pound)</option>
              <option value="EUR">EUR (€ - Euro)</option>
              <option value="CAD">CAD ($ - Canadian Dollar)</option>
              <option value="AUD">AUD ($ - Australian Dollar)</option>
              <option value="CHF">CHF (CHF - Swiss Franc)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Invoice Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="999999999"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Remitted / Received Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="999999999"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
              placeholder="Optional received amount"
              className="w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Description (Service Details)
            </label>
            <input
              type="text"
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Payment Bank Accounts Checkboxes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Payment Bank Account(s)
            </label>
            <div className="space-y-2.5">
              {accounts.map((a) => {
                const isChecked = paymentMethods.includes(a.id);
                return (
                  <div
                    key={a.id}
                    onClick={() => toggleAccount(a.id)}
                    className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all select-none ${
                      isChecked
                        ? "border-blue-600 bg-blue-50/60"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAccount(a.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 mt-0.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {a.bank_name || a.account_name}
                        </span>
                        {a.bic_swift && (
                          <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded shrink-0">
                            {a.bic_swift}
                          </span>
                        )}
                      </div>
                      {a.account_number && (
                        <div className="text-xs text-gray-600 mt-0.5 truncate">
                          Account:{" "}
                          <span className="font-mono">{a.account_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditInvoiceModal({
  invoice,
  isOpen,
  onClose,
  onSaved,
  clients,
  accounts,
}: EditInvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <EditInvoiceForm
        key={invoice.id}
        invoice={invoice}
        onClose={onClose}
        onSaved={onSaved}
        clients={clients}
        accounts={accounts}
      />
    </div>
  );
}
