"use client";
import { useState } from "react";
import { updateClient } from "@/app/actions";
import type { Client } from "@/types";
import { Save, Building2, MapPin, Landmark, FileText } from "lucide-react";
import { Modal } from "./Modal";
interface EditClientModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: Client) => void;
}

function EditClientForm({
  client,
  onClose,
  onSaved,
}: {
  client: Client;
  onClose: () => void;
  onSaved: (updated: Client) => void;
}) {
  const [name, setName] = useState(client.name || "");
  const [address, setAddress] = useState(client.address || "");
  const [taxId, setTaxId] = useState(client.tax_id || "");
  const [bankName, setBankName] = useState(client.bank_name || "");
  const [bankAddress, setBankAddress] = useState(client.bank_address || "");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Client name is required.");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const updatePayload: Record<string, unknown> = {
      name: name.trim(),
      address: address.trim() || undefined,
      tax_id: taxId.trim() || undefined,
      bank_name: bankName.trim() || undefined,
      bank_address: bankAddress.trim() || undefined,
    };

    try {
      const updatedItem = await updateClient(client.id, updatePayload);
      onSaved(updatedItem as unknown as Client);
      onClose();
    } catch (error: any) {
      console.error("Failed to update client:", error.message);
      setErrorMsg("Unable to update client details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* Error Alert */}
      {errorMsg && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg shrink-0">
          {errorMsg}
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
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
            VAT / Tax ID{" "}
            <span className="text-xs font-normal text-gray-500">
              (Optional)
            </span>
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
  );
}

export function EditClientModal({
  client,
  isOpen,
  onClose,
  onSaved,
}: EditClientModalProps) {
  if (!isOpen || !client) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Client"
      subtitle={client.name}
      icon={<Building2 className="w-5 h-5 text-blue-600" />}
      maxWidth="lg"
    >
      <EditClientForm
        key={client.id}
        client={client}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
