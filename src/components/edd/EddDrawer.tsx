"use client";

/* =========================================================================
   EddDrawer — full-screen overlay hosting the EDD Compliance Console
   (architecture §3.3). State-driven, no router.
   -------------------------------------------------------------------------
   RESTYLED: the drawer chrome now uses the Admin Console design language
   (Tailwind + Interro green tokens) and is NO LONGER wrapped in `.edd-root`,
   so the restyled console (BuildRequest / RequestDetail) renders with clean
   Tailwind and is not subject to the ported edd.css universal reset. The
   `.edd-root`-scoped prototype CSS is now applied ONLY around the recipient
   collection preview, which RequestDetail wraps itself.

   Outcome write-back: when the officer runs/escalates EDD, RequestDetail
   calls onOutcome → this drawer dispatches RUN_EDD on the EddProvider AND
   invokes the page's recordEddOutcome bridge, then closes.
   ========================================================================= */

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
      className="fixed inset-0 z-[1000] overflow-y-auto bg-gray-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3">
        <div className="text-[15px] font-bold text-interro-heading">
          Interro · EDD Compliance Console
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close EDD drawer"
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <X className="h-4 w-4" /> Close
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
