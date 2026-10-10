import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Container from './Container'
import SectionLabel from './SectionLabel'
import { CAPABILITIES } from '../data/capabilities'

export default function Capabilities() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="services" className="scroll-mt-[104px] md:scroll-mt-[120px] py-24 md:py-40 border-t border-border">
      <Container>
        <SectionLabel index="" label="What we do" />
        <h2 style={{ fontSize: 'var(--text-heading)', marginTop: 'var(--spacing-24)', marginBottom: 'var(--spacing-64)' }} className="font-extrabold leading-[0.92] tracking-tight">
          FOUR WAYS
          <br />
          WE WORK.
        </h2>

        <div>
          {CAPABILITIES.map((cap, i) => {
            const isOpen = openIndex === i
            return (
              <div key={cap.title} className="border-b border-border">
                <button onClick={() => setOpenIndex(isOpen ? null : i)} aria-expanded={isOpen} className="w-full flex items-baseline gap-6 md:gap-12 py-8 md:py-10 text-left group">
                  <span className="text-small text-text-secondary font-medium w-8 shrink-0">
                    {cap.index}
                  </span>
                  <span style={{ fontSize: 'var(--text-statement)' }} className={`font-extrabold tracking-tight transition-colors duration-300 ${isOpen ? 'text-accent' : 'text-text-primary group-hover:text-accent'}`}>
                    {cap.title}
                  </span>
                  <span className={`ml-auto text-2xl transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-45' : ''}`}>
                    +
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                      <div className="pl-14 md:pl-24 pb-10 md:pb-12">
                        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 md:gap-16 items-start">
                          <p className="text-body text-text-secondary max-w-md">
                            {cap.description}
                          </p>
                          <div className="flex flex-col">
                            {cap.services.map((service, idx) => (
                              <span key={service} className={`text-small text-text-primary tracking-wide py-3 ${idx !== cap.services.length - 1 ? 'border-b border-border' : ''}`}>
                                {service}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}