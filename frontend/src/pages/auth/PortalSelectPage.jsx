import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'

export default function PortalSelectPage() {
  const { dark, toggle } = useTheme()

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
    }}>
      <button
        onClick={toggle}
        style={{
          position: 'absolute', top: 24, right: 24,
          width: 44, height: 44, borderRadius: 12, border: 'none',
          background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 20,
        }}
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--bg-secondary)',
          borderRadius: 24, padding: 40,
          boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
          border: '1px solid var(--border-color)',
          textAlign: 'center',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 900, color: 'white',
        }}>S</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>SPGAP Platform</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, marginBottom: 32 }}>
          Choose your portal to continue
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          <Link to="/login/teacher" style={{ textDecoration: 'none' }}>
            <motion.div
              className="card"
              style={{ padding: 24, cursor: 'pointer', textAlign: 'left' }}
              whileHover={{ scale: 1.02, borderColor: 'var(--color-primary)' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🧑‍🏫</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Teacher Portal</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Manage students, projects, guides, and run smart allocation
              </div>
            </motion.div>
          </Link>

          <Link to="/login/student" style={{ textDecoration: 'none' }}>
            <motion.div
              className="card"
              style={{ padding: 24, cursor: 'pointer', textAlign: 'left' }}
              whileHover={{ scale: 1.02, borderColor: 'var(--color-accent)' }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎓</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Student Portal</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                Update your profile, join teams, and view your project allocation
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
