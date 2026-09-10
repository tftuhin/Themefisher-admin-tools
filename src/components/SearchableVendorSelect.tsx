'use client'

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import type { Vendor } from "@/types";

interface SearchableVendorSelectProps {
  vendors: Vendor[];
  value: string | null;
  onChange: (vendorId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SearchableVendorSelect({
  vendors,
  value,
  onChange,
  placeholder = "Search receiver...",
  disabled = false,
}: SearchableVendorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedVendor = vendors.find((v) => v.id === value) || null;

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.receiver_name.toLowerCase().includes(query) ||
      v.account_number.toLowerCase().includes(query) ||
      v.bank_name.toLowerCase().includes(query) ||
      v.branch_name.toLowerCase().includes(query) ||
      v.routing_number.toLowerCase().includes(query)
    );
  });

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(0);
  };

  const openDropdown = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery("");
    if (value) {
      const idx = vendors.findIndex((v) => v.id === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    } else {
      setHighlightedIndex(0);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSelect = (vendorId: string) => {
    onChange(vendorId);
    closeDropdown();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    closeDropdown();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredVendors.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredVendors.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredVendors.length > 0 && filteredVendors[highlightedIndex]) {
          handleSelect(filteredVendors[highlightedIndex].id);
        }
        break;
      case "Escape":
      case "Tab":
        e.preventDefault();
        closeDropdown();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        className={`w-full px-3 py-2 border rounded-lg text-left text-sm flex items-center justify-between transition-all bg-white cursor-pointer ${
          disabled
            ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
            : isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : "border-slate-300 hover:border-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        }`}
      >
        <div className="flex items-center min-w-0 flex-1 mr-2">
          {selectedVendor ? (
            <div className="min-w-0 flex-1">
              <span className="block truncate font-medium text-slate-900">
                {selectedVendor.receiver_name}
              </span>
              <span className="block truncate text-[11px] text-slate-500">
                {selectedVendor.bank_name} • A/C: {selectedVendor.account_number}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedVendor && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-emerald-600" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receiver name, account, bank, routing..."
              className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-0.5"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredVendors.length === 0 ? (
              <li className="py-5 px-3 text-center text-xs text-slate-400">
                {searchQuery ? `No receivers matching "${searchQuery}"` : "No receivers in vendor pool"}
              </li>
            ) : (
              filteredVendors.map((v, index) => {
                const isSelected = v.id === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={v.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(v.id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-left ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-900 font-semibold"
                        : isHighlighted
                        ? "bg-slate-50 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-sm font-medium truncate">{v.receiver_name}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
                        <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                          {v.account_number}
                        </span>
                        <span>{v.bank_name}</span>
                        {v.branch_name && <span>({v.branch_name})</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
