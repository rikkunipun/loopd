import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Seeding is handled exclusively in useHabits.initHabits to avoid race-condition duplicates.
// Login only ensures the profile row exists (required by the habits FK constraint).
async function ensureProfile(userId) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId }, { onConflict: 'id' })
  if (error) console.error('[Login] profile upsert error:', error)
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | seeding | error
  const [errorMsg, setErrorMsg] = useState('')
  const { user } = useAuthStore()
  const navigate = useNavigate()

  // If already logged in, redirect immediately
  useEffect(() => {
    if (user) {
      handlePostLogin(user.id)
    }
  }, [user])

  async function handlePostLogin(userId) {
    setStatus('seeding')
    await ensureProfile(userId)
    navigate('/tracker', { replace: true })
  }

  async function handleSendLink(e) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('sending')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin + '/tracker',
      },
    })

    if (error) {
      setErrorMsg(error.message || error.error_description || 'Something went wrong. Please try again.')
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  if (status === 'seeding') {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={styles.seedingText}>Setting up your account…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Logo mark */}
        <div style={styles.logoMark}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#5b5bd6" />
            <path
              d="M9 14a5 5 0 0 1 5-5v0a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5v0"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle cx="14" cy="19" r="1.1" fill="white" />
          </svg>
        </div>

        <h1 style={styles.appName}>Loopd</h1>
        <p style={styles.tagline}>Plan. Live. Reflect. Repeat.</p>

        {status === 'sent' ? (
          <div style={styles.sentBox}>
            <div style={styles.sentIcon}>✉️</div>
            <p style={styles.sentTitle}>Check your inbox</p>
            <p style={styles.sentSub}>
              We sent a magic link to <strong>{email}</strong>.
              <br />Tap it to sign in — no password needed.
            </p>
            <p style={styles.pwaHint}>
              After tapping the link, close Safari and reopen Loopd from your home screen — you'll stay signed in.
            </p>
            <button
              style={styles.resendBtn}
              onClick={() => setStatus('idle')}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendLink} style={styles.form}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={styles.input}
              autoFocus
              autoComplete="email"
              required
            />

            {status === 'error' && (
              <p style={styles.errorMsg}>{typeof errorMsg === 'string' ? errorMsg : 'Something went wrong. Please try again.'}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              style={{
                ...styles.button,
                opacity: (status === 'sending' || !email.trim()) ? 0.6 : 1,
                cursor: (status === 'sending' || !email.trim()) ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'sending' ? (
                <span style={styles.btnContent}>
                  <span style={styles.btnSpinner} />
                  Sending…
                </span>
              ) : (
                'Send magic link'
              )}
            </button>

            <p style={styles.hint}>No password. No sign-up form. Just your email.</p>
          </form>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f0f2f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  blob1: {
    position: 'absolute',
    top: '-80px',
    right: '-80px',
    width: '360px',
    height: '360px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(91,91,214,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute',
    bottom: '-60px',
    left: '-60px',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: '400px',
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.85)',
    borderRadius: '24px',
    padding: '40px 36px',
    boxShadow: '0 8px 32px rgba(91,91,214,0.10), 0 2px 8px rgba(0,0,0,0.06)',
    textAlign: 'center',
  },
  logoMark: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  appName: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1a1a2e',
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400',
    margin: '0 0 32px',
    letterSpacing: '0.01em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '2px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#111827',
    background: 'rgba(255,255,255,0.9)',
    border: '1px solid rgba(91,91,214,0.25)',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  button: {
    width: '100%',
    padding: '13px 20px',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#fff',
    background: '#5b5bd6',
    border: 'none',
    borderRadius: '12px',
    marginTop: '4px',
    transition: 'background 0.15s, transform 0.1s',
    boxShadow: '0 2px 12px rgba(91,91,214,0.35)',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  btnSpinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: '4px 0 0',
  },
  errorMsg: {
    fontSize: '13px',
    color: '#dc2626',
    background: 'rgba(220,38,38,0.08)',
    borderRadius: '8px',
    padding: '8px 12px',
    margin: '0',
  },
  sentBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
  },
  sentIcon: {
    fontSize: '40px',
    lineHeight: 1,
    marginBottom: '4px',
  },
  sentTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  sentSub: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.6',
    textAlign: 'center',
  },
  pwaHint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '0',
    lineHeight: '1.5',
    textAlign: 'center',
    padding: '8px 12px',
    background: 'rgba(91,91,214,0.06)',
    borderRadius: '8px',
    border: '1px solid rgba(91,91,214,0.12)',
  },
  resendBtn: {
    marginTop: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#5b5bd6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  spinner: {
    width: '28px',
    height: '28px',
    border: '3px solid rgba(91,91,214,0.2)',
    borderTopColor: '#5b5bd6',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    margin: '0 auto 16px',
  },
  seedingText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
  },
}
