import { useState } from 'react'
import CaseQueue from './CaseQueue'
import BuildRequest from './BuildRequest'
import RequestDetail from './RequestDetail'

/**
 * Compliance Console — the Interro-team point of view.
 *
 * Router between three screens:
 *   queue  → cases Alloy flagged for EDD + the queue of sent requests
 *   build  → build & send an EDD collection request for one case
 *   detail → track a sent request, and re-run EDD once data comes back
 */
export default function Console({ onOpenCollection }) {
  const [screen, setScreen] = useState('queue')
  const [caseId, setCaseId] = useState(null)
  const [requestId, setRequestId] = useState(null)

  if (screen === 'build' && caseId) {
    return (
      <BuildRequest
        caseId={caseId}
        onCancel={() => setScreen('queue')}
        onSent={(newId) => { setRequestId(newId); setScreen('detail') }}
      />
    )
  }

  if (screen === 'detail' && requestId) {
    return (
      <RequestDetail
        requestId={requestId}
        onBack={() => setScreen('queue')}
        onOpenCollection={onOpenCollection}
      />
    )
  }

  return (
    <CaseQueue
      onStartCase={(id) => { setCaseId(id); setScreen('build') }}
      onOpenRequest={(id) => { setRequestId(id); setScreen('detail') }}
    />
  )
}
