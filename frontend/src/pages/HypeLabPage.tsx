import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import Footer from '../components/Footer'
import { formatEventWhen, getPastEvents } from '../api/events'
import type { EventRecord } from '../api/events'
import { COVER_ASPECT, imageUrl } from '../api/images'

const gridStyle = {
  backgroundColor: '#ffffff',
  backgroundImage: 'linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
}

export default function HypeLabPage() {
  const [events, setEvents] = useState<EventRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const previous = document.title
    document.title = 'Hype Lab — OneHype Media'
    return () => {
      document.title = previous
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getPastEvents()
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  function retry() {
    setLoading(true)
    setError('')
    setAttempt((a) => a + 1)
  }

  return (
    <>
      <main className="min-h-screen pb-32 pt-40 text-neutral-950" style={gridStyle}>
        <Container>
          <div className="flex flex-col gap-16">
            <div className="flex flex-col gap-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">HYPE LAB</p>
              <h1 className="max-w-4xl text-5xl font-extrabold uppercase leading-[0.95] tracking-[-0.03em] md:text-7xl">Events we made.</h1>
            </div>

            {loading ? (
              <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((n) => (
                  <div key={n} className="flex flex-col gap-4">
                    <div className="animate-pulse rounded-lg bg-neutral-200" style={{ aspectRatio: COVER_ASPECT }} />
                    <div className="h-3 w-1/2 animate-pulse bg-neutral-200" />
                    <div className="h-6 w-3/4 animate-pulse bg-neutral-200" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col gap-4">
                <p className="text-neutral-600">{error}</p>
                <button type="button" onClick={retry} className="w-fit bg-neutral-950 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white">Try again</button>
              </div>
            ) : events.length === 0 ? (
              <p className="text-lg text-neutral-500">No past events yet. Check back soon.</p>
            ) : (
              <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Link key={event._id} to={`/hype-lab/${event.slug}`} className="group flex flex-col gap-4">
                    <div className="overflow-hidden rounded-lg bg-neutral-200" style={{ aspectRatio: COVER_ASPECT }}>
                      {event.coverImage && <img src={imageUrl(event.coverImage, 800)} alt={event.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">{formatEventWhen(event)} · {event.location}</p>
                      <h2 className="text-2xl font-extrabold uppercase leading-tight tracking-tight transition-colors group-hover:text-[#e31d25]">{event.title}</h2>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}