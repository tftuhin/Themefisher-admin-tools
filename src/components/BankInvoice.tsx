/* eslint-disable @next/next/no-img-element -- Standard img tags required for react-to-print rasterization reliability */
import React from "react"
import { format } from "date-fns"
import type { Invoice, Client, PaymentAccount } from "@/types"

interface BankInvoiceProps {
  invoice: Invoice
  client: Client
  paymentAccounts: PaymentAccount[]
}

function parseInvoiceDate(dateStr?: string): Date {
  if (!dateStr) return new Date()
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) return d
  const parts = dateStr.split(/[-/ ]/)
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    const month = months.indexOf(parts[1].toLowerCase())
    let year = parseInt(parts[2], 10)
    if (year < 100) year += 2000
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  return new Date()
}

export const BankInvoice = React.forwardRef<HTMLDivElement, BankInvoiceProps>(
  ({ invoice, client, paymentAccounts }, ref) => {
    if (!invoice || !client) return <div ref={ref}></div>

    const parsedDate = parseInvoiceDate(invoice.invoice_date)
    const invoiceDate = format(parsedDate, "d-MMM-yy")

    // Sales period is start of month to end of month for that invoice
    const startOfMonth = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1)
    const endOfMonth = new Date(parsedDate.getFullYear(), parsedDate.getMonth() + 1, 0)
    const salesPeriodStart = format(startOfMonth, "d-MMM-yyyy")
    const salesPeriodEnd = format(endOfMonth, "d-MMM-yyyy")

    const formattedAmount = Number(invoice.amount).toFixed(2)

    // Filter accounts selected for this invoice, or default to first account
    const selectedAccounts = paymentAccounts.filter((acc) =>
      invoice.payment_methods?.includes(acc.id)
    )
    const effectiveAccounts: PaymentAccount[] =
      selectedAccounts.length > 0
        ? selectedAccounts
        : paymentAccounts.length > 0
          ? [paymentAccounts[0]]
          : [
              {
                id: "default-scb",
                bank_name: "Standard Chartered bank",
                bank_address: "67 Gulshan Avenue, Gulshan, Dhaka\n1212, Bangladesh",
                name_on_account: "Themefisher",
                bic_swift: "SCBLBDDXXXX",
                account_number: "01914137101",
              },
            ]

    const isMultiple = effectiveAccounts.length > 1

    return (
      <div
        ref={ref}
        className="print-page bg-white text-black text-[12.5px] max-w-4xl mx-auto print:m-0 print:p-0 print:shadow-none shadow-sm flex flex-col justify-between"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          width: "210mm",
          height: "297mm",
          maxHeight: "297mm",
          padding: "12mm 18mm 12mm 18mm",
          color: "#000",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div>
          {/* Header: Logo and Invoice Meta */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <img
                src="/themefisher_logo.png"
                alt="THEMEFISHER"
                className="h-9 w-auto object-contain"
              />
            </div>
            <div className="text-right">
              <h1 className="text-[28px] font-normal tracking-tight text-black mb-2 leading-none">
                Invoice
              </h1>
              <div className="space-y-1 text-xs">
                <div className="flex justify-end gap-5">
                  <span className="font-bold">Invoice Date:</span>
                  <span className="w-24 text-right">{invoiceDate}</span>
                </div>
                <div className="flex justify-end gap-5">
                  <span className="font-bold">Invoice Number:</span>
                  <span className="w-24 text-right">{invoice.invoice_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice To / Invoice From */}
          <div className="grid grid-cols-2 gap-6 mb-5 text-xs">
            <div>
              <div className="font-bold mb-1 text-gray-700">Invoice to:</div>
              <div className="font-bold text-sm mb-0.5 text-gray-900">{client.name}</div>
              <div className="text-gray-800 whitespace-pre-line leading-relaxed text-[12px]">
                {client.address}
              </div>
              {client.tax_id && (
                <div className="mt-1.5 font-medium text-[12px] text-gray-800">
                  VAT/Tax ID: {client.tax_id}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold mb-1 text-gray-700">Invoice from:</div>
              <div className="font-bold text-sm mb-0.5 text-gray-900">Themefisher</div>
              <div className="text-gray-800 leading-relaxed text-[12px]">
                Appartement A2, House-2G,
                <br />
                Shaymoly, Road-1, Dhaka
                <br />
                Bangladesh
              </div>
              <div className="mt-2 font-medium text-[12px]">BIN: 003271347</div>
            </div>
          </div>

          {/* Currency Section */}
          <div className="border-t border-b border-black py-1.5 px-1 mb-3 flex items-center gap-5 text-xs font-bold">
            <span className="tracking-wide">CURRENCY-</span>
            <span>{invoice.currency || "USD"}</span>
          </div>

          {/* Order Details Section */}
          <div className="border-b border-black pb-2.5 mb-3 text-xs">
            <div className="font-bold mb-1">Order details:</div>
            <div className="flex items-center gap-6">
              <span className="w-20 font-bold">Product:</span>
              <span className="font-normal">{invoice.description}</span>
            </div>
          </div>

          {/* Billing Summary Section */}
          <div className="border-b border-black pb-3 mb-3 text-xs">
            <div className="font-bold mb-1.5">Billing summary:</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span>Sales Period</span>
                <span>
                  {salesPeriodStart} &nbsp;-&nbsp; {salesPeriodEnd}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Amount Due</span>
                <span>{formattedAmount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sales Tax</span>
                <span>0</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Sales Tax: %</span>
                <span>0.00%</span>
              </div>
              <div className="border-t border-b border-black py-1 flex justify-between items-center font-bold">
                <span>Total Amount Due</span>
                <span>{formattedAmount}</span>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span>Payment terms</span>
                <span>15 Days</span>
              </div>
            </div>
          </div>

          {/* Transfer Information Section */}
          <div className="text-xs">
            <div className="font-bold mb-1.5">Transfer Information:</div>
            <div className="border border-gray-300 p-3">
              {isMultiple ? (
                /* Multiple Accounts: Side-by-side Columns */
                <div className="space-y-2.5">
                  <div
                    className={`grid gap-3 ${
                      effectiveAccounts.length === 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
                    }`}
                  >
                    {effectiveAccounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="border border-black p-2.5 space-y-2 text-[11.5px] leading-tight"
                      >
                        <div>
                          <div className="font-bold">Bank Name:</div>
                          <div className="mt-0.5">{acc.bank_name || acc.account_name}</div>
                        </div>
                        {acc.bank_address && (
                          <div>
                            <div className="font-bold">Bank Address:</div>
                            <div className="mt-0.5 whitespace-pre-line leading-snug">
                              {acc.bank_address}
                            </div>
                          </div>
                        )}
                        {acc.name_on_account && (
                          <div>
                            <div className="font-bold">Name on Account:</div>
                            <div className="mt-0.5">{acc.name_on_account}</div>
                          </div>
                        )}
                        {acc.bic_swift && (
                          <div>
                            <div className="font-bold">BIC/SWIFT:</div>
                            <div className="mt-0.5 font-mono">{acc.bic_swift}</div>
                          </div>
                        )}
                        {acc.account_number && (
                          <div>
                            <div className="font-bold">IBAN/Account Number:</div>
                            <div className="mt-0.5 font-mono">{acc.account_number}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-[11.5px] pt-1">
                    <div className="font-bold">Special Instructions/ Notes:</div>
                    <div className="mt-0.5">
                      {invoice.description || "Website development Services"}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Account: Sits on the left, matching PDF */
                <div className="border border-black p-3 w-[320px] space-y-2 text-[11.5px] leading-tight">
                  <div>
                    <div className="font-bold">Bank Name:</div>
                    <div className="mt-0.5">
                      {effectiveAccounts[0].bank_name || effectiveAccounts[0].account_name}
                    </div>
                  </div>
                  {effectiveAccounts[0].bank_address && (
                    <div>
                      <div className="font-bold">Bank Address:</div>
                      <div className="mt-0.5 whitespace-pre-line leading-snug">
                        {effectiveAccounts[0].bank_address}
                      </div>
                    </div>
                  )}
                  {effectiveAccounts[0].name_on_account && (
                    <div>
                      <div className="font-bold">Name on Account:</div>
                      <div className="mt-0.5">{effectiveAccounts[0].name_on_account}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-bold">Special Instructions/ Notes:</div>
                    <div className="mt-0.5">
                      {invoice.description || "Website development Services"}
                    </div>
                  </div>
                  {effectiveAccounts[0].bic_swift && (
                    <div>
                      <div className="font-bold">BIC/SWIFT:</div>
                      <div className="mt-0.5 font-mono">{effectiveAccounts[0].bic_swift}</div>
                    </div>
                  )}
                  {effectiveAccounts[0].account_number && (
                    <div>
                      <div className="font-bold">IBAN/Account Number:</div>
                      <div className="mt-0.5 font-mono">{effectiveAccounts[0].account_number}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Terms & Conditions AND Bottom Signature */}
        <div className="pt-3 border-t border-gray-300 flex justify-between items-end gap-6 text-[11px] leading-tight mt-3">
          <div className="max-w-[65%] space-y-1 text-gray-700">
            <div className="font-bold text-gray-900 text-xs tracking-wide">
              Terms &amp; Conditions
            </div>
            <div>
              <span className="font-semibold text-gray-900">Payment Terms:</span> Payment is
              strictly due within 15 days from the invoice date via bank transfer or credit card.
            </div>
            <div>
              <span className="font-semibold text-gray-900">Disputes &amp; Ownership:</span>{" "}
              Discrepancies must be reported within 7 days of receipt; goods/services remain company
              property until paid in full.
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[10.5px] text-gray-500 mb-0.5">Signing Authority</div>
            <div className="inline-block border-b border-gray-400 pb-0.5 px-2 mb-1">
              <img
                src="/signature.png"
                alt="Signature"
                className="h-8 w-auto object-contain inline-block"
              />
            </div>
            <div className="text-xs font-bold text-gray-900 leading-tight">Mehedi Sharif</div>
            <div className="text-[11px] text-gray-600 leading-tight">Founder</div>
            <div className="text-[11.5px] font-bold text-gray-900 leading-tight">Themefisher</div>
          </div>
        </div>
      </div>
    )
  }
)

BankInvoice.displayName = "BankInvoice"
