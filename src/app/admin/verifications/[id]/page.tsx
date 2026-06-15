"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Landmark,
  Clock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Cpu,
  User as UserIcon,
  UserCog,
  Link2,
  Mail,
  RefreshCw,
  Ban,
  Copy,
  Check,
} from "lucide-react";
import {
  SessionStatusBadge,
  PersonBadge,
} from "@/components/ui/status-badge";
import { AggregateProgress } from "@/components/verifications/AggregateProgress";
import { maskValue, maskDob, entityNameFor } from "@/lib/verification-data";
import { useVerifications } from "@/lib/verifications/verification-store";
import EddDrawer from "@/components/edd/EddDrawer";
import { buildEddCaseFromSession } from "@/components/edd/edd-entry";
import {
  Address,
  EddCase,
  KycStatus,
  LinkStatus,
  PathType,
  PersonRole,
  SessionPerson,
  VerificationSession,
} from "@/types";

type Tab = "overview" | "persons" | "entity" | "timeline";

const pathLabels: Record<PathType, string> = {
  solo: "Solo",
  joint: "Joint",
  entity: "Entity",
};

const roleLabels: Record<PersonRole, string> = {
  primary: "Primary Applicant",
  co_holder: "Co-holder",
  ubo: "Beneficial Owner",
  control_person: "Control Person",
};

const kycLabels: Record<KycStatus, string> = {
  not_started: "Not Started",
  data_entered: "Data Entered",
  screening: "Screening",
  passed: "Passed",
  failed: "Failed",
  review: "Under Review",
};

const linkLabels: Record<LinkStatus, string> = {
  not_sent: "Not Sent",
  sent: "Sent",
  opened: "Opened",
  completed: "Completed",
  expired: "Expired",
  revoked: "Revoked",
};

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fullAddress(a: Address): string {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}, ${a.country}`;
}

/* ─── Initiate EDD trigger (E3.2) ───────────────────────────────────── */
function InitiateEddButton({
  scope,
  onClick,
}: {
  scope: "session" | "person";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 ${
        scope === "person" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"
      } font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover`}
    >
      <ShieldCheck className={scope === "person" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      Initiate EDD
    </button>
  );
}

/* ─── Masked field with reveal toggle ───────────────────────────────── */
function MaskedField({
  label,
  raw,
  masked,
  revealed,
}: {
  label: string;
  raw: string;
  masked: string;
  revealed: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm text-gray-900 mt-1 font-mono">
        {revealed ? raw : masked}
      </dd>
    </div>
  );
}

/* ─── Primary applicant section ─────────────────────────────────────── */
function PrimaryApplicantSection({ person }: { person: SessionPerson }) {
  const [revealed, setRevealed] = useState(false);
  const a = person.address;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-gray-400" /> Primary Applicant
        </h2>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
        >
          {revealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hide PII
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Reveal PII
            </>
          )}
        </button>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-5">
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            First Name
          </dt>
          <dd className="text-sm text-gray-900 mt-1">{person.firstName}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Last Name
          </dt>
          <dd className="text-sm text-gray-900 mt-1">{person.lastName}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Email
          </dt>
          <dd className="text-sm text-gray-900 mt-1">{person.email}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Phone
          </dt>
          <dd className="text-sm text-gray-900 mt-1">{person.phone}</dd>
        </div>
        <MaskedField
          label="Date of Birth"
          raw={person.dateOfBirth}
          masked={maskDob(person.dateOfBirth)}
          revealed={revealed}
        />
        <MaskedField
          label={person.ssnIssuingCountry ? "National ID" : "SSN / Tax ID"}
          raw={person.ssn}
          masked={maskValue(person.ssn)}
          revealed={revealed}
        />
        <div className="md:col-span-2">
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Address
          </dt>
          <dd className="text-sm text-gray-900 mt-1">
            {revealed ? fullAddress(a) : `${a.city}, ${a.state}`}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            KYC Status
          </dt>
          <dd className="text-sm text-gray-900 mt-1">
            {kycLabels[person.kycStatus]}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/* ─── Verification link management (E2.2 / PD-145 §5.2) ─────────────── */
function LinkManager({
  session,
  person,
}: {
  session: VerificationSession;
  person: SessionPerson;
}) {
  const { resendLink, regenerateLink, revokeLink } = useVerifications();
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = person.link;
  const status = link?.status;
  // A link is "active" (revocable) when sent / opened (delivered, not done).
  const isActive = status === "sent" || status === "opened";
  // Needs a fresh link when expired or revoked (or never sent).
  const needsNew =
    status === "expired" || status === "revoked" || status === "not_sent";

  function copyLink() {
    if (!link?.url) return;
    try {
      navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-gray-700">Verification Link</p>
        {link && (
          <span className="text-gray-500">
            Status:{" "}
            <span className="text-gray-900">{linkLabels[link.status]}</span>
            {link.sentVia && ` · via ${link.sentVia}`}
          </span>
        )}
      </div>

      {link && (
        <div className="space-y-0.5 text-gray-500">
          {link.sentAt && <p>Sent: {fmtDateTime(link.sentAt)}</p>}
          {link.openedAt && <p>Opened: {fmtDateTime(link.openedAt)}</p>}
          {link.completedAt && <p>Completed: {fmtDateTime(link.completedAt)}</p>}
          {link.expiresAt && <p>Expires: {fmtDateTime(link.expiresAt)}</p>}
        </div>
      )}

      {showLink && link?.url && (
        <div className="flex items-center gap-2 rounded-md bg-white border border-gray-200 px-2 py-1.5">
          <code className="flex-1 truncate text-[11px] text-gray-700">
            {link.url}
          </code>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1 text-interro-primary hover:text-interro-primary-hover"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {link?.url && (
          <button
            type="button"
            onClick={() => setShowLink((v) => !v)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Link2 className="w-3.5 h-3.5" /> {showLink ? "Hide link" : "View link"}
          </button>
        )}
        <button
          type="button"
          onClick={() => resendLink(session.id, person.id)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <Mail className="w-3.5 h-3.5" /> Resend via email
        </button>
        {needsNew && (
          <button
            type="button"
            onClick={() => regenerateLink(session.id, person.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Generate new link
          </button>
        )}
        {isActive && (
          <button
            type="button"
            onClick={() => revokeLink(session.id, person.id)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <Ban className="w-3.5 h-3.5" /> Revoke
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Expandable additional person card ─────────────────────────────── */
function PersonCard({
  person,
  session,
  onInitiateEdd,
}: {
  person: SessionPerson;
  session: VerificationSession;
  onInitiateEdd: (person: SessionPerson) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const a = person.address;
  const isEntityOrJoint =
    session.pathType === "entity" || session.pathType === "joint";

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {person.firstName} {person.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {roleLabels[person.role]}
              {person.ownershipPercentage != null &&
                ` · ${person.ownershipPercentage}%`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {person.link && (
            <span className="text-[11px] text-gray-500">
              Link: {linkLabels[person.link.status]}
            </span>
          )}
          <PersonBadge badge={person.badge} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          <div className="flex justify-end mb-3 gap-2">
            <button
              onClick={() => setRevealed((r) => !r)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
            >
              {revealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide PII
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Reveal PII
                </>
              )}
            </button>
            {isEntityOrJoint && (
              <InitiateEddButton
                scope="person"
                onClick={() => onInitiateEdd(person)}
              />
            )}
          </div>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
            <div>
              <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Email
              </dt>
              <dd className="text-gray-900">{person.email}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </dt>
              <dd className="text-gray-900">{person.phone}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Date of Birth
              </dt>
              <dd className="text-gray-900 font-mono">
                {revealed ? person.dateOfBirth : maskDob(person.dateOfBirth)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                {person.ssnIssuingCountry ? "National ID" : "SSN / Tax ID"}
              </dt>
              <dd className="text-gray-900 font-mono">
                {/* Not collected until the person starts (no biographical data yet). */}
                {!person.biographicalDataEntered ? (
                  <span className="text-gray-300 font-sans">—</span>
                ) : revealed ? (
                  person.ssn
                ) : (
                  maskValue(person.ssn)
                )}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Address
              </dt>
              <dd className="text-gray-900">
                {revealed ? fullAddress(a) : `${a.city}, ${a.state}`}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                KYC Status
              </dt>
              <dd className="text-gray-900">{kycLabels[person.kycStatus]}</dd>
            </div>
          </dl>

          {isEntityOrJoint && <LinkManager session={session} person={person} />}
        </div>
      )}
    </div>
  );
}

export default function VerificationDetailPage() {
  const params = useParams();
  const idParam = String(params.id);
  const { getSession, recordEddOutcome } = useVerifications();
  const session = getSession(idParam);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  // EDD drawer state: the synthesized case is held while the drawer is open.
  const [eddCase, setEddCase] = useState<EddCase | null>(null);

  if (!session) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Verification session not found.</p>
        <Link
          href="/admin/verifications"
          className="text-interro-primary hover:text-interro-primary-hover text-sm mt-2 inline-block"
        >
          Back to Verifications
        </Link>
      </div>
    );
  }

  const primary = session.persons[0];
  const additional = session.persons.slice(1);
  const isMultiPerson =
    session.pathType === "joint" || session.pathType === "entity";
  const isEntity = session.pathType === "entity";

  // Seed an EDD case and open the drawer (architecture §6).
  const openEddForPerson = (person: SessionPerson) => {
    setEddCase(buildEddCaseFromSession(session, person));
  };
  const openEddForSession = () => {
    setEddCase(buildEddCaseFromSession(session, null));
  };

  // A.4.5 — group the timeline per subject for the grouped timeline view.
  // Group order: business (KYB) / primary first, then each additional person in
  // session order. Entries are chronological within each group.
  const timelineGroups = (() => {
    // Desired group order keyed by subjectId.
    const order: string[] = [];
    const labels = new Map<string, string>();
    const sublabels = new Map<string, string>();
    if (isEntity) {
      order.push("business");
      labels.set("business", session.entity?.legalName ?? "Business");
      sublabels.set("business", "Business verification (KYB)");
    }
    session.persons.forEach((p) => {
      order.push(p.id);
      labels.set(p.id, `${p.firstName} ${p.lastName}`);
      sublabels.set(p.id, roleLabels[p.role]);
    });

    // Bucket entries by subjectId (default to the first group when untagged).
    const fallbackId = isEntity ? "business" : session.persons[0]?.id;
    const buckets = new Map<string, typeof session.timeline>();
    session.timeline.forEach((entry) => {
      const key =
        entry.subjectId && (labels.has(entry.subjectId) || order.includes(entry.subjectId))
          ? entry.subjectId
          : fallbackId;
      if (!labels.has(key)) {
        labels.set(key, entry.subjectLabel ?? "Verification");
        sublabels.set(key, "");
        if (!order.includes(key)) order.push(key);
      }
      const arr = buckets.get(key) ?? [];
      arr.push(entry);
      buckets.set(key, arr);
    });

    return order
      .filter((id) => buckets.has(id))
      .map((id) => ({
        subjectId: id,
        label: labels.get(id) ?? "Verification",
        sublabel: sublabels.get(id) ?? "",
        entries: [...(buckets.get(id) ?? [])].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
      }));
  })();

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Building2 className="w-4 h-4" /> },
    ...(isMultiPerson
      ? [{ key: "persons" as Tab, label: "Persons", icon: <Users className="w-4 h-4" /> }]
      : []),
    ...(isEntity
      ? [{ key: "entity" as Tab, label: "Entity Info", icon: <Landmark className="w-4 h-4" /> }]
      : []),
    { key: "timeline", label: "Timeline", icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/verifications"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          {/* Header title = Entity Being Verified (A.3.1): solo → applicant
              name (NOT the org), joint → trust name, entity → legal name. */}
          <h1 className="text-xl font-bold text-gray-900">
            {entityNameFor(session)}
          </h1>
          <p className="text-sm text-gray-500">
            {session.id} · {pathLabels[session.pathType]} verification
            {session.jointAccountType && ` · ${session.jointAccountType}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMultiPerson && <AggregateProgress session={session} />}
          <SessionStatusBadge status={session.status} />
          {session.pathType === "solo" && (
            <InitiateEddButton scope="session" onClick={openEddForSession} />
          )}
        </div>
      </div>

      {/* Header meta */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
          <div>
            {/* Organization Environment = the sending org/tenant within Delio (A.3.1). */}
            <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Organization Environment
            </dt>
            <dd className="text-sm text-gray-900 mt-1">
              {session.organizationName}
            </dd>
          </div>
          <div>
            {/* Application through which the verification was initiated. For this
                demo it is always "Delio" (A.3.1 / A-VER-2 AC2). */}
            <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Application
            </dt>
            <dd className="text-sm text-gray-900 mt-1">Delio</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Path Type
            </dt>
            <dd className="text-sm text-gray-900 mt-1">
              {pathLabels[session.pathType]}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Created
            </dt>
            <dd className="text-sm text-gray-900 mt-1">
              {fmtDate(session.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Last Activity
            </dt>
            <dd className="text-sm text-gray-900 mt-1">
              {fmtDate(session.lastActivityAt)}
            </dd>
          </div>
          </dl>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="shrink-0 text-sm font-medium text-interro-primary hover:text-interro-primary-hover underline underline-offset-2"
          >
            Alloy Verification
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-interro-primary text-interro-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === "overview" && (
          <PrimaryApplicantSection person={primary} />
        )}

        {activeTab === "persons" && isMultiPerson && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                Verification summary
              </p>
              <AggregateProgress session={session} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-gray-400" /> Additional Persons
              </h2>
              <div className="space-y-3">
                {additional.map((p) => (
                  <PersonCard
                    key={p.id}
                    person={p}
                    session={session}
                    onInitiateEdd={openEddForPerson}
                  />
                ))}
                {additional.length === 0 && (
                  <p className="text-sm text-gray-400">No additional persons.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "entity" && isEntity && session.entity && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-gray-400" /> Entity Information
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                ["Legal Name", session.entity.legalName],
                ["DBA", session.entity.dba || "—"],
                [
                  "Tax ID",
                  `${maskValue(session.entity.taxId)} (${session.entity.taxIdIssuingCountry})`,
                ],
                ["File / Registration Number", session.entity.fileNumber || "—"],
                ["Country of Registration", session.entity.countryOfRegistration],
                ["State of Registration", session.entity.stateOfRegistration || "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    {label}
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">{value}</dd>
                </div>
              ))}
              <div className="md:col-span-2">
                <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Principal Address
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {fullAddress(session.entity.principalAddress)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="space-y-6">
            {timelineGroups.map((group) => (
              <div
                key={group.subjectId}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> {group.label}
                </h2>
                <p className="text-xs text-gray-500 mb-4">{group.sublabel}</p>
                <ol className="space-y-4">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="mt-0.5">
                          {entry.actor === "system" ? (
                            <Cpu className="w-4 h-4 text-gray-400" />
                          ) : entry.actor === "admin" ? (
                            <UserCog className="w-4 h-4 text-interro-accent" />
                          ) : (
                            <UserIcon className="w-4 h-4 text-interro-primary" />
                          )}
                        </span>
                        <span className="flex-1 w-px bg-gray-200 mt-1" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">
                            {entry.action}
                          </p>
                          <p className="text-xs text-gray-400">
                            {fmtDateTime(entry.timestamp)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {entry.actor === "system"
                            ? "System"
                            : entry.actorName ??
                              (entry.actor === "admin" ? "Admin" : "End user")}
                          {entry.detail && ` — ${entry.detail}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full-screen EDD drawer (A2 → A3 → A4), seeded from the session/person.
          On Run EDD / Escalate it writes the outcome back to the session via
          recordEddOutcome, then closes (architecture §3.3 / §6.1). */}
      {eddCase && (
        <EddDrawer
          caseObj={eddCase}
          onClose={() => setEddCase(null)}
          onRecordOutcome={recordEddOutcome}
        />
      )}
    </div>
  );
}
