import { mockApplications } from "@/lib/mock-data";
import ApplicationDetailClient from "./detail-client";

// Static export: enumerate every application id so each detail page is prerendered.
export function generateStaticParams() {
  return mockApplications.map((a) => ({ id: a.id }));
}

export default function Page() {
  return <ApplicationDetailClient />;
}
