"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { getDebitAccounts, createDebitAccount, updateDebitAccount, deleteDebitAccount as deleteDebitAccountAction, setDefaultDebitAccount as setDefaultDebitAccountAction, unsetAllDefaultDebitAccounts } from "@/app/actions";
import type { DebitAccount } from "@/types";
import {
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  CreditCard,
  Star,
} from "lucide-react";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

export default function DebitAccountsClient({ initialAccounts }: { initialAccounts: DebitAccount[] }) {
  const [accounts, setAccounts] = useState<DebitAccount[]>(initialAccounts);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");


  // Add Form state
  const [formData, setFormData] = useState({
    account_number: "",
    account_label: "Main SCB Account",
    bank_name: "Standard Chartered Bank",
    is_default: true,
  });

  // Edit State
  const [editingAccount, setEditingAccount] = useState<DebitAccount | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    account_number: "",
    account_label: "",
    bank_name: "",
    is_default: false,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete State
  const [deletingAccount, setDeletingAccount] = useState<DebitAccount | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const data = await getDebitAccounts();
      setAccounts(data || []);
    } catch (err: any) {
      console.error("Error fetching debit accounts:", err);
      setErrorMessage(err.message || "Failed to load debit accounts");
    }
    setLoading(false);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Add Debit Account
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    // If new account is marked default, unset others first
    if (formData.is_default && accounts.length > 0) {
      await unsetAllDefaultDebitAccounts();
    }

    try {
      await createDebitAccount({
        account_number: formData.account_number.trim(),
        account_label: formData.account_label.trim() || "Debit Account",
        bank_name: formData.bank_name.trim() || "Standard Chartered Bank",
        is_default: formData.is_default || accounts.length === 0,
      });
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
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
      alert(`Failed to save: ${error.message}`);
    }
    setSaving(false);
  };

  // Set as Default
  const handleSetDefault = async (acc: DebitAccount) => {
    try {
      await setDefaultDebitAccountAction(acc.id);
      localStorage.setItem("scb_debit_account", acc.account_number);
      triggerSuccess(
        `Set "${acc.account_label}" as the default debit account!`,
      );
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
      await unsetAllDefaultDebitAccounts();
    }

    try {
      await updateDebitAccount(editingAccount.id, {
        account_number: editFormData.account_number.trim(),
        account_label: editFormData.account_label.trim(),
        bank_name: editFormData.bank_name.trim(),
        is_default: editFormData.is_default,
      });

      if (editFormData.is_default) {
        localStorage.setItem(
          "scb_debit_account",
          editFormData.account_number.trim(),
        );
      }
      triggerSuccess("Debit account updated successfully!");
      setEditingAccount(null);
      fetchAccounts();
    } catch (error: any) {
      alert(`Update failed: ${error.message}`);
    }
    setEditSaving(false);
  };

  // Delete Account
  const handleConfirmDelete = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);

    try {
      await deleteDebitAccountAction(deletingAccount.id);
      triggerSuccess("Debit account removed.");
      setDeletingAccount(null);
      fetchAccounts();
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
    setIsDeleting(false);
  };


  const filteredAccounts = accounts.filter(
    (a) =>
      a.account_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.account_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.bank_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          Funding Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Debit Accounts
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
          Manage your funding bank debit accounts. The
          default account is automatically loaded into the transfer generator.
        </p>
      </div>

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center justify-between gap-2 text-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 p-1"
          >
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
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add New Debit Account Form */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Add Debit Account
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          Add an account number to the database. It will be pulled automatically
          on all your devices.
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
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                placeholder="e.g. 0001234567890"
                className="w-full px-3.5 py-2 border rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                onChange={(e) =>
                  setFormData({ ...formData, account_label: e.target.value })
                }
                placeholder="e.g. Main SCB Account"
                className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) =>
                  setFormData({ ...formData, bank_name: e.target.value })
                }
                placeholder="Standard Chartered Bank"
                className="w-full px-3.5 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) =>
                  setFormData({ ...formData, is_default: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="font-medium">Set as Default Debit Account</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1.5" />
              )}
              Save to Database
            </button>
          </div>
        </form>
      </div>

      {/* Account List */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Saved Debit Accounts
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {accounts.length} {accounts.length === 1 ? "account" : "accounts"}{" "}
              configured in database
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-sm">
              Loading debit accounts from database...
            </span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-semibold text-gray-700">
              No debit accounts found
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery
                ? "No accounts match your search filter."
                : "Add your first SCB debit account above to have it auto-load in the generator."}
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
                    <tr
                      key={acc.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
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
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Account"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAccount(acc)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                <div
                  key={acc.id}
                  className="p-4 space-y-2.5 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {acc.account_label}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {acc.bank_name || "Standard Chartered Bank"}
                      </p>
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

                  <div className="bg-gray-50 rounded-xl p-2.5 font-mono text-xs font-semibold text-gray-800">
                    {acc.account_number}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 px-2.5 py-1 border rounded-lg"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingAccount(acc)}
                      className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 px-2.5 py-1 border border-red-200 rounded-lg hover:bg-red-50"
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
        <Modal
          isOpen={!!editingAccount}
          onClose={() => setEditingAccount(null)}
          title={editingAccount.id ? "Edit Debit Account" : "Add Debit Account"}
          subtitle="Manage your company's debit accounts for SCB transfers."
          icon={<CreditCard className="w-5 h-5 text-blue-600" />}
          maxWidth="md"
        >

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Debit Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.account_number}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      account_number: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm"
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
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      account_label: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={editFormData.bank_name}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      bank_name: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 pt-1">
                <input
                  type="checkbox"
                  checked={editFormData.is_default}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      is_default: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-medium">Mark as Default Account</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 border rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Account?"
        description="Are you sure you want to remove this debit account? This action cannot be undone."
        itemName={deletingAccount ? `${deletingAccount.account_label} (${deletingAccount.account_number})` : undefined}
        isDeleting={isDeleting}
      />
    </div>
  );
}
