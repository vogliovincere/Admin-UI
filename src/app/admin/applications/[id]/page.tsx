"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Users,
  Shield,
  AlertTriangle,
  Upload,
  Plus,
  Landmark,
  Wallet,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { mockApplications } from "@/lib/mock-data";
import {
  OnboardingStatusBadge,
  RiskBadge,
} from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { useDemoState, toApplication } from "@/lib/demo-state";
import {
  getAlloyResultForPerson,
  getEntityKycStatus,
  getVisibleAlloyTags,
  type AlloyKycStatus,
} from "@/lib/alloy-mock";
import {
  buildEddCaseFromApplication,
  type ApplicationEddCase,
} from "@/components/edd/edd-entry";
import ApplicationEddDrawer from "@/components/edd/ApplicationEddDrawer";
import { ControlPerson, OnboardingApplication, UBO } from "@/types";

type Tab = "overview" | "persons" | "alloy" | "edd";

// RBAC: account closure is restricted to the Admin role. demo-state has no role
// concept, so we gate behind a clearly-named constant. Flip to "viewer" to hide
// the close-account affordance entirely.
const currentUserRole: "admin" | "viewer" = "admin";

const entityKycStatusStyles: Record<string, string> = {
  Approved: "bg-interro-accent-soft text-interro-accent border border-interro-accent/30",
  Denied: "bg-red-50 text-red-700 border border-red-200",
  "Manual Review": "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Submitted: "bg-interro-primary-soft text-interro-primary border border-interro-primary/30",
  "Enhanced Due Diligence": "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Pending: "bg-gray-100 text-gray-600 border border-gray-200",
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const {
    clientApp,
    appOverrides,
    requestEddOnApplication,
    closeApplication,
  } = useDemoState();

  const idParam = String(params.id);
  const isDemoApp = clientApp && idParam === clientApp.id;
  const baseApp = isDemoApp
    ? toApplication(clientApp!)
    : mockApplications.find((a) => a.id === idParam);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showEddModal, setShowEddModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeReason, setCloseReason] = useState("");
  const [newEddLabel, setNewEddLabel] = useState("");
  const [newEddDescription, setNewEddDescription] = useState("");
  // Application-flow EDD recipient-selection drawer (distinct from Verifications).
  const [eddCase, setEddCase] = useState<ApplicationEddCase | null>(null);

  if (!baseApp) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Application not found.</p>
        <Link
          href="/admin/applications"
          className="text-interro-primary hover:text-interro-primary-hover text-sm mt-2 inline-block"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  // Apply persisted override (works for ALL apps, seed + demo)
  const override = appOverrides[idParam];
  const effectiveStatus = override?.status ?? baseApp.status;
  const effectiveClosureReason =
    override?.closureReason ?? baseApp.closureReason;
  const effectiveClosedAt = override?.closedAt ?? baseApp.closedAt;
  const overrideEdd = override?.eddItems ?? [];
  const mergedEddDocs = [...(baseApp.eddDocuments ?? []), ...overrideEdd];
  const showEddTab =
    baseApp.eddRequired ||
    effectiveStatus === "edd_required" ||
    mergedEddDocs.length > 0;

  const app = {
    ...baseApp,
    status: effectiveStatus,
    closureReason: effectiveClosureReason,
    closedAt: effectiveClosedAt,
    eddDocuments: mergedEddDocs,
    eddRequired: baseApp.eddRequired || mergedEddDocs.length > 0,
  };

  // Bank accounts for this app: override is source of truth in admin view
  const demoBankAccounts = override?.bankAccounts ?? [];

  const entityKycStatus: AlloyKycStatus = getEntityKycStatus(idParam);
  // NEW DECISIONING MODEL: Alloy tags are only shown for decision-bearing
  // statuses; otherwise none are surfaced.
  const visibleAlloyTags = getVisibleAlloyTags(entityKycStatus, app.alloyTags);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Building2 className="w-4 h-4" /> },
    { key: "persons", label: "Persons", icon: <Users className="w-4 h-4" /> },
    { key: "alloy", label: "Alloy Results", icon: <Shield className="w-4 h-4" /> },
    ...(showEddTab
      ? [
          {
            key: "edd" as Tab,
            label: "EDD",
            icon: <AlertTriangle className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  // Launch the application-flow EDD recipient-selection drawer. Optionally
  // seeded from a specific person card (control person / beneficial owner).
  function launchEdd(person?: ControlPerson | UBO) {
    const appForEdd = app as OnboardingApplication;
    setEddCase(buildEddCaseFromApplication(appForEdd, person ?? null));
  }

  function handleAddEdd() {
    requestEddOnApplication(idParam, newEddLabel, newEddDescription);
    setShowEddModal(false);
    setNewEddLabel("");
    setNewEddDescription("");
  }

  function handleClose() {
    setShowCloseModal(false);
    closeApplication(idParam, closeReason);
    setCloseReason("");
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/applications"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {app.businessInfo.legalName}
          </h1>
          <p className="text-sm text-gray-500">{app.id}</p>
          {app.alloyJourneyId && (
            <a
              href={`https://ialta.app.alloy.com/entities/${app.alloyJourneyId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-interro-accent hover:underline mt-1"
            >
              View in Alloy <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          {effectiveStatus === "closed" ? (
            <Badge variant="danger">Closed</Badge>
          ) : (
            <OnboardingStatusBadge
              status={
                effectiveStatus === "closed"
                  ? "denied"
                  : (effectiveStatus as Exclude<typeof effectiveStatus, "closed">)
              }
            />
          )}
          {app.riskLevel && <RiskBadge level={app.riskLevel} />}
        </div>
      </div>

      {effectiveStatus === "closed" && effectiveClosureReason && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Account Closed</p>
            <p className="text-xs text-gray-600 mt-1">
              {effectiveClosureReason}
              {effectiveClosedAt && (
                <> · {new Date(effectiveClosedAt).toLocaleString()}</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Approve / Deny removed — decisioning happens in Alloy. */}

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
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Business Information
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ["Legal Name", app.businessInfo.legalName],
                  ["Entity Type", app.businessInfo.entityType],
                  ["EIN", app.businessInfo.ein],
                  [
                    "State of Incorporation",
                    app.businessInfo.stateOfIncorporation,
                  ],
                  ["Industry", app.businessInfo.industry],
                  [
                    "Address",
                    `${app.businessInfo.address.street}, ${app.businessInfo.address.city}, ${app.businessInfo.address.state} ${app.businessInfo.address.zip}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {label}
                    </dt>
                    <dd className="text-sm text-gray-900 mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Account Balance — Overview tab only (C1/C2) */}
            {effectiveStatus === "approved" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-interro-accent" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Account Balance
                  </h3>
                </div>
                <p className="text-3xl font-bold text-interro-heading">
                  $
                  {(app.balance ?? 0).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-gray-500 mt-1">USD · Available</p>
              </div>
            )}

            {demoBankAccounts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-gray-400" /> Bank Accounts
                </h2>
                <div className="space-y-4">
                  {demoBankAccounts.map((ba) => (
                    <div
                      key={ba.id}
                      className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {ba.nickname || ba.bankName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {ba.bankName}
                            </p>
                          </div>
                          {ba.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-interro-accent-soft text-interro-accent border border-interro-accent/30">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                              Pending
                            </span>
                          )}
                        </div>
                        <dl className="grid grid-cols-2 gap-y-1 text-xs">
                          <dt className="text-gray-500">Holder</dt>
                          <dd className="text-gray-900">{ba.holderName}</dd>
                          <dt className="text-gray-500">Type</dt>
                          <dd className="text-gray-900">{ba.accountType}</dd>
                          <dt className="text-gray-500">Routing</dt>
                          <dd className="font-mono text-gray-900">
                            {ba.routingNumber}
                          </dd>
                          <dt className="text-gray-500">Account</dt>
                          <dd className="font-mono text-gray-900">
                            {ba.accountNumber}
                          </dd>
                        </dl>
                      </div>
                      <div className="bg-interro-accent-soft border border-interro-accent/40 rounded-lg p-3">
                        <p className="text-[11px] font-semibold text-interro-accent uppercase tracking-wider mb-2">
                          Socure Account Intelligence
                        </p>
                        {/* Socure / bank-account risk score (distinct from the
                            onboarding /100 score) — re-introduced for this card. */}
                        {ba.socureScore != null && (
                          <div className="flex items-baseline gap-1.5 mb-2">
                            <span className="text-2xl font-bold text-interro-accent">
                              {ba.socureScore}
                            </span>
                            <span className="text-[10px] font-medium text-interro-accent/70 uppercase tracking-wider">
                              Socure Score
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {/* Name Match result from Socure Account Intelligence. */}
                          {ba.socureTags?.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white text-interro-accent border border-interro-accent/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RBAC: only the Admin role can see / initiate account closure. */}
            {effectiveStatus === "approved" && currentUserRole === "admin" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Account Closure
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Initiate closure of this account.
                </p>
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  Initiate Closure
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "persons" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" /> Control Persons
              </h2>
              <div className="space-y-4">
                {app.controlPersons.map((person) => (
                  <PersonCard
                    key={person.id}
                    kind="control"
                    person={person}
                    onRequestEdd={() => launchEdd(person)}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" /> Beneficial Owners
              </h2>
              <div className="space-y-4">
                {app.ubos.map((ubo) => (
                  <PersonCard
                    key={ubo.id}
                    kind="ubo"
                    person={ubo}
                    onRequestEdd={() => launchEdd(ubo)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "alloy" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Alloy Journey Results
              </h2>
              <button
                onClick={() => launchEdd()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
              >
                <AlertTriangle className="w-4 h-4" /> Request EDD
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Journey ID
                </dt>
                <dd className="text-sm font-mono text-gray-900 mt-1">
                  {app.alloyJourneyId || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity Alloy Status
                </dt>
                <dd className="mt-1">
                  {/* D1/D2: Entity KYC/KYB decision status from KYC Microservice (mocked in-memory) */}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${entityKycStatusStyles[entityKycStatus] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {entityKycStatus}
                  </span>
                </dd>
              </div>
              {app.riskLevel && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    <RiskBadge level={app.riskLevel} />
                  </dd>
                </div>
              )}
            </dl>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Tags
              </h3>
              {/* NEW DECISIONING MODEL: tags render ONLY for decision-bearing
                  statuses (Manual Review / Submitted / Approved / Denied /
                  Enhanced Due Diligence). Otherwise none are shown. */}
              <div className="flex flex-wrap gap-2">
                {visibleAlloyTags.length > 0 ? (
                  visibleAlloyTags.map((tag) => <Badge key={tag}>{tag}</Badge>)
                ) : (
                  <span className="text-sm text-gray-400">No tags</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "edd" && app.eddRequired && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Enhanced Due Diligence Required
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Prescribe specific documentation and text input requirements
                  below.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  EDD Requirements
                </h2>
                <button
                  onClick={() => setShowEddModal(true)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
                >
                  <Plus className="w-4 h-4" /> Add Requirement
                </button>
              </div>

              <div className="space-y-4">
                {app.eddDocuments?.map((doc) => (
                  <div
                    key={doc.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        {doc.label}
                      </p>
                      {doc.submittedAt ? (
                        <Badge variant="success">Submitted</Badge>
                      ) : doc.required ? (
                        <Badge variant="danger">Required</Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {doc.description}
                    </p>
                    {doc.uploadedFile && (
                      <div className="flex items-center gap-2 p-2 bg-interro-accent-soft rounded text-xs text-interro-accent">
                        <Upload className="w-3 h-3" />
                        {doc.uploadedFile.name}
                        {doc.submittedAt && (
                          <span className="ml-auto text-gray-500">
                            {new Date(doc.submittedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    {doc.textResponse && (
                      <div className="p-2 bg-gray-50 rounded text-xs text-gray-700 whitespace-pre-wrap">
                        {doc.textResponse}
                        {doc.submittedAt && (
                          <div className="text-gray-500 mt-1">
                            Submitted{" "}
                            {new Date(doc.submittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                    {!doc.uploadedFile && !doc.textResponse && (
                      <p className="text-xs text-gray-400 italic">
                        Awaiting client response
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approve / Deny modals removed — decisioning happens in Alloy. */}

      {/* EDD Modal */}
      {showEddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Add EDD Requirement
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Prescribe additional documentation required from the client.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirement Label *
                </label>
                <input
                  type="text"
                  value={newEddLabel}
                  onChange={(e) => setNewEddLabel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  placeholder="e.g. Source of Funds Documentation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={newEddDescription}
                  onChange={(e) => setNewEddDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  placeholder="Describe what the client needs to provide..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowEddModal(false);
                  setNewEddLabel("");
                  setNewEddDescription("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEdd}
                disabled={!newEddLabel || !newEddDescription}
                className="px-4 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add & Notify Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Account Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Close Account
            </h3>
            {(app.balance ?? 0) > 0 ? (
              <>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    Balance is $
                    {(app.balance ?? 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    . The balance must be $0 before the account can be closed.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-interro-accent-soft border border-interro-accent/30 rounded-lg p-3 mb-4">
                  <p className="text-sm text-interro-accent">
                    Balance is $0.00 — eligible to close.
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-2">Reason for closure</p>
                <textarea
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
                  placeholder="Reason for closure..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClose}
                    disabled={!closeReason}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Closure
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Application-flow EDD recipient-selection drawer (distinct from the
          Verifications GP/LP flow). */}
      {eddCase && (
        <ApplicationEddDrawer
          caseObj={eddCase}
          onClose={() => setEddCase(null)}
        />
      )}
    </div>
  );
}

/* ─── Person card with Alloy results ───────────────────────────────────── */

function PersonCard({
  kind,
  person,
  onRequestEdd,
}: {
  kind: "control" | "ubo";
  person: ControlPerson | UBO;
  onRequestEdd: () => void;
}) {
  const alloy = getAlloyResultForPerson(person.id);
  const addr = person.address;
  const isControl = kind === "control";
  const cp = person as ControlPerson;
  const ubo = person as UBO;

  return (
    <div className="border border-gray-200 rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-base font-semibold text-gray-900">
            {person.firstName} {person.lastName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {isControl
              ? cp.title || "Control Person"
              : `UBO — ${ubo.ownershipPercentage}% ownership`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRequestEdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Request EDD
          </button>
          <Badge>{person.id}</Badge>
        </div>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Full Legal Name
          </dt>
          <dd className="text-gray-900">
            {person.firstName} {person.lastName}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Date of Birth
          </dt>
          <dd className="text-gray-900">{person.dateOfBirth}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Residential Address
          </dt>
          <dd className="text-gray-900">
            {addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            SSN / Tax ID
          </dt>
          <dd className="text-gray-900 font-mono">{person.ssn}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Government ID
          </dt>
          <dd className="text-gray-900">
            {person.idType} ·{" "}
            <span className="font-mono">{person.idNumber}</span> · exp{" "}
            {person.idExpiration}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Email
          </dt>
          <dd className="text-gray-900">{person.email}</dd>
        </div>
        {isControl && (
          <div>
            <dt className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </dt>
            <dd className="text-gray-900">{cp.phone}</dd>
          </div>
        )}
      </dl>

      {/* Alloy verification panel — numeric score removed (E2) */}
      <div className="bg-interro-accent-soft border border-interro-accent/40 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-interro-accent uppercase tracking-wider">
            Alloy Verification
          </p>
          <a
            href={`https://ialta.app.alloy.com/individuals/${person.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-interro-accent hover:underline"
          >
            View in Alloy <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {alloy.tags.map((t) =>
            t.match ? (
              <span
                key={t.label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-interro-accent-soft text-interro-accent border border-interro-accent"
              >
                <CheckCircle2 className="w-3 h-3" /> {t.label} Match
              </span>
            ) : (
              <span
                key={t.label}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200"
              >
                <XCircle className="w-3 h-3" /> {t.label} Mismatch
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
