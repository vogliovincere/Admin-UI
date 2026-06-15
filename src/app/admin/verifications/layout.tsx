"use client";

import { VerificationProvider } from "@/lib/verifications/verification-store";
import { EddProvider } from "@/components/edd/edd-store";

// Scopes the verifications + EDD in-memory stores to the /admin/verifications
// subtree. The root DemoStateProvider (src/app/layout.tsx) remains untouched
// and still wraps this layout from above. The two stores stay isolated and are
// joined only at the page level via the write-back bridge (architecture §3.4 /
// §6.1 / risk §8.1).
export default function VerificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VerificationProvider>
      <EddProvider>{children}</EddProvider>
    </VerificationProvider>
  );
}
