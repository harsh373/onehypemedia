import { useCallback, useEffect, useRef } from 'react'

export type LightboxImage = { src: string; alt: string }

type Props = {
  images: LightboxImage[]
  index: number
  onClose: () => void
  onChange: (index: number) => void
}

const controlClass = 'flex h-11 w-11 items-center justify-center border border-white/30 text-lg text-white transition-colors hover:bg-white hover:text-neutral-950 sm:h-12 sm:w-12'

export default function Lightbox({ images, index, onClose, onChange }: Props) {
  const touchStartX = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const total = images.length

  const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange])
  const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, prev, next])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    for (const offset of [-1, 1]) {
      const neighbour = images[(index + offset + total) % total]
      if (neighbour) {
        const img = new Image()
        img.src = neighbour.src
      }
    }
  }, [index, images, total])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current
    touchStartX.current = null
    if (start === null || total < 2) return
    const dx = e.changedTouches[0].clientX - start
    if (Math.abs(dx) < 50) return
    if (dx > 0) prev()
    else next()
  }

  function handleClose(e: React.MouseEvent) {
    e.stopPropagation()
    onClose()
  }

  function handlePrev(e: React.MouseEvent) {
    e.stopPropagation()
    prev()
  }

  function handleNext(e: React.MouseEvent) {
    e.stopPropagation()
    next()
  }

  function stop(e: React.MouseEvent) {
    e.stopPropagation()
  }

  const current = images[index]
  if (!current) return null

  return (
    <div role="dialog" aria-modal="true" aria-label="Photo viewer" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95" onClick={onClose} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 sm:p-6">
        <span className="text-xs font-semibold tracking-[0.2em] text-white/70">{index + 1} / {total}</span>
        <button ref={closeRef} type="button" onClick={handleClose} aria-label="Close" className={controlClass}>✕</button>
      </div>

      <img key={index} src={current.src} alt={current.alt} draggable={false} onClick={stop} className="max-h-[80vh] max-w-[92vw] select-none object-contain sm:max-w-[80vw]" />

      {total > 1 && <button type="button" onClick={handlePrev} aria-label="Previous photo" className={`${controlClass} absolute left-3 top-1/2 -translate-y-1/2 sm:left-6`}>←</button>}
      {total > 1 && <button type="button" onClick={handleNext} aria-label="Next photo" className={`${controlClass} absolute right-3 top-1/2 -translate-y-1/2 sm:right-6`}>→</button>}
    </div>
  )
}