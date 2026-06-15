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
  EddOutcome,
  PersonVerificationBadge,
  SessionStatus,
  SessionTimelineEntry,
  VerificationSession,
} from "@/types";
import { verificationSessions } from "@/lib/verification-data";

// Distinct storage key — must NOT collide with demo-state keys (risk §8.1).
const STORAGE_KEY = "interro-verifications-state";

// The admin actor attributed to all admin-initiated actions (mock).
const ADMIN_ACTOR_NAME = "Marco Cesaratto";

export interface VerificationContextValue {
  sessions: VerificationSession[];
  isHydrated: boolean;
  getSession: (sessionId: string) => VerificationSession | undefined;
  // Link lifecycle actions (E2.2). All append to the session audit trail.
  resendLink: (sessionId: string, personId: string) => void;
  regenerateLink: (sessionId: string, personId: string) => void;
  revokeLink: (sessionId: string, personId: string) => void;
  // EDD write-back hook (E3 calls this; implemented now per §6.1).
  recordEddOutcome: (
    sessionId: string,
    personId: string | null,
    outcome: EddOutcome,
    summary?: string
  ) => void;
  // E5 (PD-146 §6.3) — export audit log.
  exportLog: ExportLogEntry[];
  logExport: (entry: Omit<ExportLogEntry, "id" | "timestamp" | "actorName">) => void;
  reset: () => void;
}

// E5 (PD-146 §6.3) — an in-memory export audit entry.
export interface ExportLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  exportType: "session" | "per-person";
  filtersApplied: string; // human-readable summary of active filters
  rowCount: number;
  containsPii: boolean; // true when PII columns (SSN/Tax ID) were included
}

const VerificationContext = createContext<VerificationContextValue | null>(null);

// ───────────────────────── helpers ─────────────────────────

let uidCounter = 0;
function timelineId(): string {
  // Generated only inside event handlers (post-mount), never during render.
  uidCounter += 1;
  return `vt-${Date.now().toString(36)}-${uidCounter}`;
}

function linkToken(): string {
  return "lnk_" + Math.random().toString(16).slice(2, 6);
}

// Derive the link host from a session's organization (mirrors seed data convention).
function linkHost(session: VerificationSession): string {
  const slug = session.organizationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  return `https://${slug || "client"}.interro.co/v`;
}

function findPerson(session: VerificationSession, personId: string) {
  return session.persons.find((p) => p.id === personId);
}

// A.4.5 grouping — resolve the subjectId/subjectLabel for an appended timeline
// entry. A specific personId maps to that person; otherwise it defaults to the
// "business" group (entity sessions) or the primary applicant (solo/joint).
function subjectFor(
  session: VerificationSession,
  personId: string | null
): { subjectId: string; subjectLabel: string } {
  if (personId) {
    const p = findPerson(session, personId);
    if (p) {
      return { subjectId: p.id, subjectLabel: `${p.firstName} ${p.lastName}` };
    }
  }
  if (session.pathType === "entity" && session.entity) {
    return { subjectId: "business", subjectLabel: session.entity.legalName };
  }
  const primary = session.persons[0];
  return {
    subjectId: primary.id,
    subjectLabel: `${primary.firstName} ${primary.lastName}`,
  };
}

// Recompute the session status from per-person badges after an EDD outcome.
// Keeps aggregate tone and status badge coherent (risk §8.7).
function recomputeStatus(
  session: VerificationSession,
  prevStatus: SessionStatus
): SessionStatus {
  // Only recompute for statuses that reflect an in-flight verification.
  // Terminal/admin statuses (denied, expired, abandoned) are left as-is
  // unless explicitly changed elsewhere.
  if (prevStatus === "expired" || prevStatus === "abandoned") {
    return prevStatus;
  }
  const badges = session.persons.map((p) => p.badge);
  const anyDenied = badges.some((b) => b === "denied");
  const allApproved = badges.every((b) => b === "approved");
  if (anyDenied) return "denied";
  if (allApproved) return "approved";
  if (badges.some((b) => b === "under_review")) {
    return "pending_review";
  }
  return "partially_verified";
}

// Immutably patch a single person within a session and append a timeline entry.
function applyPersonPatch(
  sessions: VerificationSession[],
  sessionId: string,
  personId: string,
  patchPerson: (p: VerificationSession["persons"][number]) => VerificationSession["persons"][number],
  entry: SessionTimelineEntry,
  nowIso: string
): VerificationSession[] {
  return sessions.map((s) => {
    if (s.id !== sessionId) return s;
    return {
      ...s,
      lastActivityAt: nowIso,
      persons: s.persons.map((p) => (p.id === personId ? patchPerson(p) : p)),
      timeline: [...s.timeline, entry],
    };
  });
}

// ───────────────────────── provider ─────────────────────────

export function VerificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Seed from the static export into in-memory React state.
  const [sessions, setSessions] = useState<VerificationSession[]>(() =>
    structuredClone(verificationSessions)
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const pendingTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set()
  );

  // Hydrate from localStorage on mount (mirror demo-state.tsx).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as VerificationSession[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSessions(parsed);
        }
      }
    } catch {
      // ignore
    }
    setIsHydrated(true);
    const pending = pendingTimeoutsRef.current;
    return () => {
      pending.forEach((t) => clearTimeout(t));
      pending.clear();
    };
  }, []);

  const persist = useCallback((next: VerificationSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  // Single mutation funnel: apply updater, persist, return next.
  const update = useCallback(
    (updater: (curr: VerificationSession[]) => VerificationSession[]) => {
      setSessions((curr) => {
        const next = updater(curr);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const getSession = useCallback(
    (sessionId: string) => sessions.find((s) => s.id === sessionId),
    [sessions]
  );

  const resendLink = useCallback(
    (sessionId: string, personId: string) => {
      const nowIso = new Date().toISOString();
      update((curr) => {
        const session = curr.find((s) => s.id === sessionId);
        if (!session) return curr;
        const person = findPerson(session, personId);
        if (!person) return curr;
        const name = `${person.firstName} ${person.lastName}`;
        const entry: SessionTimelineEntry = {
          id: timelineId(),
          timestamp: nowIso,
          actor: "admin",
          actorName: ADMIN_ACTOR_NAME,
          action: "Link resent",
          detail: `Verification link re-emailed to ${name}`,
          ...subjectFor(session, personId),
        };
        return applyPersonPatch(
          curr,
          sessionId,
          personId,
          (p) => ({
            ...p,
            badge: p.badge === "not_started" ? "link_sent" : p.badge,
            link: {
              ...(p.link ?? {
                url: `${linkHost(session)}/${linkToken()}`,
              }),
              status: "sent",
              sentVia: "email",
              sentAt: nowIso,
              // refresh 72-hour TTL
              expiresAt: new Date(
                Date.now() + 72 * 60 * 60 * 1000
              ).toISOString(),
            },
          }),
          entry,
          nowIso
        );
      });
    },
    [update]
  );

  const regenerateLink = useCallback(
    (sessionId: string, personId: string) => {
      const nowIso = new Date().toISOString();
      update((curr) => {
        const session = curr.find((s) => s.id === sessionId);
        if (!session) return curr;
        const person = findPerson(session, personId);
        if (!person) return curr;
        const name = `${person.firstName} ${person.lastName}`;
        const newUrl = `${linkHost(session)}/${linkToken()}`;
        const entry: SessionTimelineEntry = {
          id: timelineId(),
          timestamp: nowIso,
          actor: "admin",
          actorName: ADMIN_ACTOR_NAME,
          action: "Link regenerated",
          detail: `New verification link generated and sent to ${name}`,
          ...subjectFor(session, personId),
        };
        return applyPersonPatch(
          curr,
          sessionId,
          personId,
          (p) => ({
            ...p,
            // E2.2 AC5: regenerating returns the badge to "link_sent".
            badge: "link_sent",
            link: {
              url: newUrl,
              status: "sent",
              sentVia: "email",
              sentAt: nowIso,
              expiresAt: new Date(
                Date.now() + 72 * 60 * 60 * 1000
              ).toISOString(),
            },
          }),
          entry,
          nowIso
        );
      });
    },
    [update]
  );

  const revokeLink = useCallback(
    (sessionId: string, personId: string) => {
      const nowIso = new Date().toISOString();
      update((curr) => {
        const session = curr.find((s) => s.id === sessionId);
        if (!session) return curr;
        const person = findPerson(session, personId);
        if (!person || !person.link) return curr;
        const name = `${person.firstName} ${person.lastName}`;
        const entry: SessionTimelineEntry = {
          id: timelineId(),
          timestamp: nowIso,
          actor: "admin",
          actorName: ADMIN_ACTOR_NAME,
          action: "Link revoked",
          detail: `Verification link invalidated for ${name}`,
          ...subjectFor(session, personId),
        };
        return applyPersonPatch(
          curr,
          sessionId,
          personId,
          (p) => ({
            ...p,
            link: p.link ? { ...p.link, status: "revoked" } : p.link,
          }),
          entry,
          nowIso
        );
      });
    },
    [update]
  );

  const recordEddOutcome = useCallback(
    (
      sessionId: string,
      personId: string | null,
      outcome: EddOutcome,
      summary?: string
    ) => {
      const nowIso = new Date().toISOString();
      // Approved → badge approved; Escalate → under_review.
      const nextBadge: PersonVerificationBadge =
        outcome === "Approved" ? "approved" : "under_review";
      const detail =
        summary ??
        (outcome === "Approved"
          ? "Outcome: Approved"
          : "Escalated for review");
      update((curr) => {
        const session = curr.find((s) => s.id === sessionId);
        if (!session) return curr;

        const subjectName = personId
          ? (() => {
              const p = findPerson(session, personId);
              return p ? `${p.firstName} ${p.lastName}` : "subject";
            })()
          : session.entity?.legalName ??
            `${session.persons[0].firstName} ${session.persons[0].lastName}`;

        const entry: SessionTimelineEntry = {
          id: timelineId(),
          timestamp: nowIso,
          actor: "admin",
          actorName: ADMIN_ACTOR_NAME,
          action: "EDD re-run in Alloy",
          detail: `${subjectName} — ${detail}`,
          ...subjectFor(session, personId),
        };

        return curr.map((s) => {
          if (s.id !== sessionId) return s;
          const persons = personId
            ? s.persons.map((p) =>
                p.id === personId ? { ...p, badge: nextBadge } : p
              )
            : s.persons;
          const patched: VerificationSession = {
            ...s,
            lastActivityAt: nowIso,
            persons,
            timeline: [...s.timeline, entry],
          };
          return { ...patched, status: recomputeStatus(patched, s.status) };
        });
      });
    },
    [update]
  );

  // ── E5 (PD-146 §6.3) export audit log (in-memory only) ──
  const [exportLog, setExportLog] = useState<ExportLogEntry[]>([]);

  const logExport = useCallback(
    (entry: Omit<ExportLogEntry, "id" | "timestamp" | "actorName">) => {
      const full: ExportLogEntry = {
        ...entry,
        id: timelineId(),
        timestamp: new Date().toISOString(),
        actorName: ADMIN_ACTOR_NAME,
      };
      setExportLog((curr) => [full, ...curr]);
      // Surface minimally per spec (don't over-build).
      console.info("[export audit]", full);
    },
    []
  );

  const reset = useCallback(() => {
    pendingTimeoutsRef.current.forEach((t) => clearTimeout(t));
    pendingTimeoutsRef.current.clear();
    const seed = structuredClone(verificationSessions);
    setSessions(seed);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<VerificationContextValue>(
    () => ({
      sessions,
      isHydrated,
      getSession,
      resendLink,
      regenerateLink,
      revokeLink,
      recordEddOutcome,
      exportLog,
      logExport,
      reset,
    }),
    [
      sessions,
      isHydrated,
      getSession,
      resendLink,
      regenerateLink,
      revokeLink,
      recordEddOutcome,
      exportLog,
      logExport,
      reset,
    ]
  );

  return (
    <VerificationContext.Provider value={value}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerifications(): VerificationContextValue {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error(
      "useVerifications must be used inside VerificationProvider"
    );
  }
  return ctx;
}
