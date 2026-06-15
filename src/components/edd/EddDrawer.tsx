"use client";

/* =========================================================================
   EddDrawer — full-screen overlay hosting the EDD Compliance Console
   (architecture §3.3). State-driven, no router.
   -------------------------------------------------------------------------
   The drawer is the single `.edd-root` ancestor that scopes the ported CSS
   (architecture §5). It renders the EddConsole (A2 → A3 → A4). The recipient
   collection flow (B0–B4) is DEFERRED — the prototype's Console/Collection
   segmented control is dropped; only the Compliance Console is mounted.
   TODO(E3-recipient): add a Collection view + segmented control later.

   Outcome write-back: when the officer runs/escalates EDD, RequestDetail
   calls onOutcome → this drawer dispatches RUN_EDD on the EddProvider AND
   invokes the page's recordEddOutcome bridge, then closes.
   ========================================================================= */

import "./edd.css";
import { X } from "lucide-react";
import EddConsole from "@/components/edd/EddConsole";
import { useEdd } from "@/components/edd/edd-store";
import type { EddCase, EddOutcome } from "@/types";

interface EddDrawerProps {
  caseObj: EddCase;
  onClose: () => void;
  // Bridge to the VerificationProvider (architecture §6.1).
  onRecordOutcome: (
    sessionId: string,
    personId: string | null,
    outcome: EddOutcome
  ) => void;
}

export default function EddDrawer({
  caseObj,
  onClose,
  onRecordOutcome,
}: EddDrawerProps) {
  const { dispatch } = useEdd();

  const handleOutcome = (requestId: string, outcome: EddOutcome) => {
    // Prototype behaviour: mark the request completed in the EDD store.
    dispatch({ type: "RUN_EDD", payload: { id: requestId, outcome } });
    // Write the result back to the session timeline / person badge.
    onRecordOutcome(caseObj.sessionId, caseObj.personId ?? null, outcome);
    // Close the drawer so the updated session detail is visible.
    onClose();
  };

  return (
    <div
      className="edd-root"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "var(--color-bg)",
        overflowY: "auto",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "12px 24px",
          background: "var(--color-white)",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "var(--color-heading)",
            fontSize: 15,
          }}
        >
          Interro · EDD Compliance Console
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close EDD drawer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-gray-500)",
            background: "var(--color-white)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-full)",
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          <X style={{ width: 16, height: 16 }} /> Close
        </button>
      </div>

      <EddConsole
        caseObj={caseObj}
        onClose={onClose}
        onOutcome={handleOutcome}
      />
    </div>
  );
}
