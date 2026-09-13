/* eslint-disable @next/next/no-img-element -- Standard img tags required for react-to-print rasterization reliability */
import React from "react";
import { format } from "date-fns";
import type { Invoice, Client, PaymentAccount } from "@/types";

interface CFormProps {
  invoice: Invoice;
  client: Client;
  paymentAccounts?: PaymentAccount[];
}

function parseInvoiceDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  const parts = dateStr.split(/[-/ ]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const month = months.indexOf(parts[1].toLowerCase());
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date();
}

export const CForm = React.forwardRef<HTMLDivElement, CFormProps>(
  ({ invoice, client }, ref) => {
    if (!invoice || !client) return <div ref={ref}></div>;

    const remitterName = client.name;
    const remitterAddress = client.address;
    const remittingBank = client.bank_name || "";
    const remittingBankAddress = client.bank_address || "";

    // The amount is in foreign currency (usually USD)
    const amountVal =
      Number(invoice.received_amount) > 0
        ? invoice.received_amount
        : invoice.amount;
    const formattedAmount = Number(amountVal).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formCDate = format(
      parseInvoiceDate(invoice.invoice_date),
      "d MMM yyyy",
    );

    return (
      <div
        ref={ref}
        className="print-page bg-white text-black text-[12.5px] leading-snug max-w-4xl mx-auto print:m-0 print:p-0 print:shadow-none shadow-sm flex flex-col"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          width: "210mm",
          height: "297mm",
          maxHeight: "297mm",
          padding: "12mm 18mm 12mm 18mm",
          color: "#000",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Top Right Enclosure */}
        <div className="text-right text-[13px] font-normal mb-1.5">
          Enclosure
        </div>

        {/* Centered Heading */}
        <div className="text-center font-bold text-[19px] mb-1 tracking-tight leading-none">
          Form–C (ICT)
        </div>

        {/* Centered Subtitle */}
        <div className="text-center text-[12.5px] leading-tight font-normal mb-4">
          Declaration for inward remittance on account of ICT
          <br />
          related services of amount exceeding USD 10,000 or equivalent
        </div>

        {/* Declaration Paragraph */}
        <p className="mb-3.5 text-justify leading-relaxed text-[12.5px]">
          I/We do hereby declare that I/we have received remittance of{" "}
          <span className="font-bold">{invoice.currency || "USD"}</span>
          &nbsp;&nbsp;
          <span className="font-bold border-b border-black inline-block px-3 min-w-[70px] text-center">
            {formattedAmount}
          </span>{" "}
          (amount)
          <br />
          which is a fair value against ICT related services described below in
          respect of which this declaration is made out and that the particulars
          given below are true:
        </p>

        {/* Section a */}
        <div className="grid grid-cols-[280px_1fr] items-start mb-2.5 text-[12.5px]">
          <div className="font-normal">a) Remitter’s name and address:</div>
          <div>
            <div className="font-bold">{remitterName}</div>
            <div className="whitespace-pre-line text-[12px] text-gray-900">
              {remitterAddress}
            </div>
          </div>
        </div>

        {/* Section b */}
        <div className="grid grid-cols-[280px_1fr] items-start mb-2.5 text-[12.5px]">
          <div className="font-normal">b) Remitting bank and address:</div>
          <div>
            <div className="font-bold">{remittingBank || "—"}</div>
            <div className="whitespace-pre-line text-[12px] text-gray-900">
              {remittingBankAddress}
            </div>
          </div>
        </div>

        {/* Section c */}
        <div className="grid grid-cols-[480px_1fr] items-start mb-2.5 text-[12.5px]">
          <div className="font-normal">
            c) Reference No (contract/invoice/electronic communication etc.):
          </div>
          <div className="font-bold">{invoice.invoice_number}</div>
        </div>

        {/* Section d */}
        <div className="mb-1.5 text-[12.5px]">d) Purpose (please tick):</div>
        <div className="ml-4 space-y-1.5 mb-2.5 text-[12px]">
          {/* Checkbox 1: Checked */}
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 border border-black bg-gray-200/50 flex items-center justify-center shrink-0 mt-0.5">
              <svg
                className="w-3 h-3 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="leading-tight">
              Information Technology Enabled Services (IT Enabled Services) and
              Business Process Outsourcing (BPO) services – code 2410
            </div>
          </div>

          {/* Checkbox 2 */}
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 border border-black shrink-0 mt-0.5"></div>
            <div className="leading-tight">
              Computer and Information Technology consultancy and management
              services – code 2411
            </div>
          </div>

          {/* Checkbox 3 */}
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 border border-black shrink-0 mt-0.5"></div>
            <div className="leading-tight">
              Export of computer software including turn-key basis (customized)–
              code 2412
            </div>
          </div>

          {/* Checkbox 4 */}
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 border border-black shrink-0 mt-0.5"></div>
            <div className="leading-tight">
              Export of computer software including turn-key basis
              (non-customized) – code 2413
            </div>
          </div>

          {/* Checkbox 5 */}
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 border border-black shrink-0 mt-0.5"></div>
            <div className="leading-tight">
              Installation services concerning hardware and software maintenance
              and repairs of computers and peripheral equipment services – code
              2414
            </div>
          </div>

          {/* Checkbox 6 */}
          <div className="flex items-start gap-2.5">
            <div className="w-4 h-4 border border-black shrink-0 mt-0.5"></div>
            <div className="leading-tight">………………………. (please specify)</div>
          </div>
        </div>

        {/* Purpose Footnote */}
        <p className="text-[11px] leading-tight mb-4 text-gray-700">
          Note: Please see the “Code lists for Reporting of External Sector
          transactions by the Authorized dealers” for explanatory notes of above
          purposes.
        </p>

        {/* Applicant Details & Signature */}
        <div className="space-y-1.5 mb-5 text-[12.5px]">
          <div className="flex items-center">
            <span className="w-64 shrink-0">
              Signature with name of applicant:
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13.5px]">Themefisher</span>
              <img
                src="/signature.png"
                alt="Applicant Signature"
                className="h-8 w-auto object-contain inline-block -mt-1"
              />
            </div>
          </div>
          <div className="flex items-start">
            <span className="w-64 shrink-0">Address:</span>
            <span>
              Apartment A2, House-2G, Shaymoly, Road-1, Dhaka, Bangladesh
            </span>
          </div>
          <div className="flex items-center">
            <span className="w-64 shrink-0">Date:</span>
            <span>{formCDate}</span>
          </div>
        </div>

        {/* AD Section directly follows */}
        <div>
          {/* Horizontal Divider */}
          <div className="border-t border-black mb-2"></div>

          <div className="text-center text-[12.5px] mb-1.5 font-normal">
            (for AD’s use only)
          </div>
          <table className="w-full border-collapse border border-black text-center text-[12px] mb-4">
            <thead>
              <tr className="border-b border-black">
                <th className="border-r border-black py-1.5 px-3 font-normal w-[22%]">
                  Month
                </th>
                <th className="border-r border-black py-1.5 px-3 font-normal w-[32%]">
                  Country of ordering
                  <br />
                  customer
                </th>
                <th className="border-r border-black py-1.5 px-3 font-normal w-[20%]">
                  Purpose
                </th>
                <th className="py-1.5 px-3 font-normal w-[26%]">
                  Amount in
                  <br />
                  (state currency)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-8">
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td className="border-r border-black"></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          {/* AD Sign-off Fields */}
          <div className="space-y-2 text-[12px] pb-1">
            <div>Coded by:</div>
            <div>Checked by:</div>
            <div>Purpose of remittance:</div>
            <div className="pt-1">
              Signature and stamp of Authorized Dealer:
            </div>
            <div>Date:</div>
          </div>
        </div>
      </div>
    );
  },
);

CForm.displayName = "CForm";
