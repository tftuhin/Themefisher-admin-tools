import { getClients } from "@/app/actions";
import ClientsClient from "./ClientsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const clients = await getClients();
  return <ClientsClient initialClients={clients} />;
}
