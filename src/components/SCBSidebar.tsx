'use client'

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSpreadsheet, Users, CreditCard, Menu, X, ArrowLeft, Home } from "lucide-react";

const navItems = [
  {
    name: "Generator",
    href: "/scb-tools",
    icon: FileSpreadsheet,
  },
  {
    name: "Receiver Bank AC",
    href: "/scb-tools/vendors",
    icon: Users,
  },
  {
    name: "Debit Accounts",
    href: "/scb-tools/debit-accounts",
    icon: CreditCard,
  },
];

export default function SCBSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMobile = () => setIsMobileOpen(false);

  const navContent = (
    <>
      {/* Home / Back to Dashboard Action Button */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all duration-150 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-emerald-600 transition-transform" />
          <span>Themefisher Admin Tools</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs shrink-0">
            SCB
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">
              SCB Transection
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Bulk Excel Generator</p>
          </div>
        </div>
        <button
          type="button"
          onClick={closeMobile}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/scb-tools" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`group flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
              }`}
            >
              <Icon
                className={`w-4.5 h-4.5 mr-3 transition-colors shrink-0 ${
                  isActive ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600"
                }`}
              />
              <span className="truncate">{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Themefisher Admin Tools</span>
        <Link href="/" className="hover:text-emerald-600 flex items-center gap-1">
          <Home className="w-3 h-3" /> Home
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top App Bar */}
      <header className="md:hidden bg-white border-b border-slate-200 h-14 px-4 flex items-center justify-between sticky top-0 z-30 flex-shrink-0 shadow-2xs">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 mr-1"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shadow-xs">
            SCB
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">SCB Transection</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
          onClick={closeMobile}
        >
          <aside
            className="w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex-col h-screen select-none">
        {navContent}
      </aside>
    </>
  );
}
