"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, type DebitAccount } from "@/lib/supabase";
import { Plus, Loader2, AlertCircle, Pencil, Trash2, X, Check, Search, AlertTriangle, CreditCard, Copy, Star } from "lucide-react";

export default function DebitAccountsPage() {
  const [accounts, setAccounts] = useState<DebitAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tableNotFound, setTableNotFound] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Add Form state
  const [formData, setFormData] = useState({
    account_number: "",
    account_label: "Main SCB Account",
    bank_name: "Standard Chartered Bank",
    is_default: true,
  });

  // Edit State
  const [editingAccount, setEditingAccount] = useState<DebitAccount | null>(null);
  const [editFormData, setEditFormData] = useState({
    account_number: "",
    account_label: "",
    bank_name: "",
    is_default: false,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete State
  const [deletingAccount, setDeletingAccount] = useState<DebitAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setTableNotFound(false);

    try {
      const { data, error } = await supabase
        .from("debit_accounts")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching debit accounts:", error);
        if (error.message?.includes("Could not find the table") || error.code === "42P01") {
          setTableNotFound(true);
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setAccounts(data || []);
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to load debit accounts";
      setErrorMessage(msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Add Debit Account
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      alert("Please connect Supabase first.");
      return;
    }
    setSaving(true);
    setErrorMessage(null);

    // If new account is marked default, unset others first
    if (formData.is_default && accounts.length > 0) {
      await supabase.from("debit_accounts").update({ is_default: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { data, error } = await supabase
      .from("debit_accounts")
      .insert([{
        account_number: formData.account_number.trim(),
        account_label: formData.account_label.trim() || "Debit Account",
        bank_name: formData.bank_name.trim() || "Standard Chartered Bank",
        is_default: formData.is_default || accounts.length === 0,
      }])
      .select();

    if (error) {
      console.error(error);
      if (error.message?.includes("Could not find the table") || error.code === "42P01") {
        setTableNotFound(true);
        setShowSqlModal(true);
      } else {
        setErrorMessage(error.message);
        alert(`Failed to save: ${error.message}`);
      }
    } else if (data) {
      // Also cache in localStorage for immediate offline persistence
      localStorage.setItem("scb_debit_account", formData.account_number.trim());
      setFormData({
        account_number: "",
        account_label: "Main SCB Account",
        bank_name: "Standard Chartered Bank",
        is_default: accounts.length === 0,
      });
      triggerSuccess("Debit account saved successfully to database!");
      fetchAccounts();
    }
    setSaving(false);
  };

  // Set as Default
  const handleSetDefault = async (acc: DebitAccount) => {
    try {
      // Unset all
      await supabase.from("debit_accounts").update({ is_default: false }).neq("id", acc.id);
      // Set chosen
      const { error } = await supabase.from("debit_accounts").update({ is_default: true }).eq("id", acc.id);
      if (error) throw error;

      localStorage.setItem("scb_debit_account", acc.account_number);
      triggerSuccess(`Set "${acc.account_label}" as the default debit account!`);
      fetchAccounts();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to set default";
      alert(msg);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (acc: DebitAccount) => {
    setEditingAccount(acc);
    setEditFormData({
      account_number: acc.account_number,
      account_label: acc.account_label,
      bank_name: acc.bank_name,
      is_default: acc.is_default,
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditSaving(true);

    if (editFormData.is_default) {
      await supabase.from("debit_accounts").update({ is_default: false }).neq("id", editingAccount.id);
    }

    const { error } = await supabase
      .from("debit_accounts")
      .update({
        account_number: editFormData.account_number.trim(),
        account_label: editFormData.account_label.trim(),
        bank_name: editFormData.bank_name.trim(),
        is_default: editFormData.is_default,
      })
      .eq("id", editingAccount.id);

    if (error) {
      alert(`Update failed: ${error.message}`);
    } else {
      if (editFormData.is_default) {
        localStorage.setItem("scb_debit_account", editFormData.account_number.trim());
      }
      triggerSuccess("Debit account updated successfully!");
      setEditingAccount(null);
      fetchAccounts();
    }
    setEditSaving(false);
  };

  // Delete Account
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);

    const { error } = await supabase.from("debit_accounts").delete().eq("id", deletingAccount.id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
    } else {
      triggerSuccess("Debit account removed.");
      setDeletingAccount(null);
      fetchAccounts();
    }
    setIsDeleting(false);
  };

  const sqlSetupScript = `-- Create debit_accounts table in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS debit_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_number TEXT NOT NULL,
  account_label TEXT DEFAULT 'Main SCB Account',
  bank_name TEXT DEFAULT 'Standard Chartered Bank',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE debit_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on debit_accounts" ON debit_accounts FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on debit_accounts" ON debit_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on debit_accounts" ON debit_accounts FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on debit_accounts" ON debit_accounts FOR DELETE USING (true);

-- Seed default SCB debit account
INSERT INTO debit_accounts (account_number, account_label, bank_name, is_default)
VALUES ('YOUR_SCB_DEBIT_ACCOUNT', 'Main SCB Account', 'Standard Chartered Bank', true)
ON CONFLICT DO NOTHING;`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.account_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bank_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          Funding Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Debit Accounts</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
          Manage your funding bank debit accounts stored in Supabase. The default account is automatically loaded into the transfer generator.
        </p>
      </div>

      {/* SQL Missing Alert */}
      {tableNotFound && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm sm:text-base">Database Table Required: debit_accounts</p>
              <p className="text-xs sm:text-sm text-amber-800 mt-1">
                Your Supabase project needs the <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-xs">debit_accounts</code> table created to store accounts centrally.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg whitespace-nowrap shadow-sm transition-colors"
          >
            View & Copy SQL Script
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between gap-2 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center justify-between gap-2 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add New Debit Account Form */}
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Add Debit Account
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          Add an account number to the database. It will be pulled automatically on all your devices.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Debit Account Number *
              </label>
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="e.g. 0001234567890"
                className="w-full px-3.5 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Account Label / Alias *
              </label>
              <input
                type="text"
                required
                value={formData.account_label}
                onChange={(e) => setFormData({ ...formData, account_label: e.target.value })}
                placeholder="e.g. Main SCB Account"
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Standard Chartered Bank"
                className="w-full px-3.5 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Set as Default Debit Account</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
              Save to Database
            </button>
          </div>
        </form>
      </div>

      {/* Account List */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Saved Debit Accounts</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {accounts.length} {accounts.length === 1 ? "account" : "accounts"} configured in database
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm">Loading debit accounts from database...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">No debit accounts found</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery ? "No accounts match your search filter." : "Add your first SCB debit account above to have it auto-load in the generator."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/80 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Label</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Bank</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {acc.account_label}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-700 font-medium">
                        {acc.account_number}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {acc.bank_name || "Standard Chartered Bank"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {acc.is_default ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <Star className="w-3 h-3 fill-green-600 text-green-600" />
                            Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(acc)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            Set as Default
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(acc)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit Account"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAccount(acc)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredAccounts.map((acc) => (
                <div key={acc.id} className="p-4 space-y-2.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{acc.account_label}</h3>
                      <p className="text-xs text-gray-500">{acc.bank_name || "Standard Chartered Bank"}</p>
                    </div>
                    {acc.is_default ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-800">
                        <Star className="w-3 h-3 fill-green-600 text-green-600" />
                        Default
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(acc)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Set Default
                      </button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2.5 font-mono text-xs font-semibold text-gray-800">
                    {acc.account_number}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 px-2.5 py-1 border rounded-md"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingAccount(acc)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2.5 py-1 border border-red-200 rounded-md hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Debit Account</h3>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Debit Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.account_number}
                  onChange={(e) => setEditFormData({ ...editFormData, account_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Account Label *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.account_label}
                  onChange={(e) => setEditFormData({ ...editFormData, account_label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={editFormData.bank_name}
                  onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 pt-1">
                <input
                  type="checkbox"
                  checked={editFormData.is_default}
                  onChange={(e) => setEditFormData({ ...editFormData, is_default: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-medium">Mark as Default Account</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-gray-900 mb-1">Delete Debit Account</h3>
            <p className="text-center text-xs sm:text-sm text-gray-500 mb-5">
              Are you sure you want to remove <span className="font-semibold text-gray-800">{deletingAccount.account_label}</span> (<span className="font-mono">{deletingAccount.account_number}</span>)?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="flex-1 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL Helper Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Supabase SQL Setup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              Run this SQL script in your <strong>Supabase Dashboard → SQL Editor</strong> to create the table and enable instant sync:
            </p>

            <div className="relative flex-1 overflow-hidden rounded-xl border bg-gray-950 p-4 font-mono text-xs text-gray-200">
              <pre className="overflow-x-auto max-h-64 whitespace-pre">{sqlSetupScript}</pre>
              <button
                type="button"
                onClick={copySql}
                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? "Copied!" : "Copy SQL"}</span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowSqlModal(false);
                  fetchAccounts();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
              >
                Done / Refresh Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
