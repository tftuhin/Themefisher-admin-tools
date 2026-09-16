"use client";

import { useRef } from "react";
import { FileText, Printer, CheckCircle2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { BankInvoice } from "@/components/BankInvoice";
import { CForm } from "@/components/CForm";
import type { Invoice, Client, PaymentAccount } from "@/types";

interface DownloadInvoiceCardProps {
  invoice: Invoice;
  client: Client;
  paymentAccounts: PaymentAccount[];
}

export function DownloadInvoiceCard({ invoice, client, paymentAccounts }: DownloadInvoiceCardProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const cFormRef = useRef<HTMLDivElement>(null);

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoice.invoice_number}`,
  });

  const handlePrintCForm = useReactToPrint({
    contentRef: cFormRef,
    documentTitle: `FormC_${invoice.invoice_number}`,
  });

  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm max-w-sm mt-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-900">Invoice Generated</h4>
          <p className="text-xs text-slate-500">{invoice.invoice_number}</p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => handlePrintInvoice()}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Invoice
        </button>
        <button
          onClick={() => handlePrintCForm()}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" /> Form-C
        </button>
      </div>

      {/* Hidden print containers */}
      <div className="hidden">
        <div ref={invoiceRef}>
          <BankInvoice
            invoice={invoice}
            client={client}
            paymentAccounts={paymentAccounts}
          />
        </div>
        <div ref={cFormRef}>
          <CForm invoice={invoice} client={client} />
        </div>
      </div>
    </div>
  );
}
