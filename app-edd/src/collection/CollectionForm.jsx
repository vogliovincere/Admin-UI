import { useRef, useState } from 'react'
import { eddItemById } from '../data/eddItemTypes'

/** Upload zone for a single requested document item (supports multiple files). */
function DocDrop({ item, files, onAdd, onRemove }) {
  const inputRef = useRef(null)
  const list = files || []

  const handleFiles = (fileList) => {
    const added = Array.from(fileList).map((f) => ({ name: f.name }))
    if (added.length) onAdd(added)
  }

  return (
    <>
      {list.map((f, i) => (
        <div key={i} className="doc-uploaded-item">
          <div className="doc-thumb emoji-badge"><span className="emoji-deco">📄</span></div>
          <div className="doc-name">{f.name}</div>
          <button className="doc-delete" onClick={() => onRemove(i)}>
            <span className="emoji-deco">🗑️</span><span className="emoji-fallback">Remove</span>
          </button>
        </div>
      ))}
      <div
        className={`upload-zone ${list.length ? 'has-file' : ''}`}
        style={{ padding: '20px 16px' }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <div className="cloud-icon" style={{ fontSize: 24 }}>☁️</div>
        <div className="upload-text" style={{ fontSize: 13 }}>
          {list.length ? 'Add another file' : <>Upload <strong>{item.label}</strong></>}
        </div>
        <div style={{ fontSize: 12 }}>
          <span className="upload-link">Choose</span> or drag and drop
        </div>
        <div className="upload-formats">JPG, PNG, HEIC, WEBP or PDF (max 10 MB)</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        accept=".jpg,.jpeg,.png,.heic,.webp,.pdf"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }}
      />
    </>
  )
}

export default function CollectionForm({ req, values, setValues, files, setFiles, onBack, onContinue }) {
  const [attempted, setAttempted] = useState(false)

  const items = req.items.map((id) => eddItemById[id]).filter(Boolean)

  const isFulfilled = (item) =>
    item.kind === 'document'
      ? (files[item.id]?.length > 0)
      : (values[item.id] != null && values[item.id] !== '')

  const completed = items.filter(isFulfilled).length
  const allDone = completed === items.length

  const setValue = (id, v) => setValues((prev) => ({ ...prev, [id]: v }))
  const addFiles = (id, added) => setFiles((prev) => ({ ...prev, [id]: [...(prev[id] || []), ...added] }))
  const removeFile = (id, idx) => setFiles((prev) => ({ ...prev, [id]: (prev[id] || []).filter((_, i) => i !== idx) }))

  const handleContinue = () => {
    setAttempted(true)
    if (allDone) onContinue()
  }

  return (
    <>
      <div className="progress-bar">
        {items.map((it, i) => (
          <div key={i} className={`progress-segment ${i < completed ? 'active' : ''}`} />
        ))}
      </div>
      <div className="header">
        <button className="back-button" onClick={onBack}>←</button>
        <button className="lang-selector">En</button>
      </div>
      <div className="screen-content">
        <h1>Provide the requested items</h1>
        <p className="subtitle">
          Upload each document and answer the questions below. {completed}/{items.length} complete.
        </p>

        {items.map((item) => {
          const fulfilled = isFulfilled(item)
          const showError = attempted && !fulfilled
          return (
            <div className="field-block" key={item.id}>
              <div className="field-block-head">
                <span className="doc-category-name">{item.label}</span>
                {fulfilled && <span className="field-done">✓</span>}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--color-gray-500)', marginBottom: 10, lineHeight: 1.4 }}>
                {item.description}
              </p>

              {item.kind === 'document' && (
                <DocDrop
                  item={item}
                  files={files[item.id]}
                  onAdd={(added) => addFiles(item.id, added)}
                  onRemove={(idx) => removeFile(item.id, idx)}
                />
              )}

              {item.kind === 'field' && item.fieldType === 'text' && (
                <input
                  className={`form-input ${showError ? 'error' : ''}`}
                  placeholder={item.placeholder || ''}
                  value={values[item.id] || ''}
                  onChange={(e) => setValue(item.id, e.target.value)}
                />
              )}

              {item.kind === 'field' && item.fieldType === 'textarea' && (
                <textarea
                  className="textarea"
                  style={showError ? { borderColor: 'var(--color-error)' } : undefined}
                  placeholder={item.placeholder || ''}
                  value={values[item.id] || ''}
                  onChange={(e) => setValue(item.id, e.target.value)}
                />
              )}

              {item.kind === 'field' && item.fieldType === 'select' && (
                <select
                  className={`form-input ${showError ? 'error' : ''}`}
                  value={values[item.id] || ''}
                  onChange={(e) => setValue(item.id, e.target.value)}
                >
                  <option value="" disabled>Select an option…</option>
                  {item.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {item.kind === 'field' && item.fieldType === 'yesno' && (
                <div className="yesno-group">
                  {[{ v: 'no', label: item.noLabel }, { v: 'yes', label: item.yesLabel }].map((opt) => (
                    <div
                      key={opt.v}
                      className={`yesno-option ${values[item.id] === opt.v ? 'selected' : ''}`}
                      onClick={() => setValue(item.id, opt.v)}
                    >
                      <span className="yesno-radio" />
                      <span>{opt.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {showError && (
                <div className="form-error" style={{ marginTop: 8 }}>
                  {item.kind === 'document' ? 'Please upload at least one file.' : 'This is required.'}
                </div>
              )}
            </div>
          )
        })}

        <div className="button-group">
          <button className="btn btn-primary" onClick={handleContinue}>
            Review &amp; submit
          </button>
        </div>
      </div>
    </>
  )
}
