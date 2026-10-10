import { useRef } from 'react'
import { useScroll } from 'framer-motion'
import Container from './Container'
import SectionLabel from './SectionLabel'
import ApproachStep from './ApproachStep'
import { APPROACH_STEPS } from '../data/approach'

export default function Approach() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  return (
    <section
      id="approach"
      ref={ref}
      className="relative bg-text-primary"
      style={{ height: `${APPROACH_STEPS.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <Container className="pt-48 md:pt-40">
          <SectionLabel index="" label="How we think" light />
          <h2
            style={{ fontSize: 'var(--text-statement)', marginTop: 'var(--spacing-24)' }}
            className="font-extrabold leading-[0.95] tracking-tight text-white"
          >
            THE ONEHYPE
            <br />
            APPROACH
          </h2>
        </Container>

        <div className="relative flex-1">
          {APPROACH_STEPS.map((step, i) => (
            <ApproachStep
              key={step.index}
              step={step}
              index={i}
              total={APPROACH_STEPS.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  )
}