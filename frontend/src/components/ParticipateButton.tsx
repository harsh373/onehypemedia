import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUserAuth } from '../auth/authContext'
import { getMyParticipation, participate, cancelParticipation, type ParticipationStatus } from '../api/participation'
import MeetingLink from './MeetingLink'

const lightStyles = {
  primary: 'bg-neutral-950 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#e31d25] disabled:opacity-50',
  info: 'inline-block border border-neutral-950 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-neutral-950',
  muted: 'inline-block border border-neutral-300 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-neutral-400',
  link: 'text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-colors hover:text-[#e31d25] disabled:opacity-50',
  text: 'text-sm text-neutral-500',
  error: 'text-sm text-[#e31d25]',
}

// For the themed (dark) card on the event page.
const darkStyles = {
  primary: 'bg-white px-8 py-4 text-sm font-semibold uppercase tracking-widest text-neutral-950 transition-colors hover:bg-[#e31d25] hover:text-white disabled:opacity-50',
  info: 'inline-block border border-white px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white',
  muted: 'inline-block border border-white/30 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white/50',
  link: 'text-xs font-semibold uppercase tracking-widest text-white/60 transition-colors hover:text-white disabled:opacity-50',
  text: 'text-sm text-white/60',
  error: 'text-sm text-red-300',
}

type Props = {
  eventId: string
  registrationOpen: boolean
  isFull: boolean
  requireApproval: boolean
  isOnline?: boolean
  dark?: boolean
}

export default function ParticipateButton({ eventId, registrationOpen, isFull, requireApproval, isOnline = false, dark = false }: Props) {
  const { user, loading: authLoading } = useUserAuth()
  const location = useLocation()
  const [result, setResult] = useState<{ eventId: string; status: ParticipationStatus } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const s = dark ? darkStyles : lightStyles

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getMyParticipation(eventId).then((status) => {
      if (!cancelled) setResult({ eventId, status })
    })
    return () => {
      cancelled = true
    }
  }, [user, eventId])

  if (authLoading) return null

  const joinLabel = requireApproval ? 'Request to join' : 'Participate'

  if (!user) {
    if (!registrationOpen) return <span className={s.muted}>Registration closed</span>
    if (isFull) return <span className={s.muted}>Event full</span>
    return (
      <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className={`inline-block ${s.primary}`}>{joinLabel}</Link>
    )
  }

  if (result?.eventId !== eventId) {
    return <p className={s.text}>Checking your registration...</p>
  }

  const status = result.status

  async function handleParticipate() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const next = await participate(eventId)
      setResult({ eventId, status: next })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    if (busy) return
    const question = status === 'pending' ? 'Withdraw your request to join this event?' : 'Cancel your registration for this event?'
    if (!window.confirm(question)) return
    setBusy(true)
    setError('')
    try {
      const next = await cancelParticipation(eventId)
      setResult({ eventId, status: next })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function renderState(): ReactNode {
    if (status === 'registered') {
      return (
        <div>
          <div className="flex flex-wrap items-center" style={{ gap: 16 }}>
            <span className={s.info}>You're registered</span>
            <button type="button" onClick={handleCancel} disabled={busy} className={s.link}>{busy ? 'Cancelling...' : 'Cancel registration'}</button>
          </div>
          {isOnline && (
            <div style={{ marginTop: 20 }}>
              <MeetingLink eventId={eventId} dark={dark} />
            </div>
          )}
        </div>
      )
    }

    if (status === 'pending') {
      return (
        <div className="flex flex-wrap items-center" style={{ gap: 16 }}>
          <span className={s.info}>Waiting for approval</span>
          <button type="button" onClick={handleCancel} disabled={busy} className={s.link}>{busy ? 'Withdrawing...' : 'Withdraw request'}</button>
        </div>
      )
    }

    if (status === 'declined') {
      return <span className={s.muted}>Registration declined</span>
    }

    if (!registrationOpen) return <span className={s.muted}>Registration closed</span>
    if (isFull) return <span className={s.muted}>Event full</span>

    return (
      <button type="button" onClick={handleParticipate} disabled={busy} className={s.primary}>
        {busy ? 'Please wait...' : status === 'cancelled' ? `${joinLabel} again` : joinLabel}
      </button>
    )
  }

  return (
    <div>
      {renderState()}
      {error && <p className={s.error} style={{ marginTop: 12 }}>{error}</p>}
    </div>
  )
}