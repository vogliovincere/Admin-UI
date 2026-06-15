import { useState } from 'react'
import { caseById } from '../data/cases'
import { eddItemTypes, EDD_CATEGORIES } from '../data/eddItemTypes'
import { useEdd } from '../store/EddContext'

function localUid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Build & send an EDD collection request for a flagged case.
 *
 * Realises Drew's note: the form is a generic data drop pre-populated with the
 * items Alloy's review determined are needed (recommendedItemIds), which the
 * officer can add to or trim — then sent to the GP or directly to the LP.
 */
export default function BuildRequest({ caseId, onCancel, onSent }) {
  const c = caseById[caseId]
  const { dispatch } = useEdd()

  const [step, setStep] = useState(1) // 1 = review + items, 2 = recipient + send
  const [selected, setSelected] = useState(() => new Set(c.recommendedItemIds))
  const [recipientType, setRecipientType] = useState('gp')
  const [note, setNote] = useState('')

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selected.size

  const recipient = recipientType === 'gp'
    ? { type: 'gp', name: c.gp.name, email: c.gp.email, firm: c.gp.firm }
    : { type: 'lp', name: c.lp.name, email: c.lp.email }

  const handleSend = () => {
    const id = localUid('edd')
    const token = localUid('lnk')
    const orderedItems = eddItemTypes.filter((i) => selected.has(i.id)).map((i) => i.id)
    dispatch({
      type: 'CREATE_REQUEST',
      payload: {
        id,
        token,
        caseId: c.id,
        subjectType: c.subjectType,
        entityName: c.entityName,
        subjectName: c.subjectName,
        flaggedParty: c.flaggedParty,
        context: c.context,
        items: orderedItems,
        recipient,
        note,
      },
    })
    onSent(id)
  }

  return (
    <div className="console">
      <button className="console-back" onClick={onCancel}>← Back to queue</button>
      <div className="console-eyebrow">Step {step} of 2 · {c.subjectName}</div>
      <h1>{step === 1 ? 'Build the EDD request' : 'Choose recipient & send'}</h1>

      {step === 1 && (
        <>
          <p className="console-lead">
            Alloy routed this account to manual review. The items below are pre-selected from Alloy’s
            review findings — adjust what you need collected, then continue.
          </p>

          {/* Alloy review summary */}
          <div className="alloy-banner">
            <span className="alloy-dot" />
            <div className="alloy-banner-text">
              <strong>Alloy decision: Manual Review</strong> · Risk score {c.alloyReview.riskScore} · run {c.alloyReview.runDate}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Why Alloy flagged this account</div>
            <ul className="reason-list">
              {c.alloyReview.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <div className="panel">
            <div className="panel-title">Request these items ({selectedCount} selected)</div>
            {EDD_CATEGORIES.map((cat) => {
              const items = eddItemTypes.filter((i) => i.category === cat.id)
              return (
                <div key={cat.id}>
                  <div className="item-cat-title">{cat.label}</div>
                  {items.map((item) => {
                    const isSel = selected.has(item.id)
                    const isRec = c.recommendedItemIds.includes(item.id)
                    return (
                      <div
                        key={item.id}
                        className={`item-row ${isSel ? 'selected' : ''}`}
                        onClick={() => toggle(item.id)}
                      >
                        <div className="item-check">{isSel ? '✓' : ''}</div>
                        <div className="item-body">
                          <div className="item-label-row">
                            <span className="item-label">{item.label}</span>
                            <span className={`item-kind-tag ${item.kind}`}>
                              {item.kind === 'document' ? 'Upload' : 'Form field'}
                            </span>
                            {isRec && <span className="item-recommended">Alloy-recommended</span>}
                          </div>
                          <div className="item-desc">{item.description}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="console-actions">
            <button className="btn btn-primary" disabled={selectedCount === 0} onClick={() => setStep(2)}>
              Continue
            </button>
            {selectedCount === 0 && <span className="console-summary-line">Select at least one item to continue.</span>}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="console-lead">
            Send a secure collection link. You can send it to the <strong>GP</strong>, who will gather the
            information from the investor, or <strong>directly to the LP</strong>.
          </p>

          <div className="panel">
            <div className="panel-title">Send the collection link to</div>
            <div className="recipient-grid">
              <div
                className={`recipient-card ${recipientType === 'gp' ? 'selected' : ''}`}
                onClick={() => setRecipientType('gp')}
              >
                <div className="rc-role">General Partner</div>
                <div className="rc-name">{c.gp.name}</div>
                <div className="rc-detail">{c.gp.firm}</div>
                <div className="rc-detail">{c.gp.email}</div>
                <div className="rc-explain">The GP receives the link and collects the documents from their LP.</div>
              </div>
              <div
                className={`recipient-card ${recipientType === 'lp' ? 'selected' : ''}`}
                onClick={() => setRecipientType('lp')}
              >
                <div className="rc-role">Limited Partner (investor)</div>
                <div className="rc-name">{c.lp.name}</div>
                <div className="rc-detail">Investor</div>
                <div className="rc-detail">{c.lp.email}</div>
                <div className="rc-explain">The investor receives the link directly and uploads their own documents.</div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Add a note (optional)</div>
            <textarea
              className="textarea"
              placeholder="e.g. Thanks for your patience — we need a little more documentation to finish onboarding for Fund III."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="panel">
            <div className="panel-title">Summary</div>
            <div className="kv-grid">
              <div>
                <div className="kv-label">Subject</div>
                <div className="kv-value">{c.subjectName}</div>
              </div>
              <div>
                <div className="kv-label">Items requested</div>
                <div className="kv-value">{selectedCount}</div>
              </div>
              <div>
                <div className="kv-label">Recipient</div>
                <div className="kv-value">{recipient.name} ({recipientType.toUpperCase()})</div>
              </div>
              <div>
                <div className="kv-label">Delivery</div>
                <div className="kv-value">{recipient.email}</div>
              </div>
            </div>
          </div>

          <div className="console-actions">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Edit items</button>
            <button className="btn btn-primary" onClick={handleSend}>Send collection link</button>
          </div>
        </>
      )}
    </div>
  )
}
