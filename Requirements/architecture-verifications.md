# Brownfield Technical Architecture — Verifications (KYC) + native EDD port

**Author:** Architect (BMAD)
**Date:** 2026-06-08
**Status:** For development
**Source PRD:** `docs/prd-verifications.md`
**Type:** Brownfield additive feature on the existing Next.js 16 admin app

---

## 0. Orientation & guiding decisions

This is an additive feature. It introduces a `/admin/verifications` route tree, a new types block, a new mock-data module, a new in-memory store, and a **native port** of the `app-edd/` Vite prototype into the App Router. It must not touch the existing Applications EDD scaffolding (`requestEddOnApplication` in `demo-state.tsx`).

**Verified codebase facts (read, not assumed):**

- Pages are client components (`"use client"`) and read the route param via `useParams()` from `next/navigation` (see `src/app/admin/applications/[id]/page.tsx:36`). We mirror that exactly — **do not** convert these to async server components that `await params`.
- **Next.js 16 drift confirmed in `node_modules/next/dist/docs/`:** in server `page.tsx`/`layout.tsx`, `params` and `searchParams` are now `Promise`s (`.../03-layouts-and-pages.md:216-248`) and there are new global `PageProps<'/route'>` / `LayoutProps<'/route'>` helper types (same doc §"Route Props Helpers"). **This only matters if a page is a server component.** Our pages are client components using `useParams()`, so the promise-params change does not affect us. If a developer adds a server component, they must `await params` and may use `PageProps<'/admin/verifications/[id]'>`.
- The "Verifications" nav item **already exists** in `src/app/admin/layout.tsx:46` and `/admin/verifications` is already in `enabledRoutes` (line 22-28). No layout edit is needed to light up the nav.
- Root layout (`src/app/layout.tsx`) wraps everything in `DemoStateProvider`. We add our providers as **siblings** of `DemoStateProvider`, scoped to the verifications subtree (see §3.4), not by overloading `DemoStateProvider`.
- Interro tokens live in `src/app/globals.css`: `--interro-primary #123524`, `--interro-primary-soft #E6F0EA`, `--interro-accent #339966`, `--interro-accent-soft #EEF7F1`, surfaced to Tailwind v4 via `@theme inline` (so `bg-interro-primary`, `text-interro-accent`, etc. are valid utilities). Font is Aptos.
- `app-edd`'s `EddContext.jsx` is a `useReducer` store; the catalog (`eddItemTypes.js`) has exactly **14 items** in 4 categories; `cases.js` carries `alloyReview` + `recommendedItemIds` per case — this is the shape we synthesize on the fly from a session/person.
- The simulated-async pattern is `setTimeout` flip with a `pendingTimeoutsRef` cleared on unmount/reset (`demo-state.tsx:185, 436-455, 753-759`). We reuse this pattern verbatim.

**Milestone 1 = EPIC E1 only** (index + detail rendering off types + mock data). E2/E4/E5 layer on; E3 (EDD port) is last and is the largest single piece.

---

## 1. Type model — additions to `src/types/index.ts`

Append the following. **Reuse** existing `Address` and `RiskLevel` (already exported at the top of the file). Do **not** redeclare them.

```ts
// ───────────────────────── Verifications (KYC) ─────────────────────────

export type PathType = "solo" | "joint" | "entity";

export type PersonRole = "primary" | "co_holder" | "ubo" | "control_person";

// PD-141 §1.3 — the 9 session statuses (string-union, stored verbatim).
// NOTE: session statuses are DEDUCED (see §2.x deriveSessionStatus), not fetched
// from the KYC microservice. The `pending_review` value renders as "Manual Review".
// "returned_for_corrections" has been removed from the model entirely.
export type SessionStatus =
  | "in_progress"
  | "abandoned"
  | "submitted"
  | "screening_in_progress"
  | "pending_review"
  | "approved"
  | "denied"
  | "partially_verified"
  | "expired";

// PD-145 §5.1 — the 8 per-person verification badges
export type PersonVerificationBadge =
  | "not_started"
  | "link_sent"
  | "in_progress"
  | "approved"
  | "denied"
  | "under_review"
  | "error"
  | "expired";

// Verification-link lifecycle for an additional person (PD-145 §5.2 / AC3)
export type LinkStatus =
  | "not_sent"
  | "sent"      // delivered via email or copied
  | "opened"
  | "completed"
  | "expired"
  | "revoked";

// KYC microservice status reflected per person/entity (E1.3 AC5).
// SOURCE OF TRUTH: every per-person and per-entity (KYB) status is grabbed
// directly from the KYC microservice — the admin UI never invents them. The
// microservice emits the statuses below (see §1.2 for the canonical list and
// UI-display mapping). There is NO `dataCorrectionNeeded` and NO
// `returned_for_corrections` status anywhere in the model.
export type KycStatus =
  | "not_started"
  | "data_entered"
  | "screening"
  | "passed"
  | "failed"
  | "review";

export interface PersonVerificationLink {
  status: LinkStatus;
  url: string;                 // simulated standalone link
  sentAt?: string;
  sentVia?: "email" | "copied";
  openedAt?: string;
  completedAt?: string;
  expiresAt?: string;          // 72-hour TTL (PD-145)
}

// A single completed step in the per-person progress indicator (E1.3 AC2)
export interface ProgressStep {
  label: string;               // e.g. "Identity", "Address", "ID upload", "Screening"
  complete: boolean;
  completedAt?: string;
}

export interface SessionPerson {
  id: string;
  role: PersonRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;         // raw ISO; masked at render via maskDob()
  ssn: string;                 // raw; masked at render via maskValue() — SSN or non-US national ID
  ssnIssuingCountry?: string;  // for non-US IDs
  address: Address;            // reuse existing Address
  // Entity-associated-party specifics (interro_client_onboarding_fieldsv1.md)
  title?: string;              // authorized rep / control person title
  ownershipPercentage?: number;// UBO
  controlFunction?: string;    // control person
  idType?: string;
  idNumber?: string;           // raw; masked at render
  photoIdUploaded?: boolean;
  // Verification state
  badge: PersonVerificationBadge;
  kycStatus: KycStatus;
  biographicalDataEntered: boolean;   // PD-145 Phase 1 (AC2)
  link?: PersonVerificationLink;      // additional persons only
  progress: ProgressStep[];
  screeningResult?: "pass" | "fail" | "review" | "error";
  // EDD seeding (E1.1 AC3 / E3.2): curated catalog subset for this person
  recommendedItemIds: string[];
}

// Entity identity block (E1.3 AC4 + interro_client_onboarding_fieldsv1.md)
export interface EntityInfo {
  legalName: string;
  dba?: string;
  taxId: string;               // EIN or non-US tax id; raw, masked at render
  taxIdIssuingCountry: string;
  fileNumber?: string;         // registration / file number
  countryOfRegistration: string;
  stateOfRegistration?: string;// if US
  principalAddress: Address;
}

// E1.3 AC6 — append-only audit timeline entry
export interface SessionTimelineEntry {
  id: string;
  timestamp: string;
  actor: "system" | "end_user" | "admin";
  actorName?: string;          // e.g. "Marco Cesaratto" for admin actions
  action: string;              // short verb phrase
  detail?: string;             // free-text detail (reason text, outcome, etc.)
}

export interface VerificationSession {
  id: string;                  // e.g. "VS-2026-0001"
  organizationId: string;
  organizationName: string;    // tenant within Delio
  pathType: PathType;
  jointAccountType?: string;   // for joint sessions (E5.1 AC2)
  status: SessionStatus;
  createdAt: string;
  submittedAt?: string;
  lastActivityAt: string;
  persons: SessionPerson[];    // [0] is always the primary applicant
  entity?: EntityInfo;         // entity sessions only
  timeline: SessionTimelineEntry[];
}
```

### 1.2 Status sourcing & session-status inference

**All per-person / per-entity statuses are grabbed from the KYC microservice.** The
microservice is the single source of truth for an individual party's status; the
admin UI reflects it and never invents one. The microservice emits exactly these
statuses (note: **no `dataCorrectionNeeded`**, **no `returned_for_corrections`**):

| KYC microservice status | Meaning | UI display |
|---|---|---|
| `documentsPending` | Verification created; PII accepted and pre-signed upload URLs issued. Awaiting document uploads and the explicit `/submit`. Auto-expires after 72h (3 days) if never submitted/cancelled. | In Progress |
| `pending` | `/submit` called; accepted and queued for processing. | Submitted |
| `inProgress` | Actively processed by data vendors through Alloy. | Screening In Progress |
| `underReview` | All vendor checks completed but routed to a manual-review queue in Alloy; a compliance reviewer must adjudicate before a terminal status. | **Manual Review** |
| `error` | A downstream vendor/service failure during processing; client can `/retry`. | Error |
| `success` | Approved (auto-approved straight from `inProgress`, or after a reviewer approves). Eligible for payments. | Approved |
| `denied` | Denied; blocked from payments. From auto-denial rules or a manual-review denial. | Denied |
| `cancelled` | Explicitly cancelled by the client via `/cancel` while in `documentsPending`. Terminal — no recovery. | Cancelled |
| `expired` | Auto-expired after 3 days in `documentsPending` without submit/cancel. Terminal — no recovery. | Expired |

> **`underReview` → "Manual Review" is the EDD entry point.** Manual Review (renamed
> from the former "Pending Review") is the state in which ops typically initiate
> Enhanced Due Diligence.

**A session's status is DEDUCED, not fetched.** A **solo** session has one party, so
its session status is that party's status (mapped above). A **joint** session
(primary + co-holders) and an **entity** session (business/KYB record + UBOs +
control persons) have multiple parties and no single microservice status, so the
session status is inferred from the **collection** of party statuses via this
precedence ladder — first matching rule wins, exhaustive over the nine statuses:

```ts
// The nine statuses the KYC microservice can emit (table above).
type KycMicroserviceStatus =
  | "documentsPending" | "pending" | "inProgress" | "underReview"
  | "error" | "success" | "denied" | "cancelled" | "expired";

// Inputs: the microservice status of every party in the session
//   - joint  → [primary, ...coHolders]
//   - entity → [kybRecord, ...ubos, ...controlPersons]
export function deriveSessionStatus(parties: KycMicroserviceStatus[]): SessionStatus {
  const any = (s: KycMicroserviceStatus) => parties.includes(s);
  const all = (s: KycMicroserviceStatus) => parties.every((p) => p === s);

  if (any("denied"))      return "denied";                // 1. any blocked party blocks the account
  if (any("underReview")) return "pending_review";        // 2. → "Manual Review" (EDD entry point)
  if (any("error"))       return "screening_in_progress"; // 3. surfaced as Error per-party; account undecidable until /retry
  if (all("success"))     return "approved";              // 4. clears only when EVERY party passes
  if (any("success"))     return "partially_verified";    // 5. some done, others still in flight / lapsed
  if (any("documentsPending")) return "in_progress";      // 6. bottleneck = least-complete party still owes docs
  if (any("pending"))     return "submitted";             // 7. all submitted; ≥1 queued, none screening
  if (any("inProgress"))  return "screening_in_progress"; // 8. ≥1 actively screening
  if (all("cancelled"))   return "abandoned";             // 9. all parties cancelled
  return "expired";                                       // 10. only cancelled/expired remain, no successes
}
```

**Rationale.** The ladder is ordered **most-blocking first** (Denied → Manual Review
→ Error) so the account surfaces the state that demands action; then the **all-clear**
(Approved) and the **mixed** state (Partially Verified); then the **in-flight** stages
reported at the *least-complete* party (the real bottleneck); then the
**terminal-incomplete** states. `error` and `cancelled` have no dedicated session
label in the demo's nine-value set, so at the aggregate they fold into
`screening_in_progress` (work outstanding, ops retries) and `abandoned`
respectively, while remaining visible on the offending party. This matches and
extends the store's `recomputeStatus` (anyDenied → Denied; allApproved → Approved;
any under-review → Manual Review; otherwise Partially Verified).

> **Session-lifecycle override.** `abandoned` (no applicant activity past the
> inactivity threshold) and session-level `expired` (30-day session TTL) are
> time-based session states independent of the screening pipeline; when they apply
> they take precedence over the in-flight rungs (6–8) above.

### 1.1 EDD types for the ported store (E3.1)

These mirror the prototype object verbatim (`app-edd/src/store/EddContext.jsx:43-63`) plus the catalog item shape (`eddItemTypes.js`). They are the **Verifications EDD** types and are wholly separate from the Applications `EDDDocument` type (which stays untouched).

```ts
// ───────────────────────── EDD (ported from app-edd) ─────────────────────────

export type EddItemKind = "document" | "field";
export type EddFieldType = "text" | "textarea" | "select" | "yesno";

export interface EddItem {
  id: string;
  label: string;
  kind: EddItemKind;
  category: "funds" | "identity" | "entity" | "risk";
  description: string;
  fieldType?: EddFieldType;    // when kind === "field"
  placeholder?: string;
  options?: string[];          // select
  yesLabel?: string;           // yesno
  noLabel?: string;
}

export type EddStatus =
  | "draft"
  | "sent"
  | "in_progress"
  | "submitted"
  | "completed";

export type EddSubjectType = "entity" | "individual";
export type EddRecipientType = "gp" | "lp";
export type EddOutcome = "Approved" | "Escalate";

export interface EddRecipient {
  type: EddRecipientType;
  name: string;
  email: string;
  firm?: string;               // gp only
}

// The Alloy review summary synthesized from the session (A2 / E3.3 AC1)
export interface EddAlloyReview {
  outcome: "Manual Review";
  riskScore: number;
  runDate: string;
  reasons: string[];
}

export interface EddSubmissionFile {
  name: string;
}

export interface EddSubmission {
  values: Record<string, string>;            // itemId → value
  files: Record<string, EddSubmissionFile[]>; // itemId → files
  submittedAt: string;
}

export interface EddHistoryEntry {
  label: string;
  at: string;
}

export interface EddRequest {
  id: string;
  token: string;
  link: string;                // https://{client}.interro.co/edd/{token}
  // bent entry linkage back to the verification session/person:
  caseId: string;              // sessionId, or `${sessionId}:${personId}` for multi-person
  sessionId: string;
  personId?: string;
  subjectType: EddSubjectType;
  entityName?: string;
  subjectName: string;
  flaggedParty: string;
  context: string;
  alloyReview: EddAlloyReview;
  items: string[];             // ordered EddItem ids
  recipient: EddRecipient;
  note: string;
  status: EddStatus;
  createdAt: string;
  submission: EddSubmission | null;
  outcome?: EddOutcome;
  history: EddHistoryEntry[];
}

// The ephemeral "case" the bent entry builds before a request is created.
// It is NOT persisted as a queue — it is synthesized on click (see §6).
export interface EddCase {
  id: string;                  // caseId
  sessionId: string;
  personId?: string;
  subjectType: EddSubjectType;
  entityName?: string;
  subjectName: string;
  flaggedParty: string;
  context: string;
  saasClient: string;          // org name
  gp: EddRecipient;
  lp: EddRecipient;
  alloyReview: EddAlloyReview;
  recommendedItemIds: string[];
}
```

> **Naming note:** the prototype calls per-person verification "badge"; the catalog item type is `EddItem`. Keep `EddItem` distinct from the existing `EDDDocument` (Applications) — they never mix.

---

## 2. Mock data — `src/lib/verification-data.ts`

New module (do **not** add sessions to `mock-data.ts`; keep the surfaces isolated). It exports `verificationSessions: VerificationSession[]` plus PII helpers.

### 2.1 Masking convention

Store the **raw** value on the object; mask only at render. Provide pure helpers in this module (consumed by detail view + CSV gating):

```ts
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
```

Reveal is local UI state (`useState`) per the existing Applications masking pattern — no store involvement.

### 2.2 Seed coverage (8–10 sessions)

| # | Path | Status | Persons | Notes |
|---|------|--------|---------|-------|
| 1 | solo | `approved` | 1 primary | clean happy path |
| 2 | solo | `pending_review` | 1 primary | screening done, awaiting ops |
| 3 | joint | `partially_verified` | primary + 1 co_holder | co_holder `link_sent` |
| 4 | joint | `pending_review` (Manual Review) | primary + 1 co_holder | co_holder `under_review` → account deduced to Manual Review |
| 5 | entity | `screening_in_progress` | primary + 2 UBO + 1 control_person | recommendedItemIds per person |
| 6 | entity | `submitted` | primary + 1 UBO | one UBO `error`, one `under_review` |
| 7 | entity | `denied` | primary + 1 UBO + 1 control_person | UBO `denied` |
| 8 | solo | `in_progress` | 1 primary | mid-flow, partial progress steps |
| 9 | joint | `expired` | primary + 1 co_holder | co_holder link `expired` |
| 10 | entity | `approved` | primary + 2 UBO | all `approved` (full green aggregate) |

Across these, every one of the **9 session statuses** and every one of the **8 badges** appears at least once, across ≥3 organizations. Dates spread over the last ~40 days; `createdAt` descending is the default index sort.

### 2.3 Fully-worked example (entity, multi-person)

```ts
export const verificationSessions: VerificationSession[] = [
  // … sessions 1-4 …
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
      legalName: "Acme Holdings LLC",
      dba: "Acme Capital",
      taxId: "84-2910037",
      taxIdIssuingCountry: "US",
      fileNumber: "DE-7741299",
      countryOfRegistration: "US",
      stateOfRegistration: "DE",
      principalAddress: {
        street: "120 Market Street, Suite 400",
        city: "Wilmington", state: "DE", zip: "19801", country: "US",
      },
    },
    persons: [
      {
        id: "P-0005-1", role: "primary",
        firstName: "Daniel", lastName: "Reyes",
        email: "daniel.reyes@acmeholdings.com", phone: "+1 302 555 0142",
        dateOfBirth: "1979-04-11", ssn: "412-55-9981",
        title: "Managing Member",
        address: {
          street: "88 Rodney St", city: "Wilmington", state: "DE",
          zip: "19806", country: "US",
        },
        badge: "approved", kycStatus: "passed",
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
        id: "P-0005-2", role: "ubo",
        firstName: "Jane", lastName: "Smith",
        email: "jane.smith@acmeholdings.com", phone: "+1 302 555 0188",
        dateOfBirth: "1984-09-22", ssn: "551-22-3390",
        ownershipPercentage: 60,
        address: {
          street: "14 Greenhill Ave", city: "Wilmington", state: "DE",
          zip: "19805", country: "US",
        },
        badge: "under_review", kycStatus: "review",
        biographicalDataEntered: true,
        screeningResult: "review",
        link: {
          status: "completed", url: "https://westbridge.interro.co/v/lnk_9a2f",
          sentVia: "email", sentAt: "2026-06-02T17:10:00Z",
          openedAt: "2026-06-03T08:20:00Z", completedAt: "2026-06-03T08:55:00Z",
        },
        progress: [
          { label: "Identity", complete: true },
          { label: "Address", complete: true },
          { label: "ID upload", complete: true },
          { label: "Screening", complete: false },
        ],
        // seeds A2 with these pre-selected + "Alloy-recommended"
        recommendedItemIds: ["ownership_chart", "source_of_funds", "audited_financials"],
      },
      {
        id: "P-0005-3", role: "ubo",
        firstName: "Robert", lastName: "Kim",
        email: "robert.kim@acmeholdings.com", phone: "+1 302 555 0190",
        dateOfBirth: "1971-01-30", ssn: "603-44-1120",
        ownershipPercentage: 25,
        address: {
          street: "9 Delaware Ave", city: "Newark", state: "DE",
          zip: "19711", country: "US",
        },
        badge: "link_sent", kycStatus: "data_entered",
        biographicalDataEntered: true,
        link: {
          status: "sent", url: "https://westbridge.interro.co/v/lnk_4c81",
          sentVia: "email", sentAt: "2026-06-06T10:00:00Z",
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
        id: "P-0005-4", role: "control_person",
        firstName: "Sofia", lastName: "Marchetti",
        email: "sofia.marchetti@acmeholdings.com", phone: "+1 302 555 0177",
        dateOfBirth: "1988-07-03", ssn: "490-77-2261",
        title: "CFO", controlFunction: "Finance & signing authority",
        address: {
          street: "200 King St", city: "Wilmington", state: "DE",
          zip: "19801", country: "US",
        },
        badge: "not_started", kycStatus: "not_started",
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
      { id: "t1", timestamp: "2026-05-28T09:12:00Z", actor: "system",
        action: "Session created", detail: "Entity KYB initiated by primary applicant" },
      { id: "t2", timestamp: "2026-06-02T16:40:00Z", actor: "end_user", actorName: "Daniel Reyes",
        action: "Session submitted", detail: "All required entity data provided" },
      { id: "t3", timestamp: "2026-06-02T17:00:00Z", actor: "system",
        action: "Screening started", detail: "Routed to Alloy for KYB + KYC screening" },
      { id: "t4", timestamp: "2026-06-03T08:55:00Z", actor: "end_user", actorName: "Jane Smith",
        action: "UBO verification completed", detail: "Jane Smith completed standalone link" },
      { id: "t5", timestamp: "2026-06-06T10:00:00Z", actor: "admin", actorName: "Marco Cesaratto",
        action: "Link sent", detail: "Verification link emailed to Robert Kim" },
    ],
  },
  // … sessions 6-10 …
];
```

Helper selectors also exported from this module: `getSessionById(id)`, `aggregateVerified(s) => { verified: number; total: number; tone: "green"|"yellow"|"red" }` (E2.3: green=all approved, red=any denied, else yellow).

---

## 3. Route & component map (App Router)

```
src/app/admin/verifications/
  layout.tsx                 "use client" — mounts VerificationProvider + EddProvider (§3.4)
  page.tsx                   "use client" — session index (E1.2, E5 export button)
  [id]/
    page.tsx                 "use client" — tabbed session detail (E1.3, E2, E4 modal, EDD entry)

src/components/verifications/
  SessionTable.tsx           filterable/sortable/paginated table (mirrors applications/page.tsx)
  SessionFilters.tsx         org multi-select, path, status multi-select, date, search
  AggregateProgress.tsx      "X of Y verified" pill, tone-colored (E2.3)
  PersonCard.tsx             expandable per-person row: badge, link status, KYC, progress, EDD button
  LinkManagerMenu.tsx        resend / regenerate / revoke actions (E2.2)
  EntityInfoSection.tsx      entity identity block (E1.3 AC4)
  PrimaryApplicantSection.tsx masked identity + reveal toggle + progress steps
  SessionTimeline.tsx        chronological audit log (E1.3 AC6)
  ReturnForCorrectionsModal.tsx  (E4)
  ExportMenu.tsx + csv.ts    session + per-person CSV, PII gating, audit log (E5)

src/components/edd/           ← native port of app-edd (see §4)
  EddConsole.tsx             host that switches A2/A3/A4 by local screen state (was Console.jsx, minus A1)
  BuildRequest.tsx           A2 build (catalog picker + Alloy summary)
  RequestDetail.tsx          A4 track (link, items, run/escalate, timeline)
  collection/
    CollectionApp.tsx        POV B host + mobile frame + "Powered by Interro" footer
    CollectionIntro.tsx      B1
    CollectionForm.tsx       B2 (DocDrop, text/select/yesno)
    CollectionReview.tsx     B3
    CollectionDone.tsx       B4 (+ B0 empty state)
  EddCatalog.ts              ported eddItemTypes (data)  → see §4
  edd-store.tsx              EddProvider + useEdd reducer (ported)  → see §4
  edd-entry.ts               buildEddCaseFromSession() (§6)
```

### 3.1 Index page (`verifications/page.tsx`) — E1.2 / E5.1

Mirrors `applications/page.tsx` structure (header + Export button, filter bar, white table card). Columns verbatim from E1.2 AC1: Organization, Path type, Primary applicant, Status, Person count, **Persons verified (X of N)** (rendered via `<AggregateProgress>`), Date created, Date submitted. Filtering/sorting/pagination is `useState` + `useMemo` over `verificationSessions` (no server data). Default sort `createdAt` desc. Each row links to `/admin/verifications/[id]`. The Export button opens `<ExportMenu>` (E5) operating on the **filtered** array.

### 3.2 Detail page (`verifications/[id]/page.tsx`) — E1.3 / E2 / E4 / E3-entry

Client component using `useParams()` (mirror `applications/[id]/page.tsx:36`). Tabbed layout identical to Applications detail. Tabs:

- **Overview** — header (org, type, created, last activity, status badge) + `<PrimaryApplicantSection>`.
- **Persons** (joint/entity only) — list of `<PersonCard>`; each has the per-person "Initiate EDD" button (entity/joint) and `<LinkManagerMenu>`; top of tab shows `<AggregateProgress>`.
- **Entity** (entity only) — `<EntityInfoSection>`.
- **Timeline** — `<SessionTimeline>`.

Header action buttons: **Return for Corrections** (opens `<ReturnForCorrectionsModal>`), and for **solo** sessions a single session-level **Initiate EDD** button (per locked decision).

### 3.3 EDD surface — **modal/drawer over a nested route** (decision)

**Decision: render the EDD flow in a full-screen overlay (drawer) launched from the detail page, NOT a nested route `[id]/edd/...`.** Justification:

1. The prototype is **screen-state driven** (`Console.jsx` switches `queue|build|detail` via `useState`; `CollectionApp` switches `intro|form|review|done`). Porting that to URL segments would require re-plumbing every `onSent`/`onBack`/`setScreen` into router navigation — high churn against ported `.jsx` for zero product gain in an in-memory demo.
2. EDD state lives in an in-memory provider; a nested route would remount/lose nothing but adds back-button ambiguity (browser back vs flow back) and a needed `not-found`/hydration story for `[id]/edd/[requestId]`.
3. A drawer keeps the session context (the "case") visually present — reinforcing the locked "the session IS the case" model.

**Component tree of the overlay** (`<EddDrawer>` lives in detail page, conditionally rendered when an EDD flow is open):

```
<EddDrawer onClose>                       full-viewport overlay, Interro chrome
  segmented control: [ Compliance Console | Collection (recipient) ]   ← replaces app-edd top-bar switcher
  view === "console":
    <EddConsole startRequestId={seededId}>
      screen "build"  → <BuildRequest caseId .../>      A2/A3 (two internal steps)
      screen "detail" → <RequestDetail requestId .../>  A4
  view === "collection":
    <CollectionApp>                                     B0–B4 in mobile frame
      <CollectionIntro> | <CollectionForm> | <CollectionReview> | <CollectionDone>
```

There is **no `CaseQueue`/A1** — the drawer opens straight on `BuildRequest` (A2) for the seeded case, or on `RequestDetail` (A4) if reopening an existing request for that person. The Console/Collection segmented control replaces the prototype's top-bar `view` switcher; the theme selector and reset button are dropped.

### 3.4 Provider mounting

A new `src/app/admin/verifications/layout.tsx` (`"use client"`) mounts **both** new providers, scoping them to the verifications subtree:

```tsx
"use client";
import { VerificationProvider } from "@/lib/verification-state";
import { EddProvider } from "@/components/edd/edd-store";

export default function VerificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <VerificationProvider>
      <EddProvider>{children}</EddProvider>
    </VerificationProvider>
  );
}
```

Rationale: keeps `DemoStateProvider` (root) untouched and avoids loading EDD/verification state for every admin page. The root `DemoStateProvider` still wraps this layout (it is above in the tree), so any future cross-read is possible but **not used** — the two stores stay isolated (NFR6).

---

## 4. EDD port mechanics — file-by-file move map

All ported files become `"use client"` TypeScript. `Math.random()` and `new Date()` are fine client-side (these run in event handlers / after mount, not during SSR of a server component — and these are client components anyway). The store file **must** carry `"use client"` at the top.

| From `app-edd/src/…` | To `src/components/edd/…` | Changes |
|---|---|---|
| `store/EddContext.jsx` | `edd-store.tsx` | Add `"use client"`. Type the reducer with `EddRequest`/action union from `src/types`. Keep reducer logic verbatim. Extend `CREATE_REQUEST` payload to carry `sessionId`, `personId`, `alloyReview` (already on `EddCase`). Change link template to `https://{client}.interro.co/edd/{token}` (client from case `saasClient`). Add a `RUN_EDD` side-effect hook point so the detail page can append to the session timeline (§6). |
| `data/eddItemTypes.js` | `EddCatalog.ts` | Convert to `export const eddItemTypes: EddItem[]`. Keep all **14** items + `EDD_CATEGORIES` + `eddItemById`. Pure data; no JSX. |
| `data/cases.js` | **DROP** | Cases are no longer static — `buildEddCaseFromSession()` (§6) synthesizes the case. Remove `caseById`. |
| `console/Console.jsx` | `EddConsole.tsx` | Remove the `queue` screen branch and `CaseQueue` import (A1 bent). Initial screen = `build` when seeded, else `detail`. Keep `build`/`detail` switching. |
| `console/CaseQueue.jsx` | **DROP** | A1 is bent away (PRD §6, E3.2 AC4). |
| `console/BuildRequest.jsx` | `BuildRequest.tsx` | Replace `caseById[caseId]` lookup with a `caseObj: EddCase` prop (passed from the drawer, built in §6). Otherwise verbatim (Alloy banner, category picker, recommended badging, recipient cards, send). |
| `console/RequestDetail.jsx` | `RequestDetail.tsx` | Verbatim. On `RUN_EDD`, also invoke the session write-back callback (§6). `navigator.clipboard` is browser-only — fine in client component. |
| `collection/CollectionApp.jsx` | `collection/CollectionApp.tsx` | Replace `interroLogo` import (Vite asset) with `next/image` pointing at `/interro-logo.png` (already in `public/`, used by admin layout). Keep mobile frame + `#phone-modal-root`. |
| `collection/CollectionIntro/Form/Review/Done.jsx` | same names `.tsx` | Type props; keep logic. Replace any image import with `next/image`. |
| `App.jsx`, `main.jsx` | **DROP** | The Vite app shell, top-bar `view` switcher, theme selector, and reset button are not ported — admin uses one Interro theme and the drawer's segmented control replaces the switcher. |
| `assets/interro-logo.png` | use existing `public/interro-logo.png` | No copy needed. |

**Import rewrites:** every relative `../store/EddContext` → `@/components/edd/edd-store`; `../data/eddItemTypes` → `@/components/edd/EddCatalog`; types from `@/types`.

---

## 5. CSS scoping strategy

The prototype styles (`app-edd/src/styles/{tokens.css,global.css,edd.css}`) define generic classes — `.btn`, `.card`, `.form-input`, `.panel`, `.pill`, `.phone-frame`, etc. Dropping these into the global Tailwind admin would leak and collide.

**Decision: scoped wrapper with selector-prefixing (a single `.edd-root` ancestor), not CSS Modules.** Justification: the ported `.jsx` uses string `className`s pervasively and shares classes across many components; CSS Modules would force renaming every `className` to `styles.x` across ~9 files (massive churn, high regression risk). A prefix wrap preserves the ported markup verbatim.

**Mechanics:**

1. Create `src/components/edd/edd.css`. Concatenate the three prototype stylesheets, then prefix **every** selector with `.edd-root ` (e.g. `.btn` → `.edd-root .btn`, `.phone-frame` → `.edd-root .phone-frame`). Drop the `:root[data-theme=…]` theme blocks entirely (admin is single-theme).
2. The EDD drawer root element gets `className="edd-root"`. All ported components render inside it. Because Tailwind's reset and the admin's utility classes never use `.btn`/`.card`/`.panel`/`.pill` class names, and the EDD rules are all descendant-scoped under `.edd-root`, there is no bleed in either direction.
3. Import `edd.css` once, at the top of `EddDrawer.tsx` (`import "./edd.css";`) — Next 16 supports component-level CSS imports in client components.
4. **Token bridge (the important part):** the prototype reads `var(--color-primary)`, `var(--color-accent)`, `var(--color-text)`, `var(--color-success)`, `var(--color-primary-soft)`, etc. Define these once **on `.edd-root`**, mapped to the Interro green tokens, so the EDD UI matches admin without touching Tailwind globals:

```css
.edd-root {
  /* shape tokens kept from prototype tokens.css */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px; --radius-full: 9999px;
  --shadow-card: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-phone: 0 4px 24px rgba(0,0,0,.12);
  /* gray + status scale kept from prototype */
  --color-gray-100:#F1F5F9; --color-gray-200:#E2E8F0; --color-gray-300:#CBD5E1;
  --color-gray-400:#94A3B8; --color-gray-500:#64748B;
  --color-error:#EF4444; --color-orange:#F59E0B; --color-green:#22C55E;
  /* ── Interro Green bridge (= globals.css :root) ── */
  --color-primary:        var(--interro-primary);        /* #123524 */
  --color-primary-hover:  var(--interro-primary-hover);  /* #0c2418 */
  --color-primary-soft:   var(--interro-primary-soft);   /* #E6F0EA */
  --color-accent:         var(--interro-accent);         /* #339966 */
  --color-accent-soft:    var(--interro-accent-soft);    /* #EEF7F1 */
  --color-text:           var(--interro-text);           /* #18181B */
  --color-heading:        var(--interro-heading);        /* #123524 */
  --color-success:        var(--interro-accent);
  --color-info-soft:      var(--interro-accent-soft);
  --color-border:#E2E8F0; --color-border-light:#F1F5F9;
  --color-bg:#F8FAFC; --color-white:#FFFFFF; --color-role-badge:#0891B2;
  --font-family:"Aptos","Segoe UI",-apple-system,sans-serif;
  --font-heading:"Aptos","Segoe UI",-apple-system,sans-serif;
}
```

This is the prototype's "Interro Green" theme values mapped onto admin's own custom properties — one source of truth, matched palette, zero global leakage.

---

## 6. The bent EDD entry contract

A single pure builder synthesizes an `EddCase` from a session (+ optional person). No queue, no static `cases.js`.

```ts
// src/components/edd/edd-entry.ts
import type { VerificationSession, SessionPerson, EddCase, EddAlloyReview } from "@/types";

export function buildEddCaseFromSession(
  session: VerificationSession,
  person: SessionPerson | null   // null ⇒ solo / entity-level subject
): EddCase {
  const isEntitySubject = person === null && session.pathType === "entity";
  const subjectType = person ? "individual" : isEntitySubject ? "entity" : "individual";

  const subjectName = person
    ? `${person.firstName} ${person.lastName}`
    : session.entity?.legalName ?? `${session.persons[0].firstName} ${session.persons[0].lastName}`;

  const roleLabel = person
    ? ({ primary: "Primary applicant", co_holder: "Co-holder",
         ubo: `Beneficial owner${person.ownershipPercentage ? `, ${person.ownershipPercentage}%` : ""}`,
         control_person: "Control person" }[person.role])
    : "Entity";

  const flaggedParty = person ? `${subjectName} (${roleLabel})` : `${subjectName} (Entity)`;

  const context = session.entity
    ? `${session.organizationName} — entity verification`
    : `${session.organizationName} — ${session.pathType} verification`;

  return {
    id: person ? `${session.id}:${person.id}` : session.id,
    sessionId: session.id,
    personId: person?.id,
    subjectType,
    entityName: session.entity?.legalName,
    subjectName,
    flaggedParty,
    context,
    saasClient: session.organizationName,
    gp: deriveGp(session),                 // GP contact = org primary contact / first authorized rep
    lp: deriveLp(session, person),         // LP = the subject person (or primary for entity subject)
    alloyReview: deriveAlloyReview(session, person),
    recommendedItemIds: (person ?? session.persons[0]).recommendedItemIds,
  };
}
```

**Field mapping summary:**

| `EddCase` field | Source |
|---|---|
| `id` / `caseId` | `session.id` (solo/entity-level) or `${session.id}:${person.id}` (multi-person) |
| `sessionId` / `personId` | linkage for write-back |
| `subjectType` | `individual` for a person, `entity` for entity-level subject |
| `subjectName` / `entityName` | person name, or `entity.legalName` |
| `flaggedParty` | person name + derived role label, or `"<entity> (Entity)"` |
| `context` | org name + path-type phrasing |
| `saasClient` | `organizationName` (also drives the link host `{client}.interro.co`) |
| `gp` / `lp` | `deriveGp` = first authorized rep / control person of the entity (firm = org name); `deriveLp` = the subject person (or primary for entity subject) |
| `alloyReview` | `deriveAlloyReview` (below) |
| `recommendedItemIds` | the seeded `recommendedItemIds` carried on the person (mock), or primary's for entity-level |

**`deriveAlloyReview(session, person)`** synthesizes the A2 summary from session risk/screening (no real Alloy): map session/person screening to an `outcome:"Manual Review"`, a deterministic `riskScore` (e.g. derived from `session.id` hash like `alloy-mock.ts:getAlloyResultForPerson`, biased higher for `under_review`/`error` badges), `runDate = session.submittedAt ?? session.createdAt` (date portion), and `reasons[]` chosen from a small bank keyed on the person's `badge`/`screeningResult` (e.g. `under_review` → PEP / adverse-media reasons; `error` → "provider error during screening"). This keeps A3.3 AC1 faithful without inventing per-session reason data — though sessions MAY override by carrying their own reasons later.

**Default `recommendedItemIds` when a person carries none** (fallback by role/path):

- `ubo` → `["ownership_chart", "source_of_funds", "audited_financials"]`
- `control_person` → `["additional_id", "occupation", "purpose_of_account"]`
- `co_holder` → `["proof_of_address", "additional_id"]`
- entity-level subject → `["certificate_incorporation", "ownership_chart", "audited_financials"]`
- solo `primary` → `["source_of_funds_narrative", "bank_statement", "proof_of_address"]`

### 6.1 Outcome write-back to the session timeline

**Decision: a thin coordinator that bridges the two providers, NOT cross-store reducer coupling.** The `EddProvider` reducer stays a pure copy of the prototype (so the port is low-risk and EDD remains independently testable). The **detail page** (which sits under both providers) owns the bridge:

- The detail page passes an `onOutcome(requestId, outcome)` callback into `<RequestDetail>`. When the officer clicks "Run EDD in Alloy" / "Escalate", `RequestDetail` dispatches `RUN_EDD` (existing prototype behavior) **and** calls `onOutcome`.
- `onOutcome` calls a new `VerificationProvider` action `recordEddOutcome(sessionId, personId, outcome)` which:
  1. appends a `SessionTimelineEntry` (`actor:"admin"`, `action:"EDD re-run in Alloy"`, `detail:"Outcome: Approved"` / `"Escalated for review"`);
  2. updates the person's `badge` → `approved` (Approved) or `under_review` (Escalate), and recomputes session `status` (e.g. entity flips `partially_verified`→`approved` when all persons approved) — via the same `aggregateVerified` selector;
  3. persists via the localStorage pattern (§3.4 store mirrors `demo-state.tsx`).

This keeps EDD state in `EddProvider` and session state in `VerificationProvider`, joined only at the page level — consistent with how `demo-state.tsx` already coordinates derived views without merging stores. The `VerificationProvider` itself follows `demo-state.tsx` verbatim: `useState` + `useEffect` hydrate + `persist()` on every mutation + `pendingTimeoutsRef` for simulated-async flips (link send, screening, EDD re-run), cleared on unmount/reset.

---

## 7. Status / badge component extensions — `src/components/ui/status-badge.tsx`

Add two new mapped badge components alongside the existing ones (reuse the same `Badge` `variant` union — no new design language, NFR1):

```ts
import { SessionStatus, PersonVerificationBadge } from "@/types";

const sessionStatusVariants: Record<SessionStatus, { label: string; variant: BadgeVariant }> = {
  in_progress:              { label: "In Progress",            variant: "info" },
  abandoned:                { label: "Abandoned",              variant: "default" },
  submitted:                { label: "Submitted",              variant: "info" },
  screening_in_progress:    { label: "Screening In Progress",  variant: "warning" },
  pending_review:           { label: "Manual Review",          variant: "warning" },
  approved:                 { label: "Approved",               variant: "success" },
  denied:                   { label: "Denied",                 variant: "danger" },
  partially_verified:       { label: "Partially Verified",     variant: "warning" },
  expired:                  { label: "Expired",                variant: "default" },
};

const personBadgeVariants: Record<PersonVerificationBadge, { label: string; variant: BadgeVariant }> = {
  not_started:  { label: "Not Started",  variant: "default" },
  link_sent:    { label: "Link Sent",    variant: "info" },
  in_progress:  { label: "In Progress",  variant: "info" },
  approved:     { label: "Approved",     variant: "success" },
  denied:       { label: "Denied",       variant: "danger" },
  under_review: { label: "Under Review", variant: "warning" },
  error:        { label: "Error",        variant: "danger" },
  expired:      { label: "Expired",      variant: "default" },
};

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const e = sessionStatusVariants[status];
  return <Badge variant={e.variant}>{e.label}</Badge>;
}
export function PersonBadge({ badge }: { badge: PersonVerificationBadge }) {
  const e = personBadgeVariants[badge];
  return <Badge variant={e.variant}>{e.label}</Badge>;
}
```

(`BadgeVariant = "default" | "success" | "warning" | "danger" | "info"` — the existing literal union used throughout this file; extract it as a named type if not already.)

`<AggregateProgress>` (E2.3) does **not** use `Badge` — it needs three explicit tones beyond the variant set: green (all verified), yellow (partial), red (any denied). Render it as a small pill with `bg-interro-accent-soft text-interro-accent` (green), `bg-yellow-100 text-yellow-700` (yellow), `bg-red-100 text-red-700` (red), matching the inline pill style already used in `applications/page.tsx`.

---

## 8. Risks & collisions

1. **Applications EDD scaffolding collision (highest).** `demo-state.tsx` already exports `requestEddOnApplication` / `submitEddOnApplication` and an `EDDDocument` type. The new feature must **not** reuse any of these. Mitigation, enforced by structure: Verifications EDD lives in a **separate provider** (`EddProvider` in `src/components/edd/edd-store.tsx`), separate types (`EddRequest`/`EddItem`, never `EDDDocument`), separate localStorage keys (e.g. `interro-edd-state`, `interro-verifications-state` — distinct from `interro-demo-state`/`interro-demo-app-overrides`). No imports cross between `demo-state.tsx` and the new stores.

2. **Next.js 16 params drift.** Confirmed in `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`: server `page`/`layout` receive `params`/`searchParams` as **Promises**, with new global `PageProps`/`LayoutProps` helpers. **Not a blocker here** because all our pages are `"use client"` and read params via `useParams()` (mirroring `applications/[id]/page.tsx`). Guardrail: keep the new pages client components; if any becomes a server component, it must `await params`.

3. **CSS leakage from the port.** Generic prototype classes (`.btn`, `.card`, `.form-input`, `.panel`, `.pill`) could collide with future admin styles. Mitigation: all EDD CSS is prefixed under `.edd-root` and imported only by `EddDrawer` (§5); theme blocks dropped; tokens bridged to Interro vars. No un-prefixed selector ships.

4. **Two providers nesting / hydration order.** `VerificationProvider` and `EddProvider` both hydrate from localStorage in `useEffect`. The write-back bridge (§6.1) only fires from user clicks (post-hydration), so there is no hydration-order race. Both must guard mutations until hydrated (mirror `isHydrated` from `demo-state.tsx`).

5. **Drawer vs nested-route decision is load-bearing.** If product later wants deep-linkable EDD URLs, the drawer must be refactored to `[id]/edd/[requestId]`. Documented here so the choice is intentional, not accidental; the screen-state-driven port (§3.3) is the reason.

6. **`Math.random()` id generation during render.** The prototype's `uid()` is fine **only** inside event handlers / reducer actions (post-mount), never during render of a (potential) server component. The ported store is `"use client"` and ids are generated in `CREATE_REQUEST` — safe. Do not call `uid()` at module top level.

7. **Aggregate tone vs status coherence.** `aggregateVerified` (green/yellow/red) and `SessionStatus` are computed independently; ensure `recordEddOutcome` recomputes both so the index column tone and the status badge never disagree after an EDD outcome.

---

## 9. Build sequence (maps to PRD epics)

1. **M1 / E1** — §1 types, §2 mock data, §7 badges, index (§3.1) + detail (§3.2) shells (Overview/Entity/Timeline + masked primary). Independently demoable.
2. **E2** — `<PersonCard>`, `<LinkManagerMenu>`, `<AggregateProgress>`; per-person state + simulated link actions in `VerificationProvider`.
3. **E4** — `<ReturnForCorrectionsModal>` + `returnForCorrections` action (status + reason + simulated email + timeline).
4. **E5** — `<ExportMenu>` + `csv.ts` (session + per-person), `pii_export` flag gating, export audit log in `VerificationProvider`.
5. **E3** — port `app-edd` (§4), `.edd-root` CSS (§5), `EddProvider` (§3.4), `buildEddCaseFromSession` (§6), drawer + Console/Collection, write-back bridge (§6.1). Last, largest.
</content>
</invoke>
