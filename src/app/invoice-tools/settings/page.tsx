import { getPaymentAccounts } from "@/app/actions";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const accounts = await getPaymentAccounts();
  return <SettingsClient initialAccounts={accounts} />;
}
