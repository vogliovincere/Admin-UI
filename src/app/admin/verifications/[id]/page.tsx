import { verificationSessions } from "@/lib/verification-data";
import VerificationDetailClient from "./detail-client";

// Static export: enumerate every verification session id so each detail page is prerendered.
export function generateStaticParams() {
  return verificationSessions.map((s) => ({ id: s.id }));
}

export default function Page() {
  return <VerificationDetailClient />;
}
