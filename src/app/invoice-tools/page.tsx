import { getClients, getInvoices, getPaymentAccounts } from "@/app/actions";
import InvoiceToolsClient from "./InvoiceToolsClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [clients, invoices, paymentAccounts] = await Promise.all([
    getClients(),
    getInvoices(),
    getPaymentAccounts(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-gray-500">
          Loading documents...
        </div>
      }
    >
      <InvoiceToolsClient
        initialClients={clients}
        initialInvoices={invoices}
        initialPaymentAccounts={paymentAccounts}
      />
    </Suspense>
  );
}
