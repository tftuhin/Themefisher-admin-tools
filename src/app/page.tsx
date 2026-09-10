'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  FileSpreadsheet, 
  ArrowRight, 
  Users, 
  PlusSquare, 
  Settings, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Database,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface Stats {
  clientsCount: number;
  invoicesCount: number;
  paymentAccountsCount: number;
  vendorsCount: number;
  debitAccountsCount: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    clientsCount: 0,
    invoicesCount: 0,
    paymentAccountsCount: 0,
    vendorsCount: 0,
    debitAccountsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }
      try {
        const [cRes, iRes, pRes, vRes, dRes] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }),
          supabase.from("invoices").select("id", { count: "exact", head: true }),
          supabase.from("payment_accounts").select("id", { count: "exact", head: true }),
          supabase.from("vendors").select("id", { count: "exact", head: true }),
          supabase.from("debit_accounts").select("id", { count: "exact", head: true }),
        ]);

        setStats({
          clientsCount: cRes.count || 0,
          invoicesCount: iRes.count || 0,
          paymentAccountsCount: pRes.count || 0,
          vendorsCount: vRes.count || 0,
          debitAccountsCount: dRes.count || 0,
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                  Finance & Operations Hub
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                  SUITE v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Unified Banking & Documentation Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isSupabaseConfigured 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`} />
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSupabaseConfigured ? "Database Connected" : "DB Config Required"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Welcome / Hero Banner */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            Centralized Business Tools
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tools Dashboard
          </h1>
          <p className="text-slate-600 mt-2 max-w-3xl text-sm sm:text-base leading-relaxed">
            Select a specialized tool below to manage bank transactions, generate remittance forms, 
            maintain beneficiary pools, or export compliant banking spreadsheets.
          </p>
        </div>

        {/* The Tool Tiles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Tool Card 1: Invoice & Form-C Generator */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden relative">
            <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />
            
            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <FileText className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Form-C & Invoices
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Invoice & Form-C Generator
              </h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Generate Bangladesh Bank inward remittance Form-C declarations and professional client invoices. 
                Full support for auto-numbering, multi-currency pricing, and one-click A4 print/PDF exports.
              </p>

              {/* Live Metric Pills */}
              <div className="grid grid-cols-3 gap-2 my-6 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Clients</div>
                  <div className="text-lg font-bold text-slate-800">
                    {loading ? "..." : stats.clientsCount}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Invoices</div>
                  <div className="text-lg font-bold text-slate-800">
                    {loading ? "..." : stats.invoicesCount}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Accounts</div>
                  <div className="text-lg font-bold text-slate-800">
                    {loading ? "..." : stats.paymentAccountsCount}
                  </div>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="mt-auto space-y-3">
                <Link
                  href="/invoice-tools"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all group/btn"
                >
                  <span>Launch Tool & View Docs</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                  <Link
                    href="/invoice-tools/create-invoice"
                    className="py-2 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PlusSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>New Invoice</span>
                  </Link>
                  <Link
                    href="/invoice-tools/clients"
                    className="py-2 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Clients</span>
                  </Link>
                  <Link
                    href="/invoice-tools/settings"
                    className="py-2 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-blue-600" />
                    <span>Settings</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tool Card 2: SCB Bulk Transaction Generator */}
          <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col overflow-hidden relative">
            <div className="h-2 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500" />

            <div className="p-6 sm:p-8 flex-1 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Standard Chartered Bank
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                SCB Transection Generator
              </h2>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                Generate bulk bank transfer Excel files compliant with SCB format specifications. 
                Manage beneficiary vendors, validate 9-digit routing codes, and select funding accounts.
              </p>

              {/* Live Metric Pills */}
              <div className="grid grid-cols-2 gap-3 my-6 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Beneficiary Vendors</div>
                  <div className="text-lg font-bold text-slate-800">
                    {loading ? "..." : stats.vendorsCount}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Debit Accounts</div>
                  <div className="text-lg font-bold text-slate-800">
                    {loading ? "..." : stats.debitAccountsCount}
                  </div>
                </div>
              </div>

              {/* Quick Action Navigation */}
              <div className="mt-auto space-y-3">
                <Link
                  href="/scb-tools"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all group/btn"
                >
                  <span>Launch Bulk Excel Generator</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                  <Link
                    href="/scb-tools/vendors"
                    className="py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Vendor Pool</span>
                  </Link>
                  <Link
                    href="/scb-tools/debit-accounts"
                    className="py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Debit Accounts</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Database Quick Reference Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Consolidated Database Architecture</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Both tools operate under a single Supabase database with 5 distinct tables (clients, invoices, payment_accounts, vendors, debit_accounts).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span>supabase_schema.sql</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>Business Finance & Banking Suite · Single Repository & Database</div>
          <div>Form-C Declaration &amp; SCB Bulk Transfer System</div>
        </div>
      </footer>
    </div>
  );
}
