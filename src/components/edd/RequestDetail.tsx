"use client";

/* =========================================================================
   B.1/B.2 follow-on — EDD request detail & tracking.
   RESTYLED to the Admin Console look (Tailwind + Interro green tokens).
   -------------------------------------------------------------------------
   The prototype's disabled "Open as recipient — coming soon" stub is replaced
   with a working "Preview what the recipient will see" action (B.3.2) that
   opens the ported collection flow via OPEN_COLLECTION / SUBMIT_COLLECTION.
   On Run EDD / Escalate the component calls onOutcome so the detail page can
   write the result back to the VerificationProvider.
   ========================================================================= */

import { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  FileText,
  PenLine,
  Eye,
} from "lucide-react";
import { resolveEddItem } from "@/components/edd/EddCatalog";
import { useEdd, STATUS_META } from "@/components/edd/edd-store";
import CollectionPreview from "@/components/edd/collection/CollectionPreview";
import type { EddItem, EddOutcome } from "@/types";

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatValue(def: EddItem, value: string): string {
  if (def.fieldType === "yesno")
    return value === "yes" ? def.yesLabel ?? "Yes" : def.noLabel ?? "No";
  return value;
}

const PILL_CLASSES: Record<string, string> = {
  idle: "bg-gray-100 text-gray-600",
  review: "bg-amber-100 text-amber-700",
  sent: "bg-interro-primary-soft text-interro-primary",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
};

interface RequestDetailProps {
  requestId: string;
  onBack: () => void;
  onOutcome: (requestId: string, outcome: EddOutcome) => void;
}

export default function RequestDetail({
  requestId,
  onBack,
  onOutcome,
}: RequestDetailProps) {
  const { state } = useEdd();
  const r = state.requests[requestId];
  const [copied, setCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (!r) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-interro-primary hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Close
        </button>
        <div className="text-center py-16 text-gray-400">
          This request no longer exists.
        </div>
      </div>
    );
  }

  if (previewOpen) {
    // RequestDetail is already rendered inside the drawer's `.edd-root`, so the
    // collection preview inherits the scoped app-edd styles directly.
    return (
      <CollectionPreview
        requestId={r.id}
        onClose={() => setPreviewOpen(false)}
      />
    );
  }

  const meta = STATUS_META[r.status] || STATUS_META.draft;
  const sub = r.submission;
  const sectionTitle =
    "text-[11px] font-semibold text-gray-500 uppercase tracking-wider";

  const copyLink = () => {
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(r.link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runEdd = (outcome: EddOutcome) => {
    onOutcome(r.id, outcome);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-16">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-interro-primary hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Close
      </button>
      <div className="text-[11px] font-semibold text-interro-accent uppercase tracking-wider mb-1">
        EDD request · {r.subjectName}
      </div>
      <div className="flex items-center gap-3.5 flex-wrap mb-1.5">
        <h1 className="text-2xl font-bold text-gray-900">{r.subjectName}</h1>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            PILL_CLASSES[meta.cls] ?? PILL_CLASSES.idle
          }`}
        >
          {meta.label}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        {r.flaggedParty} · {r.context}
      </p>

      {/* Collection link */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
        <div className={`${sectionTitle} mb-3.5`}>Collection link</div>
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-gray-50 border border-gray-200">
          <code className="flex-1 text-xs font-mono text-gray-700 break-all">
            {r.link}
          </code>
          <button
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div>
            <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Sent to
            </dt>
            <dd className="text-sm font-semibold text-gray-900">
              {r.recipient.name} ({r.recipient.type.toUpperCase()})
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Delivery
            </dt>
            <dd className="text-sm font-semibold text-gray-900">
              {r.recipient.email}
            </dd>
          </div>
        </dl>

        {/* B.3.2 — working recipient preview (demo only) */}
        <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-interro-primary bg-white border border-interro-primary rounded-lg hover:bg-interro-primary-soft"
          >
            <Eye className="w-4 h-4" /> Preview what the recipient will see
          </button>
          <span className="text-xs text-gray-500">
            Demo preview only. In production the recipient opens this from their
            email at interro.co — it is not part of the admin portal.
          </span>
        </div>
      </div>

      {/* Requested items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
        <div className={`${sectionTitle} mb-1.5`}>
          Requested items ({r.items.length})
        </div>
        <div>
          {r.items.map((itemId) => {
            const def = resolveEddItem(itemId, r.customItems);
            if (!def) return null;
            const fulfilled =
              sub &&
              (def.kind === "document"
                ? (sub.files?.[itemId]?.length ?? 0) > 0
                : sub.values?.[itemId] != null && sub.values?.[itemId] !== "");
            return (
              <div
                className="flex gap-3 py-3 border-b border-gray-100 last:border-b-0"
                key={itemId}
              >
                <div className="w-9 h-9 rounded-lg bg-interro-primary-soft flex items-center justify-center flex-shrink-0 text-interro-primary">
                  {def.kind === "document" ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <PenLine className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {def.label}
                  </div>
                  {sub ? (
                    fulfilled ? (
                      <div className="text-xs text-green-600 mt-0.5">
                        {def.kind === "document"
                          ? `✓ ${sub.files[itemId]
                              .map((f) => f.name)
                              .join(", ")}`
                          : `✓ ${formatValue(def, sub.values[itemId])}`}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-600 mt-0.5">
                        Not provided
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {def.kind === "document"
                        ? "Awaiting upload"
                        : "Awaiting response"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {r.status === "submitted" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
          <div className={`${sectionTitle} mb-3.5`}>
            Information received — re-run EDD
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            The recipient submitted the requested information. Re-run the EDD
            evaluation in Alloy with the new documents and data attached to the
            entity.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => runEdd("Approved")}
              className="px-5 py-2.5 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover"
            >
              Run EDD in Alloy
            </button>
            <button
              onClick={() => runEdd("Escalate")}
              className="px-5 py-2.5 text-sm font-medium text-interro-primary bg-white border border-interro-primary rounded-lg hover:bg-interro-primary-soft"
            >
              Escalate for review
            </button>
          </div>
        </div>
      )}

      {r.status === "completed" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
          <div className={`${sectionTitle} mb-3.5`}>EDD outcome</div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
              r.outcome === "Approved"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {r.outcome === "Approved"
              ? "✓ Cleared — Approved"
              : "⚑ Escalated for senior review"}
          </span>
          <p className="text-[13px] text-gray-500 mt-3">
            Interro returns the updated status to{" "}
            {r.recipient.firm || "the SaaS client"}, who can resume the
            investor&rsquo;s onboarding (e.g. proceed to payment).
          </p>
        </div>
      )}

      {/* Activity timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className={`${sectionTitle} mb-3.5`}>Activity</div>
        <ul className="space-y-0">
          {r.history.map((h, i) => (
            <li key={i} className="flex gap-3 pb-4 relative last:pb-0">
              {i !== r.history.length - 1 && (
                <span className="absolute left-[7px] top-[18px] bottom-0 w-0.5 bg-gray-200" />
              )}
              <span className="w-4 h-4 rounded-full bg-interro-primary border-[3px] border-interro-primary-soft flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[13.5px] font-medium text-gray-900">
                  {h.label}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {fmtTime(h.at)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
