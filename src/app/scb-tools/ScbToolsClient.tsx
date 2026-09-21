"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/Modal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { getVendors } from "@/app/actions";
import type { Vendor, DebitAccount } from "@/types";
import SearchableVendorSelect from "@/components/SearchableVendorSelect";
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  RotateCcw,
  UserCheck,
  Briefcase,
  X,
  Check,
  Download,
  ArrowRight,
  Layers,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { format } from "date-fns";

type TransferRow = {
  id: string;
  vendorId: string | null;
  amount: string;
  description: string;
  transferDate: string;
};

type EmployeeSalaryRow = {
  vendorId: string;
  vendor: Vendor;
  selected: boolean;
  amount: string;
};

type AdditionalSalaryRow = {
  id: string;
  vendorId: string | null;
  amount: string;
  description: string;
};

export default function ScbToolsClient({
  initialVendors,
  initialDebitAccounts
}: {
  initialVendors: Vendor[];
  initialDebitAccounts: DebitAccount[];
}) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [rows, setRows] = useState<TransferRow[]>([
    {
      id: "1",
      vendorId: "",
      amount: "",
      description: "",
      transferDate: format(new Date(), "yyyy-MM-dd"),
    },
  ]);
  const [debitAccount, setDebitAccount] = useState<string>("");
  const [debitAccounts, setDebitAccounts] = useState<DebitAccount[]>(initialDebitAccounts);

  // Salary Sheet Modal State
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryDate, setSalaryDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [salaryReason, setSalaryReason] = useState<string>(
    `Salary for ${format(new Date(), "MMMM yyyy")}`
  );
  const [salaryDebitAccount, setSalaryDebitAccount] = useState<string>("");
  const [employeeSalaryRows, setEmployeeSalaryRows] = useState<EmployeeSalaryRow[]>([]);
  const [additionalSalaryRows, setAdditionalSalaryRows] = useState<AdditionalSalaryRow[]>([]);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // SCB Popup State
  const [showScbPopup, setShowScbPopup] = useState(false);

  // Automatically set default debit accounts from props on load
  useEffect(() => {
    const loadDebitAccount = () => {
      try {
        const data = initialDebitAccounts;
        if (data && data.length > 0) {
          setDebitAccounts(data);
          const defaultAcc = data.find((a) => a.is_default) || data[0];
          if (defaultAcc?.account_number) {
            setDebitAccount(defaultAcc.account_number);
            setSalaryDebitAccount(defaultAcc.account_number);
            localStorage.setItem(
              "scb_debit_account",
              defaultAcc.account_number
            );
            return;
          }
        }
      } catch (e) {
        console.error("Error loading debit account from DB:", e);
      }

      // Fallback to localStorage or environment variable
      const saved = localStorage.getItem("scb_debit_account");
      if (saved) {
        setDebitAccount(saved);
        setSalaryDebitAccount(saved);
      } else if (process.env.NEXT_PUBLIC_SCB_DEBIT_ACCOUNT) {
        setDebitAccount(process.env.NEXT_PUBLIC_SCB_DEBIT_ACCOUNT);
        setSalaryDebitAccount(process.env.NEXT_PUBLIC_SCB_DEBIT_ACCOUNT);
      }
    };

    loadDebitAccount();
  }, [initialDebitAccounts]);

  const handleDebitAccountChange = (val: string) => {
    setDebitAccount(val);
    setSalaryDebitAccount(val);
    localStorage.setItem("scb_debit_account", val);
  };

  const fetchVendors = async () => {
    try {
      const data = await getVendors();
      if (data) {
        // Load local employee cache
        let localCache: Record<string, { is_employee: boolean; salary?: number }> = {};
        try {
          const saved = localStorage.getItem("scb_employee_vendors");
          if (saved) localCache = JSON.parse(saved);
        } catch {}

        const merged: Vendor[] = data.map((v: Vendor) => {
          const local = localCache[v.id];
          return {
            ...v,
            is_employee:
              v.is_employee !== undefined
                ? Boolean(v.is_employee)
                : Boolean(local?.is_employee),
            salary: v.salary !== undefined ? v.salary : (local?.salary ?? ""),
          };
        });
        setVendors(merged);
      }
    } catch (e) {
      console.error("Error fetching vendors:", e);
    }
  };

  useEffect(() => {
    let localCache: Record<string, { is_employee: boolean; salary?: number }> = {};
    try {
      const saved = localStorage.getItem("scb_employee_vendors");
      if (saved) localCache = JSON.parse(saved);
    } catch {}

    const merged: Vendor[] = initialVendors.map((v: Vendor) => {
      const local = localCache[v.id];
      return {
        ...v,
        is_employee:
          v.is_employee !== undefined
            ? Boolean(v.is_employee)
            : Boolean(local?.is_employee),
        salary: v.salary !== undefined ? v.salary : (local?.salary ?? ""),
      };
    });
    setVendors(merged);
  }, [initialVendors]);

  // Filter employees
  const employeeVendors = useMemo(
    () => vendors.filter((v) => v.is_employee),
    [vendors]
  );

  // Initialize employee rows when opening Salary Modal
  const handleOpenSalaryModal = () => {
    fetchVendors();
    setSalaryDebitAccount(debitAccount);
    setSalaryDate(format(new Date(), "yyyy-MM-dd"));
    setSalaryReason(`Salary for ${format(new Date(), "MMMM yyyy")}`);

    const initialRows: EmployeeSalaryRow[] = employeeVendors.map((emp) => ({
      vendorId: emp.id,
      vendor: emp,
      selected: true,
      amount: emp.salary ? String(emp.salary) : "",
    }));

    setEmployeeSalaryRows(initialRows);
    setAdditionalSalaryRows([]);
    setShowSalaryModal(true);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: crypto.randomUUID(),
        vendorId: null,
        amount: "",
        description: "",
        transferDate: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const handleRowChange = (
    id: string,
    field: keyof TransferRow,
    value: string | null
  ) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleReset = () => {
    const hasData =
      rows.some(
        (r) => r.vendorId || r.amount || r.description || r.transferDate
      ) || rows.length > 1;
    if (hasData) {
      setIsResetModalOpen(true);
    } else {
      executeReset();
    }
  };

  const executeReset = () => {
    setRows([
      {
        id: crypto.randomUUID(),
        vendorId: null,
        amount: "",
        description: "",
        transferDate: "",
      },
    ]);
    setIsResetModalOpen(false);
  };

  // Standard Excel Generation for manual rows
  const handleGenerateExcel = () => {
    const validRows = rows.filter(
      (r) => r.vendorId && r.amount && r.transferDate
    );

    if (validRows.length === 0) {
      alert(
        "Please fill in all required fields (Vendor, Amount, Date) for at least one row."
      );
      return;
    }

    if (!debitAccount.trim()) {
      alert(
        "Please enter or select a Debit Account Number before generating the Excel file."
      );
      return;
    }

    const excelData = validRows
      .map((row) => {
        const vendor = vendors.find((v) => v.id === row.vendorId);
        if (!vendor) return null;

        let formattedDate = "";
        try {
          formattedDate = format(new Date(row.transferDate), "dd/MM/yyyy");
        } catch (e) {
          console.error("Invalid date", e);
        }

        return {
          "Customer Reference": "",
          "Beneficiary Name(120)": vendor.receiver_name,
          "Beneficiary Account Number": vendor.account_number,
          "Routing Number": vendor.routing_number,
          "Payment Amount": row.amount,
          "Reason(140)": row.description,
          "Date(DD/MM/YYYY)": formattedDate,
          "Debit Account Number(Prefix- 00 BDT)": debitAccount.trim(),
          "Beneficiary Email ID(Optional)": "",
        };
      })
      .filter(Boolean);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transfers");

    const fileName = `SCB_Transfers_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    setShowScbPopup(true);
  };

  // Salary Sheet Actions
  const handleToggleAllEmployees = (selectAll: boolean) => {
    setEmployeeSalaryRows((prev) =>
      prev.map((r) => ({ ...r, selected: selectAll }))
    );
  };

  const handleToggleEmployeeRow = (vendorId: string) => {
    setEmployeeSalaryRows((prev) =>
      prev.map((r) =>
        r.vendorId === vendorId ? { ...r, selected: !r.selected } : r
      )
    );
  };

  const handleSalaryAmountChange = (vendorId: string, amount: string) => {
    setEmployeeSalaryRows((prev) =>
      prev.map((r) =>
        r.vendorId === vendorId ? { ...r, amount } : r
      )
    );
  };

  // Additional Transactions in Salary Sheet Modal
  const handleAddAdditionalSalaryRow = () => {
    setAdditionalSalaryRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        vendorId: null,
        amount: "",
        description: "",
      },
    ]);
  };

  const handleRemoveAdditionalSalaryRow = (id: string) => {
    setAdditionalSalaryRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAdditionalSalaryRowChange = (
    id: string,
    field: keyof AdditionalSalaryRow,
    value: string | null
  ) => {
    setAdditionalSalaryRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const selectedSalaryRows = useMemo(
    () => employeeSalaryRows.filter((r) => r.selected),
    [employeeSalaryRows]
  );

  const employeeSubtotal = useMemo(() => {
    return selectedSalaryRows.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
  }, [selectedSalaryRows]);

  const additionalSubtotal = useMemo(() => {
    return additionalSalaryRows.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
  }, [additionalSalaryRows]);

  const grandTotalPayout = employeeSubtotal + additionalSubtotal;

  // Export Salary Sheet directly to Excel
  const handleDownloadSalaryExcel = () => {
    const totalSelected = selectedSalaryRows.length + additionalSalaryRows.length;
    if (totalSelected === 0) {
      alert("Please select at least one employee or add an additional transaction.");
      return;
    }

    const missingAmount = selectedSalaryRows.some(
      (r) => !r.amount || Number(r.amount) <= 0
    );
    if (missingAmount) {
      alert("Please enter a valid salary amount for all selected employees.");
      return;
    }

    // Validate additional rows
    for (let i = 0; i < additionalSalaryRows.length; i++) {
      const row = additionalSalaryRows[i];
      if (!row.vendorId) {
        alert(`Please choose a receiver for additional transaction #${i + 1}, or remove it.`);
        return;
      }
      if (!row.amount || Number(row.amount) <= 0) {
        alert(`Please enter a valid payment amount for additional transaction #${i + 1}.`);
        return;
      }
    }

    const activeDebit = salaryDebitAccount || debitAccount;
    if (!activeDebit.trim()) {
      alert("Please select a Debit Account Number for salary payout.");
      return;
    }

    let formattedDate = "";
    try {
      formattedDate = format(new Date(salaryDate), "dd/MM/yyyy");
    } catch {
      formattedDate = format(new Date(), "dd/MM/yyyy");
    }

    // 1. Employee rows
    const employeeExcelData = selectedSalaryRows.map((row) => ({
      "Customer Reference": "",
      "Beneficiary Name(120)": row.vendor.receiver_name,
      "Beneficiary Account Number": row.vendor.account_number,
      "Routing Number": row.vendor.routing_number,
      "Payment Amount": row.amount,
      "Reason(140)": salaryReason || `Salary for ${format(new Date(), "MMMM yyyy")}`,
      "Date(DD/MM/YYYY)": formattedDate,
      "Debit Account Number(Prefix- 00 BDT)": activeDebit.trim(),
      "Beneficiary Email ID(Optional)": "",
    }));

    // 2. Additional transaction rows
    const additionalExcelData = additionalSalaryRows.map((row) => {
      const vendor = vendors.find((v) => v.id === row.vendorId)!;
      return {
        "Customer Reference": "",
        "Beneficiary Name(120)": vendor.receiver_name,
        "Beneficiary Account Number": vendor.account_number,
        "Routing Number": vendor.routing_number,
        "Payment Amount": row.amount,
        "Reason(140)": row.description || salaryReason || "Additional Payout",
        "Date(DD/MM/YYYY)": formattedDate,
        "Debit Account Number(Prefix- 00 BDT)": activeDebit.trim(),
        "Beneficiary Email ID(Optional)": "",
      };
    });

    const combinedExcelData = [...employeeExcelData, ...additionalExcelData];

    const worksheet = XLSX.utils.json_to_sheet(combinedExcelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Salary Sheet");

    const fileName = `SCB_Salary_Sheet_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setShowSalaryModal(false);
    setShowScbPopup(true);
    setBannerMessage(
      `Successfully generated salary sheet Excel for ${combinedExcelData.length} transactions (Total: ৳${grandTotalPayout.toLocaleString()})!`
    );
    setTimeout(() => setBannerMessage(null), 5000);
  };

  // Load employee and additional rows into the main generator table
  const handleLoadEmployeesIntoTable = () => {
    const totalCount = selectedSalaryRows.length + additionalSalaryRows.length;
    if (totalCount === 0) {
      alert("Please select at least one employee or add an additional transaction.");
      return;
    }

    const empRows: TransferRow[] = selectedSalaryRows.map((r) => ({
      id: crypto.randomUUID(),
      vendorId: r.vendorId,
      amount: r.amount || "",
      description: salaryReason || `Salary for ${format(new Date(), "MMMM yyyy")}`,
      transferDate: salaryDate,
    }));

    const addRows: TransferRow[] = additionalSalaryRows
      .filter((r) => r.vendorId)
      .map((r) => ({
        id: crypto.randomUUID(),
        vendorId: r.vendorId,
        amount: r.amount || "",
        description: r.description || salaryReason || "Payout",
        transferDate: salaryDate,
      }));

    const combinedRows = [...empRows, ...addRows];
    setRows(combinedRows);
    setShowSalaryModal(false);
    setBannerMessage(
      `Loaded ${combinedRows.length} transfers into the generator table.`
    );
    setTimeout(() => setBannerMessage(null), 5000);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            SCB Banking Tool
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            SCB Transaction Generator
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Generate Standard Chartered Bank bulk payout Excel files and monthly salary sheets.
          </p>
        </div>

        {/* Action Header Button: Create Salary Sheet */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenSalaryModal}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all text-sm shrink-0 cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>Create Salary Sheet</span>
            {employeeVendors.length > 0 && (
              <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-mono">
                {employeeVendors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Success / Info Banner */}
      {bannerMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
            <span>{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Debit Account Dropdown Selector */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <label
            htmlFor="debit-account"
            className="block text-sm font-semibold text-gray-900"
          >
            SCB Debit Account Number *
          </label>
          <p className="text-xs text-gray-500 mt-0.5">
            Funding account debited for transfers. Loaded automatically from your database.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <select
            id="debit-account"
            required
            value={debitAccount}
            onChange={(e) => handleDebitAccountChange(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs cursor-pointer"
          >
            {debitAccounts.length > 0 ? (
              debitAccounts.map((acc) => (
                <option key={acc.id} value={acc.account_number}>
                  {acc.account_number} —{" "}
                  {acc.account_label || acc.bank_name || "SCB"}{" "}
                  {acc.is_default ? "★" : ""}
                </option>
              ))
            ) : debitAccount ? (
              <option value={debitAccount}>
                {debitAccount} (Default Account)
              </option>
            ) : (
              <option value="">-- Select Debit Account --</option>
            )}
          </select>
        </div>
      </div>



      {/* Main Generator Grid */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="p-3.5 sm:p-4 border border-slate-200 rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors space-y-3"
            >
              {/* Mobile Header for this row */}
              <div className="flex items-center justify-between md:hidden pb-2 border-b border-gray-200/70">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Transfer #{index + 1}
                </span>
                <button
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                  title="Remove Transfer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-start">
                {/* Vendor Selection */}
                <div className="sm:col-span-2 md:col-span-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Receiver *
                  </label>
                  <SearchableVendorSelect
                    vendors={vendors}
                    value={row.vendorId}
                    onChange={(val) => handleRowChange(row.id, "vendorId", val)}
                    placeholder="Search receiver..."
                  />
                </div>

                {/* Amount */}
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Amount (BDT) *
                  </label>
                  <input
                    type="number"
                    value={row.amount}
                    onChange={(e) =>
                      handleRowChange(row.id, "amount", e.target.value)
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 min-h-[42px] text-sm font-mono"
                    placeholder="0.00"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-1 md:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Description (Max 100)
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={row.description}
                    onChange={(e) =>
                      handleRowChange(row.id, "description", e.target.value)
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 min-h-[42px] text-sm"
                    placeholder="Transfer reason..."
                  />
                </div>

                {/* Transfer Date */}
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={row.transferDate}
                    onChange={(e) =>
                      handleRowChange(row.id, "transferDate", e.target.value)
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-blue-500 focus:border-blue-500 min-h-[42px] text-sm"
                  />
                </div>

                {/* Desktop Remove Action */}
                <div className="hidden md:flex md:col-span-1 items-end self-end h-[42px] mb-0.5 justify-center">
                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Remove Row"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={addRow}
              className="flex-1 sm:flex-none flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium px-4 py-2.5 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Transfer
            </button>

            <button
              onClick={handleReset}
              className="flex items-center justify-center text-gray-600 hover:text-red-600 font-medium px-3.5 py-2.5 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200 text-sm"
              title="Reset form and clear all entries"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </button>
          </div>

          <button
            onClick={handleGenerateExcel}
            className="w-full sm:w-auto flex items-center justify-center bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-sm text-sm"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Generate Excel
          </button>
        </div>
      </div>

      {/* Salary Sheet Generator Modal */}
      {showSalaryModal && (
        <Modal
          isOpen={showSalaryModal}
          onClose={() => setShowSalaryModal(false)}
          title="Create Salary Sheet"
          subtitle="Generate Standard Chartered Bank bulk transfer Excel for employees and additional payouts."
          icon={<Briefcase className="w-5 h-5 text-emerald-600" />}
          maxWidth="4xl"
        >
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] w-full flex-1 space-y-6">
              {/* Settings Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Salary Month / Reason *
                  </label>
                  <input
                    type="text"
                    value={salaryReason}
                    onChange={(e) => setSalaryReason(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g. Salary for September 2026"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    value={salaryDate}
                    onChange={(e) => setSalaryDate(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Debit Account *
                  </label>
                  <select
                    value={salaryDebitAccount}
                    onChange={(e) => setSalaryDebitAccount(e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  >
                    {debitAccounts.map((acc) => (
                      <option key={acc.id} value={acc.account_number}>
                        {acc.account_number} ({acc.account_label || "SCB"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 1: Marked Employees Table */}
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        checked={
                          employeeSalaryRows.length > 0 &&
                          employeeSalaryRows.every((r) => r.selected)
                        }
                        onChange={(e) =>
                          handleToggleAllEmployees(e.target.checked)
                        }
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <span>Marked Employees ({employeeSalaryRows.length})</span>
                    </label>
                  </div>
                  <span className="text-xs text-gray-500">
                    {selectedSalaryRows.length} of {employeeSalaryRows.length} selected
                    {selectedSalaryRows.length > 0 && ` (৳${employeeSubtotal.toLocaleString()})`}
                  </span>
                </div>

                {employeeSalaryRows.length === 0 ? (
                  <div className="p-5 text-center bg-amber-50/60 rounded-xl border border-amber-200/80 text-amber-800 text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>No employees currently marked. You can mark them in Receiver Bank Accounts or add transfers below.</span>
                    </div>
                    <Link
                      href="/scb-tools/vendors"
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
                    >
                      <span>Mark Employees</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-gray-50 text-gray-700 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="px-3 sm:px-4 py-2.5 w-10 text-center"></th>
                          <th className="px-3 sm:px-4 py-2.5">Employee</th>
                          <th className="px-3 sm:px-4 py-2.5">Bank / Branch</th>
                          <th className="px-3 sm:px-4 py-2.5">Account & Routing</th>
                          <th className="px-3 sm:px-4 py-2.5 text-right w-44">
                            Salary Amount (BDT)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employeeSalaryRows.map((row) => (
                          <tr
                            key={row.vendorId}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              row.selected ? "bg-emerald-50/15" : "opacity-60"
                            }`}
                          >
                            <td className="px-3 sm:px-4 py-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() =>
                                  handleToggleEmployeeRow(row.vendorId)
                                }
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                              />
                            </td>
                            <td className="px-3 sm:px-4 py-3 font-medium text-gray-900">
                              {row.vendor.receiver_name}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-gray-600">
                              <div>{row.vendor.bank_name}</div>
                              {row.vendor.branch_name && (
                                <div className="text-xs text-gray-400">
                                  {row.vendor.branch_name}
                                </div>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 py-3 font-mono text-xs text-gray-700">
                              <div>A/C: {row.vendor.account_number}</div>
                              <div className="text-gray-400">
                                Routing: {row.vendor.routing_number || "—"}
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-right">
                              <input
                                type="number"
                                disabled={!row.selected}
                                value={row.amount}
                                onChange={(e) =>
                                  handleSalaryAmountChange(
                                    row.vendorId,
                                    e.target.value
                                  )
                                }
                                placeholder="0.00"
                                className="w-36 text-right border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:opacity-50"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Section 2: Additional Transactions */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span>Additional Transactions</span>
                      {additionalSalaryRows.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-mono font-medium">
                          {additionalSalaryRows.length}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Include extra payouts (bonuses, vendor invoices, allowances) in this same Excel sheet.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAdditionalSalaryRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Additional Transaction</span>
                  </button>
                </div>

                {/* Additional Transactions Table */}
                {additionalSalaryRows.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="bg-slate-100 text-gray-700 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="px-3 sm:px-4 py-2.5 w-5/12">Receiver *</th>
                          <th className="px-3 sm:px-4 py-2.5">Reason / Description</th>
                          <th className="px-3 sm:px-4 py-2.5 text-right w-44">Amount (BDT) *</th>
                          <th className="px-2 py-2.5 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {additionalSalaryRows.map((add) => {
                          const matchedVendor = vendors.find((v) => v.id === add.vendorId);
                          return (
                            <tr key={add.id} className="hover:bg-slate-50/60">
                              <td className="px-3 sm:px-4 py-3">
                                <select
                                  required
                                  value={add.vendorId || ""}
                                  onChange={(e) =>
                                    handleAdditionalSalaryRowChange(
                                      add.id,
                                      "vendorId",
                                      e.target.value || null
                                    )
                                  }
                                  className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="">-- Choose Receiver --</option>
                                  {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.receiver_name} ({v.bank_name || "Bank"} - {v.account_number})
                                    </option>
                                  ))}
                                </select>
                                {matchedVendor && (
                                  <div className="text-[11px] text-gray-400 font-mono mt-1">
                                    A/C: {matchedVendor.account_number} • Routing: {matchedVendor.routing_number || "—"}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 sm:px-4 py-3">
                                <input
                                  type="text"
                                  value={add.description}
                                  onChange={(e) =>
                                    handleAdditionalSalaryRowChange(
                                      add.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  placeholder={salaryReason || "e.g. Festival Bonus, Office Allowance"}
                                  className="w-full border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-3 sm:px-4 py-3 text-right">
                                <input
                                  type="number"
                                  value={add.amount}
                                  onChange={(e) =>
                                    handleAdditionalSalaryRowChange(
                                      add.id,
                                      "amount",
                                      e.target.value
                                    )
                                  }
                                  placeholder="0.00"
                                  className="w-36 text-right border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveAdditionalSalaryRow(add.id)
                                  }
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove additional transaction"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer / Summary & Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
              <div className="text-left w-full sm:w-auto">
                <span className="text-xs text-gray-500 block">
                  Total Payout ({selectedSalaryRows.length} Employees
                  {additionalSalaryRows.length > 0 ? ` + ${additionalSalaryRows.length} Additional` : ""})
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700">
                    ৳ {grandTotalPayout.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {additionalSalaryRows.length > 0 && (
                    <span className="text-xs text-gray-500">
                      (Emp: ৳{employeeSubtotal.toLocaleString()} • Add: ৳{additionalSubtotal.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl border border-slate-200 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleLoadEmployeesIntoTable}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white bg-slate-200/80 hover:border-slate-300 rounded-xl border border-transparent transition-colors"
                  title="Load all into the main generator table"
                >
                  Load into Table
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSalaryExcel}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Salary Excel</span>
                </button>
              </div>
            </div>
        </Modal>
      )}
      <ConfirmDeleteModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={executeReset}
        title="Reset All Entries?"
        description="Are you sure you want to clear all transfer entries? This action cannot be undone."
        itemName="All Transfer Entries"
      />
      {/* SCB Upload Notification Modal */}
      {showScbPopup && (
        <Modal 
          isOpen={showScbPopup} 
          onClose={() => setShowScbPopup(false)} 
          title="Action Required"
        >
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Excel Generated!</h3>
            <p className="text-gray-600">
              Your bulk transfer Excel file has been downloaded. Please proceed to the Standard Chartered Straight2Bank dashboard to upload it.
            </p>
            <div className="pt-4">
              <a 
                href="https://s2b.standardchartered.com/unifiedlogin/login/index.html?language=en_AE#/login"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowScbPopup(false)}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0066b3] text-white font-medium rounded-xl hover:bg-[#005596] transition-colors w-full sm:w-auto"
              >
                Go to SCB Dashboard
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </Modal>
      )}

      {/* Footer Quick Link */}
      <div className="text-center pt-8 pb-4">
        <a
          href="https://s2b.standardchartered.com/unifiedlogin/login/index.html?language=en_AE#/login"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#0066b3] transition-colors hover:underline"
        >
          Open SCB Straight2Bank Portal
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
