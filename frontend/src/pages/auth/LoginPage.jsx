import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmpId, setRegEmpId] = useState('')
  const [regDept, setRegDept] = useState('')
  const { login } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const [regLoading, setRegLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      navigate(data.role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setRegLoading(true)
    try {
      const api = (await import('../../api/axios')).default
      const res = await api.post('/auth/register', {
        email, password, name: regName, employee_id: regEmpId, department: regDept,
      })
      localStorage.setItem('spgap_token', res.data.access_token)
      localStorage.setItem('spgap_user', JSON.stringify(res.data))
      window.location.href = '/teacher'
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: dark
        ? 'linear-gradient(135deg, #0f0d1a 0%, #1e1b4b 50%, #312e81 100%)'
        : 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        top: -200, right: -200,
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
        bottom: -100, left: -100,
      }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'absolute', top: 24, right: 24,
          width: 44, height: 44, borderRadius: 12, border: 'none',
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
          cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--bg-secondary)',
          borderRadius: 24,
          padding: 40,
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 900, color: 'white',
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
            }}
          >
            S
          </motion.div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            {isRegister ? 'Register as a teacher/admin' : 'Sign in to SPGAP Platform'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--color-danger)',
              padding: '12px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            {error}
          </motion.div>
        )}

        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@college.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontSize: 15 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="Dr. Name" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
              <div>
                <label className="input-label">Employee ID</label>
                <input className="input-field" placeholder="TEACH001" value={regEmpId} onChange={e => setRegEmpId(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="input-label">Department</label>
              <input className="input-field" placeholder="CSE" value={regDept} onChange={e => setRegDept(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="input-label">Email</label>
              <input type="email" className="input-field" placeholder="you@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Password</label>
              <input type="password" className="input-field" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={regLoading}
              className="btn btn-accent btn-lg"
              style={{ width: '100%', fontSize: 15 }}
            >
              {regLoading ? 'Creating...' : 'Create Account'}
            </motion.button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-primary)', fontSize: 13, fontWeight: 600,
            }}
          >
            {isRegister ? '← Back to Login' : 'Register as Teacher →'}
          </button>
        </div>

        <div style={{
          marginTop: 24, padding: '16px', borderRadius: 12,
          background: 'var(--bg-tertiary)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Demo Credentials</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
            admin@spgap.com / admin123
          </div>
        </div>
      </motion.div>
    </div>
  )
}
