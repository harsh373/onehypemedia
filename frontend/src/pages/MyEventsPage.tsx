import { useEffect, useState, type CSSProperties } from 'react'
import { Link, Navigate } from 'react-router-dom'
import Container from '../components/Container'
import { getMyEvents, type MyEventItem, type MyEvents } from '../api/participation'
import { useUserAuth } from '../auth/authContext'

const labelClass = 'block text-[11px] font-semibold tracking-[0.2em] text-neutral-400'

const gridStyle: CSSProperties = {
  backgroundImage: 'linear-gradient(to right, rgba(10,10,10,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.06) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
  maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ paddingTop: 150, paddingBottom: 64 }} className="relative min-h-screen overflow-hidden bg-white text-neutral-950">
      <div aria-hidden="true" style={gridStyle} className="pointer-events-none absolute inset-0" />
      <Container className="relative">
        <div className="mx-auto max-w-2xl">{children}</div>
      </Container>
    </main>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

function EventRow({ item, muted }: { item: MyEventItem; muted?: boolean }) {
  return (
    <Link to={`/hype-lab/${item.event.slug}`} className="block border border-neutral-200 bg-white transition-colors hover:border-neutral-950" style={{ padding: 20 }}>
      <p className={`text-[11px] font-semibold tracking-[0.2em] ${muted ? 'text-neutral-400' : 'text-[#e31d25]'}`}>{formatDate(item.event.date).toUpperCase()}</p>
      <p className={`text-lg font-extrabold uppercase leading-tight tracking-tight ${muted ? 'text-neutral-500' : 'text-neutral-950'}`} style={{ marginTop: 8 }}>{item.event.title}</p>
      {item.event.location && <p className="text-sm text-neutral-500" style={{ marginTop: 6 }}>{item.event.location}</p>}
    </Link>
  )
}

function Section({ title, items, emptyText, muted }: { title: string; items: MyEventItem[]; emptyText: string; muted?: boolean }) {
  return (
    <section style={{ marginTop: 40 }}>
      <p className={labelClass}>{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-400" style={{ marginTop: 12 }}>{emptyText}</p>
      ) : (
        <div className="flex flex-col" style={{ marginTop: 12, gap: 12 }}>
          {items.map((item) => (
            <EventRow key={item.id} item={item} muted={muted} />
          ))}
        </div>
      )}
    </section>
  )
}

function MyEventsList() {
  const [state, setState] = useState<{ data: MyEvents | null } | null>(null)

  useEffect(() => {
    let cancelled = false
    getMyEvents().then((data) => {
      if (!cancelled) setState({ data })
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e31d25]">MY EVENTS</p>
      <h1 className="text-3xl font-extrabold uppercase leading-none tracking-tight md:text-4xl" style={{ marginTop: 16 }}>Your registrations</h1>

      {!state && <p className="text-sm text-neutral-500" style={{ marginTop: 32 }}>Loading...</p>}

      {state && !state.data && <p className="text-sm text-[#e31d25]" style={{ marginTop: 32 }}>Could not load your events. Please refresh.</p>}

      {state?.data && (
        <>
          <Section title="UPCOMING" items={state.data.upcoming} emptyText="You haven't registered for any upcoming events." />
          <Section title="PAST" items={state.data.past} emptyText="No past events yet." muted />
        </>
      )}

      <p className="text-sm text-neutral-500" style={{ marginTop: 40 }}>Looking for something to join? <Link to="/hype-lab" className="text-neutral-950 underline">Browse Hype Lab</Link></p>
    </>
  )
}

export default function MyEventsPage() {
  const { user, loading } = useUserAuth()

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-neutral-500">Loading...</p>
      </Shell>
    )
  }

  if (!user) {
    return <Navigate to="/login?next=/my-events" replace />
  }

  return (
    <Shell>
      <MyEventsList />
    </Shell>
  )
}