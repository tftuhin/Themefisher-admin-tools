import { getVendors } from "@/app/actions";
import VendorsClient from "./VendorsClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const vendors = await getVendors();
  return <VendorsClient initialVendors={vendors} />;
}
