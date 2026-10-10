import { motion, type Variants } from 'framer-motion'
import Container from './Container'
import SectionLabel from './SectionLabel'

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Manifesto() {
  return (
    <section className="bg-text-primary text-white py-40 md:py-64">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 md:gap-8">
          {/* Label — dark-bg override since SectionLabel defaults to a light-bg palette */}
          <div className="md:col-span-12 [&_*]:text-white/40">
            <SectionLabel index="05" label="What we believe" />
          </div>

          {/* Headline — takes the dominant left/upper block, no longer mirrors Hype Lab's centered stack */}
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            style={{ fontSize: 'var(--text-heading)', marginTop: 'var(--spacing-32)' }}
            className="md:col-span-8 font-extrabold leading-[0.95] tracking-tight uppercase"
          >
            <motion.span custom={0} variants={lineVariants} className="block">Good ideas</motion.span>
            <motion.span custom={1} variants={lineVariants} className="block">should</motion.span>
            <motion.span custom={2} variants={lineVariants} className="block">
              Make <span className="text-accent">noise.</span>
            </motion.span>
          </motion.h2>

          {/* Statement — pulled out as a marked quote, offset to the right and dropped low,
              instead of stacked directly under the headline like every other section does */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: 0.6, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginTop: 'var(--spacing-64)' }}
            className="md:col-span-4 md:col-start-9 md:self-end border-l-2 border-accent pl-6"
          >
            <p style={{ fontSize: 'var(--text-body)' }} className="text-white/70">
              We don't follow templates. We question the obvious. We build things worth
              remembering.
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}