import { motion, type Variants } from 'framer-motion'
import Container from './Container'
import SectionLabel from './SectionLabel'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Intro() {
  return (
    <section id="about" className="scroll-mt-[104px] md:scroll-mt-[120px] py-24 md:py-40">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-10 lg:gap-x-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="lg:col-span-7"
          >
            <motion.div custom={0} variants={fadeUp}>
              <SectionLabel index="01" label="Who we are" />
            </motion.div>
            <motion.h2
              custom={1}
              variants={fadeUp}
              style={{ fontSize: 'var(--text-statement)', marginTop: 'var(--spacing-24)' }}
              className="font-extrabold leading-[0.95] tracking-tight"
            >
              ONE AGENCY.
              <br />
              MULTIPLE
              <br />
              CAPABILITIES.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="lg:col-span-5 lg:mt-40"
          >
            <motion.p
              custom={2}
              variants={fadeUp}
              style={{ fontSize: 'var(--text-body)' }}
              className="text-text-secondary max-w-md"
            >
              OneHype brings strategy, creativity, content, experiences and technology together to build things people remember.
            </motion.p>
          </motion.div>
        </div>
      </Container>
    </section>
  )
}