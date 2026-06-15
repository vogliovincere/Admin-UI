"use client";

import { VerificationSession } from "@/types";
import { aggregateVerified } from "@/lib/verification-data";

// E2.3 aggregate "X of Y verified" pill — three explicit tones beyond the Badge
// variant set (green = all verified, yellow = partial, red = any denied).
const toneStyles: Record<"green" | "yellow" | "red", string> = {
  green: "bg-interro-accent-soft text-interro-accent",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};

export function AggregateProgress({
  session,
  className = "",
}: {
  session: VerificationSession;
  className?: string;
}) {
  const { verified, total, tone } = aggregateVerified(session);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${toneStyles[tone]} ${className}`}
    >
      {verified} of {total} verified
    </span>
  );
}
