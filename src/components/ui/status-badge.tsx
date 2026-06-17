import { Badge } from "./badge";
import {
  OnboardingStatus,
  VerificationStatus,
  TransactionStatus,
  RiskLevel,
  SessionStatus,
  PersonVerificationBadge,
} from "@/types";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const onboardingVariants: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  draft: { label: "Draft", variant: "default" },
  submitted: { label: "Submitted", variant: "info" },
  under_review: { label: "Under Review", variant: "warning" },
  edd_required: { label: "EDD Required", variant: "danger" },
  approved: { label: "Approved", variant: "success" },
  denied: { label: "Denied", variant: "danger" },
  closed: { label: "Closed", variant: "default" },
};

const verificationVariants: Record<VerificationStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Pending", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

const transactionVariants: Record<TransactionStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Pending", variant: "warning" },
  processing: { label: "Processing", variant: "info" },
  settled: { label: "Settled", variant: "success" },
  failed: { label: "Failed", variant: "danger" },
};

const riskVariants: Record<RiskLevel, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  low: { label: "Low Risk", variant: "success" },
  medium: { label: "Medium Risk", variant: "warning" },
  high: { label: "High Risk", variant: "danger" },
};

export function OnboardingStatusBadge({ status }: { status: OnboardingStatus | "closed" }) {
  const entry = onboardingVariants[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function VerificationStatusBadge({ status }: { status: VerificationStatus }) {
  const { label, variant } = verificationVariants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const { label, variant } = transactionVariants[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, variant } = riskVariants[level];
  return <Badge variant={variant}>{label}</Badge>;
}

const sessionStatusVariants: Record<SessionStatus, { label: string; variant: BadgeVariant }> = {
  in_progress: { label: "In Progress", variant: "info" },
  abandoned: { label: "Abandoned", variant: "default" },
  submitted: { label: "Submitted", variant: "info" },
  screening_in_progress: { label: "Screening In Progress", variant: "warning" },
  pending_review: { label: "Pending Review", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  denied: { label: "Denied", variant: "danger" },
  partially_verified: { label: "Partially Verified", variant: "warning" },
  expired: { label: "Expired", variant: "default" },
};

const personBadgeVariants: Record<PersonVerificationBadge, { label: string; variant: BadgeVariant }> = {
  not_started: { label: "Not Started", variant: "default" },
  link_sent: { label: "Link Sent", variant: "info" },
  in_progress: { label: "In Progress", variant: "info" },
  approved: { label: "Approved", variant: "success" },
  denied: { label: "Denied", variant: "danger" },
  under_review: { label: "Under Review", variant: "warning" },
  expired: { label: "Expired", variant: "default" },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const e =
    sessionStatusVariants[status] ??
    ({ label: String(status ?? "Unknown"), variant: "default" } as const);
  return <Badge variant={e.variant}>{e.label}</Badge>;
}

export function PersonBadge({ badge }: { badge: PersonVerificationBadge }) {
  // Defensive: never crash the page if a person arrives with a missing/unknown
  // badge value (e.g. data drift); fall back to a neutral chip.
  const e =
    personBadgeVariants[badge] ??
    ({ label: String(badge ?? "Unknown"), variant: "default" } as const);
  return <Badge variant={e.variant}>{e.label}</Badge>;
}
