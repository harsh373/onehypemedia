import { useState, type CSSProperties } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Container from '../components/Container'
import { updateMyProfile, logoutUser, type CurrentUser } from '../api/userAuth'
import { useUserAuth } from '../auth/authContext'

const inputClass = 'mt-2 w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors focus:border-neutral-950'
const labelClass = 'block text-[11px] font-semibold tracking-[0.2em] text-neutral-400'

const gridStyle: CSSProperties = {
  backgroundImage: 'linear-gradient(to right, rgba(10,10,10,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,10,10,0.06) 1px, transparent 1px)',
  backgroundSize: '56px 56px',
  maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
  WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 85%)',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ paddingTop: 150, paddingBottom: 64 }} className="relative min-h-screen overflow-hidden bg-white text-neutral-950">
      <div aria-hidden="true" style={gridStyle} className="pointer-events-none absolute inset-0" />
      <Container className="relative">
        <div className="mx-auto max-w-2xl">{children}</div>
      </Container>
    </main>
  )
}

function Field({ label, value, isPrivate }: { label: string; value: string; isPrivate?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={labelClass}>{label}{isPrivate ? ' · PRIVATE' : ''}</p>
      <p style={{ marginTop: 8 }} className="break-words text-sm font-medium text-neutral-950">{value || '—'}</p>
    </div>
  )
}

function ProfileEditor({ user }: { user: CurrentUser }) {
  const navigate = useNavigate()
  const { setUser } = useUserAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: user.name, phone: user.phone, bio: user.bio, location: user.location })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function set(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function startEdit() {
    setForm({ name: user.name, phone: user.phone, bio: user.bio, location: user.location })
    setError('')
    setSaved(false)
    setEditing(true)
  }

  function cancelEdit() {
    setError('')
    setEditing(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      const updated = await updateMyProfile(form)
      setUser(updated)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    try {
      await logoutUser()
      setUser(null)
      navigate('/')
    } catch {
      window.alert('Could not log out. Please try again.')
    }
  }

  if (!editing) {
    return (
      <div className="overflow-hidden border border-neutral-200 bg-white shadow-[0_20px_60px_-30px_rgba(10,10,10,0.25)]">
        <div className="p-7 md:p-10">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e31d25]">MY PROFILE</p>
            {saved && <p className="text-xs font-medium text-neutral-500">Saved ✓</p>}
          </div>

          <h1 style={{ marginTop: 16 }} className="break-words text-3xl font-extrabold uppercase leading-none tracking-tight md:text-4xl">{user.name}</h1>
          <p style={{ marginTop: 10 }} className="text-sm text-neutral-500">@{user.username}{user.location ? ` · ${user.location}` : ''}</p>

          <div style={{ marginTop: 32, paddingTop: 24 }} className="grid gap-6 border-t border-neutral-200 sm:grid-cols-2">
            <Field label="EMAIL" value={user.email} isPrivate />
            <Field label="PHONE" value={user.phone} isPrivate />
          </div>

          <div style={{ marginTop: 24, paddingTop: 24 }} className="border-t border-neutral-200">
            <p className={labelClass}>BIO</p>
            {user.bio ? (
              <p style={{ marginTop: 12, paddingLeft: 16 }} className="whitespace-pre-wrap break-words border-l-2 border-[#e31d25] text-base leading-relaxed text-neutral-700">{user.bio}</p>
            ) : (
              <p style={{ marginTop: 12 }} className="text-sm text-neutral-400">No bio yet. Add a line about yourself.</p>
            )}
          </div>

          <div style={{ marginTop: 40, paddingTop: 24 }} className="flex flex-wrap items-center gap-3 border-t border-neutral-200">
            <button type="button" onClick={startEdit} className="bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#e31d25]">Edit profile</button>
            <Link to="/my-events" className="border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-950 transition-colors hover:border-neutral-950">My events</Link>
            <Link to={`/u/${user.username}`} className="border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-950 transition-colors hover:border-neutral-950">Public view</Link>
            <button type="button" onClick={handleLogout} className="ml-auto text-xs font-semibold uppercase tracking-widest text-neutral-400 transition-colors hover:text-[#e31d25]">Log out</button>
          </div>
        </div>

        <div className="bg-[#0a0a0a] px-7 py-4 md:px-10">
          <p className="text-[11px] tracking-wide text-neutral-400">Email and phone are only visible to you. Others see your name, username, location and bio.</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden border border-neutral-200 bg-white shadow-[0_20px_60px_-30px_rgba(10,10,10,0.25)]">
      <div className="p-7 md:p-10">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[#e31d25]">EDIT PROFILE</p>
        <h1 style={{ marginTop: 16 }} className="text-2xl font-extrabold uppercase leading-none tracking-tight md:text-3xl">Update your details</h1>

        <div style={{ marginTop: 32 }} className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>NAME</label>
            <input id="name" value={form.name} maxLength={100} onChange={(e) => set('name', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="location" className={labelClass}>LOCATION</label>
            <input id="location" value={form.location} maxLength={150} onChange={(e) => set('location', e.target.value)} className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="phone" className={labelClass}>PHONE · PRIVATE</label>
            <input id="phone" value={form.phone} maxLength={20} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bio" className={labelClass}>BIO</label>
            <textarea id="bio" rows={5} value={form.bio} maxLength={500} onChange={(e) => set('bio', e.target.value)} className={inputClass} />
            <p style={{ marginTop: 4 }} className="text-right text-[11px] text-neutral-400">{form.bio.length}/500</p>
          </div>
        </div>

        {error && <p style={{ marginTop: 16 }} className="text-sm text-[#e31d25]">{error}</p>}

        <div style={{ marginTop: 28 }} className="flex flex-wrap gap-3">
          <button type="submit" disabled={submitting} className="bg-neutral-950 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-[#e31d25] disabled:opacity-50">
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <button type="button" onClick={cancelEdit} disabled={submitting} className="border border-neutral-300 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-neutral-950 transition-colors hover:border-neutral-950 disabled:opacity-50">Cancel</button>
        </div>
      </div>
    </form>
  )
}

export default function ProfilePage() {
  const { user, loading } = useUserAuth()

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-neutral-500">Loading...</p>
      </Shell>
    )
  }

  if (!user) {
    return <Navigate to="/login?next=/profile" replace />
  }

  return (
    <Shell>
      <ProfileEditor user={user} />
    </Shell>
  )
}