"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, type Vendor, type DebitAccount } from "@/lib/supabase";
import SearchableVendorSelect from "@/components/SearchableVendorSelect";
import { Plus, Trash2, FileSpreadsheet, AlertCircle, RotateCcw } from "lucide-react";
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

export default function GeneratorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rows, setRows] = useState<TransferRow[]>([
    { id: crypto.randomUUID(), vendorId: null, amount: "", description: "", transferDate: "" }
  ]);
  const [debitAccount, setDebitAccount] = useState<string>("");
  const [debitAccounts, setDebitAccounts] = useState<DebitAccount[]>([]);

  // Automatically pull debit accounts from Supabase database on load
  useEffect(() => {
    const loadDebitAccount = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from("debit_accounts")
            .select("*")
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false });

          if (data && data.length > 0) {
            setDebitAccounts(data);
            const defaultAcc = data.find((a) => a.is_default) || data[0];
            if (defaultAcc?.account_number) {
              setDebitAccount(defaultAcc.account_number);
              localStorage.setItem("scb_debit_account", defaultAcc.account_number);
              return;
            }
          }
        } catch (e) {
          console.error("Error loading debit account from DB:", e);
        }
      }

      // Fallback to localStorage or environment variable
      const saved = localStorage.getItem("scb_debit_account");
      if (saved) {
        setDebitAccount(saved);
      } else if (process.env.NEXT_PUBLIC_SCB_DEBIT_ACCOUNT) {
        setDebitAccount(process.env.NEXT_PUBLIC_SCB_DEBIT_ACCOUNT);
      }
    };

    loadDebitAccount();
  }, []);

  const handleDebitAccountChange = (val: string) => {
    setDebitAccount(val);
    localStorage.setItem("scb_debit_account", val);
  };

  useEffect(() => {
    const fetchVendors = async () => {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.from("vendors").select("*");
      if (data) setVendors(data);
    };
    fetchVendors();
  }, []);

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), vendorId: null, amount: "", description: "", transferDate: "" }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleRowChange = (id: string, field: keyof TransferRow, value: string | null) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleReset = () => {
    const hasData = rows.some(r => r.vendorId || r.amount || r.description || r.transferDate) || rows.length > 1;
    if (hasData) {
      const confirmReset = window.confirm("Are you sure you want to reset and clear all transfer entries?");
      if (!confirmReset) return;
    }
    setRows([
      { id: crypto.randomUUID(), vendorId: null, amount: "", description: "", transferDate: "" }
    ]);
  };

  const handleGenerateExcel = () => {
    // Validate rows
    const validRows = rows.filter(r => r.vendorId && r.amount && r.transferDate);
    
    if (validRows.length === 0) {
      alert("Please fill in all required fields (Vendor, Amount, Date) for at least one row.");
      return;
    }

    if (!debitAccount.trim()) {
      alert("Please enter a Debit Account Number before generating the Excel file.");
      return;
    }

    const excelData = validRows.map(row => {
      const vendor = vendors.find(v => v.id === row.vendorId);
      if (!vendor) return null;

      // Format date to DD/MM/YYYY
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
        "Beneficiary Email ID(Optional)": ""
      };
    }).filter(Boolean);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transfers");
    
    // Generate and download
    const fileName = `SCB_Transfers_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
          SCB Banking Tool
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">SCB Transection Generator</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">Create multiple transfer records and generate the bank Excel file.</p>
      </div>

      {/* Debit Account Dropdown Selector */}
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <label htmlFor="debit-account" className="block text-sm font-semibold text-gray-900">
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
            className="w-full px-3.5 py-2.5 border rounded-lg font-mono text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs cursor-pointer"
          >
            {debitAccounts.length > 0 ? (
              debitAccounts.map((acc) => (
                <option key={acc.id} value={acc.account_number}>
                  {acc.account_number} — {acc.account_label || acc.bank_name || "SCB"} {acc.is_default ? "★" : ""}
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

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs sm:text-sm">
              <p className="font-semibold">Supabase connection required</p>
              <p className="mt-1">
                Configure your Supabase URL & anon key in <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-xs">.env.local</code> to pull saved beneficiary accounts into this dropdown.
              </p>
            </div>
          </div>
          <Link
            href="/scb-tools/vendors"
            className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg whitespace-nowrap self-start sm:self-auto"
          >
            Manage Vendors
          </Link>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
        <div className="space-y-4">
          {rows.map((row, index) => (
            <div key={row.id} className="p-3.5 sm:p-4 border rounded-xl bg-gray-50/70 hover:bg-gray-50 transition-colors space-y-3">
              {/* Mobile Header for this row */}
              <div className="flex items-center justify-between md:hidden pb-2 border-b border-gray-200/70">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Transfer #{index + 1}
                </span>
                <button 
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length === 1}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
                  title="Remove Transfer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4 items-start">
                {/* Vendor Selection */}
                <div className="sm:col-span-2 md:col-span-4">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Receiver *</label>
                  <SearchableVendorSelect
                    vendors={vendors}
                    value={row.vendorId}
                    onChange={(val) => handleRowChange(row.id, "vendorId", val)}
                    placeholder="Search receiver..."
                  />
                </div>

                {/* Amount */}
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Amount *</label>
                  <input 
                    type="number" 
                    value={row.amount}
                    onChange={(e) => handleRowChange(row.id, "amount", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[42px] text-sm" 
                    placeholder="0.00" 
                  />
                </div>

                {/* Description (Max 100 chars) */}
                <div className="sm:col-span-1 md:col-span-3">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Description (Max 100)</label>
                  <input 
                    type="text" 
                    maxLength={100}
                    value={row.description}
                    onChange={(e) => handleRowChange(row.id, "description", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[42px] text-sm" 
                    placeholder="Transfer reason..." 
                  />
                </div>

                {/* Transfer Date */}
                <div className="sm:col-span-1 md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input 
                    type="date" 
                    value={row.transferDate}
                    onChange={(e) => handleRowChange(row.id, "transferDate", e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 min-h-[42px] text-sm" 
                  />
                </div>

                {/* Desktop Remove Action */}
                <div className="hidden md:flex md:col-span-1 items-end self-end h-[42px] mb-0.5 justify-center">
                  <button 
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    title="Remove Row"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-t pt-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={addRow}
              className="flex-1 sm:flex-none flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium px-4 py-2.5 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Transfer
            </button>

            <button 
              onClick={handleReset}
              className="flex items-center justify-center text-gray-600 hover:text-red-600 font-medium px-3.5 py-2.5 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-200 text-sm"
              title="Reset form and clear all entries"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </button>
          </div>

          <button 
            onClick={handleGenerateExcel}
            className="w-full sm:w-auto flex items-center justify-center bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-sm text-sm"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Generate Excel
          </button>
        </div>
      </div>
    </div>
  );
}
