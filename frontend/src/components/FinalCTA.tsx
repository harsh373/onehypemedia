import { motion } from 'framer-motion'
import Container from './Container'
import SectionLabel from './SectionLabel'

export default function FinalCTA() {
  return (
    <section
      id="start-project"
      className="scroll-mt-[104px] md:scroll-mt-[120px] py-32 md:py-48 bg-text-primary"
    >
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionLabel index ="" label="Start a project" light />

          <h2
            style={{ fontSize: 'var(--text-heading)', marginTop: 'var(--spacing-24)' }}
            className="font-extrabold leading-[0.95] tracking-tight text-white max-w-3xl"
          >
            GOT SOMETHING
            <br />
            WORTH <span className="text-accent">BUILDING?</span>
          </h2>

          <p
            style={{ fontSize: 'var(--text-body)', marginTop: 'var(--spacing-32)' }}
            className="text-white/60 max-w-md"
          >
            Brand. Content. Digital. Experience.
            <br />
            Or something we haven't thought of yet.
          </p>

          <motion.a
            href="mailto:hello@onehype.media"
            initial="rest"
            whileHover="hover"
            style={{ marginTop: 'var(--spacing-64)' }}
            className="inline-flex items-center gap-3 bg-white text-text-primary px-10 py-5 font-semibold text-body group"
          >
            START A PROJECT
            <motion.span
              variants={{ rest: { x: 0 }, hover: { x: 6 } }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              →
            </motion.span>
          </motion.a>
        </motion.div>
      </Container>
    </section>
  )
}