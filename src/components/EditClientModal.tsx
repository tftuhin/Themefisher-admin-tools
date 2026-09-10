'use client'
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Client } from "@/types"
import { X, Save, Building2, MapPin, Landmark, FileText } from "lucide-react"

interface EditClientModalProps {
  client: Client | null
  isOpen: boolean
  onClose: () => void
  onSaved: (updated: Client) => void
}

function EditClientForm({
  client,
  onClose,
  onSaved,
}: {
  client: Client
  onClose: () => void
  onSaved: (updated: Client) => void
}) {
  const [name, setName] = useState(client.name || "")
  const [address, setAddress] = useState(client.address || "")
  const [taxId, setTaxId] = useState(client.tax_id || "")
  const [bankName, setBankName] = useState(client.bank_name || "")
  const [bankAddress, setBankAddress] = useState(client.bank_address || "")
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg("Client name is required.")
      return
    }

    setSaving(true)
    setErrorMsg("")

    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      address: address.trim(),
      tax_id: taxId.trim() || null,
      bank_name: bankName.trim(),
      bank_address: bankAddress.trim(),
    }

    let { data, error } = await supabase
      .from("clients")
      .update(updatePayload)
      .eq("id", client.id)
      .select()

    // Fallback if 'tax_id' column doesn't exist yet in Supabase
    if (error && (error.code === "42703" || error.message?.includes("tax_id"))) {
      delete updatePayload.tax_id
      const fallback = await supabase
        .from("clients")
        .update(updatePayload)
        .eq("id", client.id)
        .select()
      data = fallback.data
      error = fallback.error
      if (!error && taxId.trim()) {
        alert(
          "Client updated! Note: To permanently store VAT/Tax IDs in Supabase, please run this in your Supabase SQL Editor:\n\nALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id TEXT;"
        )
      }
    }

    setSaving(false)

    if (error) {
      console.error("Failed to update client:", error.message)
      setErrorMsg("Unable to update client details. Please try again.")
    } else {
      const updatedClient = data && data[0] ? (data[0] as Client) : { ...client, ...updatePayload }
      onSaved(updatedClient)
      onClose()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col border border-gray-200 overflow-hidden my-auto max-h-[90vh]">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Edit Client</h2>
            <p className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-[280px]">{client.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mx-5 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg shrink-0">
          {errorMsg}
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            Client / Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paddle.com Market Ltd"
            className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            Client Address
          </label>
          <textarea
            rows={3}
            maxLength={300}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Full billing address"
            className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden resize-none"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            VAT / Tax ID <span className="text-xs font-normal text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            maxLength={50}
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="e.g. EU123456789 or Tax ID"
            className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Remitting Bank Details (Optional for Form-C)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-gray-400" />
                Bank Name
              </label>
              <input
                type="text"
                maxLength={120}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Barclays Bank PLC"
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Bank Address
              </label>
              <input
                type="text"
                maxLength={250}
                value={bankAddress}
                onChange={(e) => setBankAddress(e.target.value)}
                placeholder="Branch, City & Country"
                className="block w-full p-2.5 border rounded-lg border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export function EditClientModal({
  client,
  isOpen,
  onClose,
  onSaved,
}: EditClientModalProps) {
  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <EditClientForm key={client.id} client={client} onClose={onClose} onSaved={onSaved} />
    </div>
  )
}
