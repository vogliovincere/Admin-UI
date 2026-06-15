import { useState, useEffect } from 'react'
import interroLogo from './assets/interro-logo.png'
import { EddProvider, useEdd } from './store/EddContext'
import Console from './console/Console'
import CollectionApp from './collection/CollectionApp'

const THEMES = [
  { id: 'interro-green', label: 'Interro Green' },
  { id: 'verivend', label: 'Verivend Strict' },
  { id: 'interro-light-green', label: 'Interro Light Green' },
  { id: 'interro-gold', label: 'Interro Gold' },
  { id: 'minimalist', label: 'Minimalist' },
]

function AppShell() {
  const { state, dispatch } = useEdd()
  const [view, setView] = useState('console') // 'console' | 'collection'
  const [theme, setTheme] = useState('interro-green')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.emojis = 'on'
  }, [theme])

  const activeReq = state.activeRequestId ? state.requests[state.activeRequestId] : null
  const sentCount = state.order.length

  return (
    <div className="edd-app">
      <div className="edd-topbar">
        <div className="edd-brand">
          <img src={interroLogo} alt="Interro" />
          <span className="edd-brand-sep">|</span>
          <span>Enhanced Due Diligence</span>
        </div>

        <div className="edd-switcher">
          <button
            className={view === 'console' ? 'active' : ''}
            onClick={() => setView('console')}
          >
            🏛️ Compliance Console
          </button>
          <button
            className={view === 'collection' ? 'active' : ''}
            onClick={() => setView('collection')}
          >
            📥 Collection (Recipient){activeReq ? ' •' : ''}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="edd-reset-btn"
            style={{ cursor: 'pointer' }}
          >
            {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <span className="edd-topbar-meta">{sentCount} request{sentCount === 1 ? '' : 's'}</span>
          <button className="edd-reset-btn" onClick={() => dispatch({ type: 'RESET' })}>Reset demo</button>
        </div>
      </div>

      {view === 'console'
        ? <Console onOpenCollection={() => setView('collection')} />
        : <CollectionApp key={state.activeRequestId || 'none'} onBackToConsole={() => setView('console')} />}
    </div>
  )
}

export default function App() {
  return (
    <EddProvider>
      <AppShell />
    </EddProvider>
  )
}
