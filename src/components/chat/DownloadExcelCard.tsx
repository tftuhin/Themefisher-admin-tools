"use client";

import { Download, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

interface DownloadExcelCardProps {
  filename: string;
  rows: any[];
}

export function DownloadExcelCard({ filename, rows }: DownloadExcelCardProps) {
  const handleDownload = () => {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm max-w-sm mt-2">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-slate-900">Excel Generated</h4>
          <p className="text-xs text-slate-500">{filename}</p>
        </div>
      </div>
      
      <button
        onClick={handleDownload}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
      >
        <Download className="w-3.5 h-3.5" /> Download Excel
      </button>
    </div>
  );
}
