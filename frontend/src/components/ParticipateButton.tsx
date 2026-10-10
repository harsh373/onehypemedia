import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUserAuth } from '../auth/authContext'
import { getMyParticipation, participate, cancelParticipation, type ParticipationStatus } from '../api/participation'

const primaryBtn = 'bg-neutral-950 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#e31d25] disabled:opacity-50'

export default function ParticipateButton({ eventId }: { eventId: string }) {
  const { user, loading: authLoading } = useUserAuth()
  const location = useLocation()
  const [result, setResult] = useState<{ eventId: string; status: ParticipationStatus } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  if (!user) {
    return (
      <Link to={`/login?next=${encodeURIComponent(location.pathname)}`} className="inline-block bg-neutral-950 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#e31d25]">Participate</Link>
    )
  }

  if (result?.eventId !== eventId) {
    return <p className="text-sm text-neutral-500">Checking your registration...</p>
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
    if (!window.confirm('Cancel your registration for this event?')) return
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

  return (
    <div>
      {status === 'registered' ? (
        <div className="flex flex-wrap items-center" style={{ gap: 16 }}>
          <span className="inline-block border border-neutral-950 px-8 py-4 text-sm font-semibold uppercase tracking-widest text-neutral-950">You're registered</span>
          <button type="button" onClick={handleCancel} disabled={busy} className="text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-colors hover:text-[#e31d25] disabled:opacity-50">{busy ? 'Cancelling...' : 'Cancel registration'}</button>
        </div>
      ) : (
        <button type="button" onClick={handleParticipate} disabled={busy} className={primaryBtn}>
          {busy ? 'Please wait...' : status === 'cancelled' ? 'Participate again' : 'Participate'}
        </button>
      )}
      {error && <p className="text-sm text-[#e31d25]" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  )
}