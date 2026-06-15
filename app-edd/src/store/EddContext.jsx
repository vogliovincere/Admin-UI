/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer } from 'react'

/* =========================================================================
   Shared EDD request store
   -------------------------------------------------------------------------
   One in-memory store backs BOTH points of view in the demo:

     1. Compliance Console (Interro)  — creates & sends EDD requests, tracks them.
     2. Collection Flow (LP / GP)     — fills in the request opened from a link.

   Keeping them in one store is what makes the demo end-to-end: a request the
   compliance officer sends immediately becomes the request the recipient sees,
   and the recipient's submission immediately shows up back in the console.

   Request lifecycle (status):
     draft → sent → in_progress → submitted → completed
        ^ console builds it
               ^ console sends a collection link
                      ^ recipient opens the link
                                   ^ recipient submits the data drop
                                               ^ compliance re-runs EDD in Alloy
   ========================================================================= */

const EddContext = createContext(null)

function uid(prefix) {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${rand}`
}

const initialState = {
  requests: {},      // id → request
  order: [],         // request ids, newest first
  activeRequestId: null, // request currently open in the collection view
}

function reducer(state, action) {
  switch (action.type) {
    case 'CREATE_REQUEST': {
      const id = action.payload.id || uid('edd')
      const token = action.payload.token || uid('lnk')
      const request = {
        id,
        token,
        link: `https://delio.interro.co/edd/${token}`,
        caseId: action.payload.caseId,
        subjectType: action.payload.subjectType,
        entityName: action.payload.entityName,
        subjectName: action.payload.subjectName,
        flaggedParty: action.payload.flaggedParty,
        context: action.payload.context,
        items: action.payload.items,         // array of itemType ids
        recipient: action.payload.recipient, // { type:'gp'|'lp', name, email, firm? }
        note: action.payload.note || '',
        status: 'sent',
        createdAt: new Date().toISOString(),
        submission: null,                     // { values: {id: ...}, files: {id: [..]}, submittedAt }
        history: [
          { label: 'EDD request created in Interro Console', at: new Date().toISOString() },
          { label: `Collection link sent to ${action.payload.recipient.type === 'gp' ? 'GP' : 'LP'} (${action.payload.recipient.email})`, at: new Date().toISOString() },
        ],
      }
      return {
        ...state,
        requests: { ...state.requests, [id]: request },
        order: [id, ...state.order],
        activeRequestId: id,
      }
    }

    case 'OPEN_COLLECTION': {
      const id = action.payload.id
      const req = state.requests[id]
      if (!req) return state
      const updated = req.status === 'sent'
        ? { ...req, status: 'in_progress', history: [...req.history, { label: 'Recipient opened the collection link', at: new Date().toISOString() }] }
        : req
      return { ...state, activeRequestId: id, requests: { ...state.requests, [id]: updated } }
    }

    case 'SET_ACTIVE':
      return { ...state, activeRequestId: action.payload.id }

    case 'SUBMIT_COLLECTION': {
      const id = action.payload.id
      const req = state.requests[id]
      if (!req) return state
      const updated = {
        ...req,
        status: 'submitted',
        submission: { ...action.payload.submission, submittedAt: new Date().toISOString() },
        history: [...req.history, { label: 'Recipient submitted the requested information', at: new Date().toISOString() }],
      }
      return { ...state, requests: { ...state.requests, [id]: updated } }
    }

    case 'RUN_EDD': {
      const id = action.payload.id
      const req = state.requests[id]
      if (!req) return state
      const updated = {
        ...req,
        status: 'completed',
        outcome: action.payload.outcome || 'Approved',
        history: [...req.history, { label: `Re-ran EDD in Alloy → ${action.payload.outcome || 'Approved'}`, at: new Date().toISOString() }],
      }
      return { ...state, requests: { ...state.requests, [id]: updated } }
    }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function EddProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <EddContext.Provider value={{ state, dispatch }}>{children}</EddContext.Provider>
}

export function useEdd() {
  const ctx = useContext(EddContext)
  if (!ctx) throw new Error('useEdd must be used within EddProvider')
  return ctx
}

export const STATUS_META = {
  draft: { label: 'Draft', cls: 'idle' },
  sent: { label: 'Link sent', cls: 'sent' },
  in_progress: { label: 'In progress', cls: 'review' },
  submitted: { label: 'Submitted', cls: 'submitted' },
  completed: { label: 'Completed', cls: 'approved' },
}
