import { useState, useEffect, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Container from './Container'
import logo from '../assets/logo.png'
import { useUserAuth } from '../auth/authContext'
import { logoutUser } from '../api/userAuth'

type NavLinkItem = { label: string; href: string; route: boolean }

const NAV_LINKS: NavLinkItem[] = [
  { label: 'ABOUT', href: '/#about', route: false },
  { label: 'SERVICES', href: '/#services', route: false },
  { label: 'HYPE LAB', href: '/hype-lab', route: true },
  { label: 'UPCOMING EVENTS', href: '/upcoming-events', route: true },
]

const desktopLinkStyle: CSSProperties = { fontSize: 13, fontWeight: 500, letterSpacing: '0.06em', whiteSpace: 'nowrap' }

type NavItemProps = {
  link: NavLinkItem
  className: string
  style?: CSSProperties
  onClick?: () => void
}

function NavItem({ link, className, style, onClick }: NavItemProps) {
  if (link.route) {
    return <Link to={link.href} onClick={onClick} className={className} style={style}>{link.label}</Link>
  }
  return <a href={link.href} onClick={onClick} className={className} style={style}>{link.label}</a>
}

function UserIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  )
}

function LogoutIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, loading, setUser } = useUserAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    try {
      await logoutUser()
      setUser(null)
      setMenuOpen(false)
      navigate('/')
    } catch {
      window.alert('Could not log out. Please try again.')
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-[72px] md:h-[80px] flex items-center transition-all duration-300 ${scrolled ? 'bg-bg/90 backdrop-blur-md border-b border-border' : 'bg-transparent'}`}>
      <Container className="flex items-center">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center">
            <img src={logo} alt="OneHype" className="h-9 md:h-10 w-9 md:w-10 rounded-full object-cover" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center" style={{ gap: 36 }}>
          {NAV_LINKS.map((link) => (
            <NavItem key={link.href} link={link} style={desktopLinkStyle} className="hover:text-accent transition-colors" />
          ))}
        </nav>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div className="hidden md:flex items-center" style={{ gap: 10 }}>
            <a href="/#start-project" className="inline-flex items-center bg-text-primary text-bg hover:bg-accent transition-colors duration-300" style={{ height: 38, padding: '0 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>START A PROJECT</a>

            {!loading && !user && (
              <Link to="/login" className="inline-flex items-center border border-current hover:text-accent transition-colors" style={{ height: 38, padding: '0 14px', gap: 6, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                <UserIcon size={15} />
                LOG IN
              </Link>
            )}

            {!loading && user && (
              <>
                <Link to="/profile" title="Profile" aria-label="Profile" className="flex items-center justify-center rounded-full border border-current hover:text-accent transition-colors" style={{ width: 38, height: 38 }}>
                  <UserIcon size={18} />
                </Link>
                <button type="button" onClick={handleLogout} title="Log out" aria-label="Log out" className="flex items-center justify-center rounded-full bg-text-primary text-bg hover:bg-accent transition-colors" style={{ width: 38, height: 38 }}>
                  <LogoutIcon size={17} />
                </button>
              </>
            )}
          </div>

          <button className="md:hidden text-small font-semibold tracking-wide" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </Container>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }} className="md:hidden absolute top-full left-0 right-0 bg-bg border-b border-border flex flex-col gap-6 px-8 py-8">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.href} link={link} onClick={() => setMenuOpen(false)} className="text-card font-semibold" />
            ))}

            {!loading && !user && (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center text-card font-semibold" style={{ gap: 12 }}>
                <UserIcon size={20} />
                LOG IN
              </Link>
            )}

            {!loading && user && (
              <>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center text-card font-semibold" style={{ gap: 12 }}>
                  <UserIcon size={20} />
                  PROFILE
                </Link>
                <button type="button" onClick={handleLogout} className="flex w-fit items-center text-card font-semibold" style={{ gap: 12 }}>
                  <LogoutIcon size={20} />
                  LOG OUT
                </button>
              </>
            )}

            <a href="/#start-project" onClick={() => setMenuOpen(false)} className="w-fit px-6 py-3 text-sm font-semibold bg-text-primary text-bg inline-flex items-center gap-2">START A PROJECT</a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}