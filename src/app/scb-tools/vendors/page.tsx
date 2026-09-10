"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, type Vendor } from "@/lib/supabase";
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Check, Search, AlertTriangle } from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Form state
  const [formData, setFormData] = useState({
    receiver_name: "",
    account_number: "",
    bank_name: "",
    branch_name: "",
    routing_number: "",
  });

  // Edit State
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editFormData, setEditFormData] = useState({
    receiver_name: "",
    account_number: "",
    bank_name: "",
    branch_name: "",
    routing_number: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete State
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVendors = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    const { data, error } = await supabase.from("vendors").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching vendors:", error);
      setErrorMessage(error.message);
    } else {
      setVendors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Add Vendor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first by providing your credentials in .env.local");
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    const { data, error } = await supabase.from("vendors").insert([formData]).select();
    
    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      alert(`Failed to save vendor: ${error.message}`);
    } else if (data) {
      setFormData({
        receiver_name: "",
        account_number: "",
        bank_name: "",
        branch_name: "",
        routing_number: "",
      });
      triggerSuccess("Vendor added successfully!");
      fetchVendors();
    }
    setSaving(false);
  };

  // Start Edit
  const handleStartEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setEditFormData({
      receiver_name: vendor.receiver_name,
      account_number: vendor.account_number,
      bank_name: vendor.bank_name,
      branch_name: vendor.branch_name,
      routing_number: vendor.routing_number,
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;

    setEditSaving(true);
    setErrorMessage(null);

    const { error } = await supabase
      .from("vendors")
      .update(editFormData)
      .eq("id", editingVendor.id);

    if (error) {
      console.error(error);
      alert(`Failed to update vendor: ${error.message}`);
    } else {
      setVendors((prev) =>
        prev.map((v) => (v.id === editingVendor.id ? { ...v, ...editFormData } : v))
      );
      triggerSuccess(`Updated "${editFormData.receiver_name}" successfully!`);
      setEditingVendor(null);
    }
    setEditSaving(false);
  };

  // Delete Vendor
  const handleConfirmDelete = async () => {
    if (!deletingVendor) return;

    setIsDeleting(true);
    const targetId = deletingVendor.id;
    const targetName = deletingVendor.receiver_name;

    const { error } = await supabase
      .from("vendors")
      .delete()
      .eq("id", targetId);

    if (error) {
      console.error(error);
      alert(`Failed to delete vendor: ${error.message}`);
    } else {
      setVendors((prev) => prev.filter((v) => v.id !== targetId));
      triggerSuccess(`Deleted vendor "${targetName}".`);
      setDeletingVendor(null);
    }
    setIsDeleting(false);
  };

  // Filtered vendors
  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.receiver_name.toLowerCase().includes(q) ||
      v.account_number.toLowerCase().includes(q) ||
      v.bank_name.toLowerCase().includes(q) ||
      v.branch_name.toLowerCase().includes(q) ||
      v.routing_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vendor Management</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">Add, edit, and manage beneficiary bank accounts.</p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Supabase is not connected yet</p>
            <p className="mt-1">
              Add your <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> file and restart the dev server.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Database Error</p>
            <p className="mt-1 font-mono text-xs">{errorMessage}</p>
            {errorMessage.includes("relation") && errorMessage.includes("vendors") && (
              <p className="mt-2 text-xs text-red-700">
                It looks like the <code className="font-mono bg-red-100 px-1 rounded">vendors</code> table doesn&apos;t exist yet. Please run the SQL in <code className="font-mono bg-red-100 px-1 rounded">supabase-schema.sql</code> in your Supabase SQL Editor.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add New Vendor Form */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Add New Vendor</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
            <input required type="text" name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
            <input required type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="1234567890" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name</label>
            <input required type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="City Bank" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <input required type="text" name="branch_name" value={formData.branch_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Main Branch" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Routing Number</label>
            <input required type="text" name="routing_number" value={formData.routing_number} onChange={handleChange} className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="112233445" />
          </div>
          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium transition-colors text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Save Vendor
            </button>
          </div>
        </form>
      </div>

      {/* Vendor Pool Container */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Vendor Pool</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {vendors.length} {vendors.length === 1 ? "entry" : "entries"} saved
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 sm:py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading vendors...
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No vendors found. Add one above.
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No vendors match &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <>
            {/* Desktop Table View (Visible on md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 border-b">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Receiver Name</th>
                    <th className="px-6 py-3 font-semibold">Account Number</th>
                    <th className="px-6 py-3 font-semibold">Bank Name</th>
                    <th className="px-6 py-3 font-semibold">Branch Name</th>
                    <th className="px-6 py-3 font-semibold">Routing Number</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{v.receiver_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">{v.account_number}</td>
                      <td className="px-6 py-4 text-gray-700">{v.bank_name}</td>
                      <td className="px-6 py-4 text-gray-600">{v.branch_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">{v.routing_number}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStartEdit(v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors"
                            title="Edit vendor"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingVendor(v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (Visible on screens smaller than md) */}
            <div className="md:hidden divide-y">
              {filteredVendors.map((v) => (
                <div key={v.id} className="p-4 space-y-3 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{v.receiver_name}</h3>
                      <div className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                        {v.bank_name || "Bank Not Specified"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(v)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-100 transition-colors"
                        title="Edit vendor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingVendor(v)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"
                        title="Delete vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-500 block">Account Number</span>
                      <span className="font-mono text-gray-800 font-medium break-all">{v.account_number}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Routing Number</span>
                      <span className="font-mono text-gray-800 font-medium">{v.routing_number || "—"}</span>
                    </div>
                    {v.branch_name && (
                      <div className="col-span-2 pt-1 border-t border-gray-200/50">
                        <span className="text-gray-500 block">Branch</span>
                        <span className="text-gray-800">{v.branch_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Vendor Modal Dialog */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-6 border-b flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Edit Vendor</h3>
                <p className="text-xs text-gray-500 mt-0.5">Modify beneficiary banking information.</p>
              </div>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="overflow-y-auto flex-1">
              <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Receiver Name</label>
                  <input
                    required
                    type="text"
                    name="receiver_name"
                    value={editFormData.receiver_name}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      required
                      type="text"
                      name="account_number"
                      value={editFormData.account_number}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                    <input
                      required
                      type="text"
                      name="routing_number"
                      value={editFormData.routing_number}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      required
                      type="text"
                      name="bank_name"
                      value={editFormData.bank_name}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                    <input
                      required
                      type="text"
                      name="branch_name"
                      value={editFormData.branch_name}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Dialog */}
      {deletingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center">Delete Vendor?</h3>
              <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-900">{deletingVendor.receiver_name}</span>{" "}
                (A/C: <span className="font-mono text-xs">{deletingVendor.account_number}</span>)?
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                This entry will be permanently deleted from the database.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingVendor(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
