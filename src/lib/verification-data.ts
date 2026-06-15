import { Address, VerificationSession } from "@/types";

// ───────────────────────── PII masking helpers ─────────────────────────
// Store the raw value on the object; mask only at render.

export function maskValue(v: string, visible = 4): string {
  if (!v) return "";
  return "•••• " + v.slice(-visible);
}

export function maskDob(iso: string): string {
  // show year only, e.g. "••/••/1984"
  const y = (iso || "").slice(0, 4);
  return y ? `••/••/${y}` : "••/••/••••";
}

export function maskAddress(a: Address): string {
  return `${a.city}, ${a.state}`; // street/zip hidden until revealed
}

// ───────────────────────── Selectors ─────────────────────────

export function getSessionById(id: string): VerificationSession | undefined {
  return verificationSessions.find((s) => s.id === id);
}

// "Entity Being Verified" value (A.2.1 / A.3.1):
//   entity → entity legal name;
//   joint  → comma-separated names of the persons being verified
//            (e.g. "Aisha Rahman, Daniel Reyes");
//   solo   → the primary applicant's full name.
export function entityNameFor(s: VerificationSession): string {
  if (s.pathType === "entity") return s.entity?.legalName ?? "—";
  if (s.pathType === "joint") {
    const names = s.persons
      .map((p) => `${p.firstName} ${p.lastName}`.trim())
      .filter(Boolean);
    return names.length ? names.join(", ") : "—";
  }
  const primary = s.persons[0];
  return primary ? `${primary.firstName} ${primary.lastName}` : "—";
}

export interface AggregateResult {
  verified: number;
  total: number;
  tone: "green" | "yellow" | "red";
}

// E2.3: green=all approved, red=any denied, else yellow.
export function aggregateVerified(s: VerificationSession): AggregateResult {
  const total = s.persons.length;
  const verified = s.persons.filter((p) => p.badge === "approved").length;
  const anyDenied = s.persons.some((p) => p.badge === "denied");
  let tone: "green" | "yellow" | "red";
  if (anyDenied) {
    tone = "red";
  } else if (verified === total) {
    tone = "green";
  } else {
    tone = "yellow";
  }
  return { verified, total, tone };
}

// ───────────────────────── Seed data (10 sessions) ─────────────────────────

export const verificationSessions: VerificationSession[] = [
  // 1 — solo / approved
  {
    id: "VS-2026-0001",
    organizationId: "ORG-MERIDIAN",
    organizationName: "Meridian Wealth Partners",
    pathType: "solo",
    status: "approved",
    createdAt: "2026-06-04T14:20:00Z",
    submittedAt: "2026-06-04T15:05:00Z",
    lastActivityAt: "2026-06-05T09:30:00Z",
    persons: [
      {
        id: "P-0001-1",
        role: "primary",
        firstName: "Olivia",
        lastName: "Bennett",
        email: "olivia.bennett@gmail.com",
        phone: "+1 415 555 0110",
        dateOfBirth: "1986-02-18",
        ssn: "521-90-4471",
        address: {
          street: "742 Pine St",
          city: "San Francisco",
          state: "CA",
          zip: "94108",
          country: "US",
        },
        idType: "Driver's License",
        idNumber: "D1129845",
        photoIdUploaded: true,
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true, completedAt: "2026-06-04T14:30:00Z" },
          { label: "Address", complete: true, completedAt: "2026-06-04T14:35:00Z" },
          { label: "ID upload", complete: true, completedAt: "2026-06-04T14:42:00Z" },
          { label: "Screening", complete: true, completedAt: "2026-06-04T15:10:00Z" },
        ],
        recommendedItemIds: ["source_of_funds_narrative", "bank_statement", "proof_of_address"],
      },
    ],
    timeline: [
      { id: "t1", timestamp: "2026-06-04T14:20:00Z", actor: "system", action: "Session Created", detail: "Solo KYC initiated by applicant", subjectId: "P-0001-1", subjectLabel: "Olivia Bennett" },
      { id: "t2", timestamp: "2026-06-04T14:22:00Z", actor: "system", action: "Link Sent", detail: "Verification link emailed to Olivia Bennett", subjectId: "P-0001-1", subjectLabel: "Olivia Bennett" },
      { id: "t3", timestamp: "2026-06-04T14:28:00Z", actor: "end_user", actorName: "Olivia Bennett", action: "Link Opened", subjectId: "P-0001-1", subjectLabel: "Olivia Bennett" },
      { id: "t4", timestamp: "2026-06-04T15:05:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0001-1", subjectLabel: "Olivia Bennett" },
      { id: "t5", timestamp: "2026-06-04T15:10:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0001-1", subjectLabel: "Olivia Bennett" },
    ],
  },

  // 2 — solo / pending_review
  {
    id: "VS-2026-0002",
    organizationId: "ORG-MERIDIAN",
    organizationName: "Meridian Wealth Partners",
    pathType: "solo",
    status: "pending_review",
    createdAt: "2026-06-03T10:00:00Z",
    submittedAt: "2026-06-03T10:48:00Z",
    lastActivityAt: "2026-06-03T11:15:00Z",
    persons: [
      {
        id: "P-0002-1",
        role: "primary",
        firstName: "Marcus",
        lastName: "Lindqvist",
        email: "marcus.lindqvist@protonmail.com",
        phone: "+46 70 555 0142",
        dateOfBirth: "1979-11-09",
        ssn: "X8841220",
        ssnIssuingCountry: "SE",
        address: {
          street: "Sveavägen 44",
          city: "Stockholm",
          state: "Stockholm",
          zip: "11134",
          country: "SE",
        },
        idType: "Passport",
        idNumber: "SE9921045",
        photoIdUploaded: true,
        badge: "under_review",
        kycStatus: "review",
        biographicalDataEntered: true,
        screeningResult: "review",
        progress: [
          { label: "Identity", complete: true, completedAt: "2026-06-03T10:20:00Z" },
          { label: "Address", complete: true, completedAt: "2026-06-03T10:30:00Z" },
          { label: "ID upload", complete: true, completedAt: "2026-06-03T10:40:00Z" },
          { label: "Screening", complete: true, completedAt: "2026-06-03T11:15:00Z" },
        ],
        recommendedItemIds: ["source_of_funds_narrative", "pep_declaration", "proof_of_address"],
      },
    ],
    timeline: [
      { id: "t1", timestamp: "2026-06-03T10:00:00Z", actor: "system", action: "Session Created", detail: "Solo KYC initiated by applicant", subjectId: "P-0002-1", subjectLabel: "Marcus Lindqvist" },
      { id: "t2", timestamp: "2026-06-03T10:02:00Z", actor: "system", action: "Link Sent", detail: "Verification link emailed to Marcus Lindqvist", subjectId: "P-0002-1", subjectLabel: "Marcus Lindqvist" },
      { id: "t3", timestamp: "2026-06-03T10:10:00Z", actor: "end_user", actorName: "Marcus Lindqvist", action: "Link Opened", subjectId: "P-0002-1", subjectLabel: "Marcus Lindqvist" },
      { id: "t4", timestamp: "2026-06-03T10:48:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0002-1", subjectLabel: "Marcus Lindqvist" },
      { id: "t5", timestamp: "2026-06-03T11:15:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Manual Review — possible adverse-media hit", subjectId: "P-0002-1", subjectLabel: "Marcus Lindqvist" },
    ],
  },

  // 3 — joint / partially_verified (co_holder link_sent)
  {
    id: "VS-2026-0003",
    organizationId: "ORG-HARBORLINE",
    organizationName: "Harborline Securities",
    pathType: "joint",
    jointAccountType: "Joint Tenants with Right of Survivorship",
    entityName: "The Tanaka Family Trust",
    status: "partially_verified",
    createdAt: "2026-06-01T08:30:00Z",
    submittedAt: "2026-06-01T09:20:00Z",
    lastActivityAt: "2026-06-06T13:00:00Z",
    persons: [
      {
        id: "P-0003-1",
        role: "primary",
        firstName: "Grace",
        lastName: "Tanaka",
        email: "grace.tanaka@outlook.com",
        phone: "+1 212 555 0133",
        dateOfBirth: "1990-05-27",
        ssn: "077-66-1234",
        address: {
          street: "55 Hudson Yards, Apt 21B",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "US",
        },
        idType: "Driver's License",
        idNumber: "T2298471",
        photoIdUploaded: true,
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true, completedAt: "2026-06-01T08:40:00Z" },
          { label: "Address", complete: true, completedAt: "2026-06-01T08:45:00Z" },
          { label: "ID upload", complete: true, completedAt: "2026-06-01T08:52:00Z" },
          { label: "Screening", complete: true, completedAt: "2026-06-01T09:25:00Z" },
        ],
        recommendedItemIds: ["source_of_funds_narrative", "bank_statement"],
      },
      {
        id: "P-0003-2",
        role: "co_holder",
        firstName: "Henry",
        lastName: "Tanaka",
        email: "henry.tanaka@outlook.com",
        phone: "+1 212 555 0177",
        dateOfBirth: "1988-08-14",
        ssn: "088-55-9921",
        address: {
          street: "55 Hudson Yards, Apt 21B",
          city: "New York",
          state: "NY",
          zip: "10001",
          country: "US",
        },
        idType: "Driver's License",
        idNumber: "T7741209",
        photoIdUploaded: false,
        badge: "link_sent",
        kycStatus: "data_entered",
        biographicalDataEntered: true,
        link: {
          status: "sent",
          url: "https://harborline.interro.co/v/lnk_3a90",
          sentVia: "email",
          sentAt: "2026-06-06T13:00:00Z",
          expiresAt: "2026-06-09T13:00:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: false },
          { label: "ID upload", complete: false },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["proof_of_address", "additional_id"],
      },
    ],
    timeline: [
      // Primary applicant — Grace Tanaka (approved)
      { id: "t1", timestamp: "2026-06-01T08:30:00Z", actor: "system", action: "Session Created", detail: "Joint KYC initiated by primary applicant", subjectId: "P-0003-1", subjectLabel: "Grace Tanaka" },
      { id: "t2", timestamp: "2026-06-01T08:32:00Z", actor: "system", action: "Link Sent", detail: "Verification link emailed to Grace Tanaka", subjectId: "P-0003-1", subjectLabel: "Grace Tanaka" },
      { id: "t3", timestamp: "2026-06-01T08:38:00Z", actor: "end_user", actorName: "Grace Tanaka", action: "Link Opened", subjectId: "P-0003-1", subjectLabel: "Grace Tanaka" },
      { id: "t4", timestamp: "2026-06-01T09:20:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0003-1", subjectLabel: "Grace Tanaka" },
      { id: "t5", timestamp: "2026-06-01T09:25:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0003-1", subjectLabel: "Grace Tanaka" },
      // Co-holder — Henry Tanaka (link sent, not yet started)
      { id: "t6", timestamp: "2026-06-06T13:00:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Henry Tanaka (co-holder)", subjectId: "P-0003-2", subjectLabel: "Henry Tanaka" },
    ],
  },

  // 4 — joint / pending_review
  {
    id: "VS-2026-0004",
    organizationId: "ORG-HARBORLINE",
    organizationName: "Harborline Securities",
    pathType: "joint",
    jointAccountType: "Tenants in Common",
    entityName: "The Fuentes Living Trust",
    status: "pending_review",
    createdAt: "2026-05-25T12:00:00Z",
    submittedAt: "2026-05-25T13:10:00Z",
    lastActivityAt: "2026-05-27T16:45:00Z",
    persons: [
      {
        id: "P-0004-1",
        role: "primary",
        firstName: "Diego",
        lastName: "Fuentes",
        email: "diego.fuentes@gmail.com",
        phone: "+1 305 555 0144",
        dateOfBirth: "1982-03-30",
        ssn: "593-22-7788",
        address: {
          street: "1200 Brickell Ave, Unit 905",
          city: "Miami",
          state: "FL",
          zip: "33131",
          country: "US",
        },
        idType: "Driver's License",
        idNumber: "F0098234",
        photoIdUploaded: true,
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true, completedAt: "2026-05-25T12:20:00Z" },
          { label: "Address", complete: true, completedAt: "2026-05-25T12:25:00Z" },
          { label: "ID upload", complete: true, completedAt: "2026-05-25T12:35:00Z" },
          { label: "Screening", complete: true, completedAt: "2026-05-25T13:15:00Z" },
        ],
        recommendedItemIds: ["source_of_funds_narrative", "proof_of_address"],
      },
      {
        id: "P-0004-2",
        role: "co_holder",
        firstName: "Carmen",
        lastName: "Fuentes",
        email: "carmen.fuentes@gmail.com",
        phone: "+1 305 555 0166",
        dateOfBirth: "1984-07-19",
        ssn: "596-44-3321",
        address: {
          street: "1200 Brickell Ave, Unit 905",
          city: "Miami",
          state: "FL",
          zip: "33131",
          country: "US",
        },
        idType: "Driver's License",
        idNumber: "F5523109",
        photoIdUploaded: true,
        badge: "under_review",
        kycStatus: "review",
        biographicalDataEntered: true,
        screeningResult: "review",
        link: {
          status: "completed",
          url: "https://harborline.interro.co/v/lnk_77c2",
          sentVia: "email",
          sentAt: "2026-05-25T13:20:00Z",
          openedAt: "2026-05-25T14:00:00Z",
          completedAt: "2026-05-25T14:30:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["additional_id", "proof_of_address"],
      },
    ],
    timeline: [
      // Primary applicant — Diego Fuentes (approved)
      { id: "t1", timestamp: "2026-05-25T12:00:00Z", actor: "system", action: "Session Created", detail: "Joint KYC initiated by primary applicant", subjectId: "P-0004-1", subjectLabel: "Diego Fuentes" },
      { id: "t2", timestamp: "2026-05-25T12:02:00Z", actor: "system", action: "Link Sent", detail: "Verification link emailed to Diego Fuentes", subjectId: "P-0004-1", subjectLabel: "Diego Fuentes" },
      { id: "t3", timestamp: "2026-05-25T12:15:00Z", actor: "end_user", actorName: "Diego Fuentes", action: "Link Opened", subjectId: "P-0004-1", subjectLabel: "Diego Fuentes" },
      { id: "t4", timestamp: "2026-05-25T13:10:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0004-1", subjectLabel: "Diego Fuentes" },
      { id: "t5", timestamp: "2026-05-25T13:15:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0004-1", subjectLabel: "Diego Fuentes" },
      // Co-holder — Carmen Fuentes (under review)
      { id: "t6", timestamp: "2026-05-25T13:20:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Carmen Fuentes (co-holder)", subjectId: "P-0004-2", subjectLabel: "Carmen Fuentes" },
      { id: "t7", timestamp: "2026-05-25T14:00:00Z", actor: "end_user", actorName: "Carmen Fuentes", action: "Link Opened", subjectId: "P-0004-2", subjectLabel: "Carmen Fuentes" },
      { id: "t8", timestamp: "2026-05-25T14:30:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0004-2", subjectLabel: "Carmen Fuentes" },
      { id: "t9", timestamp: "2026-05-26T09:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Manual Review — co-holder ID requires review", subjectId: "P-0004-2", subjectLabel: "Carmen Fuentes" },
    ],
  },

  // 5 — entity / screening_in_progress (worked example from architecture doc)
  {
    id: "VS-2026-0005",
    organizationId: "ORG-WESTBRIDGE",
    organizationName: "Westbridge Capital",
    pathType: "entity",
    status: "screening_in_progress",
    createdAt: "2026-05-28T09:12:00Z",
    submittedAt: "2026-06-02T16:40:00Z",
    lastActivityAt: "2026-06-06T11:05:00Z",
    entity: {
      legalName: "Crestmont Capital Partners II, LP",
      dba: "Crestmont Capital",
      taxId: "84-2910037",
      taxIdIssuingCountry: "US",
      fileNumber: "DE-7741299",
      countryOfRegistration: "US",
      stateOfRegistration: "DE",
      principalAddress: {
        street: "120 Market Street, Suite 400",
        city: "Wilmington",
        state: "DE",
        zip: "19801",
        country: "US",
      },
    },
    persons: [
      {
        id: "P-0005-1",
        role: "primary",
        firstName: "Daniel",
        lastName: "Reyes",
        email: "daniel.reyes@acmeholdings.com",
        phone: "+1 302 555 0142",
        dateOfBirth: "1979-04-11",
        ssn: "412-55-9981",
        title: "Managing Member",
        address: {
          street: "88 Rodney St",
          city: "Wilmington",
          state: "DE",
          zip: "19806",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true, completedAt: "2026-05-28T09:30:00Z" },
          { label: "Address", complete: true, completedAt: "2026-05-28T09:35:00Z" },
          { label: "ID upload", complete: true, completedAt: "2026-05-28T09:40:00Z" },
          { label: "Screening", complete: true, completedAt: "2026-06-02T17:00:00Z" },
        ],
        recommendedItemIds: ["additional_id", "proof_of_address"],
      },
      {
        id: "P-0005-2",
        role: "ubo",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@acmeholdings.com",
        phone: "+1 302 555 0188",
        dateOfBirth: "1984-09-22",
        ssn: "551-22-3390",
        ownershipPercentage: 60,
        address: {
          street: "14 Greenhill Ave",
          city: "Wilmington",
          state: "DE",
          zip: "19805",
          country: "US",
        },
        badge: "under_review",
        kycStatus: "review",
        biographicalDataEntered: true,
        screeningResult: "review",
        link: {
          status: "completed",
          url: "https://westbridge.interro.co/v/lnk_9a2f",
          sentVia: "email",
          sentAt: "2026-06-02T17:10:00Z",
          openedAt: "2026-06-03T08:20:00Z",
          completedAt: "2026-06-03T08:55:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["ownership_chart", "source_of_funds", "audited_financials"],
      },
      {
        id: "P-0005-3",
        role: "ubo",
        firstName: "Robert",
        lastName: "Kim",
        email: "robert.kim@acmeholdings.com",
        phone: "+1 302 555 0190",
        dateOfBirth: "1971-01-30",
        ssn: "603-44-1120",
        ownershipPercentage: 25,
        address: {
          street: "9 Delaware Ave",
          city: "Newark",
          state: "DE",
          zip: "19711",
          country: "US",
        },
        badge: "link_sent",
        kycStatus: "data_entered",
        biographicalDataEntered: true,
        link: {
          status: "sent",
          url: "https://westbridge.interro.co/v/lnk_4c81",
          sentVia: "email",
          sentAt: "2026-06-06T10:00:00Z",
          expiresAt: "2026-06-09T10:00:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: false },
          { label: "ID upload", complete: false },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["pep_declaration", "source_of_wealth", "additional_id"],
      },
      {
        id: "P-0005-4",
        role: "control_person",
        firstName: "Sofia",
        lastName: "Marchetti",
        email: "sofia.marchetti@acmeholdings.com",
        phone: "+1 302 555 0177",
        dateOfBirth: "1988-07-03",
        ssn: "490-77-2261",
        title: "CFO",
        controlFunction: "Finance & signing authority",
        address: {
          street: "200 King St",
          city: "Wilmington",
          state: "DE",
          zip: "19801",
          country: "US",
        },
        badge: "not_started",
        kycStatus: "not_started",
        biographicalDataEntered: false,
        progress: [
          { label: "Identity", complete: false },
          { label: "Address", complete: false },
          { label: "ID upload", complete: false },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["additional_id", "occupation"],
      },
    ],
    timeline: [
      // Business (KYB) — Crestmont Capital Partners II, LP
      { id: "t1", timestamp: "2026-05-28T09:12:00Z", actor: "system", action: "Session Created", detail: "Entity KYB initiated by primary applicant", subjectId: "business", subjectLabel: "Crestmont Capital Partners II, LP" },
      { id: "t2", timestamp: "2026-05-28T09:14:00Z", actor: "system", action: "Link Sent", detail: "KYB verification link emailed to Daniel Reyes (managing member)", subjectId: "business", subjectLabel: "Crestmont Capital Partners II, LP" },
      { id: "t3", timestamp: "2026-05-28T09:20:00Z", actor: "end_user", actorName: "Daniel Reyes", action: "Link Opened", subjectId: "business", subjectLabel: "Crestmont Capital Partners II, LP" },
      { id: "t4", timestamp: "2026-06-02T16:40:00Z", actor: "system", action: "KYB information sent to Alloy", detail: "Entity data submitted for screening", subjectId: "business", subjectLabel: "Crestmont Capital Partners II, LP" },
      { id: "t5", timestamp: "2026-06-02T17:00:00Z", actor: "system", action: "KYB Status returned from Alloy", detail: "Approved", subjectId: "business", subjectLabel: "Crestmont Capital Partners II, LP" },
      // Primary / managing member — Daniel Reyes (approved)
      { id: "t6", timestamp: "2026-05-28T09:30:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0005-1", subjectLabel: "Daniel Reyes" },
      { id: "t7", timestamp: "2026-06-02T17:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0005-1", subjectLabel: "Daniel Reyes" },
      // UBO — Jane Smith (under review)
      { id: "t8", timestamp: "2026-06-02T17:10:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Jane Smith (UBO)", subjectId: "P-0005-2", subjectLabel: "Jane Smith" },
      { id: "t9", timestamp: "2026-06-03T08:20:00Z", actor: "end_user", actorName: "Jane Smith", action: "Link Opened", subjectId: "P-0005-2", subjectLabel: "Jane Smith" },
      { id: "t10", timestamp: "2026-06-03T08:55:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0005-2", subjectLabel: "Jane Smith" },
      { id: "t11", timestamp: "2026-06-03T09:10:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Manual Review — additional screening required", subjectId: "P-0005-2", subjectLabel: "Jane Smith" },
      // UBO — Robert Kim (link sent, not yet started)
      { id: "t12", timestamp: "2026-06-06T10:00:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Robert Kim (UBO)", subjectId: "P-0005-3", subjectLabel: "Robert Kim" },
    ],
  },

  // 6 — entity / submitted (one UBO error, primary under_review)
  {
    id: "VS-2026-0006",
    organizationId: "ORG-WESTBRIDGE",
    organizationName: "Westbridge Capital",
    pathType: "entity",
    status: "submitted",
    createdAt: "2026-05-30T11:00:00Z",
    submittedAt: "2026-06-05T18:00:00Z",
    lastActivityAt: "2026-06-05T18:30:00Z",
    entity: {
      legalName: "Northwind Ventures Fund III, LP",
      taxId: "47-3398211",
      taxIdIssuingCountry: "US",
      fileNumber: "NY-5582013",
      countryOfRegistration: "US",
      stateOfRegistration: "NY",
      principalAddress: {
        street: "401 Park Ave South, Floor 9",
        city: "New York",
        state: "NY",
        zip: "10016",
        country: "US",
      },
    },
    persons: [
      {
        id: "P-0006-1",
        role: "primary",
        firstName: "Priya",
        lastName: "Anand",
        email: "priya.anand@northwind.co",
        phone: "+1 646 555 0120",
        dateOfBirth: "1983-12-05",
        ssn: "126-77-4490",
        title: "Chief Executive Officer",
        address: {
          street: "12 W 21st St",
          city: "New York",
          state: "NY",
          zip: "10010",
          country: "US",
        },
        badge: "under_review",
        kycStatus: "review",
        biographicalDataEntered: true,
        screeningResult: "review",
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["additional_id", "occupation", "purpose_of_account"],
      },
      {
        id: "P-0006-2",
        role: "ubo",
        firstName: "Thomas",
        lastName: "Okafor",
        email: "thomas.okafor@northwind.co",
        phone: "+1 646 555 0155",
        dateOfBirth: "1975-06-21",
        ssn: "P4471092",
        ssnIssuingCountry: "NG",
        ownershipPercentage: 40,
        address: {
          street: "18 Marina Rd",
          city: "Lagos",
          state: "Lagos",
          zip: "100001",
          country: "NG",
        },
        idType: "Passport",
        idNumber: "NG7741200",
        badge: "under_review",
        kycStatus: "review",
        biographicalDataEntered: true,
        screeningResult: "review",
        link: {
          status: "opened",
          url: "https://westbridge.interro.co/v/lnk_b210",
          sentVia: "email",
          sentAt: "2026-06-05T18:05:00Z",
          openedAt: "2026-06-05T18:20:00Z",
          expiresAt: "2026-06-08T18:05:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: false },
          { label: "ID upload", complete: false },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["ownership_chart", "source_of_wealth", "additional_id"],
      },
    ],
    timeline: [
      // Business (KYB) — Northwind Ventures Fund III, LP
      { id: "t1", timestamp: "2026-05-30T11:00:00Z", actor: "system", action: "Session Created", detail: "Entity KYB initiated by primary applicant", subjectId: "business", subjectLabel: "Northwind Ventures Fund III, LP" },
      { id: "t2", timestamp: "2026-05-30T11:02:00Z", actor: "system", action: "Link Sent", detail: "KYB verification link emailed to Priya Anand (CEO)", subjectId: "business", subjectLabel: "Northwind Ventures Fund III, LP" },
      { id: "t3", timestamp: "2026-05-30T11:20:00Z", actor: "end_user", actorName: "Priya Anand", action: "Link Opened", subjectId: "business", subjectLabel: "Northwind Ventures Fund III, LP" },
      { id: "t4", timestamp: "2026-06-05T18:00:00Z", actor: "system", action: "KYB information sent to Alloy", detail: "Entity data submitted for screening", subjectId: "business", subjectLabel: "Northwind Ventures Fund III, LP" },
      { id: "t5", timestamp: "2026-06-05T18:10:00Z", actor: "system", action: "KYB Status returned from Alloy", detail: "Manual Review — pending document review", subjectId: "business", subjectLabel: "Northwind Ventures Fund III, LP" },
      // Primary / CEO — Priya Anand (under review)
      { id: "t6", timestamp: "2026-06-05T18:00:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0006-1", subjectLabel: "Priya Anand" },
      { id: "t7", timestamp: "2026-06-05T18:10:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Manual Review — adverse-media review", subjectId: "P-0006-1", subjectLabel: "Priya Anand" },
      // UBO — Thomas Okafor (under review, link opened)
      { id: "t8", timestamp: "2026-06-05T18:05:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Thomas Okafor (UBO)", subjectId: "P-0006-2", subjectLabel: "Thomas Okafor" },
      { id: "t9", timestamp: "2026-06-05T18:20:00Z", actor: "end_user", actorName: "Thomas Okafor", action: "Link Opened", subjectId: "P-0006-2", subjectLabel: "Thomas Okafor" },
      { id: "t10", timestamp: "2026-06-05T18:25:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0006-2", subjectLabel: "Thomas Okafor" },
      { id: "t11", timestamp: "2026-06-05T18:30:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Manual Review — non-US ID requires review", subjectId: "P-0006-2", subjectLabel: "Thomas Okafor" },
    ],
  },

  // 7 — entity / denied (UBO denied)
  {
    id: "VS-2026-0007",
    organizationId: "ORG-CEDARGATE",
    organizationName: "Cedargate Trust Services",
    pathType: "entity",
    status: "denied",
    createdAt: "2026-05-18T08:00:00Z",
    submittedAt: "2026-05-19T10:00:00Z",
    lastActivityAt: "2026-05-21T14:00:00Z",
    entity: {
      legalName: "Silvergate Opportunities Fund, LP",
      taxId: "98-1120044",
      taxIdIssuingCountry: "US",
      fileNumber: "NV-2210984",
      countryOfRegistration: "US",
      stateOfRegistration: "NV",
      principalAddress: {
        street: "300 S 4th St",
        city: "Las Vegas",
        state: "NV",
        zip: "89101",
        country: "US",
      },
    },
    persons: [
      {
        id: "P-0007-1",
        role: "primary",
        firstName: "Walter",
        lastName: "Voss",
        email: "walter.voss@blackrockbay.com",
        phone: "+1 702 555 0188",
        dateOfBirth: "1968-09-12",
        ssn: "530-22-1199",
        title: "Trustee",
        address: {
          street: "77 Spring Mountain Rd",
          city: "Las Vegas",
          state: "NV",
          zip: "89102",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["additional_id", "purpose_of_account"],
      },
      {
        id: "P-0007-2",
        role: "ubo",
        firstName: "Igor",
        lastName: "Petrov",
        email: "igor.petrov@blackrockbay.com",
        phone: "+7 495 555 0142",
        dateOfBirth: "1970-02-25",
        ssn: "P9920381",
        ssnIssuingCountry: "RU",
        ownershipPercentage: 55,
        address: {
          street: "Tverskaya St 12",
          city: "Moscow",
          state: "Moscow",
          zip: "125009",
          country: "RU",
        },
        idType: "Passport",
        idNumber: "RU5520119",
        badge: "denied",
        kycStatus: "failed",
        biographicalDataEntered: true,
        screeningResult: "fail",
        link: {
          status: "completed",
          url: "https://cedargate.interro.co/v/lnk_d091",
          sentVia: "email",
          sentAt: "2026-05-19T10:30:00Z",
          openedAt: "2026-05-19T12:00:00Z",
          completedAt: "2026-05-19T12:40:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["source_of_wealth", "ownership_chart", "audited_financials"],
      },
      {
        id: "P-0007-3",
        role: "control_person",
        firstName: "Helen",
        lastName: "Vance",
        email: "helen.vance@blackrockbay.com",
        phone: "+1 702 555 0199",
        dateOfBirth: "1981-04-08",
        ssn: "531-88-2210",
        title: "Administrator",
        controlFunction: "Day-to-day administration",
        address: {
          street: "88 Charleston Blvd",
          city: "Las Vegas",
          state: "NV",
          zip: "89104",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["additional_id", "occupation"],
      },
    ],
    timeline: [
      // Business (KYB) — Silvergate Opportunities Fund, LP
      { id: "t1", timestamp: "2026-05-18T08:00:00Z", actor: "system", action: "Session Created", detail: "Entity KYB initiated by trustee", subjectId: "business", subjectLabel: "Silvergate Opportunities Fund, LP" },
      { id: "t2", timestamp: "2026-05-18T08:02:00Z", actor: "system", action: "Link Sent", detail: "KYB verification link emailed to Walter Voss (trustee)", subjectId: "business", subjectLabel: "Silvergate Opportunities Fund, LP" },
      { id: "t3", timestamp: "2026-05-18T08:30:00Z", actor: "end_user", actorName: "Walter Voss", action: "Link Opened", subjectId: "business", subjectLabel: "Silvergate Opportunities Fund, LP" },
      { id: "t4", timestamp: "2026-05-19T10:00:00Z", actor: "system", action: "KYB information sent to Alloy", detail: "Entity data submitted for screening", subjectId: "business", subjectLabel: "Silvergate Opportunities Fund, LP" },
      { id: "t5", timestamp: "2026-05-20T09:00:00Z", actor: "system", action: "KYB Status returned from Alloy", detail: "Approved", subjectId: "business", subjectLabel: "Silvergate Opportunities Fund, LP" },
      // Primary / trustee — Walter Voss (approved)
      { id: "t6", timestamp: "2026-05-19T10:05:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0007-1", subjectLabel: "Walter Voss" },
      { id: "t7", timestamp: "2026-05-20T09:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0007-1", subjectLabel: "Walter Voss" },
      // UBO — Igor Petrov (denied, manual review → denied)
      { id: "t8", timestamp: "2026-05-19T10:30:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Igor Petrov (UBO)", subjectId: "P-0007-2", subjectLabel: "Igor Petrov" },
      { id: "t9", timestamp: "2026-05-19T12:00:00Z", actor: "end_user", actorName: "Igor Petrov", action: "Link Opened", subjectId: "P-0007-2", subjectLabel: "Igor Petrov" },
      { id: "t10", timestamp: "2026-05-19T12:40:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0007-2", subjectLabel: "Igor Petrov" },
      { id: "t11", timestamp: "2026-05-20T09:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Manual Review — possible sanctions match", subjectId: "P-0007-2", subjectLabel: "Igor Petrov" },
      { id: "t12", timestamp: "2026-05-21T14:00:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Status resolved → Denied", detail: "Confirmed sanctions hit — final rejection", subjectId: "P-0007-2", subjectLabel: "Igor Petrov" },
      // Control Person — Helen Vance (approved)
      { id: "t13", timestamp: "2026-05-19T10:30:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Helen Vance (Control Person)", subjectId: "P-0007-3", subjectLabel: "Helen Vance" },
      { id: "t14", timestamp: "2026-05-19T11:10:00Z", actor: "end_user", actorName: "Helen Vance", action: "Link Opened", subjectId: "P-0007-3", subjectLabel: "Helen Vance" },
      { id: "t15", timestamp: "2026-05-19T11:40:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0007-3", subjectLabel: "Helen Vance" },
      { id: "t16", timestamp: "2026-05-20T09:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0007-3", subjectLabel: "Helen Vance" },
    ],
  },

  // 8 — solo / in_progress (mid-flow, partial progress)
  {
    id: "VS-2026-0008",
    organizationId: "ORG-CEDARGATE",
    organizationName: "Cedargate Trust Services",
    pathType: "solo",
    status: "in_progress",
    createdAt: "2026-06-07T15:00:00Z",
    lastActivityAt: "2026-06-07T15:22:00Z",
    persons: [
      {
        id: "P-0008-1",
        role: "primary",
        firstName: "Aisha",
        lastName: "Rahman",
        email: "aisha.rahman@gmail.com",
        phone: "+1 408 555 0151",
        dateOfBirth: "1995-10-02",
        ssn: "612-33-7781",
        address: {
          street: "1500 Mission College Blvd",
          city: "Santa Clara",
          state: "CA",
          zip: "95054",
          country: "US",
        },
        badge: "in_progress",
        kycStatus: "data_entered",
        biographicalDataEntered: true,
        progress: [
          { label: "Identity", complete: true, completedAt: "2026-06-07T15:10:00Z" },
          { label: "Address", complete: true, completedAt: "2026-06-07T15:18:00Z" },
          { label: "ID upload", complete: false },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["source_of_funds_narrative", "proof_of_address"],
      },
    ],
    timeline: [
      { id: "t1", timestamp: "2026-06-07T15:00:00Z", actor: "system", action: "Session Created", detail: "Solo KYC initiated by applicant", subjectId: "P-0008-1", subjectLabel: "Aisha Rahman" },
      { id: "t2", timestamp: "2026-06-07T15:02:00Z", actor: "system", action: "Link Sent", detail: "Verification link emailed to Aisha Rahman", subjectId: "P-0008-1", subjectLabel: "Aisha Rahman" },
      { id: "t3", timestamp: "2026-06-07T15:08:00Z", actor: "end_user", actorName: "Aisha Rahman", action: "Link Opened", detail: "Verification underway", subjectId: "P-0008-1", subjectLabel: "Aisha Rahman" },
    ],
  },

  // 9 — joint / expired (co_holder link expired)
  {
    id: "VS-2026-0009",
    organizationId: "ORG-MERIDIAN",
    organizationName: "Meridian Wealth Partners",
    pathType: "joint",
    jointAccountType: "Joint Tenants with Right of Survivorship",
    entityName: "The O'Connor Family Trust",
    status: "expired",
    createdAt: "2026-04-29T09:00:00Z",
    submittedAt: "2026-04-29T10:00:00Z",
    lastActivityAt: "2026-05-02T10:00:00Z",
    persons: [
      {
        id: "P-0009-1",
        role: "primary",
        firstName: "Liam",
        lastName: "O'Connor",
        email: "liam.oconnor@gmail.com",
        phone: "+1 617 555 0123",
        dateOfBirth: "1991-01-17",
        ssn: "025-44-8812",
        address: {
          street: "100 Beacon St, Apt 4",
          city: "Boston",
          state: "MA",
          zip: "02116",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["source_of_funds_narrative", "bank_statement"],
      },
      {
        id: "P-0009-2",
        role: "co_holder",
        firstName: "Saoirse",
        lastName: "O'Connor",
        email: "saoirse.oconnor@gmail.com",
        phone: "+1 617 555 0145",
        dateOfBirth: "1993-06-09",
        ssn: "026-55-7723",
        address: {
          street: "100 Beacon St, Apt 4",
          city: "Boston",
          state: "MA",
          zip: "02116",
          country: "US",
        },
        badge: "expired",
        kycStatus: "data_entered",
        biographicalDataEntered: true,
        link: {
          status: "expired",
          url: "https://meridian.interro.co/v/lnk_e445",
          sentVia: "email",
          sentAt: "2026-04-29T11:00:00Z",
          expiresAt: "2026-05-02T11:00:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: false },
          { label: "ID upload", complete: false },
          { label: "Screening", complete: false },
        ],
        recommendedItemIds: ["proof_of_address", "additional_id"],
      },
    ],
    timeline: [
      // Primary applicant — Liam O'Connor (approved)
      { id: "t1", timestamp: "2026-04-29T09:00:00Z", actor: "system", action: "Session Created", detail: "Joint KYC initiated by primary applicant", subjectId: "P-0009-1", subjectLabel: "Liam O'Connor" },
      { id: "t2", timestamp: "2026-04-29T09:02:00Z", actor: "system", action: "Link Sent", detail: "Verification link emailed to Liam O'Connor", subjectId: "P-0009-1", subjectLabel: "Liam O'Connor" },
      { id: "t3", timestamp: "2026-04-29T09:30:00Z", actor: "end_user", actorName: "Liam O'Connor", action: "Link Opened", subjectId: "P-0009-1", subjectLabel: "Liam O'Connor" },
      { id: "t4", timestamp: "2026-04-29T10:00:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0009-1", subjectLabel: "Liam O'Connor" },
      { id: "t5", timestamp: "2026-04-29T10:10:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0009-1", subjectLabel: "Liam O'Connor" },
      // Co-holder — Saoirse O'Connor (link expired before completion)
      { id: "t6", timestamp: "2026-04-29T11:00:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Saoirse O'Connor (co-holder)", subjectId: "P-0009-2", subjectLabel: "Saoirse O'Connor" },
      { id: "t7", timestamp: "2026-05-02T11:00:00Z", actor: "system", action: "Link expired", detail: "72-hour TTL elapsed without completion", subjectId: "P-0009-2", subjectLabel: "Saoirse O'Connor" },
    ],
  },

  // 10 — entity / approved (all approved, full green aggregate)
  {
    id: "VS-2026-0010",
    organizationId: "ORG-HARBORLINE",
    organizationName: "Harborline Securities",
    pathType: "entity",
    status: "approved",
    createdAt: "2026-05-10T10:00:00Z",
    submittedAt: "2026-05-12T14:00:00Z",
    lastActivityAt: "2026-05-15T09:00:00Z",
    entity: {
      legalName: "Summit Peak Capital Fund II, LP",
      dba: "Summit Peak Capital",
      taxId: "33-7740921",
      taxIdIssuingCountry: "US",
      fileNumber: "CA-9982110",
      countryOfRegistration: "US",
      stateOfRegistration: "CA",
      principalAddress: {
        street: "555 California St, Suite 3000",
        city: "San Francisco",
        state: "CA",
        zip: "94104",
        country: "US",
      },
    },
    persons: [
      {
        id: "P-0010-1",
        role: "primary",
        firstName: "Nathan",
        lastName: "Cho",
        email: "nathan.cho@summitpeak.com",
        phone: "+1 415 555 0166",
        dateOfBirth: "1980-08-29",
        ssn: "550-33-1208",
        title: "Managing Partner",
        address: {
          street: "20 Maple Ln",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["additional_id", "purpose_of_account"],
      },
      {
        id: "P-0010-2",
        role: "ubo",
        firstName: "Emily",
        lastName: "Stone",
        email: "emily.stone@summitpeak.com",
        phone: "+1 415 555 0177",
        dateOfBirth: "1985-03-14",
        ssn: "551-44-2390",
        ownershipPercentage: 50,
        address: {
          street: "44 Oak Ave",
          city: "Berkeley",
          state: "CA",
          zip: "94704",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        link: {
          status: "completed",
          url: "https://harborline.interro.co/v/lnk_a112",
          sentVia: "email",
          sentAt: "2026-05-12T14:30:00Z",
          openedAt: "2026-05-12T15:00:00Z",
          completedAt: "2026-05-12T15:40:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["ownership_chart", "source_of_funds"],
      },
      {
        id: "P-0010-3",
        role: "ubo",
        firstName: "Carlos",
        lastName: "Mendez",
        email: "carlos.mendez@summitpeak.com",
        phone: "+1 415 555 0188",
        dateOfBirth: "1977-11-23",
        ssn: "552-55-4471",
        ownershipPercentage: 50,
        address: {
          street: "9 Sunset Blvd",
          city: "Oakland",
          state: "CA",
          zip: "94601",
          country: "US",
        },
        badge: "approved",
        kycStatus: "passed",
        biographicalDataEntered: true,
        screeningResult: "pass",
        link: {
          status: "completed",
          url: "https://harborline.interro.co/v/lnk_a113",
          sentVia: "email",
          sentAt: "2026-05-12T14:30:00Z",
          openedAt: "2026-05-13T09:00:00Z",
          completedAt: "2026-05-13T09:30:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: true },
        ],
        recommendedItemIds: ["ownership_chart", "source_of_funds"],
      },
    ],
    timeline: [
      // Business (KYB) — Summit Peak Capital Fund II, LP
      { id: "t1", timestamp: "2026-05-10T10:00:00Z", actor: "system", action: "Session Created", detail: "Entity KYB initiated by primary applicant", subjectId: "business", subjectLabel: "Summit Peak Capital Fund II, LP" },
      { id: "t2", timestamp: "2026-05-10T10:02:00Z", actor: "system", action: "Link Sent", detail: "KYB verification link emailed to Nathan Cho (managing partner)", subjectId: "business", subjectLabel: "Summit Peak Capital Fund II, LP" },
      { id: "t3", timestamp: "2026-05-10T10:30:00Z", actor: "end_user", actorName: "Nathan Cho", action: "Link Opened", subjectId: "business", subjectLabel: "Summit Peak Capital Fund II, LP" },
      { id: "t4", timestamp: "2026-05-12T14:00:00Z", actor: "system", action: "KYB information sent to Alloy", detail: "Entity data submitted for screening", subjectId: "business", subjectLabel: "Summit Peak Capital Fund II, LP" },
      { id: "t5", timestamp: "2026-05-14T11:00:00Z", actor: "system", action: "KYB Status returned from Alloy", detail: "Approved", subjectId: "business", subjectLabel: "Summit Peak Capital Fund II, LP" },
      // Primary / managing partner — Nathan Cho (approved)
      { id: "t6", timestamp: "2026-05-12T14:05:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0010-1", subjectLabel: "Nathan Cho" },
      { id: "t7", timestamp: "2026-05-14T11:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0010-1", subjectLabel: "Nathan Cho" },
      // UBO — Emily Stone (approved)
      { id: "t8", timestamp: "2026-05-12T14:30:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Emily Stone (UBO)", subjectId: "P-0010-2", subjectLabel: "Emily Stone" },
      { id: "t9", timestamp: "2026-05-12T15:00:00Z", actor: "end_user", actorName: "Emily Stone", action: "Link Opened", subjectId: "P-0010-2", subjectLabel: "Emily Stone" },
      { id: "t10", timestamp: "2026-05-12T15:40:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0010-2", subjectLabel: "Emily Stone" },
      { id: "t11", timestamp: "2026-05-14T11:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0010-2", subjectLabel: "Emily Stone" },
      // UBO — Carlos Mendez (approved)
      { id: "t12", timestamp: "2026-05-12T14:30:00Z", actor: "admin", actorName: "Marco Cesaratto", action: "Link Sent", detail: "Verification link emailed to Carlos Mendez (UBO)", subjectId: "P-0010-3", subjectLabel: "Carlos Mendez" },
      { id: "t13", timestamp: "2026-05-13T09:00:00Z", actor: "end_user", actorName: "Carlos Mendez", action: "Link Opened", subjectId: "P-0010-3", subjectLabel: "Carlos Mendez" },
      { id: "t14", timestamp: "2026-05-13T09:30:00Z", actor: "system", action: "KYC information sent to Alloy", detail: "Identity data submitted for screening", subjectId: "P-0010-3", subjectLabel: "Carlos Mendez" },
      { id: "t15", timestamp: "2026-05-14T11:00:00Z", actor: "system", action: "KYC Status returned from Alloy", detail: "Approved", subjectId: "P-0010-3", subjectLabel: "Carlos Mendez" },
    ],
  },
];
