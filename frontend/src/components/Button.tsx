import type { ReactNode, ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary'
}

export default function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-8 py-4 font-semibold transition-all duration-300 inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const variants = {
    primary: 'bg-text-primary text-bg hover:bg-accent',
    secondary: 'bg-transparent border border-text-primary text-text-primary hover:bg-text-primary hover:text-bg',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}