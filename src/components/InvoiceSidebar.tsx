'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, PlusSquare, Users, Settings, Menu, X, ArrowLeft, Home } from 'lucide-react'

export function InvoiceSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = [
    { name: 'Create Invoice', href: '/invoice-tools/create-invoice', icon: PlusSquare },
    { name: 'Generate Inward Docs', href: '/invoice-tools', icon: FileText },
    { name: 'Clients', href: '/invoice-tools/clients', icon: Users },
    { name: 'Configuration', href: '/invoice-tools/settings', icon: Settings },
  ]

  const navContent = (
    <>
      {/* Home / Back to Dashboard Action Button */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all duration-150 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 group-hover:text-blue-600 transition-transform" />
          <span>Themefisher Admin Tools</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">
              Invoice &amp; C Form
            </h1>
            <p className="text-[11px] text-slate-500">Generator System</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href || (link.href !== '/invoice-tools' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="truncate">{link.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Themefisher Admin Tools</span>
        <Link href="/" className="hover:text-blue-600 flex items-center gap-1">
          <Home className="w-3 h-3" /> Home
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Top Navbar (Visible on < md) */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 mr-1"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900 truncate">
            Invoice &amp; C Form
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -mr-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white text-slate-800 flex flex-col shadow-2xl transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>

      {/* Desktop Sidebar (Visible on md+) */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-slate-800 border-r border-slate-200 h-screen select-none shrink-0">
        {navContent}
      </aside>
    </>
  )
}
