"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useForm } from "react-hook-form";
import type { PaymentAccount, PaymentAccountFormData } from "@/types";
import {
  Landmark,
  Trash2,
  Building2,
  User,
  CreditCard,
  MapPin,
  AlertCircle,
} from "lucide-react";

function normalizeAccount(acc: Record<string, unknown>): PaymentAccount {
  let detailsObj: Record<string, string> = {};
  if (
    typeof acc.account_details === "string" &&
    acc.account_details.trim().startsWith("{")
  ) {
    try {
      detailsObj = JSON.parse(acc.account_details);
    } catch {}
  }
  const getStr = (val: unknown) => (typeof val === "string" ? val : "");
  return {
    id: getStr(acc.id),
    bank_name:
      getStr(acc.bank_name) ||
      detailsObj.bank_name ||
      getStr(acc.account_name) ||
      "",
    bank_address: getStr(acc.bank_address) || detailsObj.bank_address || "",
    name_on_account:
      getStr(acc.name_on_account) || detailsObj.name_on_account || "",
    bic_swift: getStr(acc.bic_swift) || detailsObj.bic_swift || "",
    account_number:
      getStr(acc.account_number) || detailsObj.account_number || "",
    account_name: getStr(acc.account_name),
    account_details: getStr(acc.account_details),
    created_at: typeof acc.created_at === "string" ? acc.created_at : undefined,
  };
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dbTableMissing, setDbTableMissing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PaymentAccountFormData>();

  const fetchAccounts = useCallback(async () => {
    const { data, error } = await supabase
      .from("payment_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205") {
        setDbTableMissing(true);
      } else {
        console.error("Error fetching accounts:", error.message);
      }
    } else if (data) {
      setAccounts(data.map(normalizeAccount));
      setDbTableMissing(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function load() {
      const { data, error } = await supabase
        .from("payment_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ignore) {
        if (error) {
          if (error.code === "PGRST205") {
            setDbTableMissing(true);
          } else {
            console.error("Error fetching accounts:", error.message);
          }
        } else if (data) {
          setAccounts(data.map(normalizeAccount));
          setDbTableMissing(false);
        }
        setLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, []);

  const onSubmit = async (data: PaymentAccountFormData) => {
    const cleanBankName = data.bank_name?.trim();
    const cleanNameOnAccount = data.name_on_account?.trim();
    const cleanAccountNumber = data.account_number?.trim();
    const cleanBicSwift = data.bic_swift
      ? data.bic_swift.trim().toUpperCase().replace(/\s+/g, "")
      : null;
    const cleanBankAddress = data.bank_address?.trim() || null;

    if (!cleanBankName) {
      alert("Bank Name is required.");
      return;
    }
    if (!cleanNameOnAccount) {
      alert("Name on Account is required.");
      return;
    }
    if (!cleanAccountNumber) {
      alert("Account / IBAN Number is required.");
      return;
    }

    setSubmitting(true);
    const accountName = cleanBankName;
    const accountDetails = [
      `Name on Account: ${cleanNameOnAccount}`,
      `IBAN/Account Number/Account ID: ${cleanAccountNumber}`,
      cleanBicSwift ? `BIC/SWIFT: ${cleanBicSwift}` : "",
      cleanBankAddress ? `Bank Address: ${cleanBankAddress}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Full structured payload
    const payload = {
      bank_name: cleanBankName,
      bank_address: cleanBankAddress,
      name_on_account: cleanNameOnAccount,
      bic_swift: cleanBicSwift,
      account_number: cleanAccountNumber,
      account_name: accountName,
      account_details: accountDetails,
    };

    let { error } = await supabase.from("payment_accounts").insert([payload]);

    // Fallback if the table exists but doesn't have the new individual columns yet
    if (
      error &&
      (error.code === "PGRST204" ||
        error.message?.includes("column") ||
        error.code === "42703")
    ) {
      const fallbackPayload = {
        account_name: accountName,
        account_details: JSON.stringify({
          bank_name: cleanBankName,
          bank_address: cleanBankAddress || "",
          name_on_account: cleanNameOnAccount,
          bic_swift: cleanBicSwift || "",
          account_number: cleanAccountNumber,
        }),
      };
      const fallbackRes = await supabase
        .from("payment_accounts")
        .insert([fallbackPayload]);
      error = fallbackRes.error;
    }

    setSubmitting(false);

    if (!error) {
      reset();
      await fetchAccounts();
    } else {
      if (error.code === "PGRST205") {
        setDbTableMissing(true);
        alert(
          "The 'payment_accounts' table does not exist in Supabase yet. Please run the SQL schema from 'supabase_schema.sql' in your Supabase SQL editor.",
        );
      } else {
        console.error("Error saving account:", error.message);
        alert(
          "Unable to save bank account. Please verify details and try again.",
        );
      }
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) return;
    const { error } = await supabase
      .from("payment_accounts")
      .delete()
      .eq("id", id);
    if (!error) {
      await fetchAccounts();
    } else {
      console.error("Error deleting account:", error.message);
      alert("Unable to delete account. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Configuration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage payout bank accounts and payment credentials.
        </p>
      </div>

      {dbTableMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">
              Supabase Table Setup Required:
            </span>{" "}
            The{" "}
            <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">
              payment_accounts
            </code>{" "}
            table has not been created in your Supabase database yet. Please run
            the script in{" "}
            <span className="font-mono font-semibold">supabase_schema.sql</span>{" "}
            in your Supabase SQL Editor to enable saving accounts.
          </div>
        </div>
      )}

      {/* Add Payment Account Card */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center gap-2.5 bg-gray-50/50">
          <Landmark className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Add Bank / Payment Account
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 sm:p-6 space-y-4 sm:space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Bank Name (Mandatory) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500 font-semibold">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("bank_name", {
                    required: "Bank Name is required",
                  })}
                  maxLength={120}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-base sm:text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    errors.bank_name
                      ? "border-red-300 bg-red-50/30"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="e.g. Standard Chartered Bank or Wise"
                />
              </div>
              {errors.bank_name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.bank_name.message}
                </p>
              )}
            </div>

            {/* Name on Account (Mandatory) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Name on Account{" "}
                <span className="text-red-500 font-semibold">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("name_on_account", {
                    required: "Name on Account is required",
                  })}
                  maxLength={120}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-base sm:text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    errors.name_on_account
                      ? "border-red-300 bg-red-50/30"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="e.g. Themefisher LLC or Account Holder Name"
                />
              </div>
              {errors.name_on_account && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name_on_account.message}
                </p>
              )}
            </div>

            {/* IBAN / Account Number / Account ID (Mandatory) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                IBAN/Account Number/Account ID{" "}
                <span className="text-red-500 font-semibold">*</span>
              </label>
              <div className="relative">
                <input
                  {...register("account_number", {
                    required: "IBAN/Account Number/Account ID is required",
                  })}
                  maxLength={50}
                  className={`w-full px-3.5 py-2.5 border rounded-lg text-base sm:text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 ${
                    errors.account_number
                      ? "border-red-300 bg-red-50/30"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="e.g. 0001234567890 or GB29 XXXXX"
                />
              </div>
              {errors.account_number && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.account_number.message}
                </p>
              )}
            </div>

            {/* BIC / SWIFT (Optional) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                BIC/SWIFT{" "}
                <span className="text-xs text-gray-400 font-normal">
                  (Optional)
                </span>
              </label>
              <div className="relative">
                <input
                  {...register("bic_swift")}
                  maxLength={20}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
                  placeholder="e.g. SCBLBDDX"
                />
              </div>
            </div>
          </div>

          {/* Bank Address (Optional) */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Bank Address{" "}
              <span className="text-xs text-gray-400 font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              {...register("bank_address")}
              rows={2}
              maxLength={300}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-base sm:text-sm transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
              placeholder="e.g. 1 Basinghall Avenue, London, EC2V 5DD, United Kingdom"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto justify-center bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {submitting ? "Saving..." : "Add Bank Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing Accounts List */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-gray-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Existing Accounts
            </h2>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
            {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
          </span>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <p className="text-gray-500 text-sm py-4">Loading accounts...</p>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Landmark className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">
                No payment accounts configured yet.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Add your bank account details above to use them in invoices.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="border border-gray-200 rounded-lg p-3.5 sm:p-4 hover:border-gray-300 transition-colors bg-white relative group"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm sm:text-base break-words">
                          {acc.bank_name || acc.account_name || "Unnamed Bank"}
                        </span>
                        {acc.bic_swift && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-medium border border-blue-100 shrink-0">
                            SWIFT: {acc.bic_swift}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        {acc.name_on_account && (
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500 text-xs">Name:</span>
                            <span className="font-medium text-gray-800">
                              {acc.name_on_account}
                            </span>
                          </div>
                        )}

                        {acc.account_number && (
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-gray-500 text-xs">
                              Account/IBAN:
                            </span>
                            <span className="font-mono font-medium text-gray-800">
                              {acc.account_number}
                            </span>
                          </div>
                        )}

                        {acc.bank_address && (
                          <div className="flex items-start gap-1.5 text-gray-600 sm:col-span-2 text-xs mt-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span>{acc.bank_address}</span>
                          </div>
                        )}

                        {!acc.account_number &&
                          !acc.name_on_account &&
                          acc.account_details && (
                            <div className="sm:col-span-2 text-xs text-gray-600 whitespace-pre-wrap mt-1">
                              {acc.account_details}
                            </div>
                          )}
                      </div>
                    </div>

                    <button
                      onClick={() => void deleteAccount(acc.id)}
                      className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors ml-4 cursor-pointer"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
