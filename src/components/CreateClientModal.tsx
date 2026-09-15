"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/app/actions";
import { Loader2, AlertCircle, UserPlus, Building2, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import type { Client } from "@/types";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (clientId: string) => void;
  defaultValues: {
    name?: string;
    bank_name?: string;
    bank_address?: string;
  };
}

export function CreateClientModal({
  isOpen,
  onClose,
  onSuccess,
  defaultValues,
}: CreateClientModalProps) {
  const { register, handleSubmit, reset, setValue } = useForm<Partial<Client>>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError("");
      reset();
      
      if (defaultValues.name) setValue("name", defaultValues.name);
      if (defaultValues.bank_name) setValue("bank_name", defaultValues.bank_name);
      if (defaultValues.bank_address) setValue("bank_address", defaultValues.bank_address);
    }
  }, [isOpen, defaultValues, setValue, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: Partial<Client>) => {
    if (!data.name?.trim()) {
      setError("Client name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const newClient = await createClient({
        name: data.name.trim(),
        address: data.address?.trim() || undefined,
        tax_id: data.tax_id?.trim() || undefined,
        bank_name: data.bank_name?.trim() || undefined,
        bank_address: data.bank_address?.trim() || undefined,
      });
      onSuccess(newClient ? (newClient as any).id : "");
    } catch (err: any) {
      setError(err.message || "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Client Detected"
      subtitle="Please add this client to continue"
      icon={<UserPlus className="w-5 h-5 text-blue-600" />}
      maxWidth="lg"
    >

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto max-h-[75vh] w-full">
          {error && (
             <div className="p-3 bg-red-50 text-red-700 rounded-xl flex items-start gap-2 text-sm border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Client Information</label>
              <div className="space-y-4 p-4 bg-gray-50/50 border rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name <span className="text-red-500">*</span></label>
                  <input placeholder="e.g. Acme Corp" {...register("name", { required: true })} className="block w-full p-2.5 bg-white border rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Address</label>
                  <textarea placeholder="Full address..." {...register("address")} rows={2} className="block w-full p-2.5 bg-white border rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tax ID / VAT No</label>
                  <input placeholder="Optional" {...register("tax_id")} className="block w-full p-2.5 bg-white border rounded-lg border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono transition-shadow" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">Bank Details (Auto-filled)</label>
              </div>
              <div className="space-y-4 p-4 bg-blue-50/30 border border-blue-100 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
                  <input placeholder="Bank Name" {...register("bank_name")} className="block w-full p-2.5 bg-white border rounded-lg border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Address</label>
                  <textarea placeholder="Bank Address" {...register("bank_address")} rows={2} className="block w-full p-2.5 bg-white border rounded-lg border-blue-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Save & Continue
            </button>
          </div>
        </form>
    </Modal>
  );
}
