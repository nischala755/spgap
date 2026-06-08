import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'

export default function StudentLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.role !== 'student') {
        setError('This portal is for students only. Please use the Teacher Portal.')
        localStorage.removeItem('spgap_token')
        localStorage.removeItem('spgap_user')
        return
      }
      navigate('/student')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your email and password (default: USN in lowercase).')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark
        ? 'linear-gradient(135deg, #0a1628 0%, #0f2942 50%, #134e4a 100%)'
        : 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 50%, #6ee7b7 100%)',
      padding: 20, position: 'relative',
    }}>
      <button onClick={toggle} style={{
        position: 'absolute', top: 24, right: 24, width: 44, height: 44,
        borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 20,
      }}>{dark ? '☀️' : '🌙'}</button>

      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 440, background: 'var(--bg-secondary)',
          borderRadius: 24, padding: 40, boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #10b981, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: 'white',
          }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>Student Portal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Sign in with your college email</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 12,
            fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Email</label>
            <input type="email" className="input-field" placeholder="you@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Password</label>
            <input type="password" className="input-field" placeholder="Your USN in lowercase" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In as Student'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Back to portal selection</Link>
        </div>

        <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'var(--bg-tertiary)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Default password is your <strong>USN in lowercase</strong> (set by your teacher via CSV import)
        </div>
      </motion.div>
    </div>
  )
}
