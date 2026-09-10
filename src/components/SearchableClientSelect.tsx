"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { Client } from "@/types"

interface SearchableClientSelectProps {
  clients: Client[]
  value: string
  onChange: (clientId: string) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
  className?: string
  error?: string | boolean
}

export default function SearchableClientSelect({
  clients,
  value,
  onChange,
  placeholder = "Select a client...",
  disabled = false,
  required = false,
  id,
  name,
  className = "",
  error,
}: SearchableClientSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Find currently selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === value)
  }, [clients, value])

  // Filter clients based on search query (matches name, tax_id, address, or bank_name)
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients
    const q = searchQuery.toLowerCase().trim()
    return clients.filter((c) => {
      const matchName = c.name?.toLowerCase().includes(q)
      const matchTax = c.tax_id?.toLowerCase().includes(q)
      const matchAddress = c.address?.toLowerCase().includes(q)
      const matchBank = c.bank_name?.toLowerCase().includes(q)
      return Boolean(matchName || matchTax || matchAddress || matchBank)
    })
  }, [clients, searchQuery])

  const openDropdown = () => {
    setIsOpen(true)
    setHighlightedIndex(0)
  }

  const closeDropdown = () => {
    setIsOpen(false)
    setSearchQuery("")
    setHighlightedIndex(0)
  }

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown()
    } else {
      openDropdown()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("touchstart", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current && filteredClients.length > 0) {
      const itemElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (itemElement) {
        itemElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex, isOpen, filteredClients.length])

  const handleSelect = (clientId: string) => {
    onChange(clientId)
    closeDropdown()
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    closeDropdown()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault()
        openDropdown()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredClients.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredClients.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (filteredClients.length > 0 && filteredClients[highlightedIndex]) {
          handleSelect(filteredClients[highlightedIndex].id)
        }
        break
      case "Escape":
      case "Tab":
        e.preventDefault()
        closeDropdown()
        break
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form validation & submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-left text-base sm:text-sm flex items-center justify-between transition-all bg-white focus:outline-hidden cursor-pointer ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        }`}
      >
        <div className="flex items-center min-w-0 flex-1 mr-2">
          {selectedClient ? (
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium text-gray-900">
                {selectedClient.name}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedClient && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/70 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1.5" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, tax ID, country..."
              className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-hidden py-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Client List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto divide-y divide-gray-50 p-1"
          >
            {filteredClients.length === 0 ? (
              <li className="py-6 px-4 text-center text-xs sm:text-sm text-gray-400">
                {searchQuery ? `No clients found matching "${searchQuery}"` : "No clients available"}
              </li>
            ) : (
              filteredClients.map((c, index) => {
                const isSelected = c.id === value
                const isHighlighted = index === highlightedIndex

                return (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-left ${
                      isSelected
                        ? "bg-blue-50/80 text-blue-900 font-semibold"
                        : isHighlighted
                        ? "bg-gray-50 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-sm font-medium truncate">{c.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-normal mt-0.5 truncate">
                        {c.tax_id && (
                          <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                            {c.tax_id}
                          </span>
                        )}
                        {c.address && (
                          <span className="truncate">{c.address}</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    )}
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
