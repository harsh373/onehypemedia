import { motion } from 'framer-motion'
import Container from './Container'
import SectionLabel from './SectionLabel'
import { EXPERIMENTS } from '../data/experiment'

export default function HypeLab() {
  return (
    <section id="hype-lab" className="scroll-mt-[104px] md:scroll-mt-[120px] py-32 md:py-48 border-t border-border">
      <Container>
        <SectionLabel index="04" label="Hype lab" />

        {EXPERIMENTS.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 'var(--spacing-32)' }}
            className="max-w-3xl"
          >
            <h2
              style={{ fontSize: 'var(--text-statement)' }}
              className="font-extrabold leading-[0.95] tracking-tight"
            >
              WE'RE JUST
              <br />
              GETTING <span className="text-accent">STARTED.</span>
            </h2>
            <p
              style={{ fontSize: 'var(--text-body)', marginTop: 'var(--spacing-24)' }}
              className="text-text-secondary"
            >
              Ideas we're playing with. Things we're building. Experiments we're not afraid to try.
              Watch this space.
            </p>
          </motion.div>
        ) : (
          <div style={{ marginTop: 'var(--spacing-64)' }} className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {EXPERIMENTS.map((exp) => (
              <div key={exp.id} className="md:col-span-3 border border-border p-8">
                <span className="text-small text-text-secondary uppercase tracking-widest">
                  {exp.category}
                </span>
                <h3 style={{ fontSize: 'var(--text-card)' }} className="font-bold mt-2">
                  {exp.title}
                </h3>
              </div>
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}