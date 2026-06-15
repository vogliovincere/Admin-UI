import { useState } from 'react'
import { eddItemById } from '../data/eddItemTypes'

function displayValue(def, value, fileList) {
  if (def.kind === 'document') return (fileList || []).map((f) => f.name).join(', ') || '—'
  if (def.fieldType === 'yesno') return value === 'yes' ? def.yesLabel : def.noLabel
  return value || '—'
}

export default function CollectionReview({ req, values, files, onBack, onSubmit }) {
  const [submitting, setSubmitting] = useState(false)
  const items = req.items.map((id) => eddItemById[id]).filter(Boolean)

  const handleSubmit = () => {
    setSubmitting(true)
    // Brief faux-processing so the demo feels like an upload/transmit step.
    setTimeout(() => onSubmit(), 1200)
  }

  return (
    <>
      <div className="progress-bar">
        {items.map((_, i) => <div key={i} className="progress-segment active" />)}
      </div>
      <div className="header">
        <button className="back-button" onClick={onBack} disabled={submitting}>←</button>
        <button className="lang-selector">En</button>
      </div>
      <div className="screen-content">
        <h1>Review &amp; submit</h1>
        <p className="subtitle">
          Please confirm everything looks right. Your information is sent securely to Interro for review.
        </p>

        <div className="review-fields" style={{ marginBottom: 24 }}>
          {items.map((def) => (
            <div className="review-field" key={def.id}>
              <div className="review-field-label">{def.label}</div>
              <div className="review-field-value" style={{ fontWeight: 500, wordBreak: 'break-word' }}>
                {def.kind === 'document' && <span className="emoji-deco">📄</span>}
                <span>{displayValue(def, values[def.id], files[def.id])}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="loading-dots"><span /><span /><span /></span> : 'Submit securely'}
          </button>
          <button className="btn btn-secondary" onClick={onBack} disabled={submitting}>
            Go back &amp; edit
          </button>
        </div>
      </div>
    </>
  )
}
