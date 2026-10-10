type SectionLabelProps = {
  index: string
  label: string
  light?: boolean
}

export default function SectionLabel({ index, label, light = false }: SectionLabelProps) {
  return (
    <p
      className={`text-small font-semibold tracking-widest uppercase ${
        light ? 'text-white/60' : 'text-text-secondary'
      }`}
    >
      {index} / {label}
    </p>
  )
}