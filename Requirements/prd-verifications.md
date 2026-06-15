# Brownfield PRD — Verifications (KYC) for the Interro Admin UI

**Author:** John (BMAD Product Manager)
**Date:** 2026-06-08
**Status:** For development
**Type:** Brownfield enhancement (additive feature on an existing Next.js admin app)

---

## 1. Goals & Background

### 1.1 Background

The Interro **admin UI** is a Next.js 16 (App Router) + React 19 + Tailwind v4 + lucide-react application used by a fintech ops/compliance team to review onboarding, accounts, banks, and risk. It already ships clickable demos for Applications, Accounts, Banks, and related ops flows.

This PRD adds a new top-level feature — **Verifications (KYC)** — that gives ops a way to search, browse, and act on **verification sessions** (the per-applicant KYC/KYB runs that feed onboarding). It also natively absorbs the **Enhanced Due Diligence (EDD)** collection flow that currently lives as a separate Vite prototype (`app-edd/`), so the full EDD loop runs inside admin and writes its outcome back into the verification session timeline.

The feature consolidates four KYC-UI admin tickets — **PD-141** (session index + detail), **PD-145** (multi-person coordination), **PD-144** (return for corrections), and **PD-146** (export). PD-142 and PD-143 are scrapped and carry no requirements.

### 1.2 Goals

1. Give ops a single filterable, sortable index of every verification session across all client organizations (tenants).
2. Provide a rich session detail view that surfaces identity data (masked), per-person status, entity info, KYC status, and a full audit timeline.
3. Coordinate multi-person (Joint / Entity) verification: per-person status badges, link management, and aggregate progress.
4. Let ops return a session to the applicant for corrections with a reason and optional emailed link.
5. Let ops export filtered session data as CSV (session-level and per-person), with PII-permission gating and an export audit log.
6. Let ops initiate EDD directly from the session detail view (per-person for entity/joint; session-level for solo), run the full build → send → collect → re-run → outcome loop natively, and write the outcome back to the session timeline.

### 1.3 Demo / fidelity note

This is a **clickable demo with fully in-memory state** — there is no backend and no persistence requirement beyond the existing localStorage-backed demo store pattern. **Fidelity of the UI and the flow is what matters, not durable storage.** All "emails sent", "links generated", "screening run", and "EDD re-run in Alloy" actions are stubbed/simulated, exactly as the existing demo does (e.g. the 1-second pending→approved bank-account flip).

---

## 2. Scope

### 2.1 In scope

- New route tree under `/admin/verifications` (index) and `/admin/verifications/[id]` (detail). The left-nav item already exists above "Banks".
- Verification **session** data model + mock data (Solo, Joint, Entity sessions).
- PD-141 session index + detail.
- PD-145 multi-person status, link management, aggregate progress.
- PD-144 return-for-corrections modal + status.
- PD-146 CSV export (session + per-person), PII gating, export audit log.
- Native port of `app-edd/` (Console POV A + Collection POV B) into the Next.js admin, entered from the session detail view (A1 queue is bent away).

### 2.2 Out of scope

- Any real backend, database, or network calls. State is in-memory only.
- Real email/SMS delivery (links are generated and the send is recorded; delivery is stubbed).
- Recipient authentication (magic-link/OTP) on the collection surface.
- Real Alloy integration, document OCR/adjudication, or automated Alloy-code → item mapping (curated `recommendedItemIds` per case).
- The standalone Alloy **EDD case queue (A1)** as an independent surface — it is intentionally replaced by the per-session/per-person trigger (see §6).
- The existing lightweight EDD scaffolding on **Applications** (`requestEddOnApplication` in `src/lib/demo-state.tsx`) — that flow is **separate and must not collide** with the new Verifications EDD (see §7.4).

---

## 3. Existing codebase facts (reuse, don't reinvent)

- **Left nav:** "Verifications" item already added above "Banks"; route is `/admin/verifications`.
- **List pattern to mirror:** `src/app/admin/applications/page.tsx` (filterable/searchable table, status pills, `var(--interro-primary)` tokens, Export button affordance).
- **Detail pattern to mirror:** `src/app/admin/applications/[id]/page.tsx` (tabbed detail with `useParams`, modals for approve/deny/EDD/close, masked-field reveal, audit log).
- **Shared UI:** `src/components/ui/badge.tsx`, `src/components/ui/status-badge.tsx` (variants: `default | success | warning | danger | info`).
- **Types:** `src/types/index.ts` (extend here — reuse `Address`, `ControlPerson`, `UBO`, `DocumentUpload`, `EDDDocument` where they fit).
- **Mock data:** `src/lib/mock-data.ts`.
- **Demo state pattern:** `src/lib/demo-state.tsx` — context provider + localStorage hydrate/persist + simulated async transitions. New Verifications/EDD state should follow this same pattern (new keys, new context or a new provider; do not overload the application overrides).
- **EDD prototype source to port:** `app-edd/src/console/{Console,CaseQueue,RequestDetail}.jsx`, `app-edd/src/collection/{CollectionIntro,CollectionForm,CollectionReview,CollectionDone}.jsx`, `app-edd/src/data/{cases,eddItemTypes}.js`.

---

## 4. Functional Requirements (system-level)

- **FR1** — Admin can browse all verification sessions across all organizations in a filterable, sortable, paginated table sorted most-recently-created first.
- **FR2** — Admin can open any session to a detail view showing header, primary applicant (masked identity with reveal), additional persons (Joint/Entity), entity info (Entity), per-person KYC status, and a chronological audit timeline.
- **FR3** — Session status reflects one of the 10 defined values (§E1.4) and is shown in both index and detail.
- **FR4** — For Joint/Entity sessions, admin can track per-person status (8 badges), view/resend/regenerate/revoke verification links, and see an aggregate "X of Y verified" indicator (color-coded) in both index and detail.
- **FR5** — Admin can return a session for corrections via a confirmation modal (required reason, optional emailed link); the session moves to a distinct "Returned for Corrections" status and the event is logged.
- **FR6** — Admin can export the filtered session list to CSV at session level and (for Joint/Entity) at per-person level; SSN/Tax ID is included only with PII export permission; every export is logged.
- **FR7** — Admin can initiate EDD from the session detail view (per-person for Entity/Joint; session-level for Solo), build/send a request, simulate the recipient collection, re-run EDD, and have the outcome written back into the session timeline.

## 5. Non-Functional Requirements

- **NFR1 — Design consistency.** Reuse existing Interro design tokens (`var(--interro-primary)`, `interro-primary-soft`, `interro-accent`, etc.), the `Badge`/status-badge components, table/modal/tab patterns from Applications. No new design language.
- **NFR2 — In-memory state.** All state in-memory, following the `demo-state.tsx` provider + localStorage pattern. No backend, no real network calls. Simulated async (e.g. screening, EDD re-run, link send) uses the existing setTimeout-flip approach.
- **NFR3 — Clean build.** No console errors/warnings at runtime; `lint` and `typecheck` pass clean. All new types declared in `src/types/index.ts`.
- **NFR4 — App Router conventions.** Follow this repo's Next.js conventions (the codebase notes Next.js APIs may differ from training data — consult `node_modules/next/dist/docs/` before introducing new framework APIs). Pages are client components (`"use client"`) consistent with existing admin pages.
- **NFR5 — PII handling (demo-faithful).** SSN/Tax ID, DOB, full address masked by default with reveal toggle; PII export gated by a (mocked) `pii_export` permission flag.
- **NFR6 — No collision.** Verifications EDD state is isolated from the Applications `requestEddOnApplication` scaffolding.

---

## 6. EDD Integration — how A1 is replaced

The EDD prototype defines a **Compliance Console POV A** with four screens — **A1 queue, A2 build, A3 send, A4 track** — and a **Recipient POV B** (B0–B4 collection). Per the locked product decision, **A1 (the standalone Alloy "needs more docs" case queue) is bent away.** EDD is no longer initiated by picking a case from a queue; instead:

- The **verification session (or a specific person within it) IS the case.** There is no separate case-discovery surface.
- **Entry point — Entity / Joint session:** an **"Initiate EDD"** button **next to each person** in the detail view (each authorized rep / UBO / control person / co-holder).
- **Entry point — Solo session:** a single **session-level "Initiate EDD"** button.
- Clicking "Initiate EDD" **seeds an EDD request object** (the same object the prototype uses) from the session/person:
  - `caseId` ← the session id (and person id for multi-person).
  - `subjectType` ← `entity` for the entity itself / `individual` for a person.
  - `subjectName` / `flaggedParty` / `context` ← person or entity name + organization/context from the session.
  - `recommendedItemIds` ← a curated subset of the catalog (carried on the session/person mock, mirroring the prototype's per-case recommendation), so **A2 opens with items pre-selected and badged "Alloy-recommended."**
- The officer proceeds straight into **A2 (build) → A3 (send) → A4 (track)**, then the recipient flow **B1–B4**, all rendered natively inside admin (the B surface keeps the embeddable mobile frame + "Powered by Interro" footer styling).
- On **"Run EDD in Alloy"** (outcome `Approved`) or **"Escalate for review"** (outcome `Escalate`), the **outcome is written back into the verification session's audit timeline** and the per-person status/badge updates accordingly.

The EDD request object retains the prototype's fields and lifecycle: `draft → sent → in_progress → submitted → completed`, with `items[]`, `recipient {type: gp|lp, name, email, firm?}`, `note`, `submission {values, files, submittedAt}`, `outcome`, and append-only `history[]`. The requestable-item catalog (documents + form fields, grouped by category) ports as data from `app-edd/src/data/eddItemTypes.js` — adding an item stays a data change, not a new screen.

---

## 7. Epic Breakdown

**Sequencing:** **E1 first** (it is independently demoable and is the foundation). Then **E2 (multi-person)**, then **E3 (EDD-from-detail)** which depends on **E1 + E2**, then **E4 (return for corrections)** and **E5 (export)**. E4 and E5 depend on E1 (E5 also benefits from E2's per-person data for the per-person export).

```
E1 Foundation ──► E2 Multi-person ──► E3 EDD-from-detail (needs E1+E2)
   │
   ├──► E4 Return for corrections (needs E1)
   └──► E5 Export (needs E1; per-person export needs E2)
```

---

### EPIC E1 — Foundation: Session Index + Detail (PD-141) — Milestone 1

**Goal:** Establish the Verifications data model, mock data, and a fully demoable session index and session detail view. This epic must be shippable and demoable on its own.

#### E1.0 Status model (PD-141 §1.3) — the 10 session status values

| Status | Description |
|---|---|
| In Progress | Session created, applicant actively completing steps. |
| Abandoned | No activity for configurable threshold (e.g., 7 days), session not submitted. |
| Submitted | All required data and documents provided, awaiting screening. |
| Screening In Progress | Screening initiated, awaiting results from provider(s). |
| Pending Review | Screening complete, awaiting Interro ops manual review. |
| Approved | All persons verified, screening passed. |
| Denied | Screening failed, final rejection. |
| Returned for Corrections | Sent back to applicant with correction guidance. |
| Partially Verified | Multi-person flow: some persons verified, others pending. |
| Expired | Session exceeded 30-day TTL without completion. |

#### Story E1.1 — Types & mock data
**As a** developer, **I want** verification session types and seed data, **so that** the index and detail views render realistic content.
- **AC1:** New types added to `src/types/index.ts`: `VerificationSession`, `SessionPerson`, `PathType = "solo" | "joint" | "entity"`, `SessionStatus` (10 values above), `PersonRole = "primary" | "co_holder" | "ubo" | "control_person"`, `PersonVerificationBadge` (8 values, see E2), `SessionTimelineEntry`. Reuse `Address`, `ControlPerson`, `UBO`, `DocumentUpload` where they fit.
- **AC2:** Person/entity fields are grounded in `interro_client_onboarding_fieldsv1.md`: entity identity (legal name, DBA, principal address, EIN / non-US tax id + issuing country, file/registration number, country/state of registration), authorized reps (name, title, email, phone, photo ID), UBOs/control persons (name, DOB, residential address, ownership %, role/control function, SSN/non-US ID, photo ID), account purpose/profile, screening acknowledgments.
- **AC3:** `src/lib/mock-data.ts` seeds at least: 2 Solo, 2 Joint, 3 Entity sessions, spanning a variety of the 10 statuses, multiple organizations, and including persons with each of the 8 verification badges. Entity sessions include `recommendedItemIds` per person to seed EDD later (E3).
- **AC4:** `typecheck` and `lint` pass.

#### Story E1.2 — Session index (list view) (PD-141 §1.1)
**As an** ops user, **I want** a filterable, sortable, paginated table of all sessions, **so that** I can find any verification quickly.
- **AC1 — Columns (verbatim):** Organization name; Path type (Solo, Joint, Entity); Primary applicant name; Session status; Person count; Persons verified count (X of N); Date created; Date submitted (if applicable).
- **AC2 — Filters (verbatim):** Organization (dropdown, multi-select — tenant within Delio from which KYC was completed); Path type (Solo, Joint, Entity); Session status (multi-select); Date created (specific date); Date submitted (specific date); Primary applicant name (free text); Free-text search across applicant name and organization name.
- **AC3:** Default sort is most-recently-created first; columns are sortable.
- **AC4:** Table is paginated.
- **AC5 (Given-When-Then):** *Given* sessions across multiple orgs, *when* I select an Organization in the multi-select and a Session status, *then* only matching rows show and the result count updates.
- **AC6:** Mirrors the Applications page layout/tokens; each row links to `/admin/verifications/[id]`.

#### Story E1.3 — Session detail view (PD-141 §1.2)
**As an** ops user, **I want** a complete session detail view, **so that** I can review identity, persons, entity info, KYC status, and history.
- **AC1 — Header:** Organization name, verification type (Solo/Joint/Entity), creation date, last activity date, current status (status badge).
- **AC2 — Primary applicant section:** first name, last name, email, phone, DOB, SSN/tax ID — **masked by default with a reveal toggle for authorized users**; full address (country, state/province, street, apt/suite, city, postal code); step-by-step progress indicator showing completed steps.
- **AC3 — Additional persons section (Joint & Entity only):** Joint co-holders show name, email, phone, DOB, address, verification status badge, verification link status (sent / not sent / completed / expired). Entity associated parties show name, email, roles (UBO / Control Person), DOB, SSN (masked), address, verification status badge, verification link status. Each person is expandable to full detail.
- **AC4 — Entity information section (Entity only):** country of registration, state (if US), entity name, file number.
- **AC5 — KYC status:** all persons and entities reflect their KYC status (from the mocked KYC microservice).
- **AC6 — Timeline / audit log:** chronological log of all session events (creation, step completions, document uploads, submissions, screening results, state changes, corrections requested, admin interventions). Each entry timestamped and attributed — system, end user, or admin user.
- **AC7:** Uses tabbed layout consistent with the Applications detail page; reveal toggle reuses the existing masking pattern.

**E1 story count: 3**

---

### EPIC E2 — Multi-Person Flow Coordination (PD-145)

**Goal:** Track and manage verification across multiple persons in Joint and Entity sessions — per-person status, link lifecycle management, and an aggregate progress indicator. **Depends on E1.**

#### E2.0 Per-person verification badges (PD-145 §5.1) — the 8 badge meanings

| Badge | Meaning |
|---|---|
| Not Started | No link generated; biographical data not yet entered by primary. |
| Link Sent | Standalone link delivered via email or copied by primary user. |
| In Progress | Link opened; verification underway. |
| Approved | IDV complete, screening passed. |
| Denied | IDV complete, screening failed. |
| Under Review | Screening complete, pending manual decision. |
| Error | IDV or screening encountered a provider error. |
| Expired | Standalone link expired (72-hour TTL) before completion. |

#### Story E2.1 — Per-person status tracking (PD-145 §5.1)
**As an** ops user, **I want** detailed per-person status, **so that** I can see exactly where each person is.
- **AC1:** Each person row shows name, email, phone, role (primary, co-holder, UBO, control person).
- **AC2:** Phase 1 status — biographical data entered (yes / no).
- **AC3:** Phase 2 status — verification link: generated → sent (email / copied) → opened → completed → result.
- **AC4:** Verification status badge per person, using the 8 badges in E2.0 (rendered via the shared `Badge` component with appropriate variants).
- **AC5:** Timestamp shown for each status transition.

#### Story E2.2 — Verification link management (PD-145 §5.2)
**As an** ops user, **I want** to manage each person's verification link, **so that** I can correct delivery problems.
- **AC1:** View the standalone verification link for any additional person.
- **AC2:** Resend the link via email (simulated send).
- **AC3:** Generate a new link if the previous expired or was invalidated.
- **AC4:** Invalidate / revoke an active link (e.g. sent to wrong email).
- **AC5 (Given-When-Then):** *Given* a person with an Expired badge, *when* I click "Generate new link", *then* the badge returns to "Link Sent" and the action is appended to the session audit trail.
- **AC6:** All link actions are logged in the session audit trail.

#### Story E2.3 — Aggregate progress indicator (PD-145 §5.3)
**As an** ops user, **I want** an at-a-glance progress summary, **so that** I know how close a multi-person session is to done.
- **AC1:** Shows "X of Y persons verified."
- **AC2:** Color-coded — green when all verified; yellow when partially verified; red when any denied.
- **AC3:** Visible in **both** the session index list (the "Persons verified (X of N)" column reflects the color state) and the session detail view.

**E2 story count: 3**

---

### EPIC E3 — EDD from Detail (port `app-edd` + bent entry)

**Goal:** Natively port the EDD prototype (Console POV A: A2/A3/A4; Recipient POV B: B0–B4) into admin, entered from the session detail view (A1 bent away), with the outcome written back to the session timeline. **Depends on E1 + E2.**

#### Story E3.1 — Port the EDD request object, catalog & in-memory store
**As a** developer, **I want** the EDD data model and item catalog ported into admin, **so that** both POVs share one in-memory store.
- **AC1:** EDD request object ported with fields `id`/`token`, `caseId`, `subjectType`, `subjectName`/`flaggedParty`/`context`, `items[]`, `recipient {type: gp|lp, name, email, firm?}`, `note`, `status (draft → sent → in_progress → submitted → completed)`, `submission {values, files, submittedAt}`, `outcome (Approved | Escalate)`, `history[]`.
- **AC2:** Catalog ported from `app-edd/src/data/eddItemTypes.js` as data (documents + form fields, grouped by category); the 14 catalog items are preserved. Adding an item remains a data change.
- **AC3:** A dedicated in-memory store (new context/provider or new keys), **isolated from** the Applications `requestEddOnApplication` scaffolding. Follows the `demo-state.tsx` localStorage pattern.
- **AC4:** `typecheck` / `lint` clean; no console errors.

#### Story E3.2 — Bent entry: Initiate EDD from session detail
**As an** ops user, **I want** to start EDD from a session/person, **so that** the session IS the case (no separate queue).
- **AC1:** Entity/Joint detail shows an "Initiate EDD" button next to each person; Solo detail shows a single session-level "Initiate EDD" button.
- **AC2 (Given-When-Then):** *Given* an Entity session, *when* I click "Initiate EDD" next to a UBO, *then* a new EDD request is seeded (`caseId`=session id + person id, `subjectType`=individual, subject/context from the person/org, `recommendedItemIds` pre-selected) and I land on the Build screen (A2).
- **AC3:** For an entity-level subject, `subjectType`=entity and the entity name/context seed the request.
- **AC4:** A1 (standalone case queue) is not built; there is no case-discovery surface.

#### Story E3.3 — A2 Build the EDD request
- **AC1:** Alloy review summary shown — outcome (Manual Review), risk score, run date, and the reasons Alloy flagged the account.
- **AC2:** Item picker shows the full catalog grouped by category; recommended items pre-selected and badged "Alloy-recommended"; running count shown; each item shows label, kind tag (Upload vs Form field), one-line description.
- **AC3:** At least one item required to continue; officer can add beyond and remove recommended items.

#### Story E3.4 — A3 Choose recipient & send
- **AC1:** Two recipient cards — General Partner ("The GP receives the link and collects the documents from their LP.") and Limited Partner ("The investor receives the link directly and uploads their own documents."), each showing the contact.
- **AC2:** Optional note to recipient; summary of subject, item count, recipient, delivery address.
- **AC3:** Exactly one recipient must be selected.
- **AC4:** "Send collection link" generates a tokenised link (`https://{client}.interro.co/edd/{token}`), records the send in history, sets status → sent, opens A4.

#### Story E3.5 — A4 Request detail & tracking
- **AC1:** Header with subject + current status pill; collection link with copy-to-clipboard, recipient, delivery address.
- **AC2:** Requested-items list annotated with fulfilment state once a submission exists (✓ filename / answered value, else "Awaiting upload/response").
- **AC3:** Activity timeline from history (created → link sent → opened → submitted → EDD re-run).
- **AC4:** State-dependent actions: while sent/in_progress an "Open as recipient" affordance (jumps to POV B with this request active); when submitted "Run EDD in Alloy" (→ Approved) and "Escalate for review" (→ Escalate); when completed shows outcome and notes the cleared status returns to the SaaS client.
- **AC5:** On completion/escalation the outcome is **written back to the verification session timeline** and the person's badge updates.

#### Story E3.6 — POV B collection flow (B0–B4)
- **AC1 — B0:** Friendly empty state when no request is active.
- **AC2 — B1 Intro:** shield icon, "Additional information needed", recipient-aware copy (GP vs LP variants), optional firm note, "What we'll ask for" preview checklist with document-vs-question count, "Get started" → B2.
- **AC3 — B2 Data drop:** progress bar with one segment per item; one block per item rendered by kind — Document (drag-and-drop / choose, multiple files, removable pills, accepts JPG/PNG/HEIC/WEBP/PDF), Text/long-text, Select, Yes/No; live "{completed}/{total} complete" counter; all items required; missing items show inline errors.
- **AC4 — B3 Review & submit:** read-back of every item; "Submit securely" shows a brief transmit state, records submission (status → submitted), advances to B4; "Go back & edit" preserves answers.
- **AC5 — B4 Confirmation:** success message; if the officer has since re-run EDD and the request is completed, shows "Verification complete — your onboarding can continue."
- **AC6:** Rendered in the embeddable mobile frame with "Powered by Interro" footer, reusing existing component styling/tokens.

#### Story E3.7 — End-to-end loop wired to the session
- **AC1 (Given-When-Then):** *Given* a seeded EDD request from a session person, *when* the officer sends the link, opens as recipient, completes B1–B3, returns to A4 and clicks "Run EDD in Alloy", *then* status flips submitted → completed/Approved, the person badge updates to Approved, and the session timeline records the EDD re-run outcome — all in one in-memory sitting.

**E3 story count: 7**

---

### EPIC E4 — Return for Corrections (PD-144)

**Goal:** Let ops return a session to the applicant for corrections with a reason and optional emailed link, recording a distinct status. **Depends on E1.**

#### Story E4.1 — Return-for-corrections trigger & modal
**As an** ops user, **I want** to return a session for corrections, **so that** an applicant can fix human-error data and resubmit.
- **AC1:** Session detail view has a "Return for Corrections" button.
- **AC2:** Clicking it opens a confirmation modal before any action is taken (the modal is the final confirmation step; nothing is enacted until confirm).
- **AC3:** Modal contains a **required** free-text reason field, with subtext explaining this is the text the applicant will see when filling out KYC/KYB again; confirm is disabled until non-empty.
- **AC4:** Modal contains a checkbox to deliver the verification link to the applicant's email.
- **AC5 (Given-When-Then):** *Given* the email checkbox is unchecked, *then* the email input is greyed out and not editable; *when* checked, *then* the email input becomes editable and is pre-loaded with the email the applicant entered during their session.

#### Story E4.2 — Apply returned status, log, and (simulated) email
**As an** ops user, **I want** confirming the return to record state and notify the applicant, **so that** the session reflects the correction request.
- **AC1:** On confirm, the session moves to the distinct **"Returned for Corrections"** status (one of the 10 status values) and shows in index + detail.
- **AC2:** If the email checkbox was checked, a (simulated) email containing the verification link is recorded as sent.
- **AC3:** The return event, reason text, and (if applicable) email send are appended to the session audit timeline (attributed to the admin user).
- **AC4 (demo note):** The applicant-side pre-fill, prominent reason display, and re-do-IDV behavior are documented as the intended embeddable behavior; in this admin demo the focus is recording the returned state, reason, and link send. The reason text is retained on the session so it can be surfaced to the applicant surface.

**E4 story count: 2**

---

### EPIC E5 — Operational Reporting & Data Export (PD-146)

**Goal:** Export filtered session data as CSV — session-level and per-person — with PII-permission gating and an export audit log. **Depends on E1 (per-person export also uses E2 data).**

#### Story E5.1 — Session-level CSV export (PD-146 §6.1)
**As an** ops user, **I want** to export the filtered session list, **so that** I can report off it.
- **AC1:** "Export" affordance on the session index exports the **filtered** rows (respects all active filters — organization, path type, status, date range, search).
- **AC2 — CSV columns (verbatim):** Session ID; Organization name; Organization ID; Path type; Joint account type (if applicable); Primary applicant: first name, last name, email, phone, DOB, full address; SSN/Tax ID (**included only if the ops user has PII export permission; otherwise the column is excluded entirely**); Session status; Date created, date submitted, date last activity; Screening result (primary applicant); Person count, persons verified count; Link to session detail in admin UI.
- **AC3 (Given-When-Then):** *Given* a user without PII export permission, *when* they export, *then* the SSN/Tax ID column is absent from the CSV (not blanked).

#### Story E5.2 — Multi-person CSV export (PD-146 §6.2)
**As an** ops user, **I want** a per-person export for Joint/Entity sessions, **so that** each person is one row.
- **AC1:** Separate export option for Joint/Entity sessions producing **one row per person** (not per session).
- **AC2 — Additional columns:** person role (primary, co-holder, UBO, control person), person name, email, DOB, verification status, screening result.
- **AC3 — Entity-specific columns:** entity name, entity country, entity file number.

#### Story E5.3 — Export audit trail (PD-146 §6.3)
**As a** compliance lead, **I want** every export logged, **so that** PII handling is auditable.
- **AC1:** Every export action logs: date, ops user, filter criteria applied, row count exported.
- **AC2:** Exports containing PII (SSN, DOB, full addresses) are flagged in the audit log.
- **AC3 (demo note):** Audit entries are kept in the in-memory store and viewable; no backend persistence required.

**E5 story count: 3**

---

## 8. Story count summary

| Epic | Ticket(s) | Stories | Depends on |
|---|---|---|---|
| E1 — Foundation: session index + detail | PD-141 | 3 | — (Milestone 1, build first) |
| E2 — Multi-person coordination | PD-145 | 3 | E1 |
| E3 — EDD from detail (port `app-edd`) | EDD flow + locked decisions | 7 | E1 + E2 |
| E4 — Return for corrections | PD-144 | 2 | E1 |
| E5 — Reporting & export | PD-146 | 3 | E1 |
| **Total** | | **18** | |

---

## 9. Assumptions, constraints & risks

- **Assumption:** "Organization" = the tenant within Delio from which the KYC was completed; mock data carries an org id + name per session.
- **Assumption:** Screening, link delivery, and EDD re-run are simulated (timeout-flip), consistent with the existing demo.
- **Constraint:** No backend/persistence beyond localStorage demo store; in-memory state must survive a single demo sitting and reset cleanly.
- **Constraint:** Must reuse existing tokens/components; lint + typecheck clean; no console errors.
- **Risk — EDD collision:** New Verifications EDD must not reuse or interfere with `requestEddOnApplication` on Applications. *Mitigation:* isolated store/keys; documented in §3 and E3.1.
- **Risk — Next.js API drift:** repo warns its Next.js may differ from training data. *Mitigation:* consult `node_modules/next/dist/docs/` before introducing new framework APIs (NFR4).
- **Risk — Scope creep on PD-144 applicant surface:** the applicant-side embeddable re-do is out of scope for this admin demo; only the admin-side return action/state/log is in scope (E4.2 AC4).
