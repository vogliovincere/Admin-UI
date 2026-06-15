# Enhanced Due Diligence (EDD) Collection Flow — MVP Functional Requirements

**Version:** 1.0
**Date:** June 2026
**Author:** Marco — Product, iAltA Payments
**First client:** Delio
**Status:** MVP definition for review with the wider team

---

## Purpose

This document defines the MVP for the **Enhanced Due Diligence (EDD) collection flow** within Interro's embeddable verification platform.

EDD is the process that runs when an account has completed standard KYC/KYB but Alloy's decisioning routes it to **manual review** because *additional documentation is required* before the subject can be cleared. Today this hand-off is manual and ad-hoc. The MVP gives Interro's compliance team a structured way to (a) say exactly what is needed, (b) collect it from the right person, and (c) feed it back into Alloy — without building bespoke forms per case.

This is derived directly from the product whiteboards (Scenario 1.1 "No EDD" and Scenario 1.2 "EDD") and adopts **Drew's recommended approach**:

> *"A generic input form / data drop that is informed by what we determine is needed within Alloy. Delio can decide to send the link to the GP or directly to the LP."*

The MVP must be **viable and quick to build**, reusing the existing embeddable UI (React + Vite, design tokens, Alloy journey/document APIs) wherever possible.

---

## Background: where EDD sits in the journey

The whiteboards model a Limited Partner (LP) being KYC'd through the Interro embeddable UI as part of a capital call on a SaaS platform (e.g. Delio).

**Scenario 1.1 — No EDD (happy path):**

1. SaaS user (investor) receives a capital call on the platform.
2. SaaS asks Interro for the KYC status of the account → Interro returns *Not Started*.
3. SaaS starts the Interro SDK; the user fills out KYC.
4. Interro routes the information to Alloy; Alloy (plus manual review if necessary) returns **Verified**.
5. SaaS receives the status update and initiates payment. Done.

**Scenario 1.2 — EDD (this document):**

Steps 1–4 are identical **until Alloy's manual review concludes that more documentation is needed from the investor**. At that point:

5. Interro performs manual review and determines **more documentation is needed from the investor**.
6. Interro contacts the SaaS client, **letting them know which documents are needed**.
7. The SaaS client either routes the request to the **GP**, who gathers it from the **LP** — or the link goes **directly to the LP**.
8. The investor supplies the additional documentation.
9. The new information flows back to Interro, which **collects it and re-runs EDD** in Alloy.

The MVP productises steps 5–9.

### Actors & glossary

| Term | Who | Role in EDD |
|---|---|---|
| **Interro** | Us | The verification/compliance provider. Operates the Compliance Console and the embeddable collection UI. |
| **SaaS client** | e.g. Delio | Interro's customer; the platform the investor transacts on. Decides whether the link goes to the GP or the LP. |
| **GP** (General Partner) | The fund manager / SaaS client's customer | May receive the collection link and gather documents from their investor. |
| **LP** (Limited Partner) | The investor / end user | The subject of due diligence. May receive the collection link directly. |
| **Alloy** | Decisioning engine | Runs KYC/KYB and EDD evaluations; its review output determines which items are needed. |

---

## Scope

### In scope (MVP)

- A **Compliance Console** view for the Interro team to initiate, configure, send, track, and resolve EDD requests.
- An **EDD Collection flow** — an embeddable, mobile-framed surface the recipient opens from a link, presenting a **generic input form / data drop** for exactly the requested items.
- A **shared catalog of requestable items** (documents + form fields) covering the common EDD asks, from which Alloy review findings pre-select a recommended subset.
- **Recipient routing**: send the collection link to the **GP** or **directly to the LP**.
- **Status tracking** across the request lifecycle, and a **re-run EDD** action that returns the outcome to the SaaS client.

### Out of scope (MVP — noted for later)

- Real email/SMS delivery of links (the MVP generates the link and records the send; delivery is stubbed).
- Authentication of the recipient at the link (magic-link/OTP) — assumed handled by the host/session in production.
- Bi-directional messaging / back-and-forth requests for clarification (single round-trip in MVP).
- Automatic mapping of Alloy review codes → required items (MVP uses a curated recommendation per case; the rules engine comes later).
- Document OCR / automated extraction or adjudication. A human compliance officer reviews and triggers the re-run.
- Persistent backend storage. The MVP demo holds state in-memory to prove the flow end-to-end.

---

## Two points of view

The MVP is intentionally two surfaces backed by one EDD request object.

### POV A — Interro Compliance team (initiation & resolution)

The compliance officer's job: turn an Alloy "needs more docs" verdict into a precise, sent request, then close it out.

### POV B — End user: LP or GP (collection)

The recipient's job: open a link, see plainly what's being asked and why, drop in the documents / answer the questions, and submit — with minimum friction.

---

## The EDD request object

A single object links both points of view. Fields:

| Field | Description |
|---|---|
| `id` / `token` | Request identifier and the opaque token embedded in the collection link. |
| `caseId` | The originating Alloy-flagged case. |
| `subjectType` | `individual` or `entity`. |
| `subjectName` / `flaggedParty` / `context` | Who/what is being diligenced and the business context (e.g. capital call, fund). |
| `items[]` | The requested item ids (subset of the catalog) — the contents of the data drop. |
| `recipient` | `{ type: 'gp' | 'lp', name, email, firm? }` — who the link was sent to. |
| `note` | Optional free-text message shown to the recipient. |
| `status` | `draft → sent → in_progress → submitted → completed`. |
| `submission` | The recipient's responses: `{ values{}, files{}, submittedAt }`. |
| `outcome` | Result of the re-run EDD (`Approved` / `Escalate`). |
| `history[]` | Append-only activity log driving the tracking timeline. |

### Status lifecycle

```
draft ──(officer sends link)──▶ sent ──(recipient opens)──▶ in_progress
      ──(recipient submits)──▶ submitted ──(officer re-runs EDD in Alloy)──▶ completed
```

---

## The requestable-item catalog

The catalog is the backbone of Drew's "generic input form." Each item is either a **document** (renders an upload / data-drop zone) or a **form field** (text, long-text, single-select, or yes/no). Items are grouped only for picker convenience.

| Item | Kind | Category |
|---|---|---|
| Source of funds — evidence | Document | Source of funds & wealth |
| Source of funds — written explanation | Field (long text) | Source of funds & wealth |
| Source of wealth — statement | Document | Source of funds & wealth |
| Recent bank statement | Document | Source of funds & wealth |
| Estimated net worth | Field (select) | Source of funds & wealth |
| Additional government-issued ID | Document | Identity & address |
| Proof of address | Document | Identity & address |
| Occupation & employer | Field (text) | Identity & address |
| Ownership / control structure chart | Document | Corporate / entity |
| Certificate of incorporation | Document | Corporate / entity |
| Audited financial statements | Document | Corporate / entity |
| Purpose of the investment | Field (long text) | Risk & compliance |
| Expected activity & volume | Field (long text) | Risk & compliance |
| PEP declaration | Field (yes/no) | Risk & compliance |

**Requirement:** The catalog is data-driven and extensible — adding an item is a data change, not new screens. Each Alloy-flagged case carries a `recommendedItemIds` set; opening a case pre-selects those items so the request is "informed by what we determine is needed within Alloy."

---

## POV A — Compliance Console: screen-by-screen

### A1 — EDD queue

- Lists accounts that completed standard verification but were routed to **Manual Review** by Alloy and need EDD.
- Each row: subject name, flagged party, business context, an Alloy **risk score**, and a *Manual review* status pill.
- A second section lists **EDD requests** already created, with their current status pill (Link sent / In progress / Submitted / Completed).
- **AC:** Selecting a queue case opens the Build screen (A2). Selecting an existing request opens its detail (A4).

### A2 — Build the EDD request

- **Alloy review summary**: outcome (Manual Review), risk score, run date, and the **reasons Alloy flagged the account** (e.g. "Beneficial owner linked to a higher-risk jurisdiction", "Source of funds not evidenced").
- **Item picker**: the full catalog, grouped by category. Items Alloy recommended are **pre-selected** and badged *Alloy-recommended*. The officer can toggle any item on/off; a running count is shown.
- Each item shows its label, a kind tag (*Upload* vs *Form field*), and a one-line description.
- **AC:** At least one item must be selected to continue. The officer can add items beyond Alloy's recommendation and remove recommended ones.

### A3 — Choose recipient & send

- **Recipient choice** — two cards (this is Drew's GP-vs-LP routing):
  - **General Partner** — shows the GP contact (name, firm, email). Helper: *"The GP receives the link and collects the documents from their LP."*
  - **Limited Partner (investor)** — shows the LP contact. Helper: *"The investor receives the link directly and uploads their own documents."*
- **Optional note** to the recipient (shown on the collection intro).
- **Summary** of subject, item count, recipient, and delivery address.
- **Send collection link** generates a tokenised link (`https://{client}.interro.co/edd/{token}`), records the send in the request history, sets status → **sent**, and opens the request detail (A4).
- **AC:** Exactly one recipient is selected. Sending creates the request and the link.

### A4 — Request detail & tracking

- Header with subject and current **status pill**.
- **Collection link** with copy-to-clipboard, plus the recipient and delivery address.
- **Requested items** list, each annotated with its fulfilment state once a submission exists (e.g. ✓ filename, or the answered value; otherwise "Awaiting upload/response").
- **Activity timeline** built from the request history (created → link sent → opened → submitted → EDD re-run).
- **State-dependent actions:**
  - While *sent* / *in_progress*: an **"Open as recipient"** affordance (in the demo this jumps to POV B with this request active; in production the recipient opens it from their email).
  - When *submitted*: **"Run EDD in Alloy"** (→ outcome *Approved*) and **"Escalate for review"** (→ outcome *Escalate*).
  - When *completed*: shows the outcome and notes that Interro returns the updated status to the SaaS client so onboarding can resume (e.g. proceed to payment).

---

## POV B — EDD Collection flow: screen-by-screen

Rendered in the embeddable mobile frame, reusing the existing component styling and "Powered by Interro" footer. Theming follows the host (same token/theme system as the KYC flows).

### B0 — No active link (demo affordance)

- If no request is active, the frame shows a friendly empty state directing the user to create/send one from the Compliance Console.

### B1 — Intro

- Shield icon, heading **"Additional information needed"**, and recipient-aware copy:
  - **To a GP:** *"To finish verifying your investor {LP name} for {context}, we need a few additional items. You can upload them here on their behalf, or forward this link to them."*
  - **To an LP:** *"To finish verifying you for {context} with {firm}, we need a few additional documents. This is a standard enhanced due-diligence check."*
- Optional **note from the firm** (if provided in A3).
- **"What we'll ask for"** — a preview checklist of every requested item (icon, label, description) and a count of documents vs questions.
- **Get started** → B2.

### B2 — Provide the requested items (the data drop)

- A **progress bar** with one segment per item; segments fill as items are completed.
- One block per requested item, rendered by kind:
  - **Document** → drag-and-drop / choose upload zone supporting **multiple files**, each shown as a removable file pill. Accepts JPG/PNG/HEIC/WEBP/PDF.
  - **Text / long-text field** → input / textarea with placeholder guidance.
  - **Select field** → dropdown of defined options.
  - **Yes/No field** (e.g. PEP) → two selectable options with explicit labels.
- A live **"{completed}/{total} complete"** counter; each completed item shows a ✓.
- **Review & submit** validates that every requested item is fulfilled; missing items show inline errors.
- **AC:** All requested items are required in the MVP. The recipient cannot submit an incomplete data drop.

### B3 — Review & submit

- Read-back of every item (filenames for documents, values for fields) in the existing review-field style.
- **Submit securely** shows a brief transmit state, then records the submission (status → **submitted**) and advances to B4.
- A **Go back & edit** option returns to B2 with answers preserved.

### B4 — Confirmation

- Success state: *"Information submitted — your documents have been sent securely to Interro's compliance team for review. You'll be notified once the review is complete."*
- If the officer has since re-run EDD and the request is *completed*, the screen instead reads *"Verification complete — your onboarding can continue."*

---

## End-to-end demo loop

The two surfaces share one in-memory store so the flow is demonstrable in one sitting:

1. **Console A1** → pick a flagged case (e.g. *Acme Holdings LLC*).
2. **A2** → review Alloy's reasons; the recommended items are pre-checked; adjust if desired.
3. **A3** → choose **GP** or **LP**, add a note, **Send**.
4. **A4** → copy the link / **Open as recipient**.
5. **B1–B3** → the recipient sees exactly the requested items, drops in documents, answers questions, submits.
6. **A4** → status flips to **Submitted**; the officer reviews the returned items and clicks **Run EDD in Alloy** → **Completed / Approved**.
7. Interro returns the cleared status to the SaaS client, mirroring Scenario 1.1's resume-to-payment ending.

---

## Non-functional & integration requirements

- **Reuse first.** Build on the existing embeddable UI: React 19 + Vite, the shared design-token/theme system, the upload/review/terminal component patterns, and the existing Alloy journey + `uploadEntityDocument` utilities. No new design language.
- **Embeddable & themable.** The collection flow renders inline in the host (iframe at `{client}.interro.co`) and honours the host's theme, identical to the KYC flows.
- **Data-driven catalog.** New requestable items are added as data, not code/screens.
- **Auditability.** Every state change appends to the request history; the timeline is the source of truth for tracking.
- **Security (production).** Collection links must be tokenised, expiring, and recipient-authenticated; uploads transit Interro and attach to the Alloy entity; no document bytes are exposed to the browser beyond the upload. (Demo stubs delivery and auth.)
- **Privacy.** EDD documents are sensitive; access is limited to the compliance team and the intended recipient.

---

## Mapping to Drew's recommendation

| Drew's note | How the MVP delivers it |
|---|---|
| "Generic input form / data drop" | One catalog-driven collection surface (B2) renders any mix of document uploads and form fields — no per-case bespoke screens. |
| "Informed by what we determine is needed within Alloy" | Each Alloy manual-review case carries `recommendedItemIds`; A2 pre-selects them from the Alloy review findings. |
| "Delio can decide to send the link to the GP or directly to the LP" | A3 offers an explicit GP-vs-LP recipient choice; the link and recipient are recorded on the request. |

---

## Demo / prototype

A working prototype implementing both points of view lives in [`app-edd/`](./app-edd). Run it with:

```bash
cd app-edd
npm install
npm run dev
```

Use the top-bar switcher to move between the **Compliance Console** and the **Collection (Recipient)** view, and **Reset demo** to start over.
