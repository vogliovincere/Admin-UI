"use client";

/* =========================================================================
   EddConsole — host that switches A2/A3 (build) ↔ A4 (detail) by local screen
   state (ported from app-edd/src/console/Console.jsx, minus the A1 queue).
   -------------------------------------------------------------------------
   There is no CaseQueue (A1 is bent away). The console opens straight on
   BuildRequest (A2) for the seeded case; after Send it shows RequestDetail
   (A4). If opened with an existing requestId it starts on A4.
   ========================================================================= */

import { useState } from "react";
import BuildRequest from "@/components/edd/BuildRequest";
import RequestDetail from "@/components/edd/RequestDetail";
import type { EddApplicationRecipient } from "@/components/edd/edd-entry";
import type { EddCase, EddOutcome } from "@/types";

type Screen = "build" | "detail";

interface EddConsoleProps {
  caseObj: EddCase;
  // When provided, the console opens on A4 for this existing request.
  startRequestId?: string | null;
  onClose: () => void;
  onOutcome: (requestId: string, outcome: EddOutcome) => void;
  // Recipient-flow variant (defaults to the verifications GP/LP flow).
  variant?: "verification" | "application";
  applicationRecipients?: EddApplicationRecipient[];
}

export default function EddConsole({
  caseObj,
  startRequestId = null,
  onClose,
  onOutcome,
  variant = "verification",
  applicationRecipients = [],
}: EddConsoleProps) {
  const [screen, setScreen] = useState<Screen>(
    startRequestId ? "detail" : "build"
  );
  const [requestId, setRequestId] = useState<string | null>(startRequestId);

  if (screen === "detail" && requestId) {
    return (
      <RequestDetail
        requestId={requestId}
        onBack={onClose}
        onOutcome={onOutcome}
      />
    );
  }

  return (
    <BuildRequest
      caseObj={caseObj}
      variant={variant}
      applicationRecipients={applicationRecipients}
      onCancel={onClose}
      onSent={(id) => {
        setRequestId(id);
        setScreen("detail");
      }}
    />
  );
}
