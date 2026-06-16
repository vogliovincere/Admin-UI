"use client";

/* =========================================================================
   CollectionDone — ported from app-edd/src/collection/CollectionDone.jsx
   ========================================================================= */

import type { EddRequest } from "@/types";

interface CollectionDoneProps {
  req: EddRequest;
  onClose: () => void;
}

export default function CollectionDone({ req, onClose }: CollectionDoneProps) {
  const completed = req.status === "completed";
  return (
    <div className="terminal-screen">
      <div className="terminal-icon success">
        <span className="emoji-deco">{completed ? "🎉" : "✓"}</span>
        <span className="emoji-fallback">✓</span>
      </div>
      <div className="terminal-heading">
        {completed ? "Verification complete" : "Information submitted"}
      </div>
      <div className="terminal-subtext">
        {completed ? (
          <>
            Thanks — your enhanced due-diligence review is complete and your
            onboarding can continue.
          </>
        ) : (
          <>
            Here&rsquo;s what happens next:
            <ul style={{ textAlign: "left", lineHeight: 1.7, marginTop: 12, paddingLeft: 20 }}>
              <li>The documents will be routed to your entity in Alloy.</li>
              <li>An email will be sent to Interro compliance personnel containing the link to the entity within Alloy.</li>
              <li>EDD review will occur within Alloy.</li>
            </ul>
          </>
        )}
      </div>
      <button
        className="btn btn-secondary"
        style={{ marginTop: 28, width: "auto" }}
        onClick={onClose}
      >
        Close preview
      </button>
    </div>
  );
}
