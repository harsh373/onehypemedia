import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Container from '../components/Container'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { loginUser } from '../api/userAuth'
import { useUserAuth } from '../auth/authContext'

const inputClass = 'mt-2 w-full border border-neutral-300 px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950'
const labelClass = 'block text-xs font-semibold tracking-widest text-neutral-500'

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setUser } = useUserAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const user = await loginUser(email, password)
      setUser(user)
      navigate(params.get('next') || '/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white pb-24 pt-40 text-neutral-950">
      <Container>
        <div className="mx-auto max-w-md">
          <form onSubmit={handleSubmit}>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">Log in</h1>

            <label htmlFor="email" className={`mt-8 ${labelClass}`}>EMAIL</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />

            <label htmlFor="password" className={`mt-5 ${labelClass}`}>PASSWORD</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />

            {error && <p className="mt-4 text-sm text-[#e31d25]">{error}</p>}

            <button type="submit" disabled={submitting} className="mt-8 w-full bg-neutral-950 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white disabled:opacity-50">
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-xs font-semibold tracking-widest text-neutral-400" style={{ margin: '24px 0' }}>OR</p>

          <GoogleSignInButton next={params.get('next') || undefined} />

          <p className="mt-6 text-sm text-neutral-500">Don't have an account? <Link to="/register" className="text-neutral-950 underline">Create one</Link></p>
        </div>
      </Container>
    </main>
  )
}