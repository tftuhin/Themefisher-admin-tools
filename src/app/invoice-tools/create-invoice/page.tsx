import { getClients, getPaymentAccounts, getInvoices } from "@/app/actions";
import CreateInvoiceClient from "./CreateInvoiceClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [clients, accounts, invoices] = await Promise.all([
    getClients(),
    getPaymentAccounts(),
    getInvoices(),
  ]);

  return (
    <CreateInvoiceClient
      initialClients={clients}
      initialAccounts={accounts}
      initialInvoices={invoices}
    />
  );
}
