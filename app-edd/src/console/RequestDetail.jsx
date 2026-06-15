import { useState } from 'react'
import { eddItemById } from '../data/eddItemTypes'
import { useEdd, STATUS_META } from '../store/EddContext'

function fmtTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function RequestDetail({ requestId, onBack, onOpenCollection }) {
  const { state, dispatch } = useEdd()
  const r = state.requests[requestId]
  const [copied, setCopied] = useState(false)

  if (!r) {
    return (
      <div className="console">
        <button className="console-back" onClick={onBack}>← Back to queue</button>
        <div className="empty-state">This request no longer exists.</div>
      </div>
    )
  }

  const meta = STATUS_META[r.status] || STATUS_META.draft
  const sub = r.submission

  const copyLink = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(r.link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openAsRecipient = () => {
    dispatch({ type: 'OPEN_COLLECTION', payload: { id: r.id } })
    onOpenCollection()
  }

  return (
    <div className="console">
      <button className="console-back" onClick={onBack}>← Back to queue</button>
      <div className="console-eyebrow">EDD request · {r.subjectName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, flexWrap: 'wrap' }}>
        <h1 style={{ marginBottom: 0 }}>{r.subjectName}</h1>
        <span className={`pill ${meta.cls}`}>{meta.label}</span>
      </div>
      <p className="console-lead">{r.flaggedParty} · {r.context}</p>

      <div className="panel">
        <div className="panel-title">Collection link</div>
        <div className="link-box">
          <code>{r.link}</code>
          <button className="btn-small btn-secondary" onClick={copyLink}>{copied ? 'Copied!' : 'Copy'}</button>
        </div>
        <div className="kv-grid" style={{ marginTop: 16 }}>
          <div>
            <div className="kv-label">Sent to</div>
            <div className="kv-value">{r.recipient.name} ({r.recipient.type.toUpperCase()})</div>
          </div>
          <div>
            <div className="kv-label">Delivery</div>
            <div className="kv-value">{r.recipient.email}</div>
          </div>
        </div>
        {(r.status === 'sent' || r.status === 'in_progress') && (
          <div className="console-actions">
            <button className="btn btn-primary" onClick={openAsRecipient}>
              Open as recipient ↗
            </button>
            <span className="console-summary-line">
              In production the recipient opens this from their email. For the demo, open it here to fill it in.
            </span>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">Requested items ({r.items.length})</div>
        {r.items.map((itemId) => {
          const def = eddItemById[itemId]
          if (!def) return null
          const fulfilled = sub && (
            def.kind === 'document'
              ? (sub.files?.[itemId]?.length > 0)
              : (sub.values?.[itemId] != null && sub.values?.[itemId] !== '')
          )
          return (
            <div className="requested-item" key={itemId}>
              <div className="ri-icon">
                <span className="emoji-deco">{def.kind === 'document' ? '📄' : '✍️'}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ri-label">{def.label}</div>
                {sub ? (
                  fulfilled ? (
                    <div className="ri-desc" style={{ color: 'var(--color-green)' }}>
                      {def.kind === 'document'
                        ? `✓ ${sub.files[itemId].map((f) => f.name).join(', ')}`
                        : `✓ ${formatValue(def, sub.values[itemId])}`}
                    </div>
                  ) : (
                    <div className="ri-desc" style={{ color: 'var(--color-orange)' }}>Not provided</div>
                  )
                ) : (
                  <div className="ri-desc">{def.kind === 'document' ? 'Awaiting upload' : 'Awaiting response'}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {r.status === 'submitted' && (
        <div className="panel">
          <div className="panel-title">Information received — re-run EDD</div>
          <p style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5, marginBottom: 16 }}>
            The recipient submitted the requested information. Re-run the EDD evaluation in Alloy with the
            new documents and data attached to the entity.
          </p>
          <div className="console-actions">
            <button className="btn btn-primary" onClick={() => dispatch({ type: 'RUN_EDD', payload: { id: r.id, outcome: 'Approved' } })}>
              Run EDD in Alloy
            </button>
            <button className="btn btn-secondary" onClick={() => dispatch({ type: 'RUN_EDD', payload: { id: r.id, outcome: 'Escalate' } })}>
              Escalate for review
            </button>
          </div>
        </div>
      )}

      {r.status === 'completed' && (
        <div className="panel">
          <div className="panel-title">EDD outcome</div>
          <span className={`pill ${r.outcome === 'Approved' ? 'approved' : 'review'}`} style={{ fontSize: 14 }}>
            {r.outcome === 'Approved' ? '✓ Cleared — Approved' : '⚑ Escalated for senior review'}
          </span>
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 12 }}>
            Interro returns the updated status to {r.recipient.firm || 'the SaaS client'}, who can resume the
            investor’s onboarding (e.g. proceed to payment).
          </p>
        </div>
      )}

      <div className="panel">
        <div className="panel-title">Activity</div>
        <ul className="timeline">
          {r.history.map((h, i) => (
            <li key={i}>
              <span className="tl-dot" />
              <div>
                <div className="tl-label">{h.label}</div>
                <div className="tl-time">{fmtTime(h.at)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function formatValue(def, value) {
  if (def.fieldType === 'yesno') return value === 'yes' ? def.yesLabel : def.noLabel
  return value
}
