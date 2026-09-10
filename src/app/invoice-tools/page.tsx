'use client'
import { useState, useEffect, useRef, Suspense } from "react"
import { supabase } from "@/lib/supabase"
import { useReactToPrint } from "react-to-print"
import { CForm } from "@/components/CForm"
import { BankInvoice } from "@/components/BankInvoice"
import type { Client, Invoice, PaymentAccount } from "@/types"
import { Printer, FileText, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import SearchableClientSelect from "@/components/SearchableClientSelect"

type ViewTab = "all" | "invoice" | "cform"

function GenerateDocsContent() {
  const searchParams = useSearchParams()
  const queryInvoiceId = searchParams.get("invoiceId")

  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([])

  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("")
  const [activeTab, setActiveTab] = useState<ViewTab>("all")

  useEffect(() => {
    let ignore = false
    async function fetchData() {
      const [cRes, iRes, pRes] = await Promise.all([
        supabase.from("clients").select("*").order("name"),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("payment_accounts").select("*"),
      ])
      if (!ignore) {
        const clientList = (cRes.data as Client[]) || []
        const invoiceList = (iRes.data as Invoice[]) || []
        setClients(clientList)
        setInvoices(invoiceList)
        if (pRes.data) setPaymentAccounts(pRes.data as PaymentAccount[])

        if (queryInvoiceId) {
          const matchedInv = invoiceList.find((i) => i.id === queryInvoiceId)
          if (matchedInv) {
            setSelectedClientId(matchedInv.client_id)
            setSelectedInvoiceId(matchedInv.id)
            return
          }
        }
      }
    }
    void fetchData()
    return () => {
      ignore = true
    }
  }, [queryInvoiceId])

  const filteredInvoices = invoices.filter((i) => i.client_id === selectedClientId)

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId)

  const cFormRef = useRef<HTMLDivElement>(null)
  const bankInvoiceRef = useRef<HTMLDivElement>(null)

  const handlePrintCForm = useReactToPrint({
    contentRef: cFormRef,
    documentTitle: `C-Form-${selectedInvoice?.invoice_number || "doc"}`,
  })

  const handlePrintBankInvoice = useReactToPrint({
    contentRef: bankInvoiceRef,
    documentTitle: `Bank-Invoice-${selectedInvoice?.invoice_number || "doc"}`,
  })

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Generate Inward Docs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and export pixel-perfect Bank Invoices and Form-C (ICT) declarations.
          </p>
        </div>
        <Link
          href="/invoice-tools/create-invoice"
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-blue-200 transition-colors shrink-0"
        >
          <span>Create New Invoice</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="relative z-20">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Select Client</label>
          <SearchableClientSelect
            clients={clients}
            value={selectedClientId}
            onChange={(val) => {
              setSelectedClientId(val)
              setSelectedInvoiceId("")
            }}
            placeholder="-- Choose a Client --"
          />
        </div>
        <div className="relative z-10">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Select Invoice</label>
          <select
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
            disabled={!selectedClientId}
            className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 focus:outline-hidden"
          >
            <option value="">-- Choose an Invoice --</option>
            {filteredInvoices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.invoice_number} ({i.invoice_date}) — {i.currency || "USD"} {i.amount}
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
            {!selectedClientId ? "Select a Client to Begin" : "Select an Invoice to Preview"}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {!selectedClientId
              ? "Choose a client from the dropdown above to view their available invoices."
              : "Choose an invoice above to preview and export pixel-perfect Bank Invoices and Form-C declarations."}
          </p>
        </div>
      )}
    </div>
  )
}

export default function GenerateDocsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading documents...</div>}>
      <GenerateDocsContent />
    </Suspense>
  )
}
