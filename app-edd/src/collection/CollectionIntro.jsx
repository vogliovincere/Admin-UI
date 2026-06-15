import { caseById } from '../data/cases'
import { eddItemById } from '../data/eddItemTypes'

export default function CollectionIntro({ req, onStart }) {
  const c = caseById[req.caseId]
  const firm = req.recipient.firm || c?.gp.firm || 'Your fund'
  const isGp = req.recipient.type === 'gp'

  const docCount = req.items.filter((id) => eddItemById[id]?.kind === 'document').length
  const fieldCount = req.items.length - docCount

  return (
    <>
      <div className="header">
        <div style={{ width: 40 }} />
        <button className="lang-selector">En</button>
      </div>
      <div className="screen-content">
        <div className="step-icon" style={{ width: 56, height: 56, fontSize: 26, marginBottom: 16 }}>
          <span className="emoji-deco">🛡️</span>
        </div>
        <h1>Additional information needed</h1>
        <p className="subtitle">
          {isGp ? (
            <>To finish verifying your investor <strong>{c?.lp.name}</strong> for {req.context}, we need a few additional
            items. You can upload them here on their behalf, or forward this link to them.</>
          ) : (
            <>To finish verifying you for {req.context} with <strong>{firm}</strong>, we need a few additional
            documents. This is a standard enhanced due-diligence check.</>
          )}
        </p>

        {req.note && (
          <div className="card" style={{ padding: 16, marginBottom: 20, background: 'var(--color-info-soft)', borderColor: 'transparent' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-gray-500)', marginBottom: 6 }}>
              Note from {firm}
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.5 }}>{req.note}</div>
          </div>
        )}

        <h2 style={{ marginBottom: 4 }}>What we’ll ask for</h2>
        <p style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 8 }}>
          {docCount > 0 && `${docCount} document${docCount === 1 ? '' : 's'}`}
          {docCount > 0 && fieldCount > 0 && ' · '}
          {fieldCount > 0 && `${fieldCount} question${fieldCount === 1 ? '' : 's'}`}
        </p>

        <div className="card" style={{ padding: '4px 16px', marginBottom: 24 }}>
          {req.items.map((id) => {
            const def = eddItemById[id]
            if (!def) return null
            return (
              <div className="requested-item" key={id}>
                <div className="ri-icon">
                  <span className="emoji-deco">{def.kind === 'document' ? '📄' : '✍️'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ri-label">{def.label}</div>
                  <div className="ri-desc">{def.description}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="button-group">
          <button className="btn btn-primary" onClick={onStart}>Get started</button>
        </div>
      </div>
    </>
  )
}
