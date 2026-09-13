import Link from "next/link";
import { FileText, FileSpreadsheet, ArrowRight, Layers } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-8 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Themefisher Admin Tools
              </h1>
              <p className="text-xs text-slate-500">
                Select a tool to get started
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12">
        <div className="max-w-4xl w-full">
          {/* Header Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tools Dashboard
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              Click on a tool below to open its workspace
            </p>
          </div>

          {/* Simple, Clickable Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Tile 1: Invoice & Form-C Generator */}
            <Link
              href="/invoice-tools"
              className="group bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center cursor-pointer shadow-xs"
            >
              <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-xs">
                <FileText className="w-10 h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Invoice &amp; Form-C Generator
              </h3>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Generate Bangladesh Bank Form-C declarations and bank invoices
                with one-click print and PDF export.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Tile 2: SCB Transection Generator */}
            <Link
              href="/scb-tools"
              className="group bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 flex flex-col items-center text-center cursor-pointer shadow-xs"
            >
              <div className="w-20 h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-xs">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                SCB Transection Generator
              </h3>
              <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                Generate bulk bank transfer Excel files compliant with Standard
                Chartered Bank format specifications.
              </p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                <span>Open Tool</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Themefisher Admin Tools
      </footer>
    </div>
  );
}
