"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createInvoice } from "@/app/actions";
import type { Client, PaymentAccount, InvoiceFormData } from "@/types";
import { Loader2, AlertCircle, FilePlus, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
  clients: Client[];
  accounts: PaymentAccount[];
  extractedData: any; // data from PDF
}

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSuccess,
  clients,
  accounts,
  extractedData,
}: CreateInvoiceModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm<InvoiceFormData>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError("");
      reset();
      
      // Pre-fill extracted data
      if (extractedData?.invoice_number) setValue("invoice_number", extractedData.invoice_number);
      if (extractedData?.invoice_date) setValue("invoice_date", extractedData.invoice_date);
      if (extractedData?.amount) setValue("amount", extractedData.amount);
      if (extractedData?.amount) setValue("received_amount", extractedData.amount);
      if (extractedData?.currency) setValue("currency", extractedData.currency);
      if (extractedData?.client_id) setValue("client_id", extractedData.client_id);
      
      setValue("description", "Web development services");

      if (accounts.length > 0) {
        setSelectedPaymentMethods([accounts[0].id]);
        setValue("payment_methods", [accounts[0].id]);
      } else {
        setSelectedPaymentMethods([]);
      }
    }
  }, [isOpen, extractedData, setValue, reset, accounts]);

  if (!isOpen) return null;

  const toggleAccount = (id: string) => {
    const next = selectedPaymentMethods.includes(id)
      ? selectedPaymentMethods.filter((item) => item !== id)
      : [...selectedPaymentMethods, id];
    setSelectedPaymentMethods(next);
    setValue("payment_methods", next);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!data.client_id) {
      setError("Please select a client.");
      return;
    }

    const cleanInvoiceNumber = data.invoice_number?.trim();
    if (!cleanInvoiceNumber) {
      setError("Invoice number is required.");
      return;
    }

    const parsedAmount = typeof data.amount === "string" ? parseFloat(data.amount) : Number(data.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Valid invoice amount required.");
      return;
    }

    let parsedReceived = parsedAmount;
    if (data.received_amount !== undefined && data.received_amount !== "") {
      const customReceived = typeof data.received_amount === "string" ? parseFloat(data.received_amount) : Number(data.received_amount);
      if (!isNaN(customReceived) && customReceived > 0) {
        parsedReceived = customReceived;
      }
    }

    setSubmitting(true);
    setError("");

    const payload: Record<string, unknown> = {
      client_id: data.client_id,
      invoice_number: cleanInvoiceNumber,
      invoice_date: data.invoice_date,
      currency: data.currency || "USD",
      amount: parsedAmount,
      description: data.description?.trim(),
      received_amount: parsedReceived,
      payment_methods: selectedPaymentMethods,
    };

    try {
      const created = await createInvoice(payload);
      onSuccess(created.id); // Close and refresh list
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Invoice"
      subtitle="Invoice not found. Please create it first to proceed."
      icon={<FilePlus className="w-5 h-5 text-blue-600" />}
      maxWidth="3xl"
    >

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] w-full">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Client</label>
              <select {...register("client_id", { required: true })} className="block w-full p-2.5 border rounded-xl border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">-- Select a Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invoice Number</label>
              <input {...register("invoice_number", { required: true })} className="block w-full p-2.5 border rounded-xl border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invoice Date</label>
              <input type="date" {...register("invoice_date", { required: true })} className="block w-full p-2.5 border rounded-xl border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
              <select {...register("currency")} className="block w-full p-2.5 border rounded-xl border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="USD">USD</option>
                <option value="BDT">BDT</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="CHF">CHF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Amount</label>
              <input type="number" step="0.01" {...register("amount", { required: true })} className="block w-full p-2.5 border rounded-xl border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
              <input {...register("description", { required: true })} className="block w-full p-2.5 border rounded-xl border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Bank Account(s)</label>
            <div className="space-y-2">
              {accounts.map((a) => {
                const isChecked = selectedPaymentMethods.includes(a.id);
                return (
                  <label key={a.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleAccount(a.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                    <div>
                      <div className="font-semibold text-sm">{a.bank_name || a.account_name}</div>
                      <div className="text-xs text-gray-500">{a.account_number}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Create Invoice
            </button>
          </div>
        </form>
    </Modal>
  );
}
