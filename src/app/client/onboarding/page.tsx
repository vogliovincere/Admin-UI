"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  Users,
  FileText,
  CheckCircle,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Shield,
  ClipboardCheck,
  Send,
} from "lucide-react";
import {
  useDemoState,
  OnboardingFormPayload,
} from "@/lib/demo-state";

type Step =
  | "business"
  | "control"
  | "ubos"
  | "documents"
  | "screening"
  | "review";

const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "business", label: "Business Info", icon: <Building2 className="w-4 h-4" /> },
  { key: "control", label: "Control Persons", icon: <User className="w-4 h-4" /> },
  { key: "ubos", label: "Beneficial Owners", icon: <Users className="w-4 h-4" /> },
  { key: "documents", label: "Documents", icon: <FileText className="w-4 h-4" /> },
  { key: "screening", label: "Screening", icon: <Shield className="w-4 h-4" /> },
  { key: "review", label: "Review & Submit", icon: <CheckCircle className="w-4 h-4" /> },
];

interface PersonForm {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  phone: string;
  dateOfBirth: string;
  ssn: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  idType: string;
  idNumber: string;
  idExpiration: string;
  ownershipPercentage?: string;
}

function emptyPerson(): PersonForm {
  return {
    id: crypto.randomUUID(),
    firstName: "",
    lastName: "",
    email: "",
    title: "",
    phone: "",
    dateOfBirth: "",
    ssn: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    idType: "Drivers License",
    idNumber: "",
    idExpiration: "",
    ownershipPercentage: "",
  };
}

interface DocumentItem {
  id: string;
  name: string;
  type: string;
}

const DEMO_BUSINESS = {
  legalName: "Northwind Markets LLC",
  dba: "Northwind",
  ein: "47-1234567",
  entityType: "LLC",
  stateOfIncorporation: "Delaware",
  dateOfIncorporation: "2020-04-15",
  street: "1100 Market Street, Suite 800",
  city: "Wilmington",
  state: "DE",
  zip: "19801",
  country: "US",
  phone: "(302) 555-0142",
  website: "https://northwindmarkets.com",
  industry: "Asset Management",
  description:
    "Boutique asset management firm focused on small-cap public equities and PIPE investments.",
};

const DEMO_CONTROL_PERSONS: PersonForm[] = [
  {
    id: "auth-demo-1",
    firstName: "Lila",
    lastName: "Okafor",
    email: "lila@northwindmarkets.com",
    title: "Managing Member",
    phone: "(302) 555-0143",
    dateOfBirth: "1982-06-14",
    ssn: "***-**-1234",
    street: "212 Greenhill Ave",
    city: "Wilmington",
    state: "DE",
    zip: "19805",
    country: "US",
    idType: "Drivers License",
    idNumber: "DE-D11234",
    idExpiration: "2028-06-14",
  },
];

const DEMO_UBOS: PersonForm[] = [
  {
    id: "ubo-demo-1",
    firstName: "Lila",
    lastName: "Okafor",
    email: "lila@northwindmarkets.com",
    title: "Managing Member",
    phone: "(302) 555-0143",
    dateOfBirth: "1982-06-14",
    ssn: "***-**-1234",
    street: "212 Greenhill Ave",
    city: "Wilmington",
    state: "DE",
    zip: "19805",
    country: "US",
    idType: "Drivers License",
    idNumber: "DE-D11234",
    idExpiration: "2028-06-14",
    ownershipPercentage: "60",
  },
  {
    id: "ubo-demo-2",
    firstName: "Daniel",
    lastName: "Reyes",
    email: "daniel@northwindmarkets.com",
    title: "Partner",
    phone: "(302) 555-0144",
    dateOfBirth: "1985-10-02",
    ssn: "***-**-5678",
    street: "55 Riverfront Pl",
    city: "Wilmington",
    state: "DE",
    zip: "19801",
    country: "US",
    idType: "Passport",
    idNumber: "P-XX5678",
    idExpiration: "2029-10-02",
    ownershipPercentage: "40",
  },
];

const DEMO_DOCS: DocumentItem[] = [
  { id: "d1", name: "Certificate_of_Formation.pdf", type: "formation_document" },
  { id: "d2", name: "Operating_Agreement.pdf", type: "operating_agreement" },
  { id: "d3", name: "IRS_EIN_Confirmation.pdf", type: "ein_letter" },
];

export default function ClientOnboardingPage() {
  const {
    isHydrated,
    submitOnboarding,
    submitActiveClientEdd,
    getActiveClientView,
  } = useDemoState();
  const view = getActiveClientView();

  const [currentStep, setCurrentStep] = useState<Step>("business");
  const [business, setBusiness] = useState({
    legalName: "",
    dba: "",
    ein: "",
    entityType: "",
    stateOfIncorporation: "",
    dateOfIncorporation: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    phone: "",
    website: "",
    industry: "",
    description: "",
  });
  const [purposeOfAccount, setPurposeOfAccount] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [sourceOfFundsDetail, setSourceOfFundsDetail] = useState("");
  const [expectedTxnVolume, setExpectedTxnVolume] = useState("");
  const [expectedTxnValue, setExpectedTxnValue] = useState("");
  const [geographicExposure, setGeographicExposure] = useState("");

  const [controlPersons, setControlPersons] = useState<PersonForm[]>([
    emptyPerson(),
  ]);
  const [ubos, setUbos] = useState<PersonForm[]>([emptyPerson()]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Section 5
  const [ofacConsent, setOfacConsent] = useState(false);
  const [pepDisclosure, setPepDisclosure] = useState(false);
  const [adverseMediaAck, setAdverseMediaAck] = useState(false);

  // Section 7
  const [tosAccepted, setTosAccepted] = useState(false);
  const [certifiedAccurate, setCertifiedAccurate] = useState(false);
  const [uboComplete, setUboComplete] = useState(false);
  const [signatoryName, setSignatoryName] = useState("");
  const [signatoryTitle, setSignatoryTitle] = useState("");

  // EDD response state
  const [eddResponses, setEddResponses] = useState<
    Record<string, { text: string; fileName: string }>
  >({});

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  if (!isHydrated) {
    return (
      <div className="p-12 text-center text-sm text-gray-400">Loading...</div>
    );
  }

  // CLOSED / DENIED state
  if (view?.status === "closed" || view?.status === "denied") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Closed
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Reason:{" "}
            <span className="font-medium text-gray-900">
              {view.closureReason || "No reason provided."}
            </span>
          </p>
          {view.closedAt && (
            <p className="text-xs text-gray-400">
              Closed on {new Date(view.closedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // APPROVED state
  if (view?.status === "approved") {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl border border-interro-accent/30 shadow-md p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-interro-accent-soft flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-interro-accent" />
          </div>
          <h2 className="text-3xl font-bold text-interro-heading mb-2">
            Application Approved.
          </h2>
          <p className="text-base text-gray-600 mb-1">
            Welcome to Interro, {view.legalName}.
          </p>
          {view.approvedAt && (
            <p className="text-xs text-gray-400 mt-2">
              Approved on {new Date(view.approvedAt).toLocaleString()}
            </p>
          )}
        </div>
        <div className="bg-interro-primary rounded-2xl text-white p-8 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Add a Bank Account</h3>
            <p className="text-sm text-white/80">
              Start linking funds to your Interro account.
            </p>
          </div>
          <Link
            href="/client/bank-accounts"
            className="px-5 py-2.5 bg-interro-accent hover:bg-interro-accent/90 rounded-lg font-medium text-sm"
          >
            Add Bank Account
          </Link>
        </div>
      </div>
    );
  }

  // SUBMITTED / EDD state
  if (
    view?.status === "submitted" ||
    view?.status === "edd_required" ||
    view?.status === "under_review"
  ) {
    const hasEdd = view.eddItems.length > 0;
    const allEddSubmitted =
      hasEdd && view.eddItems.every((i) => i.submittedAt);
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-interro-primary-soft flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck className="w-6 h-6 text-interro-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Application Submitted
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            {view.legalName} — Application ID:{" "}
            <span className="font-mono font-medium">{view.appId}</span>
          </p>
          {!hasEdd && (
            <p className="text-sm text-gray-600">
              Waiting on Interro Compliance review.
            </p>
          )}
          {hasEdd && allEddSubmitted && (
            <p className="text-sm text-gray-600">
              All EDD responses received. Under final compliance review.
            </p>
          )}
          {hasEdd && !allEddSubmitted && (
            <p className="text-sm text-gray-600">
              Enhanced Due Diligence required. Please respond to the items
              below.
            </p>
          )}
        </div>

        {hasEdd && (
          <div className="space-y-3">
            {view.eddItems.map((item) => {
              const isSubmitted = !!item.submittedAt;
              const resp = eddResponses[item.id] || { text: "", fileName: "" };
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {item.label}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                    {isSubmitted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-interro-accent-soft text-interro-accent border border-interro-accent/30">
                        <CheckCircle className="w-3 h-3" /> Submitted
                      </span>
                    )}
                  </div>
                  {!isSubmitted && (
                    <>
                      <textarea
                        value={resp.text}
                        onChange={(e) =>
                          setEddResponses({
                            ...eddResponses,
                            [item.id]: { ...resp, text: e.target.value },
                          })
                        }
                        rows={3}
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                        placeholder="Provide your response..."
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            setEddResponses({
                              ...eddResponses,
                              [item.id]: {
                                ...resp,
                                fileName: `${item.label
                                  .replace(/[^a-z0-9]+/gi, "_")
                                  .toLowerCase()}_response.pdf`,
                              },
                            })
                          }
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
                        >
                          <Upload className="w-3 h-3" />
                          {resp.fileName ? resp.fileName : "Attach file"}
                        </button>
                        <button
                          onClick={() =>
                            submitActiveClientEdd(item.id, {
                              textResponse: resp.text || undefined,
                              uploadedFile: resp.fileName
                                ? {
                                    id: `DOC-${Date.now()}`,
                                    name: resp.fileName,
                                    type: "edd_response",
                                    uploadedAt: new Date().toISOString(),
                                    url: "#",
                                  }
                                : undefined,
                            })
                          }
                          disabled={!resp.text && !resp.fileName}
                          className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-3 h-3" /> Submit Response
                        </button>
                      </div>
                    </>
                  )}
                  {isSubmitted && (
                    <div className="mt-2 text-xs text-gray-500">
                      {item.uploadedFile && (
                        <span className="block">
                          File: {item.uploadedFile.name}
                        </span>
                      )}
                      {item.textResponse && (
                        <span className="block whitespace-pre-wrap">
                          {item.textResponse}
                        </span>
                      )}
                      <span className="block mt-1">
                        Submitted{" "}
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // DRAFT — wizard form
  function goNext() {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].key);
    }
  }

  function goBack() {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].key);
    }
  }

  function updatePerson(
    list: PersonForm[],
    setList: (v: PersonForm[]) => void,
    index: number,
    field: string,
    value: string
  ) {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: value };
    setList(updated);
  }

  function addPerson(list: PersonForm[], setList: (v: PersonForm[]) => void) {
    setList([...list, emptyPerson()]);
  }

  function removePerson(
    list: PersonForm[],
    setList: (v: PersonForm[]) => void,
    index: number
  ) {
    if (list.length > 1) {
      setList(list.filter((_, i) => i !== index));
    }
  }

  function prefillDemoData() {
    setBusiness(DEMO_BUSINESS);
    setControlPersons(DEMO_CONTROL_PERSONS);
    setUbos(DEMO_UBOS);
    setDocuments(DEMO_DOCS);
    setPurposeOfAccount(
      "Operating account for LP capital contributions and portfolio company funding."
    );
    setSourceOfFunds("Investment Capital");
    setSourceOfFundsDetail(
      "Capital contributions from existing institutional LPs and HNW investors."
    );
    setExpectedTxnVolume("21-50");
    setExpectedTxnValue("$1M-$10M");
    setGeographicExposure("US (primary); UK, EU (secondary)");
    setOfacConsent(true);
    setPepDisclosure(true);
    setAdverseMediaAck(true);
    setTosAccepted(true);
    setCertifiedAccurate(true);
    setUboComplete(true);
    setSignatoryName("Lila Okafor");
    setSignatoryTitle("Managing Member");
  }

  function personFormToType(p: PersonForm, isUbo: boolean) {
    return {
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      title: p.title,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth,
      ssn: p.ssn,
      address: {
        street: p.street,
        city: p.city,
        state: p.state,
        zip: p.zip,
        country: p.country,
      },
      idType: p.idType,
      idNumber: p.idNumber,
      idExpiration: p.idExpiration,
      ...(isUbo
        ? { ownershipPercentage: Number(p.ownershipPercentage) || 0 }
        : {}),
    };
  }

  function handleSubmit() {
    const payload: OnboardingFormPayload = {
      businessInfo: {
        legalName: business.legalName,
        dba: business.dba,
        ein: business.ein,
        entityType: business.entityType,
        stateOfIncorporation: business.stateOfIncorporation,
        dateOfIncorporation: business.dateOfIncorporation,
        address: {
          street: business.street,
          city: business.city,
          state: business.state,
          zip: business.zip,
          country: business.country,
        },
        phone: business.phone,
        website: business.website,
        industry: business.industry,
        description: business.description,
      },
      controlPersons: controlPersons.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p) => personFormToType(p, false) as any
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ubos: ubos.map((p) => personFormToType(p, true) as any),
      documents: documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        uploadedAt: new Date().toISOString(),
        url: "#",
      })),
      purposeOfAccount,
      sourceOfFunds,
      sourceOfFundsDetail,
      expectedTxnVolume,
      expectedTxnValue,
      geographicExposure,
      ofacConsent,
      pepDisclosure,
      adverseMediaAck,
      tosAccepted,
      certifiedAccurate,
      uboComplete,
      signatoryName,
      signatoryTitle,
    };
    submitOnboarding(payload);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            Client Onboarding Application
          </h1>
          <button
            onClick={prefillDemoData}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg"
            style={{
              backgroundColor: "#FF00B8",
              boxShadow: "0 0 12px rgba(255,0,184,0.5)",
            }}
          >
            <Sparkles className="w-4 h-4" />
            Prefill Demo Data
          </button>
        </div>

        <nav className="flex items-center justify-between mb-8 flex-wrap gap-2">
          {steps.map((step, i) => (
            <button
              key={step.key}
              onClick={() => setCurrentStep(step.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === step.key
                  ? "bg-interro-primary-soft text-interro-primary"
                  : i < currentStepIndex
                  ? "text-interro-accent"
                  : "text-gray-400"
              }`}
            >
              <span
                className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                  currentStep === step.key
                    ? "bg-interro-primary text-white"
                    : i < currentStepIndex
                    ? "bg-interro-accent-soft text-interro-accent"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i < currentStepIndex ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
          ))}
        </nav>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {currentStep === "business" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Business Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Legal Entity Name *"
                  value={business.legalName}
                  onChange={(v) => setBusiness({ ...business, legalName: v })}
                  full
                />
                <Input
                  label="DBA"
                  value={business.dba}
                  onChange={(v) => setBusiness({ ...business, dba: v })}
                />
                <Input
                  label="EIN / Tax ID *"
                  value={business.ein}
                  onChange={(v) => setBusiness({ ...business, ein: v })}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type *
                  </label>
                  <select
                    value={business.entityType}
                    onChange={(e) =>
                      setBusiness({ ...business, entityType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  >
                    <option value="">Select type</option>
                    <option value="LLC">LLC</option>
                    <option value="Corporation">Corporation</option>
                    <option value="LP">Limited Partnership</option>
                    <option value="LLP">LLP</option>
                    <option value="Trust">Trust</option>
                  </select>
                </div>
                <Input
                  label="State/Jurisdiction of Incorporation *"
                  value={business.stateOfIncorporation}
                  onChange={(v) =>
                    setBusiness({ ...business, stateOfIncorporation: v })
                  }
                />
                <Input
                  label="Date of Incorporation *"
                  type="date"
                  value={business.dateOfIncorporation}
                  onChange={(v) =>
                    setBusiness({ ...business, dateOfIncorporation: v })
                  }
                />
                <Input
                  label="Phone *"
                  value={business.phone}
                  onChange={(v) => setBusiness({ ...business, phone: v })}
                />
                <Input
                  label="Website"
                  value={business.website}
                  onChange={(v) => setBusiness({ ...business, website: v })}
                />
                <Input
                  label="Industry *"
                  value={business.industry}
                  onChange={(v) => setBusiness({ ...business, industry: v })}
                />
                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Business Address
                  </h3>
                </div>
                <Input
                  label="Street *"
                  value={business.street}
                  onChange={(v) => setBusiness({ ...business, street: v })}
                  full
                />
                <Input
                  label="City *"
                  value={business.city}
                  onChange={(v) => setBusiness({ ...business, city: v })}
                />
                <Input
                  label="State *"
                  value={business.state}
                  onChange={(v) => setBusiness({ ...business, state: v })}
                />
                <Input
                  label="ZIP *"
                  value={business.zip}
                  onChange={(v) => setBusiness({ ...business, zip: v })}
                />
                <Input
                  label="Country *"
                  value={business.country}
                  onChange={(v) => setBusiness({ ...business, country: v })}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Description *
                  </label>
                  <textarea
                    value={business.description}
                    onChange={(e) =>
                      setBusiness({ ...business, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Account Purpose & Use
                  </h3>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose of Account *
                  </label>
                  <textarea
                    value={purposeOfAccount}
                    onChange={(e) => setPurposeOfAccount(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source of Funds *
                  </label>
                  <select
                    value={sourceOfFunds}
                    onChange={(e) => setSourceOfFunds(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  >
                    <option value="">Select source</option>
                    <option value="Operating Revenue">Operating Revenue</option>
                    <option value="Investment Capital">Investment Capital</option>
                    <option value="Loan Proceeds">Loan Proceeds</option>
                    <option value="Owner Contribution">Owner Contribution</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  label="Source of Funds — Detail"
                  value={sourceOfFundsDetail}
                  onChange={setSourceOfFundsDetail}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Monthly Txn Volume *
                  </label>
                  <select
                    value={expectedTxnVolume}
                    onChange={(e) => setExpectedTxnVolume(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  >
                    <option value="">Select range</option>
                    <option value="1-10">1-10</option>
                    <option value="11-20">11-20</option>
                    <option value="21-50">21-50</option>
                    <option value="51-100">51-100</option>
                    <option value="100+">100+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Monthly Txn Value *
                  </label>
                  <select
                    value={expectedTxnValue}
                    onChange={(e) => setExpectedTxnValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
                  >
                    <option value="">Select range</option>
                    <option value="<$100K">&lt;$100K</option>
                    <option value="$100K-$1M">$100K-$1M</option>
                    <option value="$1M-$10M">$1M-$10M</option>
                    <option value="$10M-$50M">$10M-$50M</option>
                    <option value="$50M+">$50M+</option>
                  </select>
                </div>
                <Input
                  label="Geographic Exposure *"
                  value={geographicExposure}
                  onChange={setGeographicExposure}
                  full
                />
              </div>
            </div>
          )}

          {currentStep === "control" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Control Persons
                  </h2>
                  <p className="text-sm text-gray-500">
                    Individuals with significant control over the entity.
                  </p>
                </div>
                <button
                  onClick={() =>
                    addPerson(controlPersons, setControlPersons)
                  }
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
                >
                  <Plus className="w-4 h-4" /> Add Person
                </button>
              </div>
              {controlPersons.map((person, index) => (
                <PersonFormFields
                  key={person.id}
                  person={person}
                  label={`Control Person ${index + 1}`}
                  showOwnership={false}
                  canRemove={controlPersons.length > 1}
                  onChange={(field, value) =>
                    updatePerson(
                      controlPersons,
                      setControlPersons,
                      index,
                      field,
                      value
                    )
                  }
                  onRemove={() =>
                    removePerson(
                      controlPersons,
                      setControlPersons,
                      index
                    )
                  }
                />
              ))}
            </div>
          )}

          {currentStep === "ubos" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ultimate Beneficial Owners (UBOs)
                  </h2>
                  <p className="text-sm text-gray-500">
                    Individuals with 10%+ ownership in the entity.
                  </p>
                </div>
                <button
                  onClick={() => addPerson(ubos, setUbos)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-interro-primary bg-interro-primary-soft rounded-lg hover:bg-interro-accent-soft"
                >
                  <Plus className="w-4 h-4" /> Add UBO
                </button>
              </div>
              {ubos.map((person, index) => (
                <PersonFormFields
                  key={person.id}
                  person={person}
                  label={`Beneficial Owner ${index + 1}`}
                  showOwnership
                  canRemove={ubos.length > 1}
                  onChange={(field, value) =>
                    updatePerson(ubos, setUbos, index, field, value)
                  }
                  onRemove={() => removePerson(ubos, setUbos, index)}
                />
              ))}
            </div>
          )}

          {currentStep === "documents" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Document Upload
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload the required documents.
              </p>
              <div className="space-y-3">
                {[
                  {
                    type: "formation_document",
                    label: "Certificate of Formation / Articles of Incorporation",
                    required: true,
                  },
                  {
                    type: "operating_agreement",
                    label: "Operating Agreement / Bylaws",
                    required: true,
                  },
                  {
                    type: "ein_letter",
                    label: "IRS EIN Confirmation Letter",
                    required: true,
                  },
                  {
                    type: "good_standing",
                    label: "Certificate of Good Standing",
                    required: false,
                  },
                ].map((docType) => {
                  const uploaded = documents.find(
                    (d) => d.type === docType.type
                  );
                  return (
                    <div
                      key={docType.type}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {docType.label}
                          {docType.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        {uploaded && (
                          <p className="text-xs text-interro-accent mt-1">
                            Uploaded: {uploaded.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const name = `${docType.label
                            .replace(/[^a-zA-Z ]/g, "")
                            .trim()
                            .replace(/ /g, "_")}.pdf`;
                          setDocuments((prev) => [
                            ...prev.filter((d) => d.type !== docType.type),
                            {
                              id: crypto.randomUUID(),
                              name,
                              type: docType.type,
                            },
                          ]);
                        }}
                        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg ${
                          uploaded
                            ? "text-interro-accent bg-interro-accent-soft"
                            : "text-interro-primary bg-interro-primary-soft hover:bg-interro-accent-soft"
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        {uploaded ? "Replace" : "Upload"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === "screening" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Compliance Screening
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Please acknowledge the following.
              </p>
              <div className="space-y-3">
                <Checkbox
                  checked={ofacConsent}
                  onChange={setOfacConsent}
                  label="I consent to OFAC and sanctions screening for the entity, authorized persons, and UBOs."
                />
                <Checkbox
                  checked={pepDisclosure}
                  onChange={setPepDisclosure}
                  label="I confirm that all Politically Exposed Persons (PEPs) related to this entity have been disclosed."
                />
                <Checkbox
                  checked={adverseMediaAck}
                  onChange={setAdverseMediaAck}
                  label="I acknowledge that Interro performs adverse media screening as part of its compliance process."
                />
              </div>
            </div>
          )}

          {currentStep === "review" && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Review Your Application
              </h2>
              <div className="space-y-6">
                <ReviewCard title="Business Information">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Legal Name</dt>
                    <dd className="text-gray-900">
                      {business.legalName || "—"}
                    </dd>
                    <dt className="text-gray-500">EIN</dt>
                    <dd className="text-gray-900">{business.ein || "—"}</dd>
                    <dt className="text-gray-500">Entity Type</dt>
                    <dd className="text-gray-900">
                      {business.entityType || "—"}
                    </dd>
                    <dt className="text-gray-500">Industry</dt>
                    <dd className="text-gray-900">
                      {business.industry || "—"}
                    </dd>
                    <dt className="text-gray-500">Purpose</dt>
                    <dd className="text-gray-900">
                      {purposeOfAccount || "—"}
                    </dd>
                    <dt className="text-gray-500">Source of Funds</dt>
                    <dd className="text-gray-900">{sourceOfFunds || "—"}</dd>
                    <dt className="text-gray-500">Expected Volume</dt>
                    <dd className="text-gray-900">
                      {expectedTxnVolume || "—"}
                    </dd>
                    <dt className="text-gray-500">Expected Value</dt>
                    <dd className="text-gray-900">{expectedTxnValue || "—"}</dd>
                  </dl>
                </ReviewCard>
                <ReviewCard title={`Control Persons (${controlPersons.length})`}>
                  {controlPersons.map((p) => (
                    <div key={p.id} className="text-sm text-gray-900">
                      {p.firstName} {p.lastName}
                      {p.title && ` — ${p.title}`}
                    </div>
                  ))}
                </ReviewCard>
                <ReviewCard title={`Beneficial Owners (${ubos.length})`}>
                  {ubos.map((p) => (
                    <div key={p.id} className="text-sm text-gray-900">
                      {p.firstName} {p.lastName}
                      {p.ownershipPercentage &&
                        ` — ${p.ownershipPercentage}% ownership`}
                    </div>
                  ))}
                </ReviewCard>
                <ReviewCard title={`Documents (${documents.length})`}>
                  {documents.length > 0 ? (
                    documents.map((d) => (
                      <div key={d.id} className="text-sm text-gray-900">
                        {d.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">
                      No documents uploaded
                    </p>
                  )}
                </ReviewCard>

                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Certifications & Signature
                  </h3>
                  <Checkbox
                    checked={tosAccepted}
                    onChange={setTosAccepted}
                    label="I have read and accept Interro's Terms of Service."
                  />
                  <Checkbox
                    checked={certifiedAccurate}
                    onChange={setCertifiedAccurate}
                    label="I certify that all information provided is true and accurate."
                  />
                  <Checkbox
                    checked={uboComplete}
                    onChange={setUboComplete}
                    label="I certify that all UBOs with 10% or greater ownership have been disclosed."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="Signatory Name *"
                      value={signatoryName}
                      onChange={setSignatoryName}
                    />
                    <Input
                      label="Signatory Title *"
                      value={signatoryTitle}
                      onChange={setSignatoryTitle}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {currentStep === "review" ? (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover"
              >
                Submit Application
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
      />
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-interro-primary"
      />
      <span>{label}</span>
    </label>
  );
}

function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PersonFormFields({
  person,
  label,
  showOwnership,
  canRemove,
  onChange,
  onRemove,
}: {
  person: PersonForm;
  label: string;
  showOwnership: boolean;
  canRemove: boolean;
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        {canRemove && (
          <button
            onClick={onRemove}
            className="text-red-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name *"
          value={person.firstName}
          onChange={(v) => onChange("firstName", v)}
        />
        <Input
          label="Last Name *"
          value={person.lastName}
          onChange={(v) => onChange("lastName", v)}
        />
        <Input
          label="Email *"
          value={person.email}
          onChange={(v) => onChange("email", v)}
        />
        <Input
          label="Title / Role *"
          value={person.title}
          onChange={(v) => onChange("title", v)}
        />
        <Input
          label="Phone *"
          value={person.phone}
          onChange={(v) => onChange("phone", v)}
        />
        <Input
          label="Date of Birth *"
          type="date"
          value={person.dateOfBirth}
          onChange={(v) => onChange("dateOfBirth", v)}
        />
        <Input
          label="SSN / Tax ID *"
          value={person.ssn}
          onChange={(v) => onChange("ssn", v)}
        />
        {showOwnership && (
          <Input
            label="Ownership % *"
            type="number"
            value={person.ownershipPercentage || ""}
            onChange={(v) => onChange("ownershipPercentage", v)}
          />
        )}
        <Input
          label="Street *"
          value={person.street}
          onChange={(v) => onChange("street", v)}
          full
        />
        <Input
          label="City *"
          value={person.city}
          onChange={(v) => onChange("city", v)}
        />
        <Input
          label="State *"
          value={person.state}
          onChange={(v) => onChange("state", v)}
        />
        <Input
          label="ZIP *"
          value={person.zip}
          onChange={(v) => onChange("zip", v)}
        />
        <Input
          label="Country *"
          value={person.country}
          onChange={(v) => onChange("country", v)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Type *
          </label>
          <select
            value={person.idType}
            onChange={(e) => onChange("idType", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-interro-primary focus:border-interro-primary"
          >
            <option value="Drivers License">Driver&apos;s License</option>
            <option value="Passport">Passport</option>
            <option value="State ID">State ID</option>
          </select>
        </div>
        <Input
          label="ID Number *"
          value={person.idNumber}
          onChange={(v) => onChange("idNumber", v)}
        />
        <Input
          label="ID Expiration *"
          type="date"
          value={person.idExpiration}
          onChange={(v) => onChange("idExpiration", v)}
        />
      </div>
    </div>
  );
}
