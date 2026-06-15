/* =========================================================================
   The bent EDD entry contract (architecture §6)
   -------------------------------------------------------------------------
   A single pure builder synthesizes an EddCase from a verification session
   (+ optional person). There is no static cases.js and no A1 queue — the
   session/person IS the case.
   ========================================================================= */

import type {
  ControlPerson,
  EddAlloyReview,
  EddAlloyTag,
  EddCase,
  EddRecipient,
  EddSubjectType,
  OnboardingApplication,
  PersonRole,
  SessionPerson,
  UBO,
  VerificationSession,
} from "@/types";

// ───────────────────────── recommended items by role/path ─────────────────────────

const ROLE_DEFAULT_ITEMS: Record<PersonRole, string[]> = {
  primary: ["source_of_funds_narrative", "bank_statement", "proof_of_address"],
  co_holder: ["proof_of_address", "additional_id"],
  ubo: ["ownership_chart", "source_of_funds", "audited_financials"],
  control_person: ["additional_id", "occupation", "purpose_of_account"],
};

const ENTITY_DEFAULT_ITEMS = [
  "certificate_incorporation",
  "ownership_chart",
  "audited_financials",
];

function defaultRecommendedItems(
  session: VerificationSession,
  person: SessionPerson | null
): string[] {
  // Prefer the explicitly-seeded list when present.
  const seeded = (person ?? session.persons[0]).recommendedItemIds;
  if (seeded && seeded.length > 0) return seeded;
  // Fallback by role / path.
  if (!person) {
    return session.pathType === "entity"
      ? ENTITY_DEFAULT_ITEMS
      : ROLE_DEFAULT_ITEMS.primary;
  }
  return ROLE_DEFAULT_ITEMS[person.role] ?? ROLE_DEFAULT_ITEMS.primary;
}

// ───────────────────────── alloy review synthesis ─────────────────────────

// Deterministic small hash off a string → stable per-session pseudo score.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function deriveAlloyReview(
  session: VerificationSession,
  person: SessionPerson | null
): EddAlloyReview {
  const runSource = session.submittedAt ?? session.createdAt;
  const runDate =
    (runSource || "").slice(0, 10) || new Date().toISOString().slice(0, 10);

  return {
    outcome: "Manual Review",
    runDate,
  };
}

// ───────────────────────── alloy tags synthesis (B.1.2) ─────────────────────────

// Attribute labels per subject type. 4 attributes shown at a time, each Match
// (green) / No match (red).
const INDIVIDUAL_TAG_LABELS = ["Name", "DOB", "Address", "SSN"];
const ENTITY_TAG_LABELS = [
  "Legal Name",
  "Formation Date",
  "Registered Address",
  "Tax ID (EIN)",
];

// Deterministic match/no-match per attribute, biased toward "match" with the
// occasional "no match". Derived from a stable hash of the case seed +
// attribute label so the card is stable across renders.
export function deriveAlloyTags(
  seed: string,
  subjectType: EddSubjectType
): EddAlloyTag[] {
  const labels =
    subjectType === "entity" ? ENTITY_TAG_LABELS : INDIVIDUAL_TAG_LABELS;
  return labels.map((label) => {
    // ~1 in 4 attributes is a no-match; mostly matches.
    const h = hashString(`${seed}::${label}`);
    const match = h % 4 !== 0;
    return { label, match };
  });
}

// ───────────────────────── recipient derivation ─────────────────────────

// GP contact = first authorized rep / control person of the entity (or the
// primary applicant), firm = org name.
function deriveGp(session: VerificationSession): EddRecipient {
  const control =
    session.persons.find((p) => p.role === "control_person") ??
    session.persons.find((p) => p.role === "primary") ??
    session.persons[0];
  return {
    type: "gp",
    name: `${control.firstName} ${control.lastName}`,
    email: control.email,
    firm: session.organizationName,
  };
}

// Derive ~2–3 plausible GP email addresses from the firm / control contact,
// presented as checkboxes on step 2 (B.2.1). The control rep's own address is
// always included; the rest are role addresses on the firm's domain.
function deriveGpEmails(session: VerificationSession, gp: EddRecipient): string[] {
  const emails: string[] = [];
  if (gp.email) emails.push(gp.email);

  // Build a plausible domain from the org name.
  const domain =
    `${session.organizationName}`
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "fund";

  const roleBoxes = ["compliance", "operations", "investor.relations"];
  // Pick 1–2 role boxes deterministically.
  const count = 1 + (hashString(session.id) % 2); // 1 or 2
  for (let i = 0; i < count; i += 1) {
    const box = roleBoxes[(hashString(session.id + i) % roleBoxes.length)];
    const addr = `${box}@${domain}.com`;
    if (!emails.includes(addr)) emails.push(addr);
  }
  return emails;
}

// LP = the subject person (or the primary applicant for an entity-level subject).
function deriveLp(
  session: VerificationSession,
  person: SessionPerson | null
): EddRecipient {
  const subject = person ?? session.persons[0];
  return {
    type: "lp",
    name: `${subject.firstName} ${subject.lastName}`,
    email: subject.email,
  };
}

// ───────────────────────── role labelling ─────────────────────────

function roleLabel(person: SessionPerson): string {
  switch (person.role) {
    case "primary":
      return "Primary applicant";
    case "co_holder":
      return "Co-holder";
    case "ubo":
      return `Beneficial owner${
        person.ownershipPercentage ? `, ${person.ownershipPercentage}%` : ""
      }`;
    case "control_person":
      return "Control person";
    default:
      return "Subject";
  }
}

// ───────────────────────── main builder ─────────────────────────

/* =========================================================================
   Application-flow EDD entry (distinct from the verifications path)
   -------------------------------------------------------------------------
   When EDD is initiated from an Application's onboarding, the recipient is
   NOT a GP/LP. Instead the Interro user picks among the entity's own filed
   parties — control persons and beneficial owners (and the entity itself).
   We build an EddCase the existing store understands, plus a parallel list
   of application recipients consumed by the application BuildRequest variant.
   The verifications path (buildEddCaseFromSession) is untouched.
   ========================================================================= */

export interface EddApplicationRecipient {
  id: string;
  name: string;
  email: string;
  // Human-readable role/title, e.g. "Control person · CEO" or "Beneficial owner, 30%".
  roleLabel: string;
}

export interface ApplicationEddCase extends EddCase {
  applicationRecipients: EddApplicationRecipient[];
}

function controlPersonRecipient(cp: ControlPerson): EddApplicationRecipient {
  return {
    id: cp.id,
    name: `${cp.firstName} ${cp.lastName}`,
    email: cp.email,
    roleLabel: cp.title ? `Control person · ${cp.title}` : "Control person",
  };
}

function uboRecipient(ubo: UBO): EddApplicationRecipient {
  return {
    id: ubo.id,
    name: `${ubo.firstName} ${ubo.lastName}`,
    email: ubo.email,
    roleLabel: `Beneficial owner, ${ubo.ownershipPercentage}%`,
  };
}

export function buildEddCaseFromApplication(
  app: OnboardingApplication,
  person?: ControlPerson | UBO | null
): ApplicationEddCase {
  const legalName = app.businessInfo.legalName;
  const runDate = (app.submittedAt || "").slice(0, 10) ||
    new Date().toISOString().slice(0, 10);

  const recipients: EddApplicationRecipient[] = [
    ...app.controlPersons.map(controlPersonRecipient),
    ...app.ubos.map(uboRecipient),
  ];

  // If launched from a specific person card, that person is the subject and the
  // default selected recipient; otherwise the entity is the subject.
  const subjectIsPerson = !!person;
  const subjectName = person
    ? `${person.firstName} ${person.lastName}`
    : legalName;

  // Order recipients so the launching person (if any) is first.
  const orderedRecipients = person
    ? [
        ...recipients.filter((r) => r.id === person.id),
        ...recipients.filter((r) => r.id !== person.id),
      ]
    : recipients;

  const primary = orderedRecipients[0];

  const gp: EddRecipient = {
    type: "gp",
    name: primary?.name ?? legalName,
    email: primary?.email ?? "",
    firm: legalName,
  };

  const id = person ? `${app.id}:${person.id}` : app.id;

  return {
    id,
    sessionId: app.id,
    personId: person?.id,
    subjectType: subjectIsPerson ? "individual" : "entity",
    entityName: legalName,
    subjectName,
    flaggedParty: subjectIsPerson
      ? `${subjectName} (${orderedRecipients[0]?.roleLabel ?? "Subject"})`
      : `${legalName} (Entity)`,
    context: `${legalName} — onboarding application ${app.id}`,
    saasClient: legalName,
    gp,
    gpEmails: primary?.email ? [primary.email] : [],
    lp: {
      type: "lp",
      name: primary?.name ?? legalName,
      email: primary?.email ?? "",
    },
    alloyReview: { outcome: "Manual Review", runDate },
    alloyTags: deriveAlloyTags(id, subjectIsPerson ? "individual" : "entity"),
    recommendedItemIds:
      subjectIsPerson || app.controlPersons.length === 0
        ? ROLE_DEFAULT_ITEMS.control_person
        : ENTITY_DEFAULT_ITEMS,
    applicationRecipients: orderedRecipients,
  };
}

export function buildEddCaseFromSession(
  session: VerificationSession,
  person: SessionPerson | null // null ⇒ solo / entity-level subject
): EddCase {
  const isEntitySubject = person === null && session.pathType === "entity";
  const subjectType: EddSubjectType = isEntitySubject ? "entity" : "individual";

  const subjectName = person
    ? `${person.firstName} ${person.lastName}`
    : session.entity?.legalName ??
      `${session.persons[0].firstName} ${session.persons[0].lastName}`;

  const flaggedParty = person
    ? `${subjectName} (${roleLabel(person)})`
    : `${subjectName} (Entity)`;

  const context = session.entity
    ? `${session.organizationName} — entity verification`
    : `${session.organizationName} — ${session.pathType} verification`;

  const id = person ? `${session.id}:${person.id}` : session.id;
  const gp = deriveGp(session);

  return {
    id,
    sessionId: session.id,
    personId: person?.id,
    subjectType,
    entityName: session.entity?.legalName,
    subjectName,
    flaggedParty,
    context,
    saasClient: session.organizationName,
    gp,
    gpEmails: deriveGpEmails(session, gp),
    lp: deriveLp(session, person),
    alloyReview: deriveAlloyReview(session, person),
    alloyTags: deriveAlloyTags(id, subjectType),
    recommendedItemIds: defaultRecommendedItems(session, person),
  };
}
