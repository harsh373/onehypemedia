import { useEffect, useState } from 'react'
import { getMeetingUrl } from '../api/meeting'

type Result = { url: string } | { error: string } | null

export default function MeetingLink({ eventId, dark = false }: { eventId: string; dark?: boolean }) {
  const [result, setResult] = useState<Result>(null)

  useEffect(() => {
    let cancelled = false
    getMeetingUrl(eventId)
      .then((url) => {
        if (!cancelled) setResult({ url })
      })
      .catch((e: Error) => {
        if (!cancelled) setResult({ error: e.message })
      })
    return () => {
      cancelled = true
    }
  }, [eventId])

  const label = dark ? 'text-white/50' : 'text-neutral-400'
  const muted = dark ? 'text-white/60' : 'text-neutral-500'

  if (result === null) {
    return <p className={`text-sm ${muted}`}>Loading your meeting link...</p>
  }

  if ('error' in result) {
    return <p className={`text-sm ${muted}`}>{result.error}</p>
  }

  if (!/^https?:\/\//i.test(result.url)) return null

  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${label}`}>Meeting link</p>
      <a
        href={result.url}
        target="_blank"
        rel="noreferrer"
        className={`mt-2 inline-block px-6 py-3 text-sm font-semibold uppercase tracking-widest transition-colors ${
          dark ? 'bg-white text-neutral-950 hover:bg-[#e31d25] hover:text-white' : 'bg-neutral-950 text-white hover:bg-[#e31d25]'
        }`}
      >
        Join online &#8599;
      </a>
    </div>
  )
}