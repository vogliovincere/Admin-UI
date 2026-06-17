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

1. **Legal Entity Being Verified** *(leftmost)* — the name of the subject being verified:
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
4. **Primary Applicant** — display logic varies by session type:
   - **Solo / Joint:** the primary applicant's full name (existing behavior: `persons[0]`).
   - **Entity:** the **Control Person's full name**, if one exists; if there is no
     Control Person, fall back to the **first UBO attached to the business**. If
     neither exists, the cell may be blank. *(See A2.3 requirements ticket A3.)*
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
- For a Solo session, the Legal Entity Being Verified column shows the applicant's
  name while the Organization Environment column shows the **sending org** (these
  are distinct values).

### A.2.3 Filters
The system shall provide:
- **Organization Environment** — multi-select dropdown of sending tenants.
- **Path type** — Solo, Joint, Entity.
- **Session status** — multi-select.
- **Date created** — specific-date filter.
- **Date submitted** — specific-date filter.
- **Primary applicant name** — free text.
- **Free-text search** — the search box shall match across **all** of the following:
  - Primary applicant name.
  - Organization Environment name.
  - Legal Entity Being Verified value (including combined Joint names).
  - **All associated persons' names** attached to the session: co-holders (Joint),
    UBOs, and Control Persons (Entity). A search term that matches any UBO or
    Control Person's name shall surface that session in results.
  > This means a compliance user can find an entity session by typing any associated
  > person's name, not only the primary applicant or legal entity name.

### A.2.4 Sorting & pagination
- The system shall allow sorting by the sortable columns and shall paginate the
  list. Default sort is created-date descending.

---

## A.3 — Verifications Detail View

> Supersedes the prior PD-141 §1.2 detail view. Folds in A2 (solo display), A3
> (removed progress / new fields), and A4 (retained affordances).

### A.3.1 Header
- The system shall show, as the detail header title, the **Legal Entity Being Verified**:
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

### A.3.4 Overview tab — Entity Information (Entity sessions only)

> **Ticket A4.** The separate "Entity Info" tab is **removed** for Entity sessions.
> Its content — entity information fields — is now surfaced directly within the
> **Overview tab** for Entity sessions.

- For **Entity sessions**, the Overview tab shall display the following **Entity
  Information** section (in addition to the session summary/header already there):
  - Legal name
  - DBA (if present)
  - Tax ID (masked) and issuing country
  - File / registration number
  - Country of registration
  - State of registration (if US entity)
  - Principal address
- The **standalone "Entity Info" tab shall not exist** for Entity sessions.
- **Solo and Joint** Overview tab behavior is unchanged; no Entity Information
  section appears for those session types.

### A.3.5 Additional persons (Joint and Entity only)

> **Ticket A5.** Link-management actions are gated on submission state.

- **Joint:** co-holders with name, email, DOB, address, verification status badge,
  and verification-link status (sent / opened / completed / expired / revoked).
- **Entity:** associated parties with name, email, role (UBO / Control Person), DOB,
  SSN (masked), address, verification status badge, link status.
- Each person shall be expandable to full detail.
- SSN / Tax ID shall be shown only once the person has begun verification (data
  entered); otherwise blank.
- Control persons shall be labeled simply "Control Person."
- **Link-management actions (Generate link / Send / Resend) — submission gate.**
  Once a person has **submitted** their information, the **"Generate link"** and
  **"Send / Resend link"** actions for that person shall be **hidden or disabled**
  and shall not be available. A person is considered submitted when any of the
  following is true:
  - Their standalone verification link is marked **completed**; or
  - Their per-person badge is **Under Review**, **Approved**, or **Denied**
    (any post-submission state).
  
  For persons who have not yet submitted (badges: Not Started, Link Sent, In
  Progress, Expired), link-management actions remain available as before.

### A.3.6 Entity information (Entity flow only) — MOVED

> The entity information fields formerly described in this section have been
> **moved to the Overview tab** (see A.3.4 above). This section is retained as a
> cross-reference to avoid ambiguity.

- The system shall show legal name, DBA (if present), tax ID (masked) and issuing
  country, file/registration number, country of registration, state of registration
  (if US), and principal address — **displayed within the Overview tab for Entity
  sessions** (A.3.4), not in a separate "Entity Info" tab.

### A.3.7 Retained per-person & session affordances
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
| Manual Review | Screening complete, routed to a manual-review queue (Alloy `underReview`); the point at which ops initiate EDD. |
| Approved | All persons/parties verified, screening passed. |
| Denied | Any party denied — a single blocked party blocks the account. |
| Partially Verified | Multi-person: some parties verified, others still in flight or lapsed. |
| Expired | Session exceeded its TTL / only lapsed parties remain without completion. |

> **Renamed.** The former **"Pending Review"** status is now **"Manual Review"**
> (the state in which ops typically initiate EDD).
>
> **Removed statuses.** "Returned for Corrections" is **no longer a session status**
> and has been removed from the model entirely. There is likewise **no "Data
> Correction Needed" (`dataCorrectionNeeded`) status** — correction loops are not
> part of this model.

#### A.4.2.1 Status sourcing — all per-person/entity statuses come from the KYC microservice

Every per-person and per-entity (KYB) status shown in the Verifications tab is
**grabbed directly from the KYC microservice** — the microservice is the single
source of truth for an individual party's status; the admin UI reflects it and never
invents one. The microservice emits exactly these statuses:

| KYC microservice status | Meaning | UI display |
| --- | --- | --- |
| documentsPending | Verification created; PII accepted and pre-signed upload URLs issued. Awaiting document uploads and the explicit `/submit`. Auto-expires after 72h (3 days) if never submitted/cancelled. | In Progress |
| pending | `/submit` called; accepted and queued for processing. | Submitted |
| inProgress | Actively processed by data vendors through Alloy. | Screening In Progress |
| underReview | All vendor checks completed but routed to a manual-review queue in Alloy; a compliance reviewer must adjudicate before a terminal status. | **Manual Review** |
| error | A downstream vendor/service failure during processing; client can `/retry`. | Error |
| success | Approved (auto-approved straight from inProgress, or after a reviewer approves). Eligible for payments. | Approved |
| denied | Denied; blocked from payments. From auto-denial rules or a manual-review denial. | Denied |
| cancelled | Explicitly cancelled by the client via `/cancel` while in documentsPending. Terminal — no recovery. | Cancelled |
| expired | Auto-expired after 3 days in documentsPending without submit/cancel. Terminal — no recovery. | Expired |

> **Manual Review = EDD entry point.** `underReview` (displayed as **"Manual
> Review"**) is the state in which ops initiate Enhanced Due Diligence.
> **No** `dataCorrectionNeeded` and **no** "Returned for Corrections" exist anywhere.

#### A.4.2.2 Joint-account & entity status is *deduced* from its parties

A **solo** session has one party, so its session status is that party's microservice
status (mapped above). A **joint** session (primary + co-holders) and an **entity**
session (the business/KYB record + UBOs + control persons) have multiple parties and
no single microservice status, so the session status is **inferred from the
collection** of its parties' statuses via this precedence ladder — first matching
rule wins, exhaustive over the nine statuses:

1. **Any party `denied` → Denied.** A single blocked party (e.g. a sanctioned UBO or rejected co-holder) blocks the entire account; nothing overrides a denial.
2. **Else any party `underReview` → Manual Review.** Any party awaiting manual adjudication holds the whole account for review — and is where EDD is initiated.
3. **Else any party `error` → (surfaced as the account still in screening).** A vendor/service failure on any party leaves the account undecidable until ops `/retry`; the error stays visible on the offending party.
4. **Else all parties `success` → Approved.** The account clears only when *every* party passes.
5. **Else at least one party `success` (mixed with in-flight/lapsed parties) → Partially Verified.** Some parties are done while others are not — the defining multi-party state.
6. **Else any party `documentsPending` → In Progress.** No party is done and at least one still owes documents — the account is still being assembled (bottleneck = the least-complete party).
7. **Else any party `pending` → Submitted.** All parties submitted; at least one queued, none screening yet.
8. **Else any party `inProgress` → Screening In Progress.** At least one party actively screening.
9. **Else all `cancelled` → Abandoned; otherwise → Expired** (only lapsed parties remain, no successes).

The ladder is ordered **most-blocking first** (Denied → Manual Review → Error), then
the **all-clear** (Approved) and **mixed** (Partially Verified) states, then the
**in-flight** stages reported at the *least-complete* party (the real bottleneck),
then **terminal-incomplete** states. (`abandoned` from inactivity and session-level
`expired` from the 30-day TTL are time-based and take precedence over the in-flight
rungs.) See `deriveSessionStatus` in architecture-verifications §1.2 for the exact
algorithm.

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
- **Submission gate:** the Generate link, Send, and Resend actions are unavailable
  (hidden or disabled) once a person has submitted. See A.3.5 for the full
  definition of "submitted" and per-badge conditions.

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

## A.8 — Global RBAC: Verifications tab access

> **Ticket G1.**

- The system shall require the **"Compliance" RBAC role** for a user to even
  **view the Verifications tab** in the admin navigation.
- Users without the Compliance role shall not see or be able to navigate to the
  Verifications tab. The tab shall not be rendered or accessible to non-Compliance
  roles.
- **Implementation note:** enforcing this RBAC gate is a **separate ticket** and has
  **no demo impact** in the current build. The current demo may render the
  Verifications tab without RBAC enforcement; this requirement documents the
  intended production behavior for a future ticket.

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

### B.1.2 "KYC Status" banner (replaces "Alloy decision" banner)

> **Ticket B1.** Renames and respecifies the decision banner shown to the compliance
> person on the "Build the EDD request" (Step 1) screen.

- The system shall **relabel** the banner currently titled "Alloy decision" to
  **"KYC Status."**
- The system shall **remove the timestamp / run date** (the "· run \<date\>" text)
  from this banner. No timestamp or point-in-time run indicator shall appear on the
  banner.
- The **KYC Status value** shown in this banner is the **current status of the
  verification in the KYC Microservice**, retrieved live from the KYC Microservice
  API at the time the compliance person opens the EDD kickoff step — it is **not** a
  stored point-in-time decision from a previous run.
- In the demo (no live backend), the KYC Status value shall be mocked in-memory to
  simulate a live retrieval; the requirement records that in production it comes from
  a KYC Microservice API call.

### B.1.3 "Alloy tags" card (renamed)
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

### B.1.4 Requestable item catalog
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

### B.1.5 Custom Ask
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

### B.2.4 Generate link — lock on items editing, timeline entry, and cancel/regenerate

> **Ticket B2 (generate → timeline) and Ticket B3 (cancel/regenerate).**

**Generate link — edit lock (existing requirement, unchanged)**
- The system shall provide a **"Generate link"** action on the Step 2 screen that
  produces the secure collection link to be delivered to the recipient.
- Once the link has been generated on this screen, the **"Edit items" control shall
  become disabled and non-actionable** — the admin cannot change the requested items
  after the deliverable link exists.
- Sending the collection link delivers the already-generated link.

**Generate link — timeline entry (Ticket B2)**
- When the compliance person activates **"Generate link,"** the system shall append
  a timestamped timeline entry **"Link generated by [admin user]"** to the
  verification timeline.
- **Placement rule:**
  - **Solo / Joint sessions:** the entry is appended to the **individual person's
    timeline**.
  - **Entity sessions:** the entry is appended to **both** the entity (business /
    KYB) timeline **and** the individual person's timeline.

**Cancel link and regenerate (Ticket B3)**
- The system shall provide a **"Cancel link"** action that cancels the currently
  generated collection link.
- Cancelling the link shall **re-enable editing of the requested items** (the "Edit
  items" control becomes active again).
- After cancellation, the compliance person may activate **"Generate link"** again
  to produce a new collection link with a potentially different item set.
- **Timeline entries for cancel and regenerate:**
  - When the link is **cancelled**, the system shall append a timestamped entry
    **"Link cancelled by [admin user]"** to the verification timeline.
  - When a **new link is subsequently generated**, the system shall append a
    timestamped entry **"New link generated by [admin user]"** to the verification
    timeline.
  - Both entries follow the **same entity/individual placement rule** as the initial
    "Link generated" entry (i.e. for Entity sessions, both entity and individual
    timelines receive the entry; for Solo/Joint, the individual's timeline only).

## B.3 — End-user collection flow (kept in `app-edd` style)

- The recipient flow shall follow: **intro → data drop / upload + fields → review →
  confirmation**, keeping the `app-edd` visual style.
- The flow shall be reachable via the **interro.co** link (B.0).
- A **demo preview** ("see what the end user will see") shall be available for
  demonstration purposes; per B.0 this surface is **not part of the Admin Portal**.
- Per B.2.2, the collection intro shall **not** show a "Note from firm" block.

### B.3.1 Post-submission confirmation screen — "what happens next"
- After the recipient submits their information, the system shall display a
  **confirmation screen** whose content is **exactly and exclusively** the following —
  no other copy, sections, or next-step instructions shall appear beyond the
  confirmation heading:

  1. The documents will be routed to the user's entity in **Alloy**.
  2. An email will be sent to **Interro compliance personnel** containing the link to
     the entity within Alloy.
  3. EDD review will occur within Alloy.

- These three bullet points are the **entire content** of the post-submission page
  (aside from the confirmation heading itself). No other text, panels, or calls to
  action shall be present on this screen.
- The compliance person's note (B.2.2) is **never shown to the recipient** on this
  screen or anywhere else in the collection UI — this remains consistent with the
  existing rule.
- The recipient collection UI otherwise retains its existing **interro.co visual
  presentation** (`app-edd` style) throughout, including on this confirmation screen.

---

## Implementation epics & acceptance criteria

> Build order: Epics A-* (Admin Console) can ship in full before Epics B-* (EDD
> Workflow). The only cross-link is the "Initiate EDD" button (A-VER-2 → B-EDD-*).

### Epic A-VER-1 — Verifications index (columns, rename, search)
- **AC1 (column order).** *Given* the index, *when* it renders, *then* columns are,
  left→right: Legal Entity Being Verified, Path Type, Organization Environment,
  Primary Applicant, Status, Persons, Verified, Created, Submitted.
- **AC2 (legal-entity-being-verified value).** *Given* a Solo row, *then* col 1
  shows the applicant's full name; *given* a **Joint** row, *then* col 1 shows the
  **comma-separated names of the persons being verified** (never blank); *given*
  Entity, the entity legal name. No standalone "Entity Name" column remains. The
  column header reads **"Legal Entity Being Verified"** (ticket A1).
- **AC3 (rename org column).** *Given* the index, *then* the "Organization" column
  header reads "Organization Environment" and shows the sending tenant.
- **AC4 (search — broad scope).** *Given* the search box, *when* the user types,
  *then* results match against: primary applicant name; Organization Environment
  name; Legal Entity Being Verified value (including combined Joint names); **and
  all associated persons' names** (co-holders, UBOs, Control Persons) attached to
  each session (ticket A2).
- **AC5 (primary applicant — entity fallback).** *Given* an Entity session row,
  *then* the Primary Applicant column shows the **Control Person's full name** if
  one exists; if no Control Person exists, it shows the **first UBO's full name**;
  if neither exists the cell may be blank. *Given* Solo/Joint rows, *then* existing
  behavior (`persons[0]`) is unchanged (ticket A3).

### Epic A-VER-2 — Verifications detail (header, fields, removed progress, affordances)
- **AC1 (solo header).** *Given* a Solo session detail, *then* the header title is
  the applicant's name (not the org); header reads "Legal Entity Being Verified" as
  the labeled concept; Organization Environment appears as a labeled field.
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
- **AC7 (entity overview absorbs entity info — ticket A4).** *Given* an Entity
  session, *when* the user opens the **Overview tab**, *then* the following Entity
  Information fields are displayed within Overview: legal name, DBA (if present),
  tax ID + issuing country, file/registration number, country of registration, state
  of registration (if US), principal address. *And* there is **no separate "Entity
  Info" tab** in the navigation for Entity sessions.
- **AC8 (solo/joint overview unchanged).** *Given* a Solo or Joint session, *then*
  the Overview tab does not gain an Entity Information section and behaves as before.
- **AC9 (link actions hidden for submitted persons — ticket A5).** *Given* a person
  whose badge is Under Review, Approved, or Denied, **or** whose link is completed,
  *then* the "Generate link," "Send link," and "Resend link" actions for that person
  are **not available** (hidden or disabled). *Given* a person whose badge is Not
  Started, Link Sent, In Progress, or Expired, *then* link-management actions remain
  available.

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

### Epic A-VER-5 — Global RBAC: Verifications tab access (ticket G1)
- **AC1 (compliance role required).** *Given* a user without the "Compliance" RBAC
  role, *then* the Verifications tab is **not visible and not navigable** for that
  user.
- **AC2 (compliance role grants access).** *Given* a user with the "Compliance" RBAC
  role, *then* the Verifications tab is visible and accessible.
- **AC3 (demo / separate ticket note).** This RBAC gate is a **separate ticket** and
  has **no demo impact** in the current build. The current demo build is not required
  to enforce this gate; the AC is recorded here for the production implementation.

### Epic B-EDD-1 — EDD console restyle + kickoff (Step 1)
- **AC1 (restyle).** *Given* the admin EDD pages, *then* they match the Admin
  Console (Tailwind/Interro) look.
- **AC2 (recommended removed).** *Given* step 1, *then* no "Alloy-recommended"
  badges appear.
- **AC3 (no risk score).** *Given* step 1, *then* no risk score appears (banner or
  elsewhere).
- **AC4 (KYC Status banner — ticket B1).** *Given* step 1, *then* the decision
  banner is labeled **"KYC Status"** (not "Alloy decision"), contains **no
  timestamp or run-date text**, and displays the **current verification status as
  retrieved from the KYC Microservice** (mocked in-memory for the demo). No stored
  point-in-time decision value is used.
- **AC5 (alloy tags card).** *Given* step 1, *then* the card above "request these
  items" is titled "Alloy tags" and shows 4 attribute tags (individuals: Name, DOB,
  Address, SSN; entities: Legal Name, Formation/Incorporation Date, Registered
  Address, Tax ID), each Match (green) / No match (red), with no descriptions, and
  following the global tag rule.
- **AC6 (catalog present).** *Given* step 1, *then* all catalog items in B.1.4 are
  selectable, grouped by category.
- **AC7 (custom ask).** *Given* step 1, *when* the admin adds a Custom Ask choosing
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
- **AC4 (generate link — edit locked).** *Given* the Step 2 screen, *when* the admin
  activates "Generate link," *then* the secure collection link is produced **and** the
  "Edit items" control becomes disabled and non-actionable immediately; the admin
  cannot alter the requested item set after the link exists. *And* sending the
  collection link delivers that already-generated link.
- **AC5 (generate link — timeline entry, ticket B2).** *Given* "Generate link" is
  activated, *then* a **"Link generated by [admin user]"** timestamped entry is
  appended to: the individual person's timeline (Solo/Joint); **and** both the entity
  (KYB) timeline and the individual person's timeline (Entity sessions).
- **AC6 (cancel link re-enables editing, ticket B3).** *Given* a link has been
  generated, *when* the compliance person activates "Cancel link," *then* the
  collection link is cancelled **and** the "Edit items" control becomes active again.
- **AC7 (cancel — timeline entry, ticket B3).** *Given* "Cancel link" is activated,
  *then* a **"Link cancelled by [admin user]"** timestamped entry is appended to the
  verification timeline, following the same entity/individual placement rule as AC5.
- **AC8 (regenerate — timeline entry, ticket B3).** *Given* a new link is generated
  after a cancellation, *then* a **"New link generated by [admin user]"** timestamped
  entry is appended to the verification timeline, following the same placement rule.

### Epic B-EDD-3 — End-user collection port (interro.co surface)
- **AC1 (flow + style).** *Given* the collection flow, *then* it follows intro →
  data drop/fields → review → confirmation in the `app-edd` style.
- **AC2 (hosted, not in admin).** *Given* the collection surface, *then* it is
  conceptually reachable via interro.co and is not exposed as an admin screen.
- **AC3 (preview).** *Given* the demo, *then* a preview of the end-user experience is
  available for demonstration, separate from the admin portal.
- **AC4 (post-submission confirmation content).** *Given* the recipient has submitted
  their information, *then* the confirmation screen displays **exactly three bullet
  points** as the "what happens next" content — (1) documents routed to the entity in
  Alloy, (2) email sent to Interro compliance personnel with the Alloy entity link,
  (3) EDD review occurs within Alloy — and **no other copy, sections, or next steps**
  appear beyond the confirmation heading. The compliance person's note is never shown
  to the recipient. The screen retains the interro.co (`app-edd`) visual style.
