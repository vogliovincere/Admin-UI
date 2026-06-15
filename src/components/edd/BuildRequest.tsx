"use client";

/* =========================================================================
   B.1 / B.2 — Admin EDD kickoff (Step 1) + recipient & send (Step 2)
   -------------------------------------------------------------------------
   RESTYLED to the Admin Console look (Tailwind + Interro green tokens). The
   case is passed in as a seeded `caseObj` prop (buildEddCaseFromSession).

   B.1: no "Alloy-recommended" badges, no risk score, an "Alloy tags" card of
   match/no-match attribute pills, and a Custom Ask control.
   B.2: GP emails as checkboxes (send disabled until ≥1 checked), Note framed
   as going into the email.
   ========================================================================= */

import { useState } from "react";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { eddItemTypes, EDD_CATEGORIES } from "@/components/edd/EddCatalog";
import { useEdd } from "@/components/edd/edd-store";
import type { EddApplicationRecipient } from "@/components/edd/edd-entry";
import type {
  EddCase,
  EddCustomItem,
  EddItemKind,
  EddRecipient,
  EddRecipientType,
} from "@/types";

function localUid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

interface BuildRequestProps {
  caseObj: EddCase;
  onCancel: () => void;
  onSent: (requestId: string) => void;
  // "verification" (default) keeps the existing GP/LP recipient flow used by
  // the Verifications area. "application" switches step 2 to a DISTINCT
  // recipient picker over the application's own control persons / UBOs.
  variant?: "verification" | "application";
  // Application-flow recipient candidates (control persons + beneficial owners).
  applicationRecipients?: EddApplicationRecipient[];
}

export default function BuildRequest({
  caseObj: c,
  onCancel,
  onSent,
  variant = "verification",
  applicationRecipients = [],
}: BuildRequestProps) {
  const { dispatch } = useEdd();

  const isApplication = variant === "application";

  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(c.recommendedItemIds)
  );
  const [customItems, setCustomItems] = useState<EddCustomItem[]>([]);
  const [recipientType, setRecipientType] = useState<EddRecipientType>("gp");
  const [gpEmails, setGpEmails] = useState<Set<string>>(
    () => new Set(c.gpEmails.slice(0, 1))
  );
  // Application flow: which filed party (control person / UBO) receives the link.
  const [appRecipientId, setAppRecipientId] = useState<string>(
    () => applicationRecipients[0]?.id ?? ""
  );
  const [note, setNote] = useState("");

  // Custom Ask draft state.
  const [customOpen, setCustomOpen] = useState(false);
  const [customKind, setCustomKind] = useState<EddItemKind>("document");
  const [customName, setCustomName] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGpEmail = (email: string) => {
    setGpEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const addCustomItem = () => {
    if (!customName.trim()) return;
    const item: EddCustomItem = {
      id: localUid("custom"),
      label: customName.trim(),
      subtitle: customSubtitle.trim(),
      kind: customKind,
    };
    setCustomItems((prev) => [...prev, item]);
    setSelected((prev) => new Set(prev).add(item.id));
    // reset draft
    setCustomName("");
    setCustomSubtitle("");
    setCustomKind("document");
    setCustomOpen(false);
  };

  const removeCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((ci) => ci.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const selectedCount = selected.size;

  // Ordered selected ids: catalog items (in catalog order) then custom items.
  const orderedSelectedIds = [
    ...eddItemTypes.filter((i) => selected.has(i.id)).map((i) => i.id),
    ...customItems.filter((ci) => selected.has(ci.id)).map((ci) => ci.id),
  ];

  const selectedAppRecipient = applicationRecipients.find(
    (r) => r.id === appRecipientId
  );

  const recipient: EddRecipient = isApplication
    ? {
        // The application's filed party. We reuse the "gp" channel so the
        // existing store/email logic works, but it represents a control
        // person / beneficial owner, not a fund GP.
        type: "gp",
        name: selectedAppRecipient?.name ?? c.gp.name,
        email: selectedAppRecipient?.email ?? c.gp.email,
        firm: c.entityName ?? c.gp.firm,
      }
    : recipientType === "gp"
      ? {
          type: "gp",
          name: c.gp.name,
          // primary delivery email = first checked GP email (fallback to gp.email)
          email: Array.from(gpEmails)[0] ?? c.gp.email,
          firm: c.gp.firm,
        }
      : { type: "lp", name: c.lp.name, email: c.lp.email };

  const gpReady = isApplication
    ? !!selectedAppRecipient
    : recipientType === "lp" || gpEmails.size > 0;
  const checkedGpEmails = Array.from(gpEmails);

  const handleSend = () => {
    const id = localUid("edd");
    const token = localUid("lnk");
    dispatch({
      type: "CREATE_REQUEST",
      payload: {
        id,
        token,
        caseId: c.id,
        sessionId: c.sessionId,
        personId: c.personId,
        subjectType: c.subjectType,
        entityName: c.entityName,
        subjectName: c.subjectName,
        flaggedParty: c.flaggedParty,
        context: c.context,
        saasClient: c.saasClient,
        alloyReview: c.alloyReview,
        items: orderedSelectedIds,
        customItems,
        recipient,
        note,
      },
    });
    onSent(id);
  };

  const sectionTitle =
    "text-[11px] font-semibold text-gray-500 uppercase tracking-wider";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-16">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-interro-primary hover:underline mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel
      </button>
      <div className="text-[11px] font-semibold text-interro-accent uppercase tracking-wider mb-1">
        Step {step} of 2 · {c.subjectName}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
        {step === 1 ? "Build the EDD request" : "Choose recipient & send"}
      </h1>

      {step === 1 && (
        <>
          <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-2xl">
            Alloy routed this account to manual review. Select the items you
            need collected, then continue.
          </p>

          {/* Alloy decision banner — no risk score (B.1.1) */}
          <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-lg bg-amber-50 border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <strong className="text-amber-900">
                Alloy decision: Manual Review
              </strong>{" "}
              · run {c.alloyReview.runDate}
            </div>
          </div>

          {/* Alloy tags card (B.1.2) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
            <div className={`${sectionTitle} mb-3.5`}>Alloy tags</div>
            <div className="flex flex-wrap gap-2">
              {c.alloyTags.map((tag) => (
                <span
                  key={tag.label}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                    tag.match
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  <span className="font-semibold">{tag.label}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      tag.match ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tag.match ? "Match" : "No match"}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Request these items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
            <div className={`${sectionTitle} mb-3.5`}>
              Request these items ({selectedCount} selected)
            </div>

            {EDD_CATEGORIES.map((cat) => {
              const items = eddItemTypes.filter((i) => i.category === cat.id);
              return (
                <div key={cat.id} className="mb-2">
                  <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mt-4 mb-2 first:mt-0">
                    {cat.label}
                  </div>
                  {items.map((item) => {
                    const isSel = selected.has(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className={`w-full text-left flex items-start gap-3 p-3.5 rounded-lg border mb-2 transition-colors ${
                          isSel
                            ? "border-interro-primary bg-interro-primary-soft"
                            : "border-gray-200 hover:border-interro-primary"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSel
                              ? "bg-interro-primary border-interro-primary text-white"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {isSel && <Check className="w-3 h-3" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">
                              {item.label}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                item.kind === "document"
                                  ? "bg-interro-accent-soft text-interro-accent"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {item.kind === "document"
                                ? "Upload"
                                : "Form field"}
                            </span>
                          </span>
                          <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Custom Ask (B.1.4) */}
            <div className="mt-4">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Custom asks
              </div>

              {customItems.map((ci) => (
                <div
                  key={ci.id}
                  className="flex items-start gap-3 p-3.5 rounded-lg border border-interro-primary bg-interro-primary-soft mb-2"
                >
                  <span className="w-5 h-5 rounded-md border-2 bg-interro-primary border-interro-primary text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {ci.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          ci.kind === "document"
                            ? "bg-interro-accent-soft text-interro-accent"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {ci.kind === "document" ? "Upload" : "Form field"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-interro-primary-soft text-interro-primary">
                        Custom
                      </span>
                    </div>
                    {ci.subtitle && (
                      <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {ci.subtitle}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCustomItem(ci.id)}
                    className="text-gray-400 hover:text-red-600 flex-shrink-0"
                    aria-label="Remove custom item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {customOpen ? (
                <div className="rounded-lg border border-gray-200 p-4 mt-2 bg-gray-50">
                  <div className="mb-3">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Type
                    </div>
                    <div className="flex gap-2">
                      {(
                        [
                          ["document", "File upload"],
                          ["field", "Text field"],
                        ] as [EddItemKind, string][]
                      ).map(([kind, label]) => (
                        <button
                          type="button"
                          key={kind}
                          onClick={() => setCustomKind(kind)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                            customKind === kind
                              ? "border-interro-primary bg-interro-primary-soft text-interro-primary"
                              : "border-gray-300 bg-white text-gray-600 hover:border-interro-primary"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Name
                    </label>
                    <input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Trust deed"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-interro-primary focus:outline-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      Subtitle
                    </label>
                    <input
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      placeholder="e.g. The executed trust deed naming all trustees"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-interro-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addCustomItem}
                      disabled={!customName.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover disabled:opacity-50"
                    >
                      Add item
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-interro-primary border border-dashed border-gray-300 rounded-lg hover:border-interro-primary hover:bg-interro-primary-soft w-full justify-center"
                >
                  <Plus className="w-4 h-4" /> Add a custom ask
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-2">
            <button
              onClick={() => setStep(2)}
              disabled={selectedCount === 0}
              className="px-5 py-2.5 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover disabled:opacity-50"
            >
              Continue
            </button>
            {selectedCount === 0 && (
              <span className="text-sm text-gray-500">
                Select at least one item to continue.
              </span>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {isApplication ? (
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-2xl">
              Send a secure collection link to one of the parties named on this
              application. Choose the <strong>control person</strong> or{" "}
              <strong>beneficial owner</strong> who should provide the requested
              information.
            </p>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed mb-6 max-w-2xl">
              Send a secure collection link. You can send it to the{" "}
              <strong>GP</strong>, who will gather the information from the
              investor, or <strong>directly to the LP</strong>.
            </p>
          )}

          {/* Application-flow recipient picker (DISTINCT from GP/LP) */}
          {isApplication ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
              <div className={`${sectionTitle} mb-3.5`}>
                Send the collection link to
              </div>
              {applicationRecipients.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No control persons or beneficial owners are on file for this
                  application.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {applicationRecipients.map((r) => {
                    const checked = appRecipientId === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => setAppRecipientId(r.id)}
                        className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border-2 transition-colors ${
                          checked
                            ? "border-interro-primary bg-interro-primary-soft"
                            : "border-gray-200 hover:border-interro-primary"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            checked
                              ? "bg-interro-primary border-interro-primary text-white"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[11px] font-semibold text-interro-accent uppercase tracking-wider mb-1">
                            {r.roleLabel}
                          </span>
                          <span className="block text-[15px] font-bold text-gray-900">
                            {r.name}
                          </span>
                          <span className="block text-[13px] text-gray-500 mt-0.5">
                            {r.email || "No email on file"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
          /* Recipient choice */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
            <div className={`${sectionTitle} mb-3.5`}>
              Send the collection link to
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(
                [
                  {
                    type: "gp" as const,
                    role: "General Partner",
                    name: c.gp.name,
                    detail: c.gp.firm ?? "",
                    explain:
                      "The GP receives the link and collects the documents from their LP.",
                  },
                  {
                    type: "lp" as const,
                    role: "Limited Partner (investor)",
                    name: c.lp.name,
                    detail: c.lp.email,
                    explain:
                      "The investor receives the link directly and uploads their own documents.",
                  },
                ]
              ).map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setRecipientType(opt.type)}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    recipientType === opt.type
                      ? "border-interro-primary bg-interro-primary-soft"
                      : "border-gray-200 hover:border-interro-primary"
                  }`}
                >
                  <div className="text-[11px] font-semibold text-interro-accent uppercase tracking-wider mb-1.5">
                    {opt.role}
                  </div>
                  <div className="text-[15px] font-bold text-gray-900">
                    {opt.name}
                  </div>
                  <div className="text-[13px] text-gray-500 mt-0.5">
                    {opt.detail}
                  </div>
                  <div className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                    {opt.explain}
                  </div>
                </button>
              ))}
            </div>

            {/* GP emails as checkboxes (B.2.1) */}
            {recipientType === "gp" && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <div className={`${sectionTitle} mb-2.5`}>
                  GP delivery emails (select at least one)
                </div>
                <div className="space-y-2">
                  {c.gpEmails.map((email) => {
                    const checked = gpEmails.has(email);
                    return (
                      <label
                        key={email}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                          checked
                            ? "border-interro-primary bg-interro-primary-soft"
                            : "border-gray-200 hover:border-interro-primary"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGpEmail(email)}
                          className="w-4 h-4 accent-interro-primary"
                        />
                        <span className="text-sm text-gray-900">{email}</span>
                      </label>
                    );
                  })}
                </div>
                {gpEmails.size === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Select at least one GP email to send.
                  </p>
                )}
              </div>
            )}
          </div>
          )}

          {/* Note → into the email (B.2.2) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
            <div className={`${sectionTitle} mb-1.5`}>Add a note (optional)</div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              This note is included in the <strong>email</strong> sent to the{" "}
              {isApplication
                ? "selected recipient"
                : recipientType === "gp"
                  ? "GP"
                  : "LP"}
              . It does not appear in the collection form the recipient fills
              out.
            </p>
            <textarea
              className="w-full px-3.5 py-3 text-sm rounded-lg border border-gray-300 focus:border-interro-primary focus:outline-none resize-y min-h-20"
              placeholder="e.g. Thanks for your patience — we need a little more documentation to finish onboarding for Fund III."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-5">
            <div className={`${sectionTitle} mb-3.5`}>Summary</div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Subject
                </dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {c.subjectName}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Items requested
                </dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {selectedCount}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Recipient
                </dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {isApplication
                    ? `${recipient.name}${
                        selectedAppRecipient
                          ? ` (${selectedAppRecipient.roleLabel})`
                          : ""
                      }`
                    : `${recipient.name} (${recipientType.toUpperCase()})`}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Delivery
                </dt>
                <dd className="text-sm font-semibold text-gray-900">
                  {isApplication
                    ? recipient.email || "—"
                    : recipientType === "gp"
                      ? checkedGpEmails.join(", ") || "—"
                      : recipient.email}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-2">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-interro-primary bg-white border border-interro-primary rounded-lg hover:bg-interro-primary-soft"
            >
              <ArrowLeft className="w-4 h-4" /> Edit items
            </button>
            <button
              onClick={handleSend}
              disabled={!gpReady}
              className="px-5 py-2.5 text-sm font-medium text-white bg-interro-primary rounded-lg hover:bg-interro-primary-hover disabled:opacity-50"
            >
              Send collection link
            </button>
          </div>
        </>
      )}
    </div>
  );
}
