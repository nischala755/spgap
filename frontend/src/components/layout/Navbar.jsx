import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header style={{
      height: 64,
      padding: '0 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {user?.role === 'teacher' ? 'Teacher Dashboard' : 'Student Portal'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className="btn-ghost"
          style={{
            width: 40, height: 40, borderRadius: 12, padding: 0, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, cursor: 'pointer',
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
          }}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Logout */}
        <button onClick={handleLogout} className="btn btn-sm btn-outline">
          Logout
        </button>
      </div>
    </header>
  )
}
