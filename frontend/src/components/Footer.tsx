import { Link } from 'react-router-dom'
import Container from './Container'

const FOOTER_LINKS = [
  { label: 'About', href: '/#about', route: false },
  { label: 'Services', href: '/#services', route: false },
  { label: 'Hype Lab', href: '/hype-lab', route: true },
  { label: 'Upcoming Events', href: '/upcoming-events', route: true },
  { label: 'Start a Project', href: '/#start-project', route: false },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/onehype.community' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/onehype-media/' },
  { label: 'Email', href: 'mailto:hello@onehype.media' },
]

const linkClass = 'text-body text-white/70 hover:text-accent transition-colors w-fit'

export default function Footer() {
  return (
    <footer className="bg-text-primary text-white border-t border-white/10">
      <Container className="pt-24 md:pt-32 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <span className="text-lg font-extrabold tracking-tight">ONEHYPE</span>
          </div>

          <nav className="flex flex-col gap-3">
            {FOOTER_LINKS.map((link) =>
              link.route ? (
                <Link key={link.label} to={link.href} className={linkClass}>{link.label}</Link>
              ) : (
                <a key={link.label} href={link.href} className={linkClass}>{link.label}</a>
              )
            )}
          </nav>

          <div className="flex flex-col gap-3">
            {SOCIAL_LINKS.map((link) => (
              <a key={link.label} href={link.href} className={linkClass}>{link.label}</a>
            ))}
          </div>
        </div>

        <p style={{ marginTop: 'var(--spacing-64)' }} className="text-small text-white/40">© 2026 OneHype Media</p>

        <div style={{ marginTop: 'var(--spacing-32)' }} className="font-extrabold leading-[0.8] tracking-tight text-white/10 select-none">
          <span style={{ fontSize: 'clamp(4rem, 14vw, 13rem)' }}>ONEHYPE</span>
        </div>
      </Container>
    </footer>
  )
}