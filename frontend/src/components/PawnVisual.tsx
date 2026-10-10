import { motion } from 'framer-motion'

export default function PawnVisual({ className = '' }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 200 400"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Knob */}
      <circle cx="100" cy="48" r="28" fill="var(--color-text-primary)" />

      {/* Accent ring — the one deliberate red detail */}
      <circle
        cx="100"
        cy="48"
        r="38"
        stroke="var(--color-accent)"
        strokeWidth="2"
        opacity="0.55"
      />

      {/* Body — neck, collar, waist, bulb, taper */}
      <path
        d="M82,76
           C70,84 66,90 68,96
           C74,104 78,110 78,118
           C74,138 72,148 72,158
           C60,183 52,203 50,218
           C47,243 45,263 45,278
           C45,293 50,303 60,308
           C65,313 68,316 70,320
           L130,320
           C132,316 135,313 140,308
           C150,303 155,293 155,278
           C155,263 153,243 150,218
           C148,203 140,183 128,158
           C128,148 126,138 122,118
           C122,110 126,104 132,96
           C134,90 130,84 118,76
           Z"
        fill="var(--color-text-primary)"
      />

      {/* Base — two tiers, not one flat plinth */}
      <rect x="30" y="320" width="140" height="18" rx="5" fill="var(--color-text-primary)" />
      <rect x="10" y="338" width="180" height="16" rx="5" fill="var(--color-text-primary)" />
    </motion.svg>
  )
}