"use client";

import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onHide?: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
  isHiding?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  onHide,
  title = "Delete Item?",
  description = "Are you sure you want to remove this item? This action cannot be undone.",
  itemName,
  isDeleting = false,
  isHiding = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
      maxWidth="sm"
    >
      <div className="p-6 text-center space-y-5">
        <p className="text-sm text-gray-600">
          {description}
        </p>
        
        {itemName && (
          <div className="bg-red-50 text-red-700 py-2 px-3 rounded-lg border border-red-100 font-medium text-sm inline-block">
            {itemName}
          </div>
        )}

        <div className={`flex items-center gap-3 pt-2 ${onHide ? 'flex-col sm:flex-row' : ''}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting || isHiding}
            className="flex-1 w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              disabled={isDeleting || isHiding}
              className="flex-1 w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isHiding ? "Hiding..." : "Hide Instead"}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || isHiding}
            className="flex-1 w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
