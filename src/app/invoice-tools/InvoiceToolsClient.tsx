"use client";
import { useState, useRef } from "react";
import { getClients, lookupSwiftCode } from "@/app/actions";
import { parseMT103 } from "@/lib/pdfParser";
import { useReactToPrint } from "react-to-print";
import { CForm } from "@/components/CForm";
import { BankInvoice } from "@/components/BankInvoice";
import type { Client, Invoice, PaymentAccount } from "@/types";
import Script from "next/script";
import { UploadCloud, Loader2, X, AlertCircle } from "lucide-react";
import { CreateInvoiceModal } from "@/components/CreateInvoiceModal";
import { CreateClientModal } from "@/components/CreateClientModal";
import { Modal } from "@/components/Modal";
import { Printer, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SearchableClientSelect from "@/components/SearchableClientSelect";

type ViewTab = "all" | "invoice" | "cform";

export default function InvoiceToolsClient({
  initialClients,
  initialInvoices,
  initialPaymentAccounts
}: {
  initialClients: Client[];
  initialInvoices: Invoice[];
  initialPaymentAccounts: PaymentAccount[];
}) {
  const searchParams = useSearchParams();
  const queryInvoiceId = searchParams.get("invoiceId");

  const [clients, setClients] = useState<Client[]>(initialClients);
  const [invoices] = useState<Invoice[]>(initialInvoices);
  const [paymentAccounts] = useState<PaymentAccount[]>(initialPaymentAccounts);

  const matchedInv = queryInvoiceId ? initialInvoices.find((i) => i.id === queryInvoiceId) : null;
  const [selectedClientId, setSelectedClientId] = useState(matchedInv ? matchedInv.client_id : "");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(matchedInv ? matchedInv.id : "");

  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [clientDefaultValues, setClientDefaultValues] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchPopupData, setMatchPopupData] = useState<{invoiceNum: string, clientName: string} | null>(null);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    try {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF library not loaded yet");

      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      }

      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data, password: "T137101" });
      const pdfDocument = await loadingTask.promise;
      const parsedData = await parseMT103(file);
      if (!parsedData) {
        triggerError("Could not extract any text from the PDF.");
        return;
      }

      const curr = parsedData.currency || "";
      const amount = parsedData.amount || "";
      const invoiceNumber = parsedData.invoice_number || "";
      const extractedClientName = parsedData.client_name || "";
      const completeTextBlob = parsedData.full_text || "";

      let formattedDate = "";
      if (parsedData.value_date) {
        let parsedDate = new Date(parsedData.value_date);
        if (!isNaN(parsedDate.getTime())) {
          parsedDate.setDate(parsedDate.getDate() - 7);
          formattedDate = parsedDate.toISOString().split("T")[0];
        }
      }

      // SWIFT code lookup for bank data
      let bankData: any = null;
      const swiftMatches = [...completeTextBlob.matchAll(/\b([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?)\b/g)];
      for (const match of swiftMatches) {
        const potentialSwift = match[1];
        const bData = await lookupSwiftCode(potentialSwift);
        if (bData) {
          bankData = bData;
          break;
        }
      }

      // Client matching
      let matchedClient: Client | null = null;
      const sortedClients = [...clients].sort((a, b) => b.name.length - a.name.length);

      if (extractedClientName) {
        const normExtracted = extractedClientName.replace(/[^a-z0-9]/g, "").toLowerCase();
        for (const c of sortedClients) {
          const normDb = c.name.replace(/[^a-z0-9]/g, "").toLowerCase();
          if (normExtracted === normDb || normExtracted.includes(normDb) || normDb.includes(normExtracted)) {
            matchedClient = c;
            break;
          }
        }
      }

      if (!matchedClient) {
        const normalizedFullText = completeTextBlob.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const c of sortedClients) {
          const dbName = c.name.toLowerCase();
          if (completeTextBlob.toLowerCase().includes(dbName)) {
            matchedClient = c;
            break;
          }
          const normalizedDbName = dbName.replace(/[^a-z0-9]/g, "");
          if (normalizedDbName.length >= 4 && normalizedFullText.includes(normalizedDbName)) {
            matchedClient = c;
            break;
          }
          const words = dbName.split(/[\s\,]+/).filter((w) => w.length > 3);
          if (words.length > 0 && completeTextBlob.toLowerCase().includes(words[0])) {
            matchedClient = c;
            break;
          }
        }
      }

      let finalInvoiceNumber = invoiceNumber;
      if (!finalInvoiceNumber) {
        const invMatch = completeTextBlob.match(/INV[A-Z0-9\-\_]+/i);
        if (invMatch) finalInvoiceNumber = invMatch[0];
      }

      const matchInv = invoices.find(inv => inv.invoice_number === finalInvoiceNumber);
      if (matchInv) {
        setSelectedClientId(matchInv.client_id);
        setSelectedInvoiceId(matchInv.id);
        const cName = clients.find((c) => c.id === matchInv.client_id)?.name || "Unknown Client";
        setMatchPopupData({ invoiceNum: matchInv.invoice_number, clientName: cName });
      } else if (matchedClient) {
        setExtractedData({
          invoice_number: finalInvoiceNumber,
          invoice_date: formattedDate,
          amount: amount,
          currency: curr,
          client_id: matchedClient.id,
        });
        setIsCreateModalOpen(true);
      } else {
        setExtractedData({
          invoice_number: finalInvoiceNumber,
          invoice_date: formattedDate,
          amount: amount,
          currency: curr,
          client_id: "",
        });
        setClientDefaultValues({
          name: extractedClientName || "",
          bank_name: bankData?.bank_name || "",
          bank_address: [bankData?.branch, bankData?.city, bankData?.country].filter(Boolean).join(", ") || "",
        });
        setIsCreateClientModalOpen(true);
      }
    } catch (err: any) {
      triggerError(err.message || "Error parsing PDF");
    } finally {
      setIsUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const [activeTab, setActiveTab] = useState<ViewTab>("all");

  const filteredInvoices = invoices.filter(
    (i) => i.client_id === selectedClientId,
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const cFormRef = useRef<HTMLDivElement>(null);
  const bankInvoiceRef = useRef<HTMLDivElement>(null);

  const handlePrintCForm = useReactToPrint({
    contentRef: cFormRef,
    documentTitle: `C-Form-${selectedInvoice?.invoice_number || "doc"}`,
  });

  const handlePrintBankInvoice = useReactToPrint({
    contentRef: bankInvoiceRef,
    documentTitle: `Bank-Invoice-${selectedInvoice?.invoice_number || "doc"}`,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <Script src="//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" strategy="lazyOnload" />
      {matchPopupData && (
        <Modal
          isOpen={!!matchPopupData}
          onClose={() => setMatchPopupData(null)}
          title="Invoice Match Found!"
          subtitle={`Client: ${matchPopupData.clientName}`}
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          maxWidth="sm"
        >
          <div className="p-6">
            <p className="text-sm text-gray-600">
              Existing invoice <strong className="text-gray-900">{matchPopupData.invoiceNum}</strong> has been selected automatically from your database.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setMatchPopupData(null)}
                className="w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >
                View Invoice
              </button>
            </div>
          </div>
        </Modal>
      )}


      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Generate Inward Docs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and export pixel-perfect Bank Invoices and Form-C (ICT)
            declarations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPdf}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 transition-colors shrink-0 shadow-sm"
          >
            {isUploadingPdf ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <UploadCloud className="w-4 h-4 text-gray-500" />}
            {isUploadingPdf ? "Parsing..." : "Autofill from PDF"}
          </button>
          <Link
            href="/invoice-tools/create-invoice"
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-blue-200 transition-colors shrink-0"
          >
            <span>Create New Invoice</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="relative z-20">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            Select Client
          </label>
          <SearchableClientSelect
            clients={clients}
            value={selectedClientId}
            onChange={(val) => {
              setSelectedClientId(val);
              setSelectedInvoiceId("");
            }}
            placeholder="-- Choose a Client --"
          />
        </div>
        <div className="relative z-10">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
            Select Invoice
          </label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            disabled={!selectedClientId}
            className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 focus:outline-hidden"
          >
            <option value="">-- Choose an Invoice --</option>
            {filteredInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoice_number} ({i.invoice_date}) — {i.currency || "USD"}{" "}
                {i.amount}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedClient && selectedInvoice && (
        <div className="space-y-6">
          {/* Document switcher tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "all"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Documents
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("invoice")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "invoice"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bank Invoice
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cform")}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === "cform"
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Form-C (ICT)
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {(activeTab === "all" || activeTab === "invoice") && (
                <button
                  type="button"
                  onClick={() => handlePrintBankInvoice()}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Invoice
                </button>
              )}
              {(activeTab === "all" || activeTab === "cform") && (
                <button
                  type="button"
                  onClick={() => handlePrintCForm()}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Print Form-C
                </button>
              )}
            </div>
          </div>

          {/* Bank Invoice Preview */}
          {(activeTab === "all" || activeTab === "invoice") && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-gray-100/90 p-3 sm:p-6 md:p-8">
              <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                  <span>Bank Invoice Preview</span>
                </h2>
                <button
                  type="button"
                  onClick={() => handlePrintBankInvoice()}
                  className="bg-blue-600 text-white px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </div>
              <p className="sm:hidden text-center text-[11px] text-gray-500 mb-2">
                ← Swipe horizontally to view full page →
              </p>
              <div className="overflow-x-auto bg-gray-100/90 flex justify-start sm:justify-center py-2 sm:py-4">
                <div className="shadow-xl rounded-xs shrink-0">
                  <BankInvoice
                    ref={bankInvoiceRef}
                    invoice={selectedInvoice}
                    client={selectedClient}
                    paymentAccounts={paymentAccounts}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form-C (ICT) Preview */}
          {(activeTab === "all" || activeTab === "cform") && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-gray-100/90 p-3 sm:p-6 md:p-8">
              <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Form–C (ICT) Preview</span>
                </h2>
                <button
                  type="button"
                  onClick={() => handlePrintCForm()}
                  className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl shadow-xs hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </div>
              <p className="sm:hidden text-center text-[11px] text-gray-500 mb-2">
                ← Swipe horizontally to view full page →
              </p>
              <div className="overflow-x-auto bg-gray-100/90 flex justify-start sm:justify-center py-2 sm:py-4">
                <div className="shadow-xl rounded-xs shrink-0">
                  <CForm
                    ref={cFormRef}
                    invoice={selectedInvoice}
                    client={selectedClient}
                    paymentAccounts={paymentAccounts}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(!selectedClient || !selectedInvoice) && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {!selectedClientId
              ? "Select a Client to Begin"
              : "Select an Invoice to Preview"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {!selectedClientId
              ? "Choose a client from the dropdown above to view their available invoices."
              : "Choose an invoice above to preview and export pixel-perfect Bank Invoices and Form-C declarations."}
          </p>
        </div>
      )}
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        defaultValues={clientDefaultValues}
        onSuccess={async (newClientId) => {
          setIsCreateClientModalOpen(false);
          const updatedClients = await getClients();
          setClients(updatedClients);
          setExtractedData((prev: any) => ({ ...prev, client_id: newClientId }));
          setIsCreateModalOpen(true);
        }}
      />
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(invoiceId) => {
          setIsCreateModalOpen(false);
          window.location.href = '?invoiceId=' + invoiceId;
        }}
        clients={clients}
        accounts={paymentAccounts}
        extractedData={extractedData}
      />
    </div>
  );
}
