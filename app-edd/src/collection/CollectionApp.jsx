import { useState, useEffect } from 'react'
import interroLogo from '../assets/interro-logo.png'
import { useEdd } from '../store/EddContext'
import CollectionIntro from './CollectionIntro'
import CollectionForm from './CollectionForm'
import CollectionReview from './CollectionReview'
import CollectionDone from './CollectionDone'

/**
 * EDD Collection flow — the recipient (LP or GP) point of view.
 *
 * This is the embeddable, mobile-framed surface the recipient opens from the
 * link the compliance team sent. It renders the "generic input form / data
 * drop" for exactly the items the officer requested (Drew's note).
 */
export default function CollectionApp({ onBackToConsole }) {
  const { state, dispatch } = useEdd()
  const req = state.activeRequestId ? state.requests[state.activeRequestId] : null

  // This component is remounted (keyed on the active request id by the parent),
  // so initial screen state is derived once from the request's status — an
  // already-submitted request opens straight on the confirmation screen.
  const alreadyDone = req && (req.status === 'submitted' || req.status === 'completed')
  const [screen, setScreen] = useState(alreadyDone ? 'done' : 'intro') // intro | form | review | done
  const [values, setValues] = useState({})      // itemId → string
  const [files, setFiles] = useState({})         // itemId → [{ name }]

  // When the recipient lands on a freshly-sent link, mark it opened (in_progress).
  useEffect(() => {
    if (req && req.status === 'sent') {
      dispatch({ type: 'OPEN_COLLECTION', payload: { id: req.id } })
    }
  }, [req?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!req) {
    return (
      <div className="phone-frame-wrapper">
        <div className="phone-frame">
          <div className="phone-frame-scroll">
            <div className="terminal-screen">
              <div className="terminal-icon" style={{ background: 'var(--color-gray-100)', color: 'var(--color-gray-400)' }}>
                <span className="emoji-deco">🔗</span>
              </div>
              <div className="terminal-heading">No active collection link</div>
              <div className="terminal-subtext">
                Open the <strong>Compliance Console</strong>, build an EDD request and send it — then it
                appears here, exactly as the recipient would see it.
              </div>
              <button className="btn btn-primary" style={{ marginTop: 24, width: 'auto' }} onClick={onBackToConsole}>
                Go to Compliance Console
              </button>
            </div>
            <div className="powered-footer">
              <span>Powered by</span>
              <img src={interroLogo} alt="Interro" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const submit = () => {
    dispatch({ type: 'SUBMIT_COLLECTION', payload: { id: req.id, submission: { values, files } } })
    setScreen('done')
  }

  const shared = { req, values, setValues, files, setFiles }

  return (
    <div className="phone-frame-wrapper">
      <div className="phone-frame">
        <div className="phone-frame-scroll">
          {screen === 'intro' && <CollectionIntro {...shared} onStart={() => setScreen('form')} />}
          {screen === 'form' && (
            <CollectionForm
              {...shared}
              onBack={() => setScreen('intro')}
              onContinue={() => setScreen('review')}
            />
          )}
          {screen === 'review' && (
            <CollectionReview
              {...shared}
              onBack={() => setScreen('form')}
              onSubmit={submit}
            />
          )}
          {screen === 'done' && <CollectionDone req={req} onBackToConsole={onBackToConsole} />}
          <div className="powered-footer">
            <span>Powered by</span>
            <img src={interroLogo} alt="Interro" />
          </div>
        </div>
        <div id="phone-modal-root" />
      </div>
    </div>
  )
}
