# Applications — Functional Requirements

> **Living document.** Functional requirements for the **Applications** feature of
> the Interro KYC-UI demo. This is a demo app backed by in-memory mock data with no
> backend; fidelity of UI and flow is what matters. Requirements are written as
> testable "The system shall…" statements grouped by feature. Implementers (dev
> agents) build against this document; QA verifies against the acceptance criteria
> at the end.

## What "Applications" means in this demo

The demo has **two cooperating points of view**:

1. **Client View** — an applicant (a prospective client of the GP/tenant) fills out
   their **onboarding / verification**. The entity filling this out is referred to,
   in our system architecture, as an **"Application."** This is the data-collection
   surface where the applicant supplies business info, control persons, beneficial
   owners, bank account, etc.
2. **Interro Admin View** — once a Client-View submission exists, the **Interro
   team** interacts with that submission through the **admin portal**: they review
   what the applicant submitted, view the KYC/KYB/AML results that come back from
   Alloy, and take the limited set of admin actions described below (e.g. requesting
   EDD, account closure).

This document is therefore **split into two parts**:

- **Part 1 — Interro Admin View** (the `/admin/applications` index and the
  `/admin/applications/[id]` detail view).
- **Part 2 — Client View** (the applicant onboarding surface).

**Scope:** the Applications index/table, the Application detail view (Admin View),
and the applicant onboarding surface (Client View).

**Out of scope:** Verifications and the EDD workflow internals — see
`kyc-ui-admin-requirements.md` (Section A — Admin Console, Section B — EDD
Workflow). Notifications requirements live in `requirements-notifications.md`.

---

## GLOBAL RULE — Alloy decisioning & tags (applies everywhere Alloy results appear)

> **This rule is global.** It applies anywhere in the product — Applications,
> Verifications, EDD — that depicts an Alloy result.

- **All KYC / KYB / AML decisioning and rendering of documentation occurs in
  Alloy.** The Interro admin view does **not** make or override decisions; it simply
  **renders the KYC status and the relevant tags received in the response from
  Alloy.**
- **Tags are payload-driven.** The tags shown for any subject are exactly the tags
  associated with the **data-payload response received from Alloy** for that
  subject — nothing is invented client-side.
- **Tags appear only for these statuses.** Tags shall be present **only if** the
  status is one of:
  - **Manual Review**
  - **Submitted**
  - **Approved**
  - **Denied**
  - **Enhanced Due Diligence**

  For any other status, no Alloy tags are shown.

---
---

# PART 1 — INTERRO ADMIN VIEW

The admin portal surfaces the applicant's submission and the Alloy results. There is
**no admin-side approve/deny** — decisioning lives entirely in Alloy (see global
rule). The admin's actions are limited to: reviewing data, requesting EDD, and
(for Admin-role users only) initiating account closure.

## 1A. Index / Table

### 1A.1 Clickable rows
- The system shall make the **entire table row** clickable; clicking anywhere on a
  row shall navigate to that application's detail view
  (`/admin/applications/[id]`).
- The system shall preserve keyboard/affordance accessibility: the legal-name cell
  may remain a focusable link, but navigation shall no longer be limited to the name
  link only — any point on the row navigates.
- The row shall present a pointer cursor and a hover state to signal that it is
  clickable.

### 1A.2 Application-ID display removed from rows
- The system shall **remove the gray application-ID text** currently shown beneath
  the legal name in each row.
- After removal, no application ID shall be visible within the index table rows.

### 1A.3 Application-ID search retained
- The system shall continue to match the free-text search box against **both** the
  application's **legal name** and its **application ID**, even though the
  application ID is no longer displayed in the row (per 1A.2).
- This requirement is explicit: removing the displayed ID (1A.2) shall **not**
  remove ID matching from search. A search term that matches an application ID shall
  return that application.
- The search placeholder may continue to read "Search by name or ID…".

### 1A.4 KYC status & tags on the index
- The system shall render the application's **KYC status** as received from Alloy.
- Any tags shown in the index follow the **global Alloy-tag rule**: payload-driven,
  and present only for statuses Manual Review / Submitted / Approved / Denied /
  Enhanced Due Diligence.

---

## 1B. Detail View — Removed Fields & Sections

The system shall **remove the following entirely** from the Application detail view
(both UI rendering and any supporting labels/sections):

- 1B.1 **Phone number** (business phone) — removed from the Business Information
  section.
- 1B.2 **Description** (business description) — removed from the Business
  Information section.
- 1B.3 **DBA** (doing-business-as) — removed from the Business Information section.
- 1B.4 **Documents tab** — the entire "Documents" tab and its panel
  (uploaded-documents list) shall be removed from the detail view. No navigation
  affordance for Documents shall remain.

> **Note — Entity Type is RE-INTRODUCED.** Entity Type is **not** removed. Because
> everything the client fills out in Client View must be viewable in Admin View
> (see 1F), Entity Type is shown in the detail view. (It was previously removed; it
> is now brought back.)

> Remaining Business Information fields (e.g. Legal Name, EIN, State of
> Incorporation, Industry, Address, Entity Type) are unaffected by this section
> unless otherwise stated.

---

## 1C. No admin-side Approve / Deny

- 1C.1 The system shall **remove the Approve and Deny buttons** from the application
  detail view.
- 1C.2 The system shall **remove the rectangle/container** that previously housed
  those Approve/Deny buttons. No empty container or layout gap shall remain.
- 1C.3 There is **no admin-side approve/deny** of an application. Decisioning occurs
  in Alloy and the admin view only renders the resulting KYC status (global rule).

---

## 1D. Account Balance Placement

- 1D.1 The system shall display the **Account Balance only within the Overview tab**
  of the detail view.
- 1D.2 The system shall **not** render Account Balance as its own tab, nor as a
  persistent sidebar card, nor on any tab other than Overview.
- 1D.3 (Reference to current behavior) Today the balance is shown as a right-column
  sidebar card when the application is approved; the requirement is that the balance
  instead appears inside the Overview tab content. Whether it is shown only for
  approved applications or always may follow existing data availability, but its
  **location** shall be the Overview tab.

---

## 1E. Alloy Results Tab — Entity Alloy Status, tags & EDD entry

- 1E.1 The system shall show, in the main card of the **Alloy Results** tab, the
  **Alloy status of the entity** (the KYC/KYB decision status for the application's
  subject — e.g. Approved, Denied, Manual Review, Submitted, Enhanced Due
  Diligence).
- 1E.2 The system shall present this status as a clearly labeled field/badge,
  alongside the **tags from the Alloy payload** (per the global rule — present only
  for the five qualifying statuses).
- 1E.3 The system shall record that, **in production**, this entity Alloy status and
  its tags are obtained via the **KYC Microservice / Alloy API**; **in this demo**
  the value is **mocked in-memory** and rendered as if it were the live decision.
- 1E.4 **"Request EDD" button — Alloy Journey Results.** The Alloy Results tab shall
  contain a rectangle titled **"Alloy Journey Results"**, and a **"Request EDD"**
  button shall live **inside that rectangle**.

---

## 1F. Client-submitted data must be viewable in Admin View

Everything the applicant fills out in **Client View** must be viewable in the Admin
detail view. In particular:

- 1F.1 **Entity Type** shall be re-introduced and shown (see 1B note).
- 1F.2 **Control-person title/role label** shall be re-introduced — each control
  person shall display their **title / role label** (e.g. "CFO", "Managing Member")
  as captured in Client View.
- 1F.3 Any other field the applicant supplies in Client View (business info,
  beneficial owners, bank account details, etc.) shall be viewable in the detail
  view.

---

## 1G. Persons — per-person card, KYC status, tags & EDD entry

- 1G.1 Each person (Control Person / Beneficial Owner) shall be shown as a **card**
  in the Persons tab, displaying their identity data, their **KYC status from
  Alloy**, and the **Alloy payload tags** (per global rule).
- 1G.2 **"Request EDD" button — per-person card.** A **"Request EDD"** button shall
  live **inside each person's card**.
- 1G.3 Control persons shall display their **title / role label** (see 1F.2).

---

## 1H. Request EDD — recipient selection screen (new, distinct)

- 1H.1 When EDD is initiated from an **Application's onboarding** (via the per-person
  card or the Alloy Journey Results rectangle), the screen on which the Interro user
  chooses **who to send the EDD request to** is a **distinct/new screen**, separate
  from the existing Verifications EDD recipient flow (Section B of
  `kyc-ui-admin-requirements.md`).
- 1H.2 **Purpose of this screen.** It lets the Interro user select the recipient of
  the EDD request for an **Application** (e.g. the relevant person/contact on the
  application, or the responsible party), and confirm before the request is sent.
  Because Applications and Verifications are different surfaces with different
  subject data, this is a separate screen rather than reusing the verifications
  recipient flow.

---

## 1I. Bank Account Verification card (Socure)

The bank-account / Socure card in the detail view has the following requirements:

- 1I.1 **Risk score RE-INTRODUCED.** The numeric **risk score** shall be **brought
  back** for the **bank-account / Socure card specifically**. (It was previously
  removed; for this card it is re-introduced.) This is the one place a numeric score
  is reinstated.
- 1I.2 **Remove the "ACH Debit Available" tag** from the card.
- 1I.3 **Name-match tag.** The tag displayed in the card's **"Socure Account
  Intelligence"** section shall be the one pertaining to the **NAME MATCH** from
  Socure Account Intelligence.

---

## 1J. Account closure — Admin RBAC only

- 1J.1 **Only the Admin RBAC role** shall be able to **initiate account closure**.
- 1J.2 **Only the Admin RBAC role** shall even **see the account-closure button.**
  For all other roles the button is not rendered (not merely disabled).

---

## 1K. Return for Corrections — REMOVED

- 1K.1 The **entire "Return for Corrections" flow is removed** from Applications:
  all buttons, statuses, modals, and any mentions. The workflow has been scrapped
  for this demo (CCO decision).
- 1K.2 No Application status, badge, label, or audit event shall reference "Return
  for Corrections" / "Returned for Corrections." All such references have been
  scrubbed from this document.

---

## 1L. System Transactions tab — disabled

- 1L.1 The **"System Transactions"** tab in the admin navigation shall be **grayed
  out / inaccessible** (currently disabled). The affordance may remain visible but
  shall not be clickable/navigable.

---

## 1M. Global RBAC: Applications tab access

> **Ticket G1.**

- 1M.1 The system shall require the **"Compliance" RBAC role** for a user to even
  **view the Applications tab** in the admin navigation.
- 1M.2 Users without the Compliance role shall not see or be able to navigate to the
  Applications tab. The tab shall not be rendered or accessible to non-Compliance
  roles.
- 1M.3 **Implementation note:** enforcing this RBAC gate is a **separate ticket** and
  has **no demo impact** in the current build. The current demo may render the
  Applications tab without RBAC enforcement; this requirement documents the intended
  production behavior for a future ticket.

---
---

# PART 2 — CLIENT VIEW (Applicant Onboarding)

The Client View is the surface where the applicant (the "Application" entity) fills
out their onboarding/verification before the Interro team reviews it in the Admin
View.

## 2A. Purpose & relationship to Admin View

- 2A.1 The Client View is the **data-collection surface** for an Application. The
  applicant supplies business information, control persons, beneficial owners, bank
  account, and any other onboarding data.
- 2A.2 **Every field captured in Client View must be viewable in the Admin detail
  view** (mirrors 1F). In particular, **Entity Type** and each control person's
  **title / role label** are captured here and surfaced in Admin View.

## 2B. Data captured (Client View)

- 2B.1 **Entity Type** — captured and persisted; shown in Admin View.
- 2B.2 **Control persons** — name, **title / role label**, and identity data.
- 2B.3 **Beneficial owners** — identity data and ownership information.
- 2B.4 **Bank account** — bank-account details that feed the Socure / Bank Account
  Verification card in Admin View (name-match and risk score per 1I).
- 2B.5 Remaining business information fields (Legal Name, EIN, State of
  Incorporation, Industry, Address, etc.).

## 2C. Decisioning is NOT in Client View

- 2C.1 No KYC/KYB/AML decision is rendered or made in Client View. The submission is
  sent onward; **all decisioning occurs in Alloy** and is surfaced in the Admin View
  (global rule).

## 2D. Return for Corrections — REMOVED (Client View)

- 2D.1 There is **no Return-for-Corrections** experience in Client View. The applicant
  is never sent back "for corrections" via this scrapped workflow. All such
  references are removed (mirrors 1K).

---
---

## Implementation epics & acceptance criteria

### Epic APP-1 — Index table: clickable rows, ID display, ID search, KYC status
- **AC1 (rows clickable).** *Given* the Applications index, *when* the user clicks
  any cell of a row (not just the name), *then* the app navigates to that
  application's detail view.
- **AC2 (hover/cursor).** *Given* the index, *when* the user hovers a row, *then*
  the row shows a hover state and a pointer cursor.
- **AC3 (ID hidden).** *Given* the index, *when* rows render, *then* no
  application-ID text appears under the legal name (or anywhere in the row).
- **AC4 (ID search works).** *Given* the search box, *when* the user types a string
  that matches an application ID, *then* the matching application appears in the
  filtered results, even though the ID is not displayed.
- **AC5 (name search unaffected).** *Given* the search box, *when* the user types a
  legal-name substring, *then* matching applications still appear.
- **AC6 (KYC status + tag rule).** *Given* the index, *then* the KYC status from
  Alloy is shown; *and* any tags shown appear only when status is one of Manual
  Review / Submitted / Approved / Denied / Enhanced Due Diligence, and are exactly
  the payload tags.

### Epic APP-2 — Detail view: removed fields, Documents tab, re-introduced fields
- **AC1 (fields gone).** *Given* the detail Overview, *when* Business Information
  renders, *then* Phone, Description, and DBA are absent.
- **AC2 (entity-type present).** *Given* the detail view, *then* **Entity Type is
  shown** (re-introduced).
- **AC3 (Documents tab gone).** *Given* the detail view, *when* tabs render, *then*
  no "Documents" tab exists and there is no route/panel for it.
- **AC4 (no orphan references).** *Given* the removed fields, *when* the page
  renders, *then* no empty labels, dangling dt/dd pairs, or layout gaps remain.
- **AC5 (control-person title present).** *Given* a control person, *then* their
  **title / role label** is displayed.

### Epic APP-3 — No admin-side Approve/Deny
- **AC1 (buttons gone).** *Given* the detail view, *then* there are **no Approve and
  no Deny buttons**.
- **AC2 (container gone).** *Given* the detail view, *then* the rectangle/container
  that housed those buttons is removed, with no empty box or gap.

### Epic APP-4 — Account Balance in Overview only
- **AC1 (Overview shows balance).** *Given* an application whose balance is
  available, *when* the user opens the Overview tab, *then* the Account Balance is
  displayed within Overview content.
- **AC2 (no sidebar/other tabs).** *Given* any tab other than Overview, *when* it
  renders, *then* no Account Balance card is shown, and no standalone Balance tab
  exists.

### Epic APP-5 — Alloy Results: status, payload tags & EDD entry
- **AC1 (status shown).** *Given* an application, *when* the user opens the Alloy
  Results tab, *then* the main card shows a labeled entity Alloy status from the
  in-memory mock.
- **AC2 (tag rule).** *Given* the Alloy Results tab, *then* tags are the Alloy
  payload tags and appear only for the five qualifying statuses.
- **AC3 (production note).** *Given* this document, *then* it records that
  production obtains the status/tags via the KYC Microservice / Alloy API while the
  demo mocks them in-memory. (Doc-level AC.)
- **AC4 (EDD button in Journey Results).** *Given* the Alloy Results tab, *then* an
  "Alloy Journey Results" rectangle contains a **"Request EDD"** button.

### Epic APP-6 — Per-person cards & EDD entry
- **AC1 (person cards).** *Given* the Persons tab, *then* each person renders as a
  card showing identity data, Alloy KYC status, and payload tags (tag rule applies).
- **AC2 (EDD button in card).** *Given* a person's card, *then* it contains a
  **"Request EDD"** button.

### Epic APP-7 — Request EDD recipient screen (distinct)
- **AC1 (distinct screen).** *Given* EDD is initiated from an Application (person
  card or Alloy Journey Results), *when* the recipient-selection screen opens, *then*
  it is a **distinct/new screen** separate from the Verifications EDD recipient flow.
- **AC2 (purpose).** *Given* that screen, *then* the Interro user can choose the EDD
  recipient for the application and confirm before sending.

### Epic APP-8 — Bank Account / Socure card
- **AC1 (risk score back).** *Given* the bank-account / Socure card, *then* the
  numeric **risk score is shown** (re-introduced for this card).
- **AC2 (ACH tag removed).** *Given* the card, *then* the **"ACH Debit Available"**
  tag is **absent**.
- **AC3 (name-match tag).** *Given* the card's "Socure Account Intelligence"
  section, *then* the tag shown is the **NAME MATCH** tag from Socure Account
  Intelligence.

### Epic APP-9 — Account closure RBAC
- **AC1 (admin-only visible).** *Given* a non-Admin role, *then* the account-closure
  button is **not visible**.
- **AC2 (admin-only initiate).** *Given* the Admin role, *then* the account-closure
  button is visible and only the Admin role can initiate closure.

### Epic APP-10 — Return for Corrections removed
- **AC1 (no UI).** *Given* the Application detail view (and Client View), *then* no
  Return-for-Corrections button, status, modal, or label appears anywhere.
- **AC2 (no references).** *Given* this document and the app, *then* no mention of
  "Return for Corrections" / "Returned for Corrections" remains.

### Epic APP-11 — System Transactions tab disabled
- **AC1 (grayed out).** *Given* the admin navigation, *then* the "System
  Transactions" tab is grayed out / inaccessible (not navigable).

### Epic APP-12 — Client View captures all admin-viewable data
- **AC1 (round-trip).** *Given* an applicant completes Client View, *then* every
  field they entered (including Entity Type and each control person's title/role
  label) is viewable in the Admin detail view.
- **AC2 (no decisioning in client).** *Given* Client View, *then* no KYC/KYB/AML
  decision is rendered there.

### Epic APP-13 — Global RBAC: Applications tab access (ticket G1)
- **AC1 (compliance role required).** *Given* a user without the "Compliance" RBAC
  role, *then* the Applications tab is **not visible and not navigable** for that
  user.
- **AC2 (compliance role grants access).** *Given* a user with the "Compliance" RBAC
  role, *then* the Applications tab is visible and accessible.
- **AC3 (demo / separate ticket note).** This RBAC gate is a **separate ticket** and
  has **no demo impact** in the current build. The current demo build is not required
  to enforce this gate; the AC is recorded here for the production implementation.
