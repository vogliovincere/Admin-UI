"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ControlPerson,
  BankAccount,
  BusinessInfo,
  DocumentUpload,
  EDDDocument,
  OnboardingApplication,
  OnboardingStatus,
  UBO,
} from "@/types";
import { mockApplications } from "@/lib/mock-data";

const STORAGE_KEY = "interro-demo-state";
const OVERRIDES_KEY = "interro-demo-app-overrides";
const ACTIVE_CLIENT_KEY = "interro-demo-active-client";

export type ClientAppStatus =
  | "draft"
  | "submitted"
  | "edd_pending"
  | "edd_in_review"
  | "approved"
  | "closed";

export interface ClientBankAccount extends BankAccount {
  status: "pending" | "approved";
}

export interface ClientAppState {
  id: string;
  status: ClientAppStatus;
  submittedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  closureReason?: string;
  businessInfo: BusinessInfo;
  // Section 4 fields
  purposeOfAccount: string;
  sourceOfFunds: string;
  sourceOfFundsDetail: string;
  expectedTxnVolume: string;
  expectedTxnValue: string;
  geographicExposure: string;
  // Section 5
  ofacConsent: boolean;
  pepDisclosure: boolean;
  adverseMediaAck: boolean;
  // Section 7
  tosAccepted: boolean;
  certifiedAccurate: boolean;
  uboComplete: boolean;
  signatoryName: string;
  signatoryTitle: string;
  controlPersons: ControlPerson[];
  ubos: UBO[];
  documents: DocumentUpload[];
  eddItems: EDDDocument[];
  bankAccounts: ClientBankAccount[];
  balance: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  alloyJourneyId?: string;
}

export interface OnboardingFormPayload {
  businessInfo: BusinessInfo;
  controlPersons: ControlPerson[];
  ubos: UBO[];
  documents: DocumentUpload[];
  purposeOfAccount: string;
  sourceOfFunds: string;
  sourceOfFundsDetail: string;
  expectedTxnVolume: string;
  expectedTxnValue: string;
  geographicExposure: string;
  ofacConsent: boolean;
  pepDisclosure: boolean;
  adverseMediaAck: boolean;
  tosAccepted: boolean;
  certifiedAccurate: boolean;
  uboComplete: boolean;
  signatoryName: string;
  signatoryTitle: string;
}

export interface AddBankAccountPayload {
  bankName: string;
  holderName: string;
  nickname: string;
  routingNumber: string;
  accountNumber: string;
  accountType: string;
}

export interface AppOverride {
  status?: OnboardingStatus | "closed";
  closureReason?: string;
  closedAt?: string;
  approvedAt?: string;
  eddItems?: EDDDocument[];
  bankAccounts?: ClientBankAccount[];
}

export type AppOverrides = Record<string, AppOverride>;

export interface ActiveClientView {
  appId: string;
  legalName: string;
  status: OnboardingStatus | "closed";
  eddItems: EDDDocument[];
  bankAccounts: ClientBankAccount[];
  approvedAt?: string;
  closedAt?: string;
  closureReason?: string;
  balance: number;
  alloyJourneyId?: string;
}

interface DemoStateContextValue {
  clientApp: ClientAppState | null;
  appOverrides: AppOverrides;
  activeClientAppId: string | null;
  isHydrated: boolean;
  reset: () => void;
  submitOnboarding: (form: OnboardingFormPayload) => void;
  approveApp: () => void;
  denyApp: (reason: string) => void;
  addEddItem: (label: string, description: string) => void;
  submitEddItem: (id: string, textResponse: string, fileName?: string) => void;
  addBankAccount: (form: AddBankAccountPayload) => void;
  closeAccount: (reason: string) => void;
  // Per-application persisted actions (work for ALL applications)
  approveApplication: (appId: string) => void;
  denyApplication: (appId: string, reason: string) => void;
  requestEddOnApplication: (
    appId: string,
    label: string,
    description: string
  ) => void;
  submitEddOnApplication: (
    appId: string,
    eddItemId: string,
    response: { textResponse?: string; uploadedFile?: DocumentUpload }
  ) => void;
  addBankAccountToApplication: (
    appId: string,
    form: AddBankAccountPayload
  ) => void;
  closeApplication: (appId: string, reason: string) => void;
  // Active-client derived view + convenience actions bound to it
  getActiveClientView: () => ActiveClientView | null;
  submitActiveClientEdd: (
    eddItemId: string,
    response: { textResponse?: string; uploadedFile?: DocumentUpload }
  ) => void;
  addBankAccountToActiveClient: (form: AddBankAccountPayload) => void;
}

const DemoStateContext = createContext<DemoStateContextValue | null>(null);

function mask(value: string, last: number = 4): string {
  if (!value) return "";
  const tail = value.slice(-last);
  return "****" + tail;
}

export function DemoStateProvider({ children }: { children: React.ReactNode }) {
  const [clientApp, setClientApp] = useState<ClientAppState | null>(null);
  const [appOverrides, setAppOverrides] = useState<AppOverrides>({});
  const [activeClientAppId, setActiveClientAppIdState] = useState<string | null>(
    null
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ClientAppState;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClientApp(parsed);
      }
      const rawO = localStorage.getItem(OVERRIDES_KEY);
      if (rawO) {
        const parsedO = JSON.parse(rawO) as AppOverrides;
        setAppOverrides(parsedO);
      }
      const rawA = localStorage.getItem(ACTIVE_CLIENT_KEY);
      if (rawA) {
        try {
          const parsedA = JSON.parse(rawA) as string | null;
          setActiveClientAppIdState(parsedA);
        } catch {
          // raw string fallback
          setActiveClientAppIdState(rawA);
        }
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
  }, []);

  const persist = useCallback((next: ClientAppState | null) => {
    try {
      if (next === null) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // ignore
    }
  }, []);

  const persistOverrides = useCallback((next: AppOverrides) => {
    try {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setActiveClientAppId = useCallback((id: string | null) => {
    setActiveClientAppIdState(id);
    try {
      if (id === null) {
        localStorage.removeItem(ACTIVE_CLIENT_KEY);
      } else {
        localStorage.setItem(ACTIVE_CLIENT_KEY, JSON.stringify(id));
      }
    } catch {
      // ignore
    }
  }, []);

  const update = useCallback(
    (updater: (curr: ClientAppState | null) => ClientAppState | null) => {
      setClientApp((curr) => {
        const next = updater(curr);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateOverrides = useCallback(
    (appId: string, patcher: (curr: AppOverride) => AppOverride) => {
      setAppOverrides((curr) => {
        const next: AppOverrides = {
          ...curr,
          [appId]: patcher(curr[appId] || {}),
        };
        persistOverrides(next);
        return next;
      });
    },
    [persistOverrides]
  );

  const reset = useCallback(() => {
    pendingTimeoutsRef.current.forEach((t) => clearTimeout(t));
    pendingTimeoutsRef.current.clear();
    setClientApp(null);
    persist(null);
    setAppOverrides({});
    setActiveClientAppId(null);
    try {
      localStorage.removeItem(OVERRIDES_KEY);
    } catch {
      // ignore
    }
  }, [persist, setActiveClientAppId]);

  const submitOnboarding = useCallback(
    (form: OnboardingFormPayload) => {
      const now = new Date().toISOString();
      // Generate synthetic Alloy journey id
      const journeyId =
        "JRN-DEMO-" + Math.random().toString(36).slice(2, 6).toUpperCase();
      const next: ClientAppState = {
        id: "APP-DEMO",
        status: "submitted",
        submittedAt: now,
        businessInfo: form.businessInfo,
        purposeOfAccount: form.purposeOfAccount,
        sourceOfFunds: form.sourceOfFunds,
        sourceOfFundsDetail: form.sourceOfFundsDetail,
        expectedTxnVolume: form.expectedTxnVolume,
        expectedTxnValue: form.expectedTxnValue,
        geographicExposure: form.geographicExposure,
        ofacConsent: form.ofacConsent,
        pepDisclosure: form.pepDisclosure,
        adverseMediaAck: form.adverseMediaAck,
        tosAccepted: form.tosAccepted,
        certifiedAccurate: form.certifiedAccurate,
        uboComplete: form.uboComplete,
        signatoryName: form.signatoryName,
        signatoryTitle: form.signatoryTitle,
        controlPersons: form.controlPersons,
        ubos: form.ubos,
        documents: form.documents,
        eddItems: [],
        bankAccounts: [],
        balance: 0,
        riskScore: 38,
        riskLevel: "low",
        alloyJourneyId: journeyId,
      };
      update(() => next);
      setActiveClientAppId("APP-DEMO");
    },
    [update, setActiveClientAppId]
  );

  const approveApp = useCallback(() => {
    update((curr) =>
      curr
        ? { ...curr, status: "approved", approvedAt: new Date().toISOString() }
        : curr
    );
  }, [update]);

  const denyApp = useCallback(
    (reason: string) => {
      update((curr) =>
        curr
          ? {
              ...curr,
              status: "closed",
              closureReason: `Denied: ${reason}`,
              closedAt: new Date().toISOString(),
            }
          : curr
      );
    },
    [update]
  );

  const addEddItem = useCallback(
    (label: string, description: string) => {
      update((curr) => {
        if (!curr) return curr;
        const newItem: EDDDocument = {
          id: `EDD-${Date.now()}`,
          label,
          description,
          required: true,
        };
        return {
          ...curr,
          status: "edd_pending",
          eddItems: [...curr.eddItems, newItem],
        };
      });
    },
    [update]
  );

  const submitEddItem = useCallback(
    (id: string, textResponse: string, fileName?: string) => {
      update((curr) => {
        if (!curr) return curr;
        const now = new Date().toISOString();
        const eddItems = curr.eddItems.map((item) =>
          item.id === id
            ? {
                ...item,
                textResponse: textResponse || undefined,
                uploadedFile: fileName
                  ? {
                      id: `DOC-${Date.now()}`,
                      name: fileName,
                      type: "edd_response",
                      uploadedAt: now,
                      url: "#",
                    }
                  : item.uploadedFile,
                submittedAt: now,
              }
            : item
        );
        const allSubmitted = eddItems.every((i) => i.submittedAt);
        return {
          ...curr,
          eddItems,
          status: allSubmitted ? "edd_in_review" : "edd_pending",
        };
      });
    },
    [update]
  );

  const addBankAccount = useCallback(
    (form: AddBankAccountPayload) => {
      const newId = `BA-${Date.now()}`;
      const now = new Date().toISOString();
      let isFirstAdded = false;
      update((curr) => {
        if (!curr) return curr;
        isFirstAdded = curr.bankAccounts.length === 0;
        const score = isFirstAdded ? 97 : 95;
        const newAccount: ClientBankAccount = {
          id: newId,
          bankName: form.bankName,
          holderName: form.holderName,
          nickname: form.nickname,
          accountType: form.accountType,
          routingNumber: mask(form.routingNumber),
          accountNumber: mask(form.accountNumber),
          verificationStatus: "pending",
          linkedAt: now,
          status: "pending",
          socureScore: score,
          socureTags: ["Name Matched"],
        };
        return { ...curr, bankAccounts: [...curr.bankAccounts, newAccount] };
      });

      const timeout = setTimeout(() => {
        pendingTimeoutsRef.current.delete(timeout);
        update((curr) => {
          if (!curr) return curr;
          return {
            ...curr,
            bankAccounts: curr.bankAccounts.map((b) =>
              b.id === newId
                ? {
                    ...b,
                    status: "approved" as const,
                    verificationStatus: "verified" as const,
                    verifiedAt: new Date().toISOString(),
                  }
                : b
            ),
          };
        });
      }, 1000);
      pendingTimeoutsRef.current.add(timeout);
    },
    [update]
  );

  const closeAccount = useCallback(
    (reason: string) => {
      update((curr) =>
        curr
          ? {
              ...curr,
              status: "closed",
              closureReason: reason,
              closedAt: new Date().toISOString(),
            }
          : curr
      );
    },
    [update]
  );

  // ─── Per-application persisted actions ──────────────────────────────────

  const isDemoAppId = useCallback(
    (appId: string) => !!clientApp && clientApp.id === appId,
    [clientApp]
  );

  const approveApplication = useCallback(
    (appId: string) => {
      setActiveClientAppId(appId);
      const now = new Date().toISOString();
      updateOverrides(appId, (curr) => ({
        ...curr,
        status: "approved",
        approvedAt: now,
      }));
      if (isDemoAppId(appId)) approveApp();
    },
    [setActiveClientAppId, updateOverrides, isDemoAppId, approveApp]
  );

  const denyApplication = useCallback(
    (appId: string, reason: string) => {
      setActiveClientAppId(appId);
      const now = new Date().toISOString();
      updateOverrides(appId, (curr) => ({
        ...curr,
        status: "closed",
        closureReason: `Denied: ${reason}`,
        closedAt: now,
      }));
      if (isDemoAppId(appId)) denyApp(reason);
    },
    [setActiveClientAppId, updateOverrides, isDemoAppId, denyApp]
  );

  const requestEddOnApplication = useCallback(
    (appId: string, label: string, description: string) => {
      setActiveClientAppId(appId);
      const newItem: EDDDocument = {
        id: `EDD-${Date.now()}`,
        label,
        description,
        required: true,
      };
      updateOverrides(appId, (curr) => ({
        ...curr,
        status: "edd_required",
        eddItems: [...(curr.eddItems ?? []), newItem],
      }));
      if (isDemoAppId(appId)) addEddItem(label, description);
    },
    [setActiveClientAppId, updateOverrides, isDemoAppId, addEddItem]
  );

  const submitEddOnApplication = useCallback(
    (
      appId: string,
      eddItemId: string,
      response: { textResponse?: string; uploadedFile?: DocumentUpload }
    ) => {
      setActiveClientAppId(appId);
      const now = new Date().toISOString();
      updateOverrides(appId, (curr) => {
        const items = curr.eddItems ?? [];
        return {
          ...curr,
          eddItems: items.map((it) =>
            it.id === eddItemId
              ? {
                  ...it,
                  textResponse: response.textResponse,
                  uploadedFile: response.uploadedFile ?? it.uploadedFile,
                  submittedAt: now,
                }
              : it
          ),
        };
      });
      if (isDemoAppId(appId)) {
        submitEddItem(
          eddItemId,
          response.textResponse ?? "",
          response.uploadedFile?.name
        );
      }
    },
    [setActiveClientAppId, updateOverrides, isDemoAppId, submitEddItem]
  );

  const addBankAccountToApplication = useCallback(
    (appId: string, form: AddBankAccountPayload) => {
      setActiveClientAppId(appId);
      const newId = `BA-${Date.now()}`;
      const now = new Date().toISOString();
      updateOverrides(appId, (curr) => {
        const existing = curr.bankAccounts ?? [];
        const isFirst = existing.length === 0;
        const score = isFirst ? 97 : 95;
        const newAccount: ClientBankAccount = {
          id: newId,
          bankName: form.bankName,
          holderName: form.holderName,
          nickname: form.nickname,
          accountType: form.accountType,
          routingNumber: mask(form.routingNumber),
          accountNumber: mask(form.accountNumber),
          verificationStatus: "pending",
          linkedAt: now,
          status: "pending",
          socureScore: score,
          socureTags: ["Name Matched"],
        };
        return { ...curr, bankAccounts: [...existing, newAccount] };
      });
      if (isDemoAppId(appId)) addBankAccount(form);

      // Flip pending -> approved after 1s
      const timeout = setTimeout(() => {
        pendingTimeoutsRef.current.delete(timeout);
        setAppOverrides((curr) => {
          const ov = curr[appId];
          if (!ov || !ov.bankAccounts) return curr;
          const next: AppOverrides = {
            ...curr,
            [appId]: {
              ...ov,
              bankAccounts: ov.bankAccounts.map((b) =>
                b.id === newId
                  ? {
                      ...b,
                      status: "approved" as const,
                      verificationStatus: "verified" as const,
                      verifiedAt: new Date().toISOString(),
                    }
                  : b
              ),
            },
          };
          persistOverrides(next);
          return next;
        });
      }, 1000);
      pendingTimeoutsRef.current.add(timeout);
    },
    [setActiveClientAppId, updateOverrides, isDemoAppId, addBankAccount, persistOverrides]
  );

  const closeApplication = useCallback(
    (appId: string, reason: string) => {
      setActiveClientAppId(appId);
      const now = new Date().toISOString();
      updateOverrides(appId, (curr) => ({
        ...curr,
        status: "closed",
        closureReason: reason,
        closedAt: now,
      }));
      if (isDemoAppId(appId)) closeAccount(reason);
    },
    [setActiveClientAppId, updateOverrides, isDemoAppId, closeAccount]
  );

  // ─── Active client view (derived) ──────────────────────────────────────
  const getActiveClientView = useCallback((): ActiveClientView | null => {
    if (activeClientAppId === null) return null;

    // Case 1: demo client (APP-DEMO)
    if (clientApp && clientApp.id === activeClientAppId) {
      const override = appOverrides[activeClientAppId];
      // Build effective status from override > clientApp.status
      let status: OnboardingStatus | "closed";
      if (override?.status) {
        status = override.status;
      } else {
        switch (clientApp.status) {
          case "edd_pending":
          case "edd_in_review":
            status = "edd_required";
            break;
          case "draft":
            status = "draft";
            break;
          case "submitted":
            status = "submitted";
            break;
          case "approved":
            status = "approved";
            break;
          case "closed":
            status = "closed";
            break;
          default:
            status = "submitted";
        }
      }
      // Merge EDD items (dedupe by id, override-wins)
      const baseEdd = clientApp.eddItems ?? [];
      const overrideEdd = override?.eddItems ?? [];
      const eddMap = new Map<string, EDDDocument>();
      for (const it of baseEdd) eddMap.set(it.id, it);
      for (const it of overrideEdd) eddMap.set(it.id, it);
      const eddItems = Array.from(eddMap.values());
      // Bank accounts: override > clientApp
      const bankAccounts =
        override?.bankAccounts ?? clientApp.bankAccounts ?? [];
      return {
        appId: clientApp.id,
        legalName: clientApp.businessInfo.legalName,
        status,
        eddItems,
        bankAccounts,
        approvedAt: override?.approvedAt ?? clientApp.approvedAt,
        closedAt: override?.closedAt ?? clientApp.closedAt,
        closureReason: override?.closureReason ?? clientApp.closureReason,
        balance: clientApp.balance,
        alloyJourneyId: clientApp.alloyJourneyId,
      };
    }

    // Case 2: seed application
    const seed = mockApplications.find((a) => a.id === activeClientAppId);
    if (!seed) return null;
    const override = appOverrides[activeClientAppId];
    const status: OnboardingStatus | "closed" =
      override?.status ?? seed.status;
    // Merge EDD items: base eddDocuments + override eddItems, dedupe by id
    const baseEdd = seed.eddDocuments ?? [];
    const overrideEdd = override?.eddItems ?? [];
    const eddMap = new Map<string, EDDDocument>();
    for (const it of baseEdd) eddMap.set(it.id, it);
    for (const it of overrideEdd) eddMap.set(it.id, it);
    const eddItems = Array.from(eddMap.values());
    const bankAccounts: ClientBankAccount[] = override?.bankAccounts ?? [];
    return {
      appId: seed.id,
      legalName: seed.businessInfo.legalName,
      status,
      eddItems,
      bankAccounts,
      approvedAt: override?.approvedAt,
      closedAt: override?.closedAt ?? seed.closedAt,
      closureReason: override?.closureReason ?? seed.closureReason,
      balance: seed.balance ?? 0,
      alloyJourneyId: seed.alloyJourneyId,
    };
  }, [activeClientAppId, clientApp, appOverrides]);

  // Memoize the result so consumers see stable identity when nothing changed
  const memoActiveClientView = useMemo(
    () => getActiveClientView(),
    [getActiveClientView]
  );
  const getActiveClientViewStable = useCallback(
    () => memoActiveClientView,
    [memoActiveClientView]
  );

  const submitActiveClientEdd = useCallback(
    (
      eddItemId: string,
      response: { textResponse?: string; uploadedFile?: DocumentUpload }
    ) => {
      if (!activeClientAppId) return;
      submitEddOnApplication(activeClientAppId, eddItemId, response);
    },
    [activeClientAppId, submitEddOnApplication]
  );

  const addBankAccountToActiveClient = useCallback(
    (form: AddBankAccountPayload) => {
      if (!activeClientAppId) return;
      addBankAccountToApplication(activeClientAppId, form);
    },
    [activeClientAppId, addBankAccountToApplication]
  );

  useEffect(() => {
    const set = pendingTimeoutsRef.current;
    return () => {
      set.forEach((t) => clearTimeout(t));
      set.clear();
    };
  }, []);

  return (
    <DemoStateContext.Provider
      value={{
        clientApp,
        appOverrides,
        activeClientAppId,
        isHydrated,
        reset,
        submitOnboarding,
        approveApp,
        denyApp,
        addEddItem,
        submitEddItem,
        addBankAccount,
        closeAccount,
        approveApplication,
        denyApplication,
        requestEddOnApplication,
        submitEddOnApplication,
        addBankAccountToApplication,
        closeApplication,
        getActiveClientView: getActiveClientViewStable,
        submitActiveClientEdd,
        addBankAccountToActiveClient,
      }}
    >
      {children}
    </DemoStateContext.Provider>
  );
}

export function useDemoState(): DemoStateContextValue {
  const ctx = useContext(DemoStateContext);
  if (!ctx) {
    throw new Error("useDemoState must be used inside DemoStateProvider");
  }
  return ctx;
}

/**
 * Adapt the demo client app into a standard OnboardingApplication
 * for use in admin Applications list/detail.
 */
export function toApplication(app: ClientAppState): OnboardingApplication {
  let appStatus: OnboardingApplication["status"];
  switch (app.status) {
    case "draft":
      appStatus = "draft";
      break;
    case "submitted":
      appStatus = "submitted";
      break;
    case "edd_pending":
    case "edd_in_review":
      appStatus = "edd_required";
      break;
    case "approved":
      appStatus = "approved";
      break;
    case "closed":
      appStatus = "closed";
      break;
    default:
      appStatus = "submitted";
  }
  return {
    id: app.id,
    status: appStatus,
    submittedAt: app.submittedAt,
    updatedAt: app.submittedAt ?? new Date().toISOString(),
    businessInfo: app.businessInfo,
    controlPersons: app.controlPersons,
    ubos: app.ubos,
    documents: app.documents,
    riskScore: app.riskScore,
    riskLevel: app.riskLevel,
    alloyJourneyId: app.alloyJourneyId ?? "JRN-DEMO-001",
    alloyTags: ["us_entity", "demo_client"],
    eddRequired: app.eddItems.length > 0,
    eddDocuments: app.eddItems,
    balance: app.balance,
    closureReason: app.closureReason,
    closedAt: app.closedAt,
  };
}
