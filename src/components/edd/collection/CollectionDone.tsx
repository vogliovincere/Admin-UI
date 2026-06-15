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
            Thank you. Your documents have been sent securely to Interro&rsquo;s
            compliance team for review. You&rsquo;ll be notified once the review
            is complete — no further action is needed right now.
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
