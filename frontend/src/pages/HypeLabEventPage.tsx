import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import Container from '../components/Container'
import Lightbox from '../components/Lightbox'
import ParticipateButton from '../components/ParticipateButton'
import { formatEventWhen, getEventBySlug } from '../api/events'
import type { EventRecord } from '../api/events'
import { COVER_ASPECT, GALLERY_ASPECT, imageUrl } from '../api/images'
import { isBeforeTodayIST } from '../api/istDay'
import { getTheme } from '../admin/eventTheme'

const gridStyle = {
  backgroundColor: '#ffffff',
  backgroundImage: 'linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px)',
  backgroundSize: '80px 80px',
}

const cardLabel = 'text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400'

type State = {
  slug: string
  event: EventRecord | null
  error: string
  notFound: boolean
}

function mapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
}

export default function HypeLabEventPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [state, setState] = useState<State | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const loading = !state || state.slug !== slug
  const event = state && state.slug === slug ? state.event : null

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    getEventBySlug(slug)
      .then((data) => {
        if (!cancelled) setState({ slug, event: data, error: '', notFound: false })
      })
      .catch((e: Error) => {
        if (cancelled) return
        const notFound = axios.isAxiosError(e.cause) && e.cause.response?.status === 404
        setState({ slug, event: null, error: e.message, notFound })
      })
    return () => {
      cancelled = true
    }
  }, [slug, attempt])

  useEffect(() => {
    if (!event) return
    const previous = document.title
    document.title = `${event.title} — OneHype Media`
    return () => {
      document.title = previous
    }
  }, [event])

  function retry() {
    setState(null)
    setAttempt((a) => a + 1)
  }

  const ended = event ? isBeforeTodayIST(event.date) : false
  const isUpcoming = event ? !ended : false
  const backTo = isUpcoming ? '/upcoming-events' : '/hype-lab'
  const backLabel = isUpcoming ? '← Upcoming events' : '← All events'

  const isOnline = event?.locationType === 'online'
  const theme = getTheme(event?.theme)
  const pin = event && typeof event.lat === 'number' && typeof event.lng === 'number' ? { lat: event.lat, lng: event.lng } : null

  const usingCover = event ? event.gallery.length === 0 : false
  const photos = event ? (event.gallery.length > 0 ? event.gallery : event.coverImage ? [event.coverImage] : []) : []
  const photoAspect = usingCover ? COVER_ASPECT : GALLERY_ASPECT
  const lightboxImages = event ? photos.map((photo, i) => ({ src: imageUrl(photo, 2200), alt: `${event.title} photo ${i + 1}` })) : []

  return (
    <main className="min-h-screen pb-32 pt-40 text-neutral-950" style={gridStyle}>
      <Container>
        <div className="flex flex-col gap-12">
          <Link to={backTo} className="w-fit text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 transition-colors hover:text-neutral-950">{backLabel}</Link>

          {loading ? (
            <div className="flex flex-col gap-14">
              <div className="flex flex-col gap-4">
                <div className="h-12 w-2/3 animate-pulse bg-neutral-200" />
                <div className="h-4 w-48 animate-pulse bg-neutral-200" />
                <div className="h-16 w-full max-w-2xl animate-pulse bg-neutral-200" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((n) => (
                  <div key={n} className="animate-pulse rounded-lg bg-neutral-200" style={{ aspectRatio: GALLERY_ASPECT }} />
                ))}
              </div>
            </div>
          ) : !event ? (
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-extrabold uppercase tracking-[-0.03em] md:text-6xl">{state?.notFound ? 'Event not found.' : 'Something went wrong.'}</h1>
              <p className="text-neutral-600">{state?.notFound ? 'This event does not exist or was removed.' : state?.error}</p>
              {!state?.notFound && <button type="button" onClick={retry} className="w-fit bg-neutral-950 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white">Try again</button>}
            </div>
          ) : (
            <article className="flex flex-col gap-14">
              <header className="flex max-w-3xl flex-col gap-4">
                <h1 className="break-words text-4xl font-extrabold uppercase leading-[1] tracking-[-0.03em] sm:text-5xl">{event.title}</h1>
                <p className="whitespace-pre-line text-base leading-relaxed text-neutral-600 md:text-lg">{event.description}</p>

                <div
                  className="mt-2 flex max-w-xl flex-col gap-6 border border-neutral-950 bg-white p-6 sm:p-8"
                  style={{ borderTop: `4px solid ${theme.swatch}` }}
                >
                  <div>
                    <p className={cardLabel}>When</p>
                    <p className="mt-1 text-base font-semibold text-neutral-950">{formatEventWhen(event)}</p>
                  </div>

                  <div>
                    <p className={cardLabel}>Where</p>
                    <p className="mt-1 text-base font-semibold text-neutral-950">{isOnline ? 'Online' : event.location}</p>
                    {!isOnline && pin && (
                      <a
                        href={mapUrl(pin.lat, pin.lng)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm font-semibold text-neutral-950 underline underline-offset-2 transition-colors hover:text-[#e31d25]"
                      >
                        Open map &#8599;
                      </a>
                    )}
                  </div>

                  <div>
                    {ended ? (
                      <p className="text-sm font-semibold uppercase tracking-[0.15em] text-neutral-400">This event has ended.</p>
                    ) : (
                      <ParticipateButton
                        eventId={event._id}
                        registrationOpen={event.registrationOpen !== false}
                        isFull={event.isFull === true}
                        requireApproval={event.requireApproval === true}
                        isOnline={isOnline}
                      />
                    )}
                  </div>
                </div>
              </header>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {photos.map((photo, index) => (
                  <button key={photo._id} type="button" onClick={() => setOpenIndex(index)} aria-label={`Open photo ${index + 1}`} className="group block cursor-zoom-in overflow-hidden rounded-lg bg-neutral-200" style={{ aspectRatio: photoAspect }}>
                    <img src={imageUrl(photo, 900)} alt={`${event.title} photo ${index + 1}`} loading={index < 3 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  </button>
                ))}
              </div>
            </article>
          )}
        </div>
      </Container>

      {openIndex !== null && lightboxImages.length > 0 && <Lightbox images={lightboxImages} index={openIndex} onClose={() => setOpenIndex(null)} onChange={setOpenIndex} />}
    </main>
  )
}