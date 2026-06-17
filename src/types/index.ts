export type RiskLevel = "low" | "medium" | "high";

export type OnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "edd_required"
  | "approved"
  | "denied";

export type VerificationStatus = "pending" | "verified" | "failed";

export type TransactionRail = "wire" | "ach" | "check";
export type TransactionDirection = "incoming" | "outgoing";
export type TransactionStatus = "pending" | "processing" | "settled" | "failed";

export type RefreshCadenceMonths = 12 | 24 | 36;
export type ResponseWindowDays = 60 | 90;

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface BusinessInfo {
  legalName: string;
  dba: string;
  ein: string;
  entityType: string;
  stateOfIncorporation: string;
  dateOfIncorporation: string;
  address: Address;
  phone: string;
  website: string;
  industry: string;
  description: string;
}

export interface ControlPerson {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  address: Address;
  idType: string;
  idNumber: string;
  idExpiration: string;
  idDocumentUrl?: string;
}

export interface UBO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  ownershipPercentage: number;
  dateOfBirth: string;
  ssn: string;
  address: Address;
  idType: string;
  idNumber: string;
  idExpiration: string;
  idDocumentUrl?: string;
}

export type OnboardingStatusExtended = OnboardingStatus | "closed";

export interface OnboardingApplication {
  id: string;
  status: OnboardingStatus | "closed";
  submittedAt?: string;
  updatedAt: string;
  businessInfo: BusinessInfo;
  controlPersons: ControlPerson[];
  ubos: UBO[];
  documents: DocumentUpload[];
  riskScore?: number;
  riskLevel?: RiskLevel;
  alloyJourneyId?: string;
  alloyTags?: string[];
  eddRequired: boolean;
  eddDocuments?: EDDDocument[];
  notes?: string;
  balance?: number;
  closureReason?: string;
  closedAt?: string;
}

export interface DocumentUpload {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  url: string;
}

export interface EDDDocument {
  id: string;
  label: string;
  required: boolean;
  description: string;
  uploadedFile?: DocumentUpload;
  textResponse?: string;
  submittedAt?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  routingNumber: string;
  accountNumber: string;
  holderName?: string;
  nickname?: string;
  verificationStatus: VerificationStatus;
  verificationMethod?: "plaid" | "micro_deposit";
  verifiedAt?: string;
  linkedAt: string;
  socureScore?: number;
  socureTags?: string[];
}

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Transaction {
  id: string;
  guid: string;
  amount: number;
  rail: TransactionRail;
  direction: TransactionDirection;
  status: TransactionStatus;
  dateStarted: string;
  dateSettled?: string;
  to: string;
  from: string;
}

export interface Account {
  id: string;
  organizationName: string;
  applicationId: string;
  balance: number;
  transactionsEnabled: boolean;
  users: AccountUser[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  auditLog: AuditEntry[];
  closedAt?: string;
  closureReason?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface RefreshSchedule {
  id: string;
  applicationId: string;
  organizationName: string;
  riskLevel: RiskLevel;
  cadenceMonths: RefreshCadenceMonths;
  responseWindowDays: ResponseWindowDays;
  lastRefreshDate: string;
  nextRefreshDate: string;
  notificationSentAt?: string;
  responseDeadline?: string;
  status: "current" | "notification_sent" | "overdue" | "completed";
}

export interface IDExpiration {
  id: string;
  personName: string;
  personType: "control_person" | "ubo";
  applicationId: string;
  organizationName: string;
  idExpiration: string;
  status: "valid" | "expiring_soon" | "expired" | "renewed";
  notificationSentAt?: string;
  responseDeadline?: string;
}

// ───────────────────────── Verifications (KYC) ─────────────────────────

export type PathType = "solo" | "joint" | "entity";

export type PersonRole = "primary" | "co_holder" | "ubo" | "control_person";

// PD-141 §1.3 — session statuses (string-union, stored verbatim)
export type SessionStatus =
  | "in_progress"
  | "abandoned"
  | "submitted"
  | "screening_in_progress"
  | "manual_review"
  | "approved"
  | "denied"
  | "partially_verified"
  | "expired";

// A.4.3 — the 7 per-person verification badges ("error" removed per A5).
export type PersonVerificationBadge =
  | "not_started"
  | "link_sent"
  | "in_progress"
  | "approved"
  | "denied"
  | "under_review"
  | "expired";

// Verification-link lifecycle for an additional person (PD-145 §5.2 / AC3)
export type LinkStatus =
  | "not_sent"
  | "sent" // delivered via email or copied
  | "opened"
  | "completed"
  | "expired"
  | "revoked";

// KYC microservice status reflected per person/entity (E1.3 AC5)
export type KycStatus =
  | "not_started"
  | "data_entered"
  | "screening"
  | "passed"
  | "failed"
  | "review";

export interface PersonVerificationLink {
  status: LinkStatus;
  url: string; // simulated standalone link
  sentAt?: string;
  sentVia?: "email" | "copied";
  openedAt?: string;
  completedAt?: string;
  expiresAt?: string; // 72-hour TTL (PD-145)
}

// A single completed step in the per-person progress indicator (E1.3 AC2)
export interface ProgressStep {
  label: string; // e.g. "Identity", "Address", "ID upload", "Screening"
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
  dateOfBirth: string; // raw ISO; masked at render via maskDob()
  ssn: string; // raw; masked at render via maskValue() — SSN or non-US national ID
  ssnIssuingCountry?: string; // for non-US IDs
  address: Address; // reuse existing Address
  // Entity-associated-party specifics (interro_client_onboarding_fieldsv1.md)
  title?: string; // authorized rep / control person title
  ownershipPercentage?: number; // UBO
  controlFunction?: string; // control person
  idType?: string;
  idNumber?: string; // raw; masked at render
  photoIdUploaded?: boolean;
  // Verification state
  badge: PersonVerificationBadge;
  kycStatus: KycStatus;
  biographicalDataEntered: boolean; // PD-145 Phase 1 (AC2)
  link?: PersonVerificationLink; // additional persons only
  progress: ProgressStep[];
  screeningResult?: "pass" | "fail" | "review";
  // EDD seeding (E1.1 AC3 / E3.2): curated catalog subset for this person
  recommendedItemIds: string[];
}

// Entity identity block (E1.3 AC4 + interro_client_onboarding_fieldsv1.md)
export interface EntityInfo {
  legalName: string;
  dba?: string;
  taxId: string; // EIN or non-US tax id; raw, masked at render
  taxIdIssuingCountry: string;
  fileNumber?: string; // registration / file number
  countryOfRegistration: string;
  stateOfRegistration?: string; // if US
  principalAddress: Address;
}

// E1.3 AC6 / A.4 — append-only audit timeline entry.
// A.4.5 grouping: each entry is tagged with the subject (person/business) it
// belongs to, so the detail view can render one timeline per subject.
export interface SessionTimelineEntry {
  id: string;
  timestamp: string;
  actor: "system" | "end_user" | "admin";
  actorName?: string; // e.g. "Marco Cesaratto" for admin actions
  action: string; // short verb phrase
  detail?: string; // free-text detail (reason text, outcome, etc.)
  // A.4.5 grouping — subjectId is a person id, or "business" for the entity/KYB
  // group; subjectLabel is the human-readable heading shown for the group.
  subjectId?: string;
  subjectLabel?: string;
}

export interface VerificationSession {
  id: string; // e.g. "VS-2026-0001"
  organizationId: string;
  organizationName: string; // tenant within Delio
  pathType: PathType;
  jointAccountType?: string; // for joint sessions (E5.1 AC2)
  // Display name of the onboarded vehicle, shown in the index "Entity name"
  // column. Entity sessions derive it from entity.legalName; joint sessions
  // carry the trust name here; solo sessions leave it blank.
  entityName?: string;
  status: SessionStatus;
  createdAt: string;
  submittedAt?: string;
  lastActivityAt: string;
  persons: SessionPerson[]; // [0] is always the primary applicant
  entity?: EntityInfo; // entity sessions only
  timeline: SessionTimelineEntry[];
}

// ───────────────────────── EDD (ported from app-edd) ─────────────────────────

export type EddItemKind = "document" | "field";
export type EddFieldType = "text" | "textarea" | "select" | "yesno";

export interface EddItem {
  id: string;
  label: string;
  kind: EddItemKind;
  category: "funds" | "identity" | "entity" | "risk";
  description: string;
  fieldType?: EddFieldType; // when kind === "field"
  placeholder?: string;
  options?: string[]; // select
  yesLabel?: string; // yesno
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
  firm?: string; // gp only
}

// A single match / no-match identity-attribute tag shown in the "Alloy tags"
// card (B.1.2). Individuals: Name, DOB, Address, SSN. Entities: Legal Name,
// Formation Date, Registered Address, Tax ID (EIN).
export interface EddAlloyTag {
  label: string;
  match: boolean;
}

// The Alloy review summary synthesized from the session (A2 / E3.3 AC1).
// Risk score removed per B.1.1 — no numeric score is carried anywhere.
export interface EddAlloyReview {
  outcome: "Manual Review";
  runDate: string;
}

// A custom requested item the admin adds on step 1 (B.1.4). It is sent like a
// catalog item and rendered in the collection flow as a doc upload or a text
// field according to `kind`.
export interface EddCustomItem {
  id: string; // e.g. "custom_ab12cd"
  label: string; // admin-entered name
  subtitle: string; // admin-entered subtitle / description
  kind: EddItemKind; // "document" → upload, "field" → text field
}

export interface EddSubmissionFile {
  name: string;
}

export interface EddSubmission {
  values: Record<string, string>; // itemId → value
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
  link: string; // https://{client}.interro.co/edd/{token}
  caseId: string; // sessionId, or `${sessionId}:${personId}` for multi-person
  sessionId: string;
  personId?: string;
  subjectType: EddSubjectType;
  entityName?: string;
  subjectName: string;
  flaggedParty: string;
  context: string;
  alloyReview: EddAlloyReview;
  items: string[]; // ordered EddItem ids (catalog ids + custom item ids)
  customItems?: EddCustomItem[]; // inline custom items added on step 1 (B.1.4)
  recipient: EddRecipient;
  note: string;
  status: EddStatus;
  createdAt: string;
  submission: EddSubmission | null;
  outcome?: EddOutcome;
  history: EddHistoryEntry[];
}

// The ephemeral "case" the bent entry builds before a request is created.
export interface EddCase {
  id: string; // caseId
  sessionId: string;
  personId?: string;
  subjectType: EddSubjectType;
  entityName?: string;
  subjectName: string;
  flaggedParty: string;
  context: string;
  saasClient: string; // org name
  gp: EddRecipient;
  // Plausible GP email addresses presented as checkboxes on step 2 (B.2.1).
  gpEmails: string[];
  lp: EddRecipient;
  alloyReview: EddAlloyReview;
  // Match / no-match identity-attribute tags for the "Alloy tags" card (B.1.2).
  alloyTags: EddAlloyTag[];
  recommendedItemIds: string[];
}
