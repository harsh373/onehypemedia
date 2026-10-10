import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import { useRef } from 'react'
import Container from './Container'
import Button from './Button'
import PawnVisual from './PawnVisual'

const lineVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  return (
    <section ref={ref} className="relative min-h-[100vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <motion.div style={{ y, opacity }} className="relative w-full">
        <Container className="relative z-10 py-32 md:py-24">
          <div className="max-w-5xl">
            <h1 className="tracking-tight">
              <motion.span
                custom={0} initial="hidden" animate="visible" variants={lineVariants}
                style={{ fontSize: 'var(--text-hero)' }}
                className="block font-extrabold leading-[0.88]"
              >
                WE DON'T
              </motion.span>
              <motion.span
                custom={1} initial="hidden" animate="visible" variants={lineVariants}
                style={{ fontSize: 'var(--text-hero)' }}
                className="block font-extrabold leading-[0.88]"
              >
                DO <span className="text-accent">BORING.</span>
              </motion.span>
            </h1>

            <motion.p
              custom={2} initial="hidden" animate="visible" variants={lineVariants}
              style={{ fontSize: 'var(--text-card)', marginTop: 'var(--spacing-32)' }}
              className="font-bold leading-[1.05] tracking-tight"
            >
              WE MAKE PEOPLE <span className="text-accent">NOTICE.</span>
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.68, duration: 0.6 }}
              style={{ marginTop: 'var(--spacing-24)' }}
              className="text-body text-text-secondary max-w-md"
            >
              Strategy, creativity, content, experiences and technology — built under one roof.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ marginTop: 'var(--spacing-80)' }}
            >
              <Button
                variant="primary"
                style={{ padding: '1.1rem 2.75rem', fontSize: '1.0625rem' }}
              >
                START A PROJECT →
              </Button>
            </motion.div>
          </div>
        </Container>
      </motion.div>

      <motion.div style={{ y, opacity }} className="absolute right-[6%] top-1/2 -translate-y-1/2 w-[24vw] max-w-[340px] hidden lg:block">
        <PawnVisual className="w-full h-auto" />
      </motion.div>
    </section>
  )
}