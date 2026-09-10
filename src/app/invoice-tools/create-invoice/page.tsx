'use client'
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import type { Client, PaymentAccount, Invoice, InvoiceFormData } from "@/types"
import { EditInvoiceModal } from "@/components/EditInvoiceModal"
import {
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  FileText,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import SearchableClientSelect from "@/components/SearchableClientSelect"

export default function CreateInvoicePage() {
  const [clients, setClients] = useState<Client[]>([])
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("")
  const { register, handleSubmit, reset, setValue } = useForm<InvoiceFormData>()

  // Invoices list state
  const [searchTerm, setSearchTerm] = useState("")
  const [tableClientFilter, setTableClientFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Edit modal state
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
    if (data) setInvoices(data as Invoice[])
  }

  useEffect(() => {
    let ignore = false
    async function fetchData() {
      const [clientsRes, accountsRes, invoicesRes] = await Promise.all([
        supabase.from("clients").select("*").order("name"),
        supabase.from("payment_accounts").select("*"),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      ])
      if (!ignore) {
        if (clientsRes.data) setClients(clientsRes.data as Client[])
        if (invoicesRes.data) setInvoices(invoicesRes.data as Invoice[])
        if (accountsRes.data) {
          const accs = accountsRes.data as PaymentAccount[]
          setAccounts(accs)
          if (accs.length > 0) {
            setSelectedPaymentMethods([accs[0].id])
            setValue("payment_methods", [accs[0].id])
          }
        }

        // Auto-generate invoice number format TF-YYYY-MM-DD-01
        const dateStr = new Date().toISOString().split("T")[0]
        setValue("invoice_number", `TF-${dateStr}-01`)
        setValue("invoice_date", dateStr)
        setValue("currency", "USD")
      }
    }
    void fetchData()
    return () => {
      ignore = true
    }
  }, [setValue])

  const toggleAccount = (id: string) => {
    const next = selectedPaymentMethods.includes(id)
      ? selectedPaymentMethods.filter((item) => item !== id)
      : [...selectedPaymentMethods, id]
    setSelectedPaymentMethods(next)
    setValue("payment_methods", next)
  }

  const onSubmit = async (data: InvoiceFormData) => {
    const clientId = selectedClientId || data.client_id
    if (!clientId) {
      alert("Please select a client.")
      return
    }

    const cleanInvoiceNumber = data.invoice_number?.trim()
    if (!cleanInvoiceNumber) {
      alert("Invoice number is required.")
      return
    }

    const cleanDescription = data.description?.trim()
    if (!cleanDescription) {
      alert("Please enter a service description.")
      return
    }

    const parsedAmount = typeof data.amount === "string" ? parseFloat(data.amount) : Number(data.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid invoice amount greater than 0.")
      return
    }

    let parsedReceived = 0
    if (data.received_amount !== undefined && data.received_amount !== "") {
      parsedReceived =
        typeof data.received_amount === "string"
          ? parseFloat(data.received_amount)
          : Number(data.received_amount)
      if (isNaN(parsedReceived) || parsedReceived < 0) {
        alert("Received amount cannot be negative.")
        return
      }
    }

    setSubmitting(true)
    const paymentMethodsArray =
      selectedPaymentMethods.length > 0
        ? selectedPaymentMethods
        : Array.isArray(data.payment_methods)
          ? data.payment_methods
          : data.payment_methods
            ? [data.payment_methods]
            : []

    const payload: Record<string, unknown> = {
      client_id: clientId,
      invoice_number: cleanInvoiceNumber,
      invoice_date: data.invoice_date,
      currency: data.currency || "USD",
      amount: parsedAmount,
      description: cleanDescription,
      received_amount: parsedReceived,
      payment_methods: paymentMethodsArray,
    }

    let { error } = await supabase
      .from("invoices")
      .insert([payload])
      .select()

    // Fallback if column 'currency' doesn't exist yet
    if (error && (error.code === "42703" || error.message?.includes("currency"))) {
      delete payload.currency
      const fallbackRes = await supabase
        .from("invoices")
        .insert([payload])
        .select()
      error = fallbackRes.error
    }

    setSubmitting(false)

    if (!error) {
      alert("Invoice created successfully!")
      reset()
      setSelectedClientId("")
      const dateStr = new Date().toISOString().split("T")[0]
      setValue("invoice_number", `TF-${dateStr}-01`)
      setValue("invoice_date", dateStr)
      setValue("currency", "USD")
      if (accounts.length > 0) {
        setSelectedPaymentMethods([accounts[0].id])
        setValue("payment_methods", [accounts[0].id])
      } else {
        setSelectedPaymentMethods([])
      }
      await fetchInvoices()
    } else {
      console.error("Error creating invoice:", error.message)
      alert("Unable to save invoice. Please verify invoice details and try again.")
    }
  }

  // Edit action
  const handleEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv)
    setIsEditModalOpen(true)
  }

  // Saved edit
  const handleInvoiceSaved = (updated: Invoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)))
  }

  // Delete action
  const handleDeleteInvoice = async (inv: Invoice) => {
    if (!confirm(`Are you sure you want to delete invoice ${inv.invoice_number}?`)) {
      return
    }

    const { error } = await supabase.from("invoices").delete().eq("id", inv.id)
    if (error) {
      console.error("Error deleting invoice:", error.message)
      alert("Unable to delete invoice. Please try again.")
      return
    }

    setInvoices((prev) => prev.filter((i) => i.id !== inv.id))
  }

  // Filtered invoices for table
  const tableInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (tableClientFilter && inv.client_id !== tableClientFilter) {
        return false
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const client = clients.find((c) => c.id === inv.client_id)
        const matchNum = inv.invoice_number?.toLowerCase().includes(term)
        const matchDesc = inv.description?.toLowerCase().includes(term)
        const matchClient = client?.name?.toLowerCase().includes(term)
        const matchDate = inv.invoice_date?.toLowerCase().includes(term)
        return matchNum || matchDesc || matchClient || matchDate
      }
      return true
    })
  }, [invoices, tableClientFilter, searchTerm, clients])

  const totalPages = Math.ceil(tableInvoices.length / pageSize) || 1
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return tableInvoices.slice(start, start + pageSize)
  }, [tableInvoices, currentPage, pageSize])

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Invoice</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a new client billing record and manage existing invoices below.
        </p>
      </div>

      {/* TOP: Invoice Creation Form */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl shadow-xs border border-gray-200">
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">New Invoice Details</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="relative z-20">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Client</label>
              <SearchableClientSelect
                clients={clients}
                value={selectedClientId}
                onChange={(val) => {
                  setSelectedClientId(val)
                  setValue("client_id", val)
                }}
                placeholder="Select a client..."
              />
            </div>

            <div className="relative z-10">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Invoice Number</label>
              <input
                {...register("invoice_number", { required: true })}
                maxLength={60}
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Invoice Date</label>
              <input
                type="date"
                {...register("invoice_date", { required: true })}
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
              <select
                {...register("currency")}
                defaultValue="USD"
                className="block w-full p-2.5 border rounded-lg border-gray-300 bg-white text-base sm:text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
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
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Invoice Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="999999999"
                {...register("amount", { required: true })}
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Remitted / Received Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999999"
                {...register("received_amount")}
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="Optional received amount"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                Description (Service Details)
              </label>
              <input
                {...register("description", { required: true })}
                maxLength={300}
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="e.g. Website Maintenance Service"
              />
            </div>

            {/* Payment Bank Account Selector as Checkboxes */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Bank Account(s)
              </label>
              <div className="space-y-3">
                {accounts.map((a) => {
                  const isChecked = selectedPaymentMethods.includes(a.id)
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleAccount(a.id)}
                      className={`flex items-start gap-3.5 p-3.5 border rounded-xl cursor-pointer transition-all select-none ${
                        isChecked
                          ? "border-blue-600 bg-blue-50/60 shadow-xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAccount(a.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-0.5 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">
                            {a.bank_name || a.account_name}
                          </span>
                          {a.bic_swift && (
                            <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              SWIFT: {a.bic_swift}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          {a.account_number && (
                            <span>
                              <strong className="text-gray-700">Account:</strong>{" "}
                              <span className="font-mono">{a.account_number}</span>
                            </span>
                          )}
                          {a.name_on_account && (
                            <span>
                              <strong className="text-gray-700">Name:</strong> {a.name_on_account}
                            </span>
                          )}
                        </div>
                        {a.bank_address && (
                          <div className="text-[11px] text-gray-500 mt-1 truncate">
                            {a.bank_address}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {accounts.length === 0 && (
                  <div className="p-4 border border-dashed border-gray-300 rounded-xl text-center text-sm text-gray-500">
                    No payment accounts configured. Add one in Configuration.
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Check the payment bank account(s) to include in the invoice transfer instructions.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-base transition-colors shadow-xs cursor-pointer"
          >
            {submitting ? "Generating Invoice..." : "Generate Invoice"}
          </button>
        </form>
      </div>

      {/* BOTTOM: List of Invoices with Edit and Delete */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-bold text-gray-900">Invoices List</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {tableInvoices.length} {tableInvoices.length === 1 ? "invoice" : "invoices"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 min-w-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search invoice, client..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white focus:outline-hidden"
              />
            </div>

            {/* Client Filter */}
            <select
              value={tableClientFilter}
              onChange={(e) => {
                setTableClientFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="py-2 sm:py-1.5 px-3 text-base sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white focus:outline-hidden"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Service Details</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Remitted</th>
                <th className="py-3 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedInvoices.map((inv) => {
                const client = clients.find((c) => c.id === inv.client_id)

                return (
                  <tr key={inv.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 text-xs sm:text-sm">
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap text-xs">
                      {inv.invoice_date}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-[180px] truncate text-xs sm:text-sm">
                      {client?.name || "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[200px] truncate text-xs">
                      {inv.description}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 whitespace-nowrap text-xs sm:text-sm">
                      {inv.currency || "USD"} {Number(inv.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap text-xs sm:text-sm">
                      {inv.received_amount
                        ? `${inv.currency || "USD"} ${Number(inv.received_amount).toFixed(2)}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View in Generate Docs Link */}
                        <Link
                          href={`/invoice-tools?invoiceId=${inv.id}`}
                          title="Generate Documents"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleEditInvoice(inv)}
                          title="Edit Invoice"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv)}
                          title="Delete Invoice"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paginatedInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No invoices match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 text-xs sm:text-sm text-gray-600 bg-gray-50/40">
            <div className="text-center sm:text-left">
              Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{" "}
              <span className="font-semibold">
                {Math.min(currentPage * pageSize, tableInvoices.length)}
              </span>{" "}
              of <span className="font-semibold">{tableInvoices.length}</span> invoices
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        invoice={editingInvoice}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={handleInvoiceSaved}
        clients={clients}
        accounts={accounts}
      />
    </div>
  )
}
