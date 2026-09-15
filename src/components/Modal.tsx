import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string; // Additional classes for the form/body wrapper
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = "lg",
  className = "",
}: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden border border-gray-100 ${maxWidthClass}`}
      >
        <div className="px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="bg-blue-100 p-2 rounded-lg">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Using a flex container for children so they can define their own padding/scrolling */}
        <div className={`w-full ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
