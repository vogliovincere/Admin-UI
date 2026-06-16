import { mockAccounts } from "@/lib/mock-data";
import AccountDetailClient from "./detail-client";

// Static export: enumerate every account id so each detail page is prerendered.
export function generateStaticParams() {
  return mockAccounts.map((a) => ({ id: a.id }));
}

export default function Page() {
  return <AccountDetailClient />;
}
