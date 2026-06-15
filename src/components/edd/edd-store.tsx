"use client";

/* =========================================================================
   Shared EDD request store (ported from app-edd/src/store/EddContext.jsx)
   -------------------------------------------------------------------------
   One in-memory store backs BOTH points of view in the demo:

     1. Compliance Console (Interro)  — creates & sends EDD requests, tracks them.
     2. Collection Flow (LP / GP)     — fills in the request opened from a link.

   Request lifecycle (status):
     draft → sent → in_progress → submitted → completed

   Ported verbatim from the prototype reducer, typed against @/types and
   extended to carry sessionId / personId / alloyReview (per architecture §4).
   The link host is derived from the case's saasClient.
   ========================================================================= */

import React, { createContext, useContext, useReducer } from "react";
import type {
  EddAlloyReview,
  EddCustomItem,
  EddOutcome,
  EddRecipient,
  EddRequest,
  EddStatus,
  EddSubjectType,
  EddSubmission,
} from "@/types";

function uid(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${rand}`;
}

// Derive the tokenised collection-link host from the SaaS client name.
function clientSlug(saasClient: string): string {
  return (
    saasClient
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 16) || "client"
  );
}

export interface EddState {
  requests: Record<string, EddRequest>;
  order: string[]; // request ids, newest first
  activeRequestId: string | null; // request currently open in the collection view
}

export interface CreateRequestPayload {
  id?: string;
  token?: string;
  caseId: string;
  sessionId: string;
  personId?: string;
  subjectType: EddSubjectType;
  entityName?: string;
  subjectName: string;
  flaggedParty: string;
  context: string;
  saasClient: string;
  alloyReview: EddAlloyReview;
  items: string[];
  customItems?: EddCustomItem[];
  recipient: EddRecipient;
  note?: string;
}

export type EddAction =
  | { type: "CREATE_REQUEST"; payload: CreateRequestPayload }
  | { type: "OPEN_COLLECTION"; payload: { id: string } }
  | { type: "SET_ACTIVE"; payload: { id: string | null } }
  | {
      type: "SUBMIT_COLLECTION";
      payload: { id: string; submission: Omit<EddSubmission, "submittedAt"> };
    }
  | { type: "RUN_EDD"; payload: { id: string; outcome?: EddOutcome } }
  | { type: "RESET" };

const initialState: EddState = {
  requests: {},
  order: [],
  activeRequestId: null,
};

function reducer(state: EddState, action: EddAction): EddState {
  switch (action.type) {
    case "CREATE_REQUEST": {
      const p = action.payload;
      const id = p.id || uid("edd");
      const token = p.token || uid("lnk");
      const nowIso = new Date().toISOString();
      const status: EddStatus = "sent";
      const request: EddRequest = {
        id,
        token,
        link: `https://${clientSlug(p.saasClient)}.interro.co/edd/${token}`,
        caseId: p.caseId,
        sessionId: p.sessionId,
        personId: p.personId,
        subjectType: p.subjectType,
        entityName: p.entityName,
        subjectName: p.subjectName,
        flaggedParty: p.flaggedParty,
        context: p.context,
        alloyReview: p.alloyReview,
        items: p.items, // array of itemType ids (catalog + custom)
        customItems: p.customItems ?? [],
        recipient: p.recipient,
        note: p.note || "",
        status,
        createdAt: nowIso,
        submission: null,
        history: [
          { label: "EDD request created in Interro Console", at: nowIso },
          {
            label: `Collection link sent to ${
              p.recipient.type === "gp" ? "GP" : "LP"
            } (${p.recipient.email})`,
            at: nowIso,
          },
        ],
      };
      return {
        ...state,
        requests: { ...state.requests, [id]: request },
        order: [id, ...state.order],
        activeRequestId: id,
      };
    }

    case "OPEN_COLLECTION": {
      const id = action.payload.id;
      const req = state.requests[id];
      if (!req) return state;
      const updated: EddRequest =
        req.status === "sent"
          ? {
              ...req,
              status: "in_progress",
              history: [
                ...req.history,
                {
                  label: "Recipient opened the collection link",
                  at: new Date().toISOString(),
                },
              ],
            }
          : req;
      return {
        ...state,
        activeRequestId: id,
        requests: { ...state.requests, [id]: updated },
      };
    }

    case "SET_ACTIVE":
      return { ...state, activeRequestId: action.payload.id };

    case "SUBMIT_COLLECTION": {
      const id = action.payload.id;
      const req = state.requests[id];
      if (!req) return state;
      const updated: EddRequest = {
        ...req,
        status: "submitted",
        submission: {
          ...action.payload.submission,
          submittedAt: new Date().toISOString(),
        },
        history: [
          ...req.history,
          {
            label: "Recipient submitted the requested information",
            at: new Date().toISOString(),
          },
        ],
      };
      return { ...state, requests: { ...state.requests, [id]: updated } };
    }

    case "RUN_EDD": {
      const id = action.payload.id;
      const req = state.requests[id];
      if (!req) return state;
      const outcome: EddOutcome = action.payload.outcome || "Approved";
      const updated: EddRequest = {
        ...req,
        status: "completed",
        outcome,
        history: [
          ...req.history,
          {
            label: `Re-ran EDD in Alloy → ${outcome}`,
            at: new Date().toISOString(),
          },
        ],
      };
      return { ...state, requests: { ...state.requests, [id]: updated } };
    }

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

interface EddContextValue {
  state: EddState;
  dispatch: React.Dispatch<EddAction>;
}

const EddContext = createContext<EddContextValue | null>(null);

export function EddProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <EddContext.Provider value={{ state, dispatch }}>
      {children}
    </EddContext.Provider>
  );
}

export function useEdd(): EddContextValue {
  const ctx = useContext(EddContext);
  if (!ctx) throw new Error("useEdd must be used within EddProvider");
  return ctx;
}

export interface StatusMetaEntry {
  label: string;
  cls: string;
}

export const STATUS_META: Record<EddStatus, StatusMetaEntry> = {
  draft: { label: "Draft", cls: "idle" },
  sent: { label: "Link sent", cls: "sent" },
  in_progress: { label: "In progress", cls: "review" },
  submitted: { label: "Submitted", cls: "submitted" },
  completed: { label: "Completed", cls: "approved" },
};
