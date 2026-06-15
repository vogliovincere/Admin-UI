export default function CollectionDone({ req, onBackToConsole }) {
  const completed = req.status === 'completed'
  return (
    <div className="terminal-screen">
      <div className="terminal-icon success">
        <span className="emoji-deco">{completed ? '🎉' : '✓'}</span>
        <span className="emoji-fallback">✓</span>
      </div>
      <div className="terminal-heading">
        {completed ? 'Verification complete' : 'Information submitted'}
      </div>
      <div className="terminal-subtext">
        {completed ? (
          <>Thanks — your enhanced due-diligence review is complete and your onboarding can continue.</>
        ) : (
          <>Thank you. Your documents have been sent securely to Interro’s compliance team for review.
          You’ll be notified once the review is complete — no further action is needed right now.</>
        )}
      </div>
      <button
        className="btn btn-secondary"
        style={{ marginTop: 28, width: 'auto' }}
        onClick={onBackToConsole}
      >
        Back to Compliance Console
      </button>
    </div>
  )
}
