import type { ReactNode } from 'react'

type ContainerProps = {
  children: ReactNode
  className?: string
}

export default function Container({ children, className = '' }: ContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-8 sm:px-12 lg:px-16 ${className}`}
      style={{ maxWidth: 'var(--container-max)' }}
    >
      {children}
    </div>
  )
}