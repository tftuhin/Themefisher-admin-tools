import { getVendors, getDebitAccounts } from "@/app/actions";
import ScbToolsClient from "./ScbToolsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [vendors, debitAccounts] = await Promise.all([
    getVendors(),
    getDebitAccounts(),
  ]);

  return (
    <ScbToolsClient
      initialVendors={vendors}
      initialDebitAccounts={debitAccounts}
    />
  );
}
