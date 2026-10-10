import { motion, useTransform, type MotionValue } from 'framer-motion'
import type { ApproachStepData } from '../data/approach'

interface Props {
  step: ApproachStepData
  index: number
  total: number
  progress: MotionValue<number>
}

export default function ApproachStep({ step, index, total, progress }: Props) {
  const segment = 1 / total
  const start = index * segment
  const end = start + segment
  const fade = segment * 0.005

  const fadeInStart = Math.max(0, start - fade)
  const fadeOutEnd = Math.min(1, end + fade)

  const opacity = useTransform(progress, [fadeInStart, start, end, fadeOutEnd], [0, 1, 1, 0])
  const scale = useTransform(progress, [fadeInStart, start, end, fadeOutEnd], [0.94, 1, 1, 0.94])

  return (
    <motion.div
      style={{ opacity, scale, pointerEvents: 'none' }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
    >
      <span className="text-small font-medium tracking-widest text-white/50 mb-6">{step.index}</span>
      <h3
        style={{ fontSize: 'var(--text-heading)' }}
        className="font-extrabold leading-[0.95] tracking-tight text-white"
      >
        {step.lineOne}
        <br />
        <span className="text-accent">{step.lineTwo}</span>
      </h3>
    </motion.div>
  )
}