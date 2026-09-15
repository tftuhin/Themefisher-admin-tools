import { getDebitAccounts } from "@/app/actions";
import DebitAccountsClient from "./DebitAccountsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const accounts = await getDebitAccounts();
  return <DebitAccountsClient initialAccounts={accounts} />;
}
