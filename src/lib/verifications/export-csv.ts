// E5 (PD-146) — client-side CSV export for verification sessions.
// No backend: builds a CSV string and triggers a Blob download.

import {
  Address,
  PersonRole,
  SessionPerson,
  SessionStatus,
  VerificationSession,
} from "@/types";

// E5 / PD-146 §6.1 — PII export permission gate.
// In a real app this comes from the ops user's role/permission claims.
// Here it is a simple, real boolean controlling whether the SSN/Tax ID
// column is emitted at all (the column is OMITTED, not blanked, when false).
export const OPS_HAS_PII_EXPORT_PERMISSION = true;

const statusLabels: Record<SessionStatus, string> = {
  in_progress: "In Progress",
  abandoned: "Abandoned",
  submitted: "Submitted",
  screening_in_progress: "Screening In Progress",
  manual_review: "Manual Review",
  approved: "Approved",
  denied: "Denied",
  partially_verified: "Partially Verified",
  expired: "Expired",
};

const roleLabels: Record<PersonRole, string> = {
  primary: "Primary",
  co_holder: "Co-holder",
  ubo: "UBO",
  control_person: "Control Person",
};

const pathLabels: Record<VerificationSession["pathType"], string> = {
  solo: "Solo",
  joint: "Joint",
  entity: "Entity",
};

function fullAddress(a: Address): string {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}, ${a.country}`;
}

function fmtDate(iso?: string): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

function badgeLabel(p: SessionPerson): string {
  return p.badge.replace(/_/g, " ");
}

function personsVerified(s: VerificationSession): number {
  return s.persons.filter((p) => p.badge === "approved").length;
}

function detailUrl(s: VerificationSession): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/admin/verifications/${s.id}`;
}

// Escape a single CSV cell per RFC-4180 (quote if it contains , " or newline).
function cell(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(cell).join(","));
  return lines.join("\r\n");
}

// ── Session-level export (PD-146 §6.1) ──
export function buildSessionCsv(
  sessions: VerificationSession[],
  includePii: boolean
): string {
  const headers = [
    "Session ID",
    "Organization name",
    "Organization ID",
    "Path type",
    "Joint account type",
    "Primary first name",
    "Primary last name",
    "Primary email",
    "Primary phone",
    "Primary DOB",
    "Primary address",
    ...(includePii ? ["Primary SSN / Tax ID"] : []),
    "Session status",
    "Date created",
    "Date submitted",
    "Date last activity",
    "Screening result (primary)",
    "Person count",
    "Persons verified",
    "Detail link",
  ];

  const rows = sessions.map((s) => {
    const p = s.persons[0];
    return [
      s.id,
      s.organizationName,
      s.organizationId,
      pathLabels[s.pathType],
      s.jointAccountType ?? "",
      p.firstName,
      p.lastName,
      p.email,
      p.phone,
      fmtDate(p.dateOfBirth),
      fullAddress(p.address),
      ...(includePii ? [p.ssn] : []),
      statusLabels[s.status],
      fmtDate(s.createdAt),
      fmtDate(s.submittedAt),
      fmtDate(s.lastActivityAt),
      p.screeningResult ?? "",
      s.persons.length,
      personsVerified(s),
      detailUrl(s),
    ] as (string | number)[];
  });

  return toCsv(headers, rows);
}

// ── Per-person export (PD-146 §6.2) — Joint & Entity only, one row per person ──
export function buildPerPersonCsv(
  sessions: VerificationSession[],
  includePii: boolean
): string {
  const multi = sessions.filter(
    (s) => s.pathType === "joint" || s.pathType === "entity"
  );

  const headers = [
    "Session ID",
    "Organization name",
    "Organization ID",
    "Path type",
    "Person role",
    "Person name",
    "Email",
    "DOB",
    ...(includePii ? ["SSN / Tax ID"] : []),
    "Verification status",
    "Screening result",
    "Entity name",
    "Entity country",
    "Entity file number",
    "Detail link",
  ];

  const rows: (string | number)[][] = [];
  multi.forEach((s) => {
    s.persons.forEach((p) => {
      rows.push([
        s.id,
        s.organizationName,
        s.organizationId,
        pathLabels[s.pathType],
        roleLabels[p.role],
        `${p.firstName} ${p.lastName}`,
        p.email,
        fmtDate(p.dateOfBirth),
        ...(includePii ? [p.ssn] : []),
        badgeLabel(p),
        p.screeningResult ?? "",
        s.entity?.legalName ?? "",
        s.entity?.countryOfRegistration ?? "",
        s.entity?.fileNumber ?? "",
        detailUrl(s),
      ]);
    });
  });

  return toCsv(headers, rows);
}

// Count rows a per-person export would produce (for the audit log).
export function perPersonRowCount(sessions: VerificationSession[]): number {
  return sessions
    .filter((s) => s.pathType === "joint" || s.pathType === "entity")
    .reduce((acc, s) => acc + s.persons.length, 0);
}

// Trigger a browser download from a CSV string.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
