import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Container from '../components/Container'
import GoogleSignInButton from '../components/GoogleSignInButton'
import { registerUser } from '../api/userAuth'
import { useUserAuth } from '../auth/authContext'

const inputClass = 'mt-2 w-full border border-neutral-300 px-4 py-3 text-neutral-950 outline-none focus:border-neutral-950'
const labelClass = 'block text-xs font-semibold tracking-widest text-neutral-500'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useUserAuth()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const user = await registerUser(form)
      setUser(user)
      navigate('/profile')
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
            <h1 className="text-3xl font-extrabold uppercase tracking-tight">Create account</h1>

            <label htmlFor="name" className={`mt-8 ${labelClass}`}>NAME</label>
            <input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />

            <label htmlFor="username" className={`mt-5 ${labelClass}`}>USERNAME</label>
            <input id="username" value={form.username} onChange={(e) => set('username', e.target.value)} className={inputClass} />

            <label htmlFor="email" className={`mt-5 ${labelClass}`}>EMAIL</label>
            <input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />

            <label htmlFor="password" className={`mt-5 ${labelClass}`}>PASSWORD</label>
            <input id="password" type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass} />

            <label htmlFor="confirmPassword" className={`mt-5 ${labelClass}`}>CONFIRM PASSWORD</label>
            <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} className={inputClass} />

            {error && <p className="mt-4 text-sm text-[#e31d25]">{error}</p>}

            <button type="submit" disabled={submitting} className="mt-8 w-full bg-neutral-950 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white disabled:opacity-50">
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-xs font-semibold tracking-widest text-neutral-400" style={{ margin: '24px 0' }}>OR</p>

          <GoogleSignInButton />

          <p className="mt-6 text-sm text-neutral-500">Already have an account? <Link to="/login" className="text-neutral-950 underline">Log in</Link></p>
        </div>
      </Container>
    </main>
  )
}