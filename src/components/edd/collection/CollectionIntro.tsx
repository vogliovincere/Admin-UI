"use client";

/* =========================================================================
   CollectionIntro — ported from app-edd/src/collection/CollectionIntro.jsx
   -------------------------------------------------------------------------
   End-user (recipient) surface — kept in the app-edd visual style under
   `.edd-root`. Per B.2.3 the "Note from {firm}" block is REMOVED: the note
   lives only in the email, never in the collection UI.
   ========================================================================= */

import { resolveEddItem } from "@/components/edd/EddCatalog";
import type { EddRequest } from "@/types";

interface CollectionIntroProps {
  req: EddRequest;
  onStart: () => void;
}

export default function CollectionIntro({ req, onStart }: CollectionIntroProps) {
  const firm = req.recipient.firm || "Your fund";
  const isGp = req.recipient.type === "gp";

  const items = req.items
    .map((id) => resolveEddItem(id, req.customItems))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));

  const docCount = items.filter((d) => d.kind === "document").length;
  const fieldCount = items.length - docCount;

  return (
    <>
      <div className="header">
        <div style={{ width: 40 }} />
        <button className="lang-selector">En</button>
      </div>
      <div className="screen-content">
        <div
          className="step-icon"
          style={{ width: 56, height: 56, fontSize: 26, marginBottom: 16 }}
        >
          <span className="emoji-deco">🛡️</span>
        </div>
        <h1>Additional information needed</h1>
        <p className="subtitle">
          {isGp ? (
            <>
              To finish verifying your investor for {req.context}, we need a few
              additional items. You can upload them here on their behalf, or
              forward this link to them.
            </>
          ) : (
            <>
              To finish verifying you for {req.context} with{" "}
              <strong>{firm}</strong>, we need a few additional documents. This
              is a standard enhanced due-diligence check.
            </>
          )}
        </p>

        <h2 style={{ marginBottom: 4 }}>What we&rsquo;ll ask for</h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-gray-500)",
            marginBottom: 8,
          }}
        >
          {docCount > 0 && `${docCount} document${docCount === 1 ? "" : "s"}`}
          {docCount > 0 && fieldCount > 0 && " · "}
          {fieldCount > 0 &&
            `${fieldCount} question${fieldCount === 1 ? "" : "s"}`}
        </p>

        <div className="card" style={{ padding: "4px 16px", marginBottom: 24 }}>
          {items.map((def) => (
            <div className="requested-item" key={def.id}>
              <div className="ri-icon">
                <span className="emoji-deco">
                  {def.kind === "document" ? "📄" : "✍️"}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ri-label">{def.label}</div>
                <div className="ri-desc">{def.description}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={onStart}>
            Get started
          </button>
        </div>
      </div>
    </>
  );
}
