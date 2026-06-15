"use client";

/* =========================================================================
   CollectionPreview — demo-only preview of the end-user collection surface
   (B.3 / B.0). Hosts intro → form → review → done inside a phone frame, in
   the app-edd visual style (deliberately distinct from the restyled admin
   console). Drives the existing OPEN_COLLECTION / SUBMIT_COLLECTION store
   actions.

   Per B.0 / B.3 the real surface lives at interro.co and is NOT part of the
   admin portal — a clear note in the preview chrome states this.
   ========================================================================= */

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { useEdd } from "@/components/edd/edd-store";
import CollectionIntro from "@/components/edd/collection/CollectionIntro";
import CollectionForm from "@/components/edd/collection/CollectionForm";
import CollectionReview from "@/components/edd/collection/CollectionReview";
import CollectionDone from "@/components/edd/collection/CollectionDone";
import type { EddSubmissionFile } from "@/types";

type Screen = "intro" | "form" | "review" | "done";

interface CollectionPreviewProps {
  requestId: string;
  onClose: () => void;
}

export default function CollectionPreview({
  requestId,
  onClose,
}: CollectionPreviewProps) {
  const { state, dispatch } = useEdd();
  const req = state.requests[requestId];

  const alreadyDone =
    req && (req.status === "submitted" || req.status === "completed");
  const [screen, setScreen] = useState<Screen>(alreadyDone ? "done" : "intro");
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, EddSubmissionFile[]>>({});

  // Mark a freshly-sent link as opened (in_progress) when the preview lands.
  useEffect(() => {
    if (req && req.status === "sent") {
      dispatch({ type: "OPEN_COLLECTION", payload: { id: req.id } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req?.id]);

  const submit = () => {
    if (!req) return;
    dispatch({
      type: "SUBMIT_COLLECTION",
      payload: { id: req.id, submission: { values, files } },
    });
    setScreen("done");
  };

  const link = req ? req.link : "https://{client}.interro.co/edd/{token}";

  return (
    <div className="edd-preview-shell">
      <div className="edd-preview-note">
        <Info style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>Preview only.</strong> This is what the recipient sees. In
          production this surface is hosted at{" "}
          <strong>{link}</strong> and is <strong>not part of the admin
          portal</strong> — the recipient opens it from their email.
        </div>
      </div>

      <div className="phone-frame">
        <div className="phone-frame-scroll">
          {!req ? (
            <div className="terminal-screen">
              <div className="terminal-heading">Request not found</div>
              <div className="terminal-subtext">
                This collection link no longer exists.
              </div>
            </div>
          ) : (
            <>
              {screen === "intro" && (
                <CollectionIntro req={req} onStart={() => setScreen("form")} />
              )}
              {screen === "form" && (
                <CollectionForm
                  req={req}
                  values={values}
                  setValues={setValues}
                  files={files}
                  setFiles={setFiles}
                  onBack={() => setScreen("intro")}
                  onContinue={() => setScreen("review")}
                />
              )}
              {screen === "review" && (
                <CollectionReview
                  req={req}
                  values={values}
                  files={files}
                  onBack={() => setScreen("form")}
                  onSubmit={submit}
                />
              )}
              {screen === "done" && (
                <CollectionDone req={req} onClose={onClose} />
              )}
            </>
          )}
          <div className="powered-footer">
            <span>Powered by Interro</span>
          </div>
        </div>
      </div>

      <button className="edd-preview-close" onClick={onClose}>
        Close preview
      </button>
    </div>
  );
}
