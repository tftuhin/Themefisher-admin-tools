"use client";

import { useEffect, useState, useMemo } from "react";
import { getVendors, createVendor, updateVendor, deleteVendor as deleteVendorAction } from "@/app/actions";
import type { Vendor } from "@/types";
import dynamic from "next/dynamic";

const BankBranchSelect = dynamic(() => import("@/components/BankBranchSelect"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-100 rounded-xl h-[38px]" />,
});
import {
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Check,
  Search,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "employees" | "others">("all");

  // Add Form state
  const [formData, setFormData] = useState({
    receiver_name: "",
    account_number: "",
    bank_name: "",
    branch_name: "",
    routing_number: "",
    is_employee: false,
    salary: "",
  });

  // Edit State
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [editFormData, setEditFormData] = useState({
    receiver_name: "",
    account_number: "",
    bank_name: "",
    branch_name: "",
    routing_number: "",
    is_employee: false,
    salary: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete State
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to read local employee cache
  const getLocalEmployeeCache = (): Record<string, { is_employee: boolean; salary?: number }> => {
    try {
      const saved = localStorage.getItem("scb_employee_vendors");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };

  // Helper to write local employee cache
  const saveLocalEmployeeCache = (id: string, is_employee: boolean, salary?: number | string) => {
    try {
      const cache = getLocalEmployeeCache();
      cache[id] = {
        is_employee,
        salary: salary ? Number(salary) : (cache[id]?.salary ?? 0),
      };
      localStorage.setItem("scb_employee_vendors", JSON.stringify(cache));
    } catch (e) {
      console.error("Failed to write to localStorage:", e);
    }
  };

  const fetchVendors = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getVendors();
      const localCache = getLocalEmployeeCache();
      const merged: Vendor[] = (data || []).map((v: Vendor) => {
        const local = localCache[v.id];
        return {
          ...v,
          is_employee: v.is_employee !== undefined ? Boolean(v.is_employee) : Boolean(local?.is_employee),
          salary: v.salary !== undefined ? v.salary : (local?.salary ?? ""),
        };
      });
      setVendors(merged);
    } catch (error: any) {
      console.error("Error fetching vendors:", error);
      setErrorMessage(error.message);
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Toggle Employee Checkmark directly from Table / Card
  const handleToggleEmployee = async (vendor: Vendor) => {
    const nextStatus = !vendor.is_employee;

    // 1. Optimistic UI update
    setVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, is_employee: nextStatus } : v))
    );

    // 2. Persist to localStorage cache
    saveLocalEmployeeCache(vendor.id, nextStatus, vendor.salary);

    // 3. Persist to Supabase if column exists
    try {
      await updateVendor(vendor.id, { is_employee: nextStatus });
    } catch (e: any) {
      console.warn("Could not sync with column:", e.message);
    }

    triggerSuccess(
      nextStatus
        ? `Marked "${vendor.receiver_name}" as an employee.`
        : `Removed "${vendor.receiver_name}" from employees.`
    );
  };

  // Add Vendor
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    const payloadToInsert: Record<string, any> = {
      receiver_name: formData.receiver_name,
      account_number: formData.account_number,
      bank_name: formData.bank_name,
      branch_name: formData.branch_name,
      routing_number: formData.routing_number,
    };

    if (formData.is_employee) {
      payloadToInsert.is_employee = true;
    }
    if (formData.salary) {
      payloadToInsert.salary = Number(formData.salary);
    }

    try {
      const newVendor = await createVendor(payloadToInsert);
      // Sync local cache
      saveLocalEmployeeCache(newVendor.id, formData.is_employee, formData.salary);

      setFormData({
        receiver_name: "",
        account_number: "",
        bank_name: "",
        branch_name: "",
        routing_number: "",
        is_employee: false,
        salary: "",
      });
      triggerSuccess(
        formData.is_employee
          ? `Added "${newVendor.receiver_name}" as an employee!`
          : `Vendor "${newVendor.receiver_name}" added successfully!`
      );
      fetchVendors();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message);
      alert(`Failed to save vendor: ${error.message}`);
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
      is_employee: Boolean(vendor.is_employee),
      salary: vendor.salary ? String(vendor.salary) : "",
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;

    setEditSaving(true);
    setErrorMessage(null);

    const updatePayload: Record<string, any> = {
      receiver_name: editFormData.receiver_name,
      account_number: editFormData.account_number,
      bank_name: editFormData.bank_name,
      branch_name: editFormData.branch_name,
      routing_number: editFormData.routing_number,
      is_employee: editFormData.is_employee,
      salary: editFormData.salary ? Number(editFormData.salary) : 0,
    };

    try {
      await updateVendor(editingVendor.id, updatePayload);
      setVendors((prev) =>
        prev.map((v) =>
          v.id === editingVendor.id
            ? {
                ...v,
                ...editFormData,
                salary: editFormData.salary ? Number(editFormData.salary) : 0,
              }
            : v
        )
      );
      triggerSuccess(`Updated "${editFormData.receiver_name}" successfully!`);
      setEditingVendor(null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to update vendor: ${error.message}`);
    }
    setEditSaving(false);
  };

  // Delete Vendor
  const handleConfirmDelete = async () => {
    if (!deletingVendor) return;

    setIsDeleting(true);
    const targetId = deletingVendor.id;
    const targetName = deletingVendor.receiver_name;

    try {
      await deleteVendorAction(targetId);
      setVendors((prev) => prev.filter((v) => v.id !== targetId));
      triggerSuccess(`Deleted vendor "${targetName}".`);
      setDeletingVendor(null);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to delete vendor: ${error.message}`);
    }
    setIsDeleting(false);
  };

  // Filtered vendors
  const employeeCount = useMemo(
    () => vendors.filter((v) => v.is_employee).length,
    [vendors]
  );

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      // Tab filter
      if (activeTab === "employees" && !v.is_employee) return false;
      if (activeTab === "others" && v.is_employee) return false;

      // Search query filter
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
  }, [vendors, activeTab, searchQuery]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Receiver Bank Accounts
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
            Add, edit, and mark employees or vendor beneficiary bank accounts.
          </p>
        </div>
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
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}



      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">Database Error</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Add New Receiver Form */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200">
        <h2 className="text-base sm:text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          Add New Receiver Account
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4"
        >
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Receiver / Employee Name *
            </label>
            <input
              required
              type="text"
              name="receiver_name"
              value={formData.receiver_name}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="e.g. John Doe"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              required
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              placeholder="1234567890"
            />
          </div>

          <BankBranchSelect
            bankName={formData.bank_name}
            branchName={formData.branch_name}
            routingNumber={formData.routing_number}
            onBankChange={(val) => setFormData((prev) => ({ ...prev, bank_name: val }))}
            onBranchChange={(val) => setFormData((prev) => ({ ...prev, branch_name: val }))}
            onRoutingChange={(val) => setFormData((prev) => ({ ...prev, routing_number: val }))}
          />

          {/* Employee Option & Default Salary */}
          <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="is_employee"
                  checked={formData.is_employee}
                  onChange={handleChange}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Mark as Employee (Included in Salary Sheets)
                </span>
              </label>

              {formData.is_employee && (
                <div className="inline-flex items-center gap-2">
                  <label className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">
                    Default Salary (BDT):
                  </label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    className="w-36 border border-slate-200 rounded-xl px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center font-medium transition-colors text-sm shadow-sm shrink-0"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Save Receiver
            </button>
          </div>
        </form>
      </div>

      {/* Receiver Bank AC Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden mt-6">
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Receivers List
            </h2>
            <span className="text-xs bg-slate-200/80 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
              {vendors.length} Total
            </span>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Filter Tabs */}
            <div className="inline-flex p-1 bg-slate-200/70 rounded-xl text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "all"
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({vendors.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("employees")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "employees"
                    ? "bg-white text-emerald-700 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-emerald-700"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Employees ({employeeCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("others")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "others"
                    ? "bg-white text-gray-900 shadow-xs font-semibold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Vendors ({vendors.length - employeeCount})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search receivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
            Loading receiver accounts...
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No receivers found. Add one using the form above.
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No receivers match the selected filter or search query.
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-700 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Receiver Name</th>
                    <th className="px-4 py-3 font-semibold text-center w-36">
                      Employee Status
                    </th>
                    <th className="px-5 py-3 font-semibold">Account Number</th>
                    <th className="px-5 py-3 font-semibold">Bank Name</th>
                    <th className="px-5 py-3 font-semibold">Branch Name</th>
                    <th className="px-5 py-3 font-semibold">Routing Number</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.map((v) => (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        v.is_employee ? "bg-emerald-50/20" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <span>{v.receiver_name}</span>
                          {v.salary ? (
                            <span className="text-[11px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded border">
                              ৳{Number(v.salary).toLocaleString()}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Employee Toggle Checkmark Column */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleEmployee(v)}
                          title={
                            v.is_employee
                              ? "Click to unmark as employee"
                              : "Click to mark as employee"
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            v.is_employee
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {v.is_employee ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                              <span>Employee</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-gray-300" />
                              <span>Mark Employee</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                        {v.account_number}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{v.bank_name}</td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {v.branch_name || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-gray-700">
                        {v.routing_number || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Edit receiver"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeletingVendor(v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Delete receiver"
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

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredVendors.map((v) => (
                <div
                  key={v.id}
                  className={`p-4 space-y-3 transition-colors ${
                    v.is_employee ? "bg-emerald-50/25" : "hover:bg-gray-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {v.receiver_name}
                        </h3>
                      </div>
                      <div className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-100">
                        {v.bank_name || "Bank Not Specified"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(v)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-100 transition-colors"
                        title="Edit receiver"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingVendor(v)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl border border-red-100 transition-colors"
                        title="Delete receiver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Employee Toggle on Mobile */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleEmployee(v)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        v.is_employee
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {v.is_employee ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Marked as Employee</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-300" />
                          <span>Not Employee (Tap to mark)</span>
                        </>
                      )}
                    </button>

                    {v.salary ? (
                      <span className="text-xs font-mono text-gray-600">
                        Salary: ৳{Number(v.salary).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-gray-500 block">Account Number</span>
                      <span className="font-mono text-gray-800 font-medium break-all">
                        {v.account_number}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Routing Number</span>
                      <span className="font-mono text-gray-800 font-medium">
                        {v.routing_number || "—"}
                      </span>
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Edit Receiver Account
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Modify beneficiary banking and employee status.
                </p>
              </div>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="overflow-y-auto flex-1">
              <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Receiver / Employee Name
                  </label>
                  <input
                    required
                    type="text"
                    name="receiver_name"
                    value={editFormData.receiver_name}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      required
                      type="text"
                      name="account_number"
                      value={editFormData.account_number}
                      onChange={handleEditChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                    />
                  </div>
                  <BankBranchSelect
                    bankName={editFormData.bank_name}
                    branchName={editFormData.branch_name}
                    routingNumber={editFormData.routing_number}
                    onBankChange={(val) => setEditFormData((prev) => ({ ...prev, bank_name: val }))}
                    onBranchChange={(val) => setEditFormData((prev) => ({ ...prev, branch_name: val }))}
                    onRoutingChange={(val) => setEditFormData((prev) => ({ ...prev, routing_number: val }))}
                  />
                </div>

                {/* Employee checkmark in Edit */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="is_employee"
                      checked={editFormData.is_employee}
                      onChange={handleEditChange}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      Mark as Employee (Included in Salary Sheets)
                    </span>
                  </label>

                  {editFormData.is_employee && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Default Monthly Salary (BDT)
                      </label>
                      <input
                        type="number"
                        name="salary"
                        value={editFormData.salary}
                        onChange={handleEditChange}
                        placeholder="e.g. 50000"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  disabled={editSaving}
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {editSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
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
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 text-center">
                Delete Receiver Account?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 text-center mt-2">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-gray-900">
                  {deletingVendor.receiver_name}
                </span>{" "}
                (A/C:{" "}
                <span className="font-mono text-xs">
                  {deletingVendor.account_number}
                </span>
                )?
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
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl border transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Receiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
