import { useState, useEffect, useRef } from 'react'
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

function extractErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  if (error.status === 429 || String(error.code).includes('rate_limit') || String(error.message).includes('rate limit')) {
    return 'Too many attempts — please wait a few minutes and try again.'
  }
  return (
    error.message ||
    error.error_description ||
    error.msg ||
    (error.status ? `Error ${error.status}` : null) ||
    error.code ||
    error.name ||
    (typeof error === 'string' ? error : null) ||
    JSON.stringify(error) ||
    'Something went wrong. Please try again.'
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | codeSent | verifying | seeding | error
  const [errorMsg, setErrorMsg] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)
  const countdownRef = useRef(null)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) handlePostLogin(user.id)
  }, [user])

  useEffect(() => {
    return () => clearInterval(countdownRef.current)
  }, [])

  function startResendTimer() {
    setResendCountdown(30)
    countdownRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handlePostLogin(userId) {
    setStatus('seeding')
    await ensureProfile(userId)
    navigate('/tracker', { replace: true })
  }

  async function handleSendCode(e) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('sending')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    })

    if (error) {
      console.error('OTP send error:', JSON.stringify(error, null, 2))
      setErrorMsg(extractErrorMessage(error))
      setStatus('error')
    } else {
      setStatus('codeSent')
      setCode('')
      startResendTimer()
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (code.trim().length < 6) return

    setStatus('verifying')
    setErrorMsg('')

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    })

    if (error) {
      console.error('OTP verify error:', JSON.stringify(error, null, 2))
      setErrorMsg(extractErrorMessage(error))
      setStatus('codeSent')
    } else if (data?.session) {
      handlePostLogin(data.session.user.id)
    }
  }

  async function handleResend() {
    if (resendCountdown > 0) return
    clearInterval(countdownRef.current)
    await handleSendCode({ preventDefault: () => {} })
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
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
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

        {status === 'codeSent' || status === 'verifying' ? (
          <form onSubmit={handleVerify} style={styles.form}>
            <p style={styles.codePrompt}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>

            <label style={styles.label}>Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="123456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ ...styles.input, ...styles.codeInput }}
              autoFocus
              autoComplete="one-time-code"
              maxLength={6}
              required
            />

            {errorMsg ? (
              <p style={styles.errorMsg}>{typeof errorMsg === 'string' ? errorMsg : 'Something went wrong. Please try again.'}</p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'verifying' || code.trim().length < 6}
              style={{
                ...styles.button,
                opacity: (status === 'verifying' || code.trim().length < 6) ? 0.6 : 1,
                cursor: (status === 'verifying' || code.trim().length < 6) ? 'not-allowed' : 'pointer',
              }}
            >
              {status === 'verifying' ? (
                <span style={styles.btnContent}>
                  <span style={styles.btnSpinner} />
                  Verifying…
                </span>
              ) : (
                'Verify code'
              )}
            </button>

            <div style={styles.resendRow}>
              {resendCountdown > 0 ? (
                <span style={styles.resendHint}>Resend in {resendCountdown}s</span>
              ) : (
                <button type="button" style={styles.resendBtn} onClick={handleResend}>
                  Resend code
                </button>
              )}
              <button
                type="button"
                style={styles.changeEmailBtn}
                onClick={() => { setStatus('idle'); setCode(''); setErrorMsg('') }}
              >
                Change email
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSendCode} style={styles.form}>
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
                'Send code'
              )}
            </button>

            <p style={styles.hint}>We'll email you a 6-digit code. No password needed.</p>
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
  codeInput: {
    fontSize: '24px',
    fontWeight: '600',
    letterSpacing: '0.3em',
    textAlign: 'center',
    padding: '14px',
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
  codePrompt: {
    fontSize: '13px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0 0 4px',
    lineHeight: '1.5',
  },
  resendRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '2px',
  },
  resendHint: {
    fontSize: '12px',
    color: '#9ca3af',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  resendBtn: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#5b5bd6',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  changeEmailBtn: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#9ca3af',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: "'Inter', system-ui, sans-serif",
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
