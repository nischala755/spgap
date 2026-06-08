import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'

export default function TeacherLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmpId, setRegEmpId] = useState('')
  const [regDept, setRegDept] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const { login } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.role !== 'teacher') {
        setError('This portal is for teachers only. Please use the Student Portal.')
        localStorage.removeItem('spgap_token')
        localStorage.removeItem('spgap_user')
        return
      }
      navigate('/teacher')
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
      navigate('/teacher')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: dark
        ? 'linear-gradient(135deg, #0f0d1a 0%, #1e1b4b 50%, #312e81 100%)'
        : 'linear-gradient(135deg, #eef2ff 0%, #c7d2fe 50%, #a5b4fc 100%)',
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
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 900, color: 'white',
          }}>🧑‍🏫</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {isRegister ? 'Register Teacher' : 'Teacher Portal'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            {isRegister ? 'Create a teacher/admin account' : 'Manage allocation and student data'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 12,
            fontSize: 13, marginBottom: 16,
          }}>{error}</div>
        )}

        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Email</label>
              <input type="email" className="input-field" placeholder="admin@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Password</label>
              <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In as Teacher'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label className="input-label">Full Name</label><input className="input-field" value={regName} onChange={e => setRegName(e.target.value)} required /></div>
              <div><label className="input-label">Employee ID</label><input className="input-field" value={regEmpId} onChange={e => setRegEmpId(e.target.value)} required /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label className="input-label">Department</label><input className="input-field" value={regDept} onChange={e => setRegDept(e.target.value)} required /></div>
            <div style={{ marginBottom: 12 }}><label className="input-label">Email</label><input type="email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required /></div>
            <div style={{ marginBottom: 24 }}><label className="input-label">Password</label><input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <button type="submit" className="btn btn-accent btn-lg" style={{ width: '100%' }} disabled={regLoading}>
              {regLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}>
            {isRegister ? '← Back to Login' : 'Register as Teacher →'}
          </button>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>← Back to portal selection</Link>
        </div>

        {!isRegister && (
          <div style={{ marginTop: 20, padding: 14, borderRadius: 12, background: 'var(--bg-tertiary)', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
            Demo: <strong>admin@spgap.com</strong> / <strong>admin123</strong>
          </div>
        )}
      </motion.div>
    </div>
  )
}
