# KYC-UI Admin — Functional Requirements

> **Living document.** This is a demo app backed by in-memory mock data with no
> backend; fidelity of UI and flow is what matters. Requirements are written as
> testable "The system shall…" statements grouped by feature. Dev agents build
> against this document; QA verifies against the acceptance criteria at the end of
> each major part.

> **Build-order note (important).** The work is organized into two independent
> top-level sections:
>
> - **Section A — Admin Console** (Applications, Verifications index/detail/timeline,
>   and the button that *initiates* the EDD workflow).
> - **Section B — EDD Workflow** (the admin EDD console restyle, kickoff, recipient
>   send, and the end-user collection surface).
>
> The **Admin Console (Section A) can be fully built and completed first** —
> including the button that initiates the EDD workflow — **before any EDD Workflow
> (Section B) work begins.** The EDD Workflow is always **initiated FROM the Admin
> Console** (the "Initiate EDD" affordance on a verification session / person).
> Section B is a separate surface and a separate build stream.

> **Related documents.** Applications-tab requirements live in
> `requirements-applications.md` (summarized in Section A.1 below). Notifications
> requirements live in `requirements-notifications.md`.

> **Risk-score policy (applies throughout).** All numeric risk scores expressed
> **out of 100** are removed from both UI and requirements in Verifications.
> Qualitative tags/badges (risk LEVEL low/med/high, "Match"/"No match", capability
> tags) may remain. Any historical "/100" language has been scrubbed from this
> document. (Note: the Applications bank-account/Socure card re-introduces a numeric
> score; that exception lives in `requirements-applications.md` and does not apply
> here.)

> **GLOBAL RULE — Alloy decisioning & tags (applies throughout).** All KYC / KYB /
> AML decisioning and rendering of documentation occurs in **Alloy**. The admin view
> only **renders the KYC status and the tags received in the response from Alloy.**
> Tags shown are exactly the tags associated with the **data-payload response
> received from Alloy**. Tags shall be present **only if** the status is one of:
> **Manual Review**, **Submitted**, **Approved**, **Denied**, or **Enhanced Due
> Diligence**. This same tag rule applies everywhere Alloy results are depicted.

---
---

# Section A — Admin Console

The Admin Console comprises the **Applications** area and the **Verifications**
area. It is fully buildable on its own. The only coupling to Section B is the
**"Initiate EDD"** button, which lives in the Admin Console and launches the EDD
workflow; that button can be wired as a stub/entry point and completed before any
Section B internals exist.

## A.1 Applications (summary; full spec in `requirements-applications.md`)

- **Two POVs:** Applications spans a **Client View** (applicant onboarding) and an
  **Interro Admin View** (review of the submission). See the full doc.
- **Decisioning in Alloy:** the admin view renders the KYC status + payload tags
  from Alloy; there is **no admin-side approve/deny** (Approve/Deny buttons and
  their container are removed).
- **Index:** the entire row is clickable; the gray application-ID text is removed;
  free-text search still matches on application **ID** and **legal name**.
- **Detail — removed:** phone number, description, DBA, and the entire **Documents**
  tab. **Entity Type is re-introduced** (everything the client fills out is viewable
  in admin), as is the control-person title/role label.
- **Request EDD** lives in each person's card and in the "Alloy Journey Results"
  rectangle of the Alloy Results tab; initiating EDD from an Application uses a
  **distinct recipient-selection screen**.
- **Bank Account / Socure card:** risk score **re-introduced** for this card; "ACH
  Debit Available" tag removed; the tag shown is the Socure **NAME MATCH** tag.
- **Account closure:** Admin RBAC role only (only Admin can see/initiate it).
- **Return for Corrections:** **removed entirely** from Applications.
- **System Transactions tab:** grayed out / disabled.

> The authoritative, testable Applications statements and their acceptance criteria
> are in `requirements-applications.md`.

---

## A.2 — Verifications Index (List View)

> Supersedes the prior PD-141 §1.1 index. Still-valid PD-141 content is preserved
> and reorganized here.

The system shall display all verification sessions across all organizations in a
filterable, sortable, paginated table. Default sort: most recently created first.

### A.2.1 Column layout (left → right)
The system shall present the index columns in this exact order:

1. **Entity Being Verified** *(leftmost)* — the name of the subject being verified:
   - **Solo:** the individual applicant's full name (e.g. "Aisha Rahman").
   - **Joint:** the **comma-separated combination of the names of the persons being
     verified** (e.g. "Aisha Rahman, David Rahman"). This cell shall **not** be blank
     for Joint sessions.
   - **Entity:** the entity legal name.
   > This column **merges and replaces** the prior standalone "Entity Name" column.
   > For Solo the cell shows the applicant's name; for Joint it shows the combined
   > person names; for Entity the entity legal name.
2. **Path Type** — Solo / Joint / Entity.
3. **Organization Environment** *(renamed from "Organization")* — see definition in
   A.2.2.
4. **Primary Applicant** — primary applicant's full name.
5. **Status** — session status (see A.4 status model).
6. **Persons** — person count.
7. **Verified** — persons verified, "X of N".
8. **Created** — date created.
9. **Submitted** — date submitted (if applicable).

### A.2.2 "Organization Environment" — definition
- The system shall rename the "Organization" column to **"Organization
  Environment."**
- **Definition:** the organization (tenant) that **sent** the KYC/KYB workflow to
  the entity being verified — i.e. the GP / tenant **environment within Delio** from
  which the verification was initiated.
- For a Solo session, the Entity Being Verified column shows the applicant's name
  while the Organization Environment column shows the **sending org** (these are
  distinct values).

### A.2.3 Filters
The system shall provide:
- **Organization Environment** — multi-select dropdown of sending tenants.
- **Path type** — Solo, Joint, Entity.
- **Session status** — multi-select.
- **Date created** — specific-date filter.
- **Date submitted** — specific-date filter.
- **Primary applicant name** — free text.
- **Free-text search** across primary applicant name and Organization Environment
  name. (Search shall also match the Entity Being Verified value, including the
  combined Joint names.)

### A.2.4 Sorting & pagination
- The system shall allow sorting by the sortable columns and shall paginate the
  list. Default sort is created-date descending.

---

## A.3 — Verifications Detail View

> Supersedes the prior PD-141 §1.2 detail view. Folds in A2 (solo display), A3
> (removed progress / new fields), and A4 (retained affordances).

### A.3.1 Header
- The system shall show, as the detail header title, the **Entity Being Verified**:
  - **Solo:** the applicant's name (e.g. "Aisha Rahman") — **not** the organization
    name.
  - **Joint:** the joint account / trust name (the combined person names appear in
    the index per A.2.1).
  - **Entity:** the entity legal name.
- The system shall show **Organization Environment** as a labeled field in the
  header/meta area (the sending tenant, per A.2.2).
- The system shall show the **Application through which the verification was
  initiated** as a labeled field; for this demo its value is always **"Delio."**
- The header shall continue to show path type, created date, last-activity date,
  and current status.

### A.3.2 Removed: Verification Progress
- The system shall **remove the "Verification Progress" section entirely** —
  including both:
  - the primary-applicant progress steps (Overview tab), and
  - the per-person progress steps (Persons tab / expanded person cards).
- No step-by-step progress indicator shall remain in the detail view. (The
  aggregate "X of N verified" indicator from A.5.3 is **not** part of "Verification
  Progress" and may remain.)

### A.3.3 Primary applicant section
- The system shall display identity fields (first name, last name, email, DOB,
  SSN/Tax ID, address) with PII masked by default and a reveal toggle for authorized
  users.
- The system shall **NOT** display a **"Title"** field for the primary applicant.
  (Verifications surface different information than Applications; the Title field is
  removed from the primary applicant here.)
- The system shall display the KYC status from Alloy, with payload tags shown only
  for the qualifying statuses (global rule).

### A.3.4 Additional persons (Joint and Entity only)
- **Joint:** co-holders with name, email, DOB, address, verification status badge,
  and verification-link status (sent / opened / completed / expired / revoked).
- **Entity:** associated parties with name, email, role (UBO / Control Person), DOB,
  SSN (masked), address, verification status badge, link status.
- Each person shall be expandable to full detail.
- SSN / Tax ID shall be shown only once the person has begun verification (data
  entered); otherwise blank.
- Control persons shall be labeled simply "Control Person."

### A.3.5 Entity information (Entity flow only)
- The system shall show legal name, DBA (if present), tax ID (masked) and issuing
  country, file/registration number, country of registration, state of registration
  (if US), and principal address.

### A.3.6 Retained per-person & session affordances
- The system shall retain the per-person **"Initiate EDD"** affordance (and the
  session-level "Initiate EDD" for Solo). This button **initiates the Section B EDD
  Workflow** and is part of the Admin Console build.
- The system shall retain the **"Alloy Verification"** link in the session summary
  card (non-navigating in the demo).

> **Return for Corrections is removed.** The per-person and session-level "Return
> for corrections" affordances have been **removed entirely** from Verifications
> (workflow scrapped for this demo). No such button, modal, status, or mention
> remains.

---

## A.4 — Verification Status & Timeline Model

> Supersedes the prior PD-141 §1.3 status table and PD-145 §5.1 badge table.

### A.4.1 Statuses returned from Alloy
The verification statuses returned from Alloy are exactly:
- **Approved**
- **Denied**
- **Manual Review** — a non-terminal outcome that **must subsequently resolve** to
  **Approved** or **Denied**.

> **Tag rule reminder.** Per the global rule, Alloy payload tags are shown only when
> the status is one of Manual Review / Submitted / Approved / Denied / Enhanced Due
> Diligence.

### A.4.2 Session statuses (admin-facing)
The session-level status model:

| Status | Description |
| --- | --- |
| In Progress | Session created, applicant actively completing steps. |
| Abandoned | No activity for a configurable threshold; not submitted. |
| Submitted | All required data provided, awaiting screening. |
| Screening In Progress | Screening initiated, awaiting provider results. |
| Pending Review | Screening complete, awaiting manual review (maps to Alloy "Manual Review"). |
| Approved | All persons verified, screening passed. |
| Denied | Screening failed, final rejection. |
| Partially Verified | Multi-person: some persons verified, others pending. |
| Expired | Session exceeded its TTL without completion. |

> **Removed status.** "Returned for Corrections" is **no longer a session status**
> and has been removed from the model entirely.

### A.4.3 Per-person verification badges
The per-person verification badges are exactly:

| Badge | Meaning |
| --- | --- |
| Not Started | No link generated; data not yet entered. |
| Link Sent | Standalone link delivered via email or copied. |
| In Progress | Link opened; verification underway. |
| Approved | IDV complete, screening passed. |
| Denied | IDV complete, screening failed. |
| Under Review | Screening complete, pending manual decision (resolves to Approved/Denied). |
| Expired | Standalone link expired before completion. |

- **"Verification Error" removed.** The system shall **remove the "error" /
  "Verification Error" status** from the set of possible person badges/statuses
  entirely. No person shall ever display an Error badge, and "error" shall not be a
  selectable/filterable status.

### A.4.4 Timeline / audit log — general
- The system shall maintain a chronological, append-only audit timeline per session.
  Each entry shall be timestamped and attributed to **system**, **end user**, or
  **admin user**.
- For entity verifications, the system shall label "KYC" events as **"KYB"** (e.g.
  "KYB information sent to Alloy", "KYB Status returned from Alloy").
- **Manual Review resolution:** whenever a returned status is **"Manual Review"**,
  the system shall additionally record a **later** timeline event marking when the
  status becomes **"Approved"** or **"Denied."**

### A.4.5 Timeline events & statuses — enumerated per verification type

#### A.4.5.a SOLO — single timeline for the individual
**Possible timeline events (in typical order):**
1. Session Created
2. Link Sent
3. *(optional)* Link Opened
4. KYC information sent to Alloy
5. KYC Status returned from Alloy *(Approved | Denied | Manual Review)*
6. *(if Manual Review)* Status resolved → Approved **or** Denied

**Possible verification statuses:** Approved, Denied, Manual Review
(Manual Review → Approved | Denied).

#### A.4.5.b JOINT — one timeline for the primary applicant + one per additional co-holder
**Primary applicant timeline:** Session Created; Link Sent; *(optional)* Link
Opened; KYC information sent to Alloy; KYC Status returned from Alloy; *(if Manual
Review)* resolution to Approved/Denied.

**Per additional person (co-holder) timeline — for EACH co-holder:**
1. Link Sent
2. *(where applicable)* Link Opened
3. KYC information sent to Alloy
4. KYC Status returned from Alloy *(Approved | Denied | Manual Review)*
5. *(if Manual Review)* Status resolved → Approved **or** Denied

**Possible verification statuses (per person):** Approved, Denied, Manual Review.

#### A.4.5.c ENTITY / business — one timeline for the business (KYB) + events per Control Person / UBO
**Business (KYB) timeline:**
1. Session Created
2. Link Sent
3. *(optional)* Link Opened
4. KYB information sent to Alloy
5. KYB Status returned from Alloy *(Approved | Denied | Manual Review)*
6. *(if Manual Review)* Status resolved → Approved **or** Denied

**Per Control Person / UBO — for EACH associated party:**
1. Link Sent
2. Link Opened
3. KYC information sent to Alloy
4. KYC Status returned from Alloy *(Approved | Denied | Manual Review)*
5. *(if Manual Review)* Status resolved → Approved **or** Denied

**Possible verification statuses (business and each party):** Approved, Denied,
Manual Review.

> **Common event vocabulary (all types):** "Session Created"; "Link Sent"; "Link
> Opened"; "KYC information sent to Alloy" (labeled "KYB…" for entities); "KYC
> Status returned from Alloy" (labeled "KYB…" for entities); and the Manual-Review
> resolution event. "Verification Error" is **not** a valid event, and there is no
> "Returned for Corrections" event.

---

## A.5 — Multi-Person Coordination

### A.5.1 Per-person tracking
- Name, email, role (primary, co-holder, UBO, control person).
- Data entered (yes / no).
- Verification-link lifecycle: generated → sent (email / copied) → opened →
  completed → result.
- Verification status badge per person (per A.4.3 — no "error").
- Timestamp for each transition (captured via the timeline, A.4.4).

### A.5.2 Verification-link management
- View / resend / regenerate / revoke an additional person's standalone link.
- All link actions are recorded in the session timeline.

### A.5.3 Aggregate progress indicator
- The system shall show an aggregate "X of N persons verified" summary for
  multi-person sessions, color-coded (green all verified; yellow partial; red any
  denied), in both the index and the detail view.
- This aggregate indicator is distinct from the removed "Verification Progress" step
  list (A.3.2) and is retained.

---

## A.6 — Operational Reporting & Export

- The system shall export the currently-filtered session list as CSV (session
  export, one row per session) and a per-person CSV (one row per person for
  Joint/Entity).
- Exports shall respect active filters. SSN/Tax ID columns are included only with
  PII-export permission; otherwise omitted.
- Every export shall be logged (date, ops user, filters applied, row count);
  PII-containing exports shall be flagged.

---

## A.7 — Notifications tab (grayed out)

- The **"Notifications"** tab is currently **grayed out / inaccessible** in the
  admin navigation. The affordance may remain visible but shall not be
  clickable/navigable. The underlying work is preserved separately — see
  `requirements-notifications.md`.

---
---

# Section B — EDD Workflow

> **Initiated from the Admin Console.** The EDD Workflow begins when an admin clicks
> **"Initiate EDD"** on a verification session/person (Section A.3.6). Section A can
> be completed before any Section B work starts.

> **Two surfaces, two looks:**
> - The **admin-facing EDD console** (kickoff + recipient send + request tracking)
>   shall be **restyled to match the rest of the Admin Console** (Tailwind / Interro
>   look).
> - The **end-user collection surface** (what the recipient sees) keeps the
>   `app-edd` visual style.

## B.0 — End-user collection surface lives at interro.co (not in Admin)

- The system shall make the UI from which the recipient **enters information** (the
  EDD collection flow / data-drop) accessible via a hosted **interro.co** link
  (e.g. `https://{client}.interro.co/edd/{token}`).
- **This end-user collection UI is NOT viewable from the Admin Portal.** It is a
  separate surface. The Admin Portal shall not embed or route to the live collection
  experience as an admin screen.
- A **preview** of "what the end user will see" may exist for demo purposes (B.3),
  but the requirement records that the real surface conceptually lives at interro.co
  and is **not part of admin**.

## B.1 — Admin EDD kickoff page (Build Request, Step 1)

> Restyle the ported `BuildRequest` step 1 to the Admin Console look, and apply the
> following changes.

### B.1.1 Removals
- The system shall **remove all "Alloy-recommended" tags/badges** on items.
- The system shall **remove all mention of a risk score** (including the "Risk score
  N" text in the Alloy decision banner and anywhere else on the page).

### B.1.2 "Alloy tags" card (renamed)
- The system shall rename the card directly **above** the "request these items" area
  to **"Alloy tags."**
- The card shall display **match / no-match** tags for identity attributes; each
  attribute shown as either **"Match" (green)** or **"No match" (red)**:
  - **Individuals:** **Name, DOB, Address, SSN** — exactly **4 attributes shown at a
    time** (one per attribute). There are **8 possible cards** (4 attributes ×
    {Match, No match}); at any time **4 are shown**.
  - **Companies / entities:** the equivalent attributes — **Legal Name,
    Formation/Incorporation Date, Registered Address, Tax ID (EIN)** — each Match
    (green) / No match (red).
- These tags follow the **global Alloy-tag rule** (they are the tags from the Alloy
  payload, present only for the qualifying statuses).
- The system shall **not** display any explanatory description for the tags (no
  descriptive text under the tags).

### B.1.3 Requestable item catalog
The system shall offer the following catalog of requestable items (grouped by
category), each selectable for the request. `kind: document` renders an
upload/data-drop in collection; `kind: field` renders a text/textarea/select/yes-no
input.

**Source of funds & wealth (`funds`)**
- **Source of funds — evidence** — *document*
- **Source of funds — written explanation** — *field (textarea)*
- **Source of wealth — statement** — *document*
- **Recent bank statement** — *document*
- **Estimated net worth** — *field (select: Under $1M; $1M–$5M; $5M–$25M;
  $25M–$100M; Over $100M)*

**Identity & address (`identity`)**
- **Additional government-issued ID** — *document*
- **Proof of address** — *document*
- **Occupation & employer** — *field (text)*

**Corporate / entity (`entity`)**
- **Ownership / control structure chart** — *document*
- **Certificate of incorporation** — *document*
- **Audited financial statements** — *document*

**Risk & compliance (`risk`)**
- **Purpose of the investment** — *field (textarea)*
- **Expected activity & volume** — *field (textarea)*
- **Politically Exposed Person (PEP) declaration** — *field (yes/no)*

### B.1.4 Custom Ask
- The system shall let the admin add a **Custom Ask** requested item.
- For a Custom Ask the admin shall choose the type: **file upload** or **text
  field**.
- The admin shall specify the item's **name** and its **subtitle / subtitle text**.
- The custom item shall then appear among the requested items (selected) and shall
  be sent like any catalog item.

## B.2 — Admin EDD Step 2 (choose recipient & send)

### B.2.1 GP recipient — multiple emails as checkboxes
- For the **GP** recipient option, the system shall present **multiple GP email
  addresses as checkboxes**.
- The system shall require **at least one** GP email checked before the request can
  be sent (send disabled otherwise).

### B.2.2 Optional Note → into the email only
- The system shall keep the optional **Note** input on the admin send step, framed
  as text that goes **into the email** sent to the recipient.
- When a note is included, it shall be delivered **inside the email** to the
  recipient — for **both GP and LP** sends.
- The note shall **NOT** appear as a section inside the end-user collection UI. The
  system shall **remove the "Note from {firm}" block** from the collection intro
  surface. The note lives **only** in the email.

### B.2.3 Send summary
- The system shall show a summary (subject, items requested count, recipient,
  delivery email(s)) before sending and generate the collection link/token on send.

## B.3 — End-user collection flow (kept in `app-edd` style)

- The recipient flow shall follow: **intro → data drop / upload + fields → review →
  confirmation**, keeping the `app-edd` visual style.
- The flow shall be reachable via the **interro.co** link (B.0).
- A **demo preview** ("see what the end user will see") shall be available for
  demonstration purposes; per B.0 this surface is **not part of the Admin Portal**.
- Per B.2.2, the collection intro shall **not** show a "Note from firm" block.

---

## Implementation epics & acceptance criteria

> Build order: Epics A-* (Admin Console) can ship in full before Epics B-* (EDD
> Workflow). The only cross-link is the "Initiate EDD" button (A-VER-2 → B-EDD-*).

### Epic A-VER-1 — Verifications index (columns, rename, search)
- **AC1 (column order).** *Given* the index, *when* it renders, *then* columns are,
  left→right: Entity Being Verified, Path Type, Organization Environment, Primary
  Applicant, Status, Persons, Verified, Created, Submitted.
- **AC2 (entity-being-verified value).** *Given* a Solo row, *then* col 1 shows the
  applicant's full name; *given* a **Joint** row, *then* col 1 shows the
  **comma-separated names of the persons being verified** (never blank); *given*
  Entity, the entity legal name. No standalone "Entity Name" column remains.
- **AC3 (rename).** *Given* the index, *then* the "Organization" column header reads
  "Organization Environment" and shows the sending tenant.
- **AC4 (search).** *Given* the search box, *when* the user types, *then* it matches
  primary applicant, Organization Environment, and Entity Being Verified (including
  combined Joint names).

### Epic A-VER-2 — Verifications detail (header, fields, removed progress, affordances)
- **AC1 (solo header).** *Given* a Solo session detail, *then* the header title is
  the applicant's name (not the org); Organization Environment appears as a labeled
  field.
- **AC2 (application field).** *Given* any session detail, *then* an "Application"
  field reads "Delio".
- **AC3 (progress removed).** *Given* the detail view, *then* no "Verification
  Progress" step list appears (Overview or Persons); the aggregate X-of-N indicator
  may remain.
- **AC4 (no Title on primary).** *Given* the primary applicant section, *then* there
  is **no "Title" field**.
- **AC5 (affordances retained, RFC removed).** *Given* the detail view, *then*
  per-person "Initiate EDD" (and session-level for Solo) and the "Alloy
  Verification" link are present, and **no "Return for corrections" affordance
  appears** (session or per-person).
- **AC6 (initiate EDD entry).** *Given* "Initiate EDD", *when* clicked, *then* it
  launches the EDD workflow entry point (may be stubbed before Section B is built).

### Epic A-VER-3 — Status & timeline model
- **AC1 (no error status).** *Given* any person, *then* the "error"/"Verification
  Error" badge/status never appears and is not filterable.
- **AC2 (no RFC status).** *Given* the status model, *then* "Returned for
  Corrections" is **not** a session status and never appears.
- **AC3 (alloy statuses + tag rule).** *Given* a returned Alloy status, *then* it is
  one of Approved, Denied, Manual Review; *and* payload tags appear only for
  statuses Manual Review / Submitted / Approved / Denied / Enhanced Due Diligence.
- **AC4 (manual-review resolution).** *Given* a "Manual Review" outcome, *then* a
  later timeline event records resolution to Approved or Denied.
- **AC5 (solo timeline).** *Given* a Solo session, *then* the timeline contains a
  single individual timeline with the A.4.5.a events.
- **AC6 (joint timeline).** *Given* a Joint session, *then* there is a primary
  timeline plus one timeline per co-holder, each with Link Sent and (where
  applicable) Link Opened, info-sent, status-returned.
- **AC7 (entity timeline).** *Given* an Entity session, *then* there is a KYB
  business timeline plus per-Control-Person/UBO events; entity labels read "KYB".

### Epic A-VER-4 — Notifications tab disabled
- **AC1 (grayed out).** *Given* the admin navigation, *then* the "Notifications" tab
  is grayed out / inaccessible (not navigable). See `requirements-notifications.md`.

### Epic B-EDD-1 — EDD console restyle + kickoff (Step 1)
- **AC1 (restyle).** *Given* the admin EDD pages, *then* they match the Admin
  Console (Tailwind/Interro) look.
- **AC2 (recommended removed).** *Given* step 1, *then* no "Alloy-recommended"
  badges appear.
- **AC3 (no risk score).** *Given* step 1, *then* no risk score appears (banner or
  elsewhere).
- **AC4 (alloy tags card).** *Given* step 1, *then* the card above "request these
  items" is titled "Alloy tags" and shows 4 attribute tags (individuals: Name, DOB,
  Address, SSN; entities: Legal Name, Formation/Incorporation Date, Registered
  Address, Tax ID), each Match (green) / No match (red), with no descriptions, and
  following the global tag rule.
- **AC5 (catalog present).** *Given* step 1, *then* all catalog items in B.1.3 are
  selectable, grouped by category.
- **AC6 (custom ask).** *Given* step 1, *when* the admin adds a Custom Ask choosing
  file-upload or text-field and entering a name and subtitle, *then* the custom item
  appears among requested items and is sent like any item.

### Epic B-EDD-2 — Recipient & send (Step 2)
- **AC1 (GP checkboxes).** *Given* GP selected, *then* multiple GP emails appear as
  checkboxes and send is disabled until at least one is checked.
- **AC2 (note → email).** *Given* a note is entered, *when* sent (GP or LP), *then*
  the note is described as delivered inside the email; it is not shown in the
  collection UI.
- **AC3 (no note-from-firm).** *Given* the collection intro, *then* no "Note from
  firm" block renders.

### Epic B-EDD-3 — End-user collection port (interro.co surface)
- **AC1 (flow + style).** *Given* the collection flow, *then* it follows intro →
  data drop/fields → review → confirmation in the `app-edd` style.
- **AC2 (hosted, not in admin).** *Given* the collection surface, *then* it is
  conceptually reachable via interro.co and is not exposed as an admin screen.
- **AC3 (preview).** *Given* the demo, *then* a preview of the end-user experience is
  available for demonstration, separate from the admin portal.
