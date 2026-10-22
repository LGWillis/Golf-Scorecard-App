import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Login() {
  const { session } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (!data.session) setMessage('Check your email to confirm your account, then sign in.')
    }
    setBusy(false)
  }

  return (
    <main className="page">
      <h1 style={{ margin: '40px 0 4px' }}>Scorecard</h1>
      <p className="muted" style={{ marginBottom: 28 }}>
        {mode === 'signin' ? 'Sign in to see your rounds.' : 'Create an account to start tracking rounds.'}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" className="input" type="password" minLength={6} required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p>{message}</p>}

        <button className="btn btn-primary btn-wide" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
        <button className="link-btn" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage('') }}>
          {mode === 'signin' ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </main>
  )
}
