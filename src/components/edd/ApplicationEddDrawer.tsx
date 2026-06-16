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

   RESTYLED: the chrome uses the Admin Console design language (Tailwind +
   Interro green tokens) and is no longer wrapped in `.edd-root`. The ported
   edd.css is applied only around the collection preview (inside RequestDetail).
   ========================================================================= */

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
      className="fixed inset-0 z-[1000] overflow-y-auto bg-gray-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3">
        <div className="text-[15px] font-bold text-interro-heading">
          Interro · EDD Request · {caseObj.entityName}
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
        variant="application"
        applicationRecipients={caseObj.applicationRecipients}
        onClose={onClose}
        onOutcome={handleOutcome}
      />
    </div>
  );
}
