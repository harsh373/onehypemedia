import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Container from '../components/Container'
import { getPublicProfile, type PublicProfile } from '../api/userAuth'
import { useUserAuth } from '../auth/authContext'

const labelClass = 'block text-xs font-semibold tracking-widest text-neutral-500'

export default function PublicProfilePage() {
  const { username } = useParams()
  const { user } = useUserAuth()
  const [result, setResult] = useState<{ username: string; profile: PublicProfile | null } | null>(null)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    getPublicProfile(username).then((profile) => {
      if (!cancelled) setResult({ username, profile })
    })
    return () => {
      cancelled = true
    }
  }, [username])

  const loading = result?.username !== username
  const profile = result?.profile ?? null
  const isOwn = !!user && !!profile && user.username === profile.username

  return (
    <main className="min-h-screen bg-white pb-24 pt-40 text-neutral-950">
      <Container>
        <div className="mx-auto max-w-md">
          {loading && <p className="text-sm text-neutral-500">Loading...</p>}

          {!loading && !profile && (
            <>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight">Not found</h1>
              <p className="mt-4 text-neutral-500">No user with that username.</p>
              <p className="mt-6 text-sm"><Link to="/" className="text-neutral-950 underline">Back to home</Link></p>
            </>
          )}

          {!loading && profile && (
            <>
              <h1 className="text-3xl font-extrabold uppercase tracking-tight">{profile.name}</h1>
              <p className="mt-1 text-sm text-neutral-500">@{profile.username}</p>

              <p className={`mt-8 ${labelClass}`}>LOCATION</p>
              <p className="mt-2 text-neutral-950">{profile.location || '—'}</p>

              <p className={`mt-5 ${labelClass}`}>BIO</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-neutral-950">{profile.bio || '—'}</p>

              {isOwn && (
                <Link to="/profile" className="mt-8 block w-full bg-neutral-950 px-6 py-3 text-center text-sm font-semibold uppercase tracking-widest text-white">Edit profile</Link>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  )
}