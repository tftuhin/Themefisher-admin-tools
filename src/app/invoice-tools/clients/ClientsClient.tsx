"use client";
import { useState, useCallback, useMemo } from "react";
import { getClients, createClient as createClientAction, deleteClient as deleteClientAction } from "@/app/actions";
import { useForm } from "react-hook-form";
import type { Client, ClientFormData } from "@/types";
import { EditClientModal } from "@/components/EditClientModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import {
  Building2,
  MapPin,
  Landmark,
  Edit2,
  Trash2,
  Search,
  PlusCircle,
  Users,
  FileText,
} from "lucide-react";

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const { register, handleSubmit, reset } = useForm<ClientFormData>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal state
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const data = await getClients();
      setClients(data);
    } catch (error: any) {
      console.error("Error fetching clients:", error.message);
    }
    setLoading(false);
  }, []);

  const onSubmit = async (data: ClientFormData) => {
    const cleanName = data.name?.trim();
    if (!cleanName) {
      alert("Client name is required.");
      return;
    }

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      name: cleanName,
      address: data.address?.trim() || null,
      tax_id: data.tax_id?.trim() || null,
      bank_name: data.bank_name?.trim() || null,
      bank_address: data.bank_address?.trim() || null,
    };

    try {
      await createClientAction(payload);
      reset();
      await fetchClients();
    } catch (error: any) {
      console.error("Error creating client:", error.message);
      alert("Unable to create client. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClientSaved = (updated: Client) => {
    setClients((prev) =>
      prev
        .map((c) => (c.id === updated.id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      await deleteClientAction(deletingClient.id);
      setClients((prev) => prev.filter((c) => c.id !== deletingClient.id));
      setDeletingClient(null);
    } catch (error: any) {
      console.error("Error deleting client:", error.message);
      alert("Unable to delete client. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const q = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.tax_id && c.tax_id.toLowerCase().includes(q)) ||
        (c.bank_name && c.bank_name.toLowerCase().includes(q)),
    );
  }, [clients, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Clients
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage clients, remitting banks, and addresses for your invoices and
          Form-C declarations.
        </p>
      </div>

      {/* Add Client Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-200">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-blue-600" />
          Add New Client
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400" />
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                {...register("name", { required: true })}
                maxLength={120}
                className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="Client or company name"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Client Address
              </label>
              <input
                {...register("address")}
                maxLength={300}
                className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="Full billing address"
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
                {...register("tax_id")}
                maxLength={50}
                className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="e.g. EU123456789 or Tax ID"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-gray-400" />
                Remitting Bank Name
              </label>
              <input
                {...register("bank_name")}
                maxLength={120}
                className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="e.g. Barclays Bank PLC"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Remitting Bank Address
              </label>
              <input
                {...register("bank_address")}
                maxLength={250}
                className="block w-full p-2.5 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                placeholder="Branch, City & Country"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{submitting ? "Adding..." : "Add Client"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Clients List */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Client Directory
              </h2>
              <p className="text-xs text-gray-500">
                {clients.length} registered{" "}
                {clients.length === 1 ? "client" : "clients"}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-9 pr-4 py-2 border rounded-xl border-gray-300 text-base sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden bg-gray-50/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading clients...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="p-5 sm:p-6 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0 pr-0 sm:pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-gray-900 truncate">
                      {client.name}
                    </h3>
                    {client.tax_id && (
                      <span className="text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg shrink-0">
                        VAT/Tax ID: {client.tax_id}
                      </span>
                    )}
                  </div>

                  {client.address && (
                    <div className="text-xs text-gray-600 flex items-start gap-1.5 break-words">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-line leading-relaxed">
                        {client.address}
                      </span>
                    </div>
                  )}

                  {(client.bank_name || client.bank_address) && (
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-0.5 flex-wrap">
                      <Landmark className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>
                        {client.bank_name && (
                          <strong className="text-gray-700">
                            {client.bank_name}
                          </strong>
                        )}
                        {client.bank_name && client.bank_address && " — "}
                        {client.bank_address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions: Edit and Delete */}
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleEditClient(client)}
                    title="Edit Client"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-gray-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingClient(client)}
                    title="Delete Client"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-gray-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredClients.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                {searchTerm
                  ? "No clients match your search query."
                  : "No clients found."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      <EditClientModal
        client={editingClient}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={handleClientSaved}
      />
      <ConfirmDeleteModal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Client?"
        description="Are you sure you want to permanently delete this client? All associated data will be removed."
        itemName={deletingClient?.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}
