# Notifications — Functional Requirements

> **Living document.** Functional requirements for the **Notifications** feature of
> the Interro KYC-UI Admin Console. This is a demo app backed by in-memory mock data
> with no backend; fidelity of UI and flow is what matters. Requirements are written
> as testable "The system shall…" statements grouped by feature. Implementers (dev
> agents) build against this document; QA verifies against the acceptance criteria at
> the end.

## Status — tab is currently DISABLED

> **The Notifications tab is currently grayed-out / inaccessible in the admin
> navigation.** The affordance may remain visible in the nav but shall **not** be
> clickable/navigable in the current demo. This document exists so the **underlying
> work is preserved for later** — the requirements and the existing
> implementation are intentionally retained and not deleted, so the tab can be
> re-enabled without rebuilding from scratch.

**Scope:** the admin Notifications surface — **KYC Refresh Tracking** (risk-based
refresh cadence) and **ID Expirations** tracking.

**Out of scope:** Applications (see `requirements-applications.md`), Verifications and
the EDD workflow (see `kyc-ui-admin-requirements.md`).

> **Cross-reference.** The grayed-out state is also recorded in
> `kyc-ui-admin-requirements.md` §A.7, which points here for the preserved detail.

---

## GLOBAL RULE — Alloy decisioning & tags (applies everywhere Alloy results appear)

- **All KYC / KYB / AML decisioning occurs in Alloy.** The admin view renders the KYC
  status and the payload tags received from Alloy; it does not decide.
- The **risk-based refresh cadence** below is **driven by the risk level returned
  from Alloy**.
- Alloy payload tags, where shown, appear **only if** the status is one of: **Manual
  Review**, **Submitted**, **Approved**, **Denied**, or **Enhanced Due Diligence**.

---

## N.0 — Disabled-tab behavior (current state)

- N.0.1 The system shall present the **"Notifications"** nav entry in a **grayed-out
  / disabled** visual state.
- N.0.2 The system shall **not** navigate to the Notifications surface when the
  disabled nav entry is clicked (no route activation).
- N.0.3 The underlying Notifications implementation (KYC Refresh Tracking + ID
  Expirations) shall be **preserved** in the codebase rather than removed, so the tab
  can be re-enabled later by lifting the disabled state.

---

## N.1 — Notifications & Refresh Tracking surface

When (re-)enabled, the Notifications surface shall present a header
("Notifications & Refresh Tracking") and two sub-tabs:

- **KYC Refresh Schedule**
- **ID Expirations**

### N.1.1 Risk-based refresh cadence reference (from Alloy)
- The system shall show a reference panel of the **risk-based refresh cadence**, with
  one column per risk level — **Low / Medium / High** — sourced from the Alloy risk
  level.
- For each risk level the panel shall show: the **Refresh Cadence** (in months), the
  **Response Window** (in days), and the **Reminder schedule** (reminders at **day
  30, 50, and 59**).

## N.2 — KYC Refresh Schedule (sub-tab)

- N.2.1 The system shall display a table of refresh schedules, one row per
  organization/application, with columns: **Organization**, **Risk Level**,
  **Cadence**, **Response Window**, **Last Refresh**, **Next Refresh**, **Status**,
  **Actions**.
- N.2.2 The **Risk Level** shall be rendered as the qualitative risk-level badge (low
  / medium / high) — consistent with the risk-score policy (no numeric "/100" here).
- N.2.3 The **Status** shall be one of: **Current**, **Notified** (notification sent),
  **Overdue**, **Completed**.
- N.2.4 The **Actions** column shall offer a **"Send Reminder"** action on a schedule
  row.

## N.3 — ID Expirations (sub-tab)

- N.3.1 The system shall show an **ID Expiration Policy** note: when an ID expires,
  the individual has a hard **90-day response window** to upload a new ID, regardless
  of risk level, with reminders at **day 30, 50, and 59**.
- N.3.2 The system shall display a table of ID expirations with columns: **Person**,
  **Type** (Control Person / UBO), **Organization**, **ID Expires**, **Response
  Deadline**, **Status**, **Actions**.
- N.3.3 The **Status** shall be one of: **Valid**, **Expiring Soon**, **Expired**,
  **Renewed**.
- N.3.4 A **"Send Reminder"** action shall be available for rows whose status is
  **Expiring Soon**.

---

## Implementation epics & acceptance criteria

### Epic NOTIF-0 — Notifications tab disabled
- **AC1 (grayed out).** *Given* the admin navigation, *when* it renders, *then* the
  "Notifications" entry appears grayed-out / disabled.
- **AC2 (not navigable).** *Given* the disabled "Notifications" entry, *when* it is
  clicked, *then* no navigation to the Notifications surface occurs.
- **AC3 (work preserved).** *Given* the codebase, *then* the Notifications
  implementation (Refresh Tracking + ID Expirations) is retained, not deleted, so the
  tab can be re-enabled later.

### Epic NOTIF-1 — Refresh cadence reference (when enabled)
- **AC1 (three levels).** *Given* the surface is enabled, *when* the cadence panel
  renders, *then* Low / Medium / High columns each show Refresh Cadence (months),
  Response Window (days), and reminders at day 30/50/59.
- **AC2 (from Alloy).** *Given* the cadence reference, *then* the risk level driving
  cadence originates from the Alloy result.

### Epic NOTIF-2 — KYC Refresh Schedule (when enabled)
- **AC1 (columns).** *Given* the Refresh Schedule sub-tab, *then* the table shows
  Organization, Risk Level, Cadence, Response Window, Last Refresh, Next Refresh,
  Status, Actions.
- **AC2 (status set).** *Given* a schedule row, *then* its status is one of Current /
  Notified / Overdue / Completed.
- **AC3 (reminder).** *Given* a schedule row, *when* the user clicks "Send Reminder",
  *then* the reminder action is triggered (mocked in this demo).

### Epic NOTIF-3 — ID Expirations (when enabled)
- **AC1 (policy note).** *Given* the ID Expirations sub-tab, *then* a policy note
  states the hard 90-day response window and day 30/50/59 reminders.
- **AC2 (columns).** *Given* the sub-tab, *then* the table shows Person, Type,
  Organization, ID Expires, Response Deadline, Status, Actions.
- **AC3 (status set).** *Given* a row, *then* its status is one of Valid / Expiring
  Soon / Expired / Renewed.
- **AC4 (reminder on expiring).** *Given* a row with status "Expiring Soon", *then* a
  "Send Reminder" action is available; other statuses do not show it.
