import { cases } from '../data/cases'
import { useEdd, STATUS_META } from '../store/EddContext'

function riskClass(score) {
  if (score >= 75) return 'high'
  if (score >= 55) return 'med'
  return ''
}

export default function CaseQueue({ onStartCase, onOpenRequest }) {
  const { state } = useEdd()
  const requests = state.order.map((id) => state.requests[id])

  // Cases that already have a request in flight are de-emphasised in the queue.
  const requestedCaseIds = new Set(requests.map((r) => r.caseId))

  return (
    <div className="console">
      <div className="console-eyebrow">Interro · Compliance</div>
      <h1>Enhanced Due Diligence queue</h1>
      <p className="console-lead">
        Accounts that completed standard verification but were routed to <strong>Manual Review</strong> by
        Alloy — additional documentation is required before they can be cleared.
      </p>

      <div className="panel-title">Needs EDD ({cases.length})</div>
      {cases.map((c) => (
        <div
          key={c.id}
          className="case-row"
          onClick={() => onStartCase(c.id)}
          style={requestedCaseIds.has(c.id) ? { opacity: 0.6 } : undefined}
        >
          <div className="case-avatar">
            <span className="emoji-deco">{c.subjectType === 'entity' ? '🏢' : '👤'}</span>
          </div>
          <div className="case-main">
            <div className="case-name">{c.subjectName}</div>
            <div className="case-sub">
              {c.flaggedParty} · {c.context}
            </div>
          </div>
          <div className="case-meta-right">
            <div className="pill review">Manual review</div>
            <div className={`risk-score ${riskClass(c.alloyReview.riskScore)}`} style={{ marginTop: 6 }}>
              Risk {c.alloyReview.riskScore}
            </div>
          </div>
          <div className="case-arrow">›</div>
        </div>
      ))}

      <div className="panel-title" style={{ marginTop: 36 }}>EDD requests ({requests.length})</div>
      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="es-icon"><span className="emoji-deco">📭</span></div>
          <div>No EDD requests sent yet.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Pick a case above to build and send one.</div>
        </div>
      ) : (
        requests.map((r) => {
          const meta = STATUS_META[r.status] || STATUS_META.draft
          return (
            <div key={r.id} className="case-row" onClick={() => onOpenRequest(r.id)}>
              <div className="case-avatar">
                <span className="emoji-deco">{r.subjectType === 'entity' ? '🏢' : '👤'}</span>
              </div>
              <div className="case-main">
                <div className="case-name">{r.subjectName}</div>
                <div className="case-sub">
                  {r.items.length} item{r.items.length === 1 ? '' : 's'} requested · sent to {r.recipient.type === 'gp' ? 'GP' : 'LP'} ({r.recipient.name})
                </div>
              </div>
              <div className="case-meta-right">
                <span className={`pill ${meta.cls}`}>{meta.label}</span>
              </div>
              <div className="case-arrow">›</div>
            </div>
          )
        })
      )}
    </div>
  )
}
