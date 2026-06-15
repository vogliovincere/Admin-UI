"use client";

/* =========================================================================
   ApplicationEddDrawer — full-screen EDD console for the APPLICATION flow.
   -------------------------------------------------------------------------
   Mirrors EddDrawer (used by Verifications) but feeds the application
   recipient-selection variant of BuildRequest. The verifications EddDrawer is
   deliberately left untouched so Stream B's flow keeps working; this is a
   parallel host, not a rewrite of the shared one.

   The case is built via buildEddCaseFromApplication, which also supplies the
   list of filed parties (control persons / beneficial owners) that the Interro
   user chooses between on step 2.
   ========================================================================= */

import "./edd.css";
import { X } from "lucide-react";
import EddConsole from "@/components/edd/EddConsole";
import { useEdd } from "@/components/edd/edd-store";
import type { ApplicationEddCase } from "@/components/edd/edd-entry";
import type { EddOutcome } from "@/types";

interface ApplicationEddDrawerProps {
  caseObj: ApplicationEddCase;
  onClose: () => void;
}

export default function ApplicationEddDrawer({
  caseObj,
  onClose,
}: ApplicationEddDrawerProps) {
  const { dispatch } = useEdd();

  const handleOutcome = (requestId: string, outcome: EddOutcome) => {
    // Mark the request completed in the shared EDD store; the application's
    // decisioning lives in Alloy, so there is no session write-back here.
    dispatch({ type: "RUN_EDD", payload: { id: requestId, outcome } });
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
          Interro · EDD Request · {caseObj.entityName}
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
        variant="application"
        applicationRecipients={caseObj.applicationRecipients}
        onClose={onClose}
        onOutcome={handleOutcome}
      />
    </div>
  );
}
