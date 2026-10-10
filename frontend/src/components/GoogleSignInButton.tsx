import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { googleLogin } from '../api/userAuth'
import { useUserAuth } from '../auth/authContext'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export default function GoogleSignInButton({ next }: { next?: string }) {
  const navigate = useNavigate()
  const { setUser } = useUserAuth()
  const [error, setError] = useState('')

  if (!clientId) return null

  async function handleCredential(credential: string | undefined) {
    if (!credential) {
      setError('Google sign-in failed.')
      return
    }
    setError('')
    try {
      const user = await googleLogin(credential)
      setUser(user)
      navigate(next || '/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleOAuthProvider clientId={clientId}>
          <GoogleLogin onSuccess={(res) => handleCredential(res.credential)} onError={() => setError('Google sign-in failed.')} text="continue_with" shape="rectangular" width="384" />
        </GoogleOAuthProvider>
      </div>
      {error && <p className="text-sm text-[#e31d25]" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  )
}