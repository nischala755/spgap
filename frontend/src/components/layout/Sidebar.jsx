import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const teacherLinks = [
  { to: '/teacher', label: 'Dashboard', icon: '📊' },
  { to: '/teacher/students', label: 'Students', icon: '👨‍🎓' },
  { to: '/teacher/teams', label: 'Teams', icon: '👥' },
  { to: '/teacher/projects', label: 'Projects', icon: '📁' },
  { to: '/teacher/guides', label: 'Guides', icon: '🧑‍🏫' },
  { to: '/teacher/allocation', label: 'Allocation', icon: '🎯' },
  { to: '/teacher/csv', label: 'CSV Upload', icon: '📤' },
  { to: '/teacher/reports', label: 'Reports', icon: '📈' },
]

const studentLinks = [
  { to: '/student', label: 'Dashboard', icon: '🏠' },
  { to: '/student/profile', label: 'Profile', icon: '👤' },
  { to: '/student/team', label: 'My Team', icon: '👥' },
  { to: '/student/allocation', label: 'Allocation', icon: '🎯' },
]

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const links = user?.role === 'teacher' ? teacherLinks : studentLinks

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: 'white'
          }}>S</div>
          <div>
            <div style={{ color: 'white', fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>SPGAP</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 500 }}>Allocation Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <div style={{ padding: '0 16px 8px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>
          Navigation
        </div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/teacher' || link.to === '/student'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span style={{ fontSize: 18 }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #10b981, #34d399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: 'white',
        }}>
          {user?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || 'User'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'capitalize' }}>
            {user?.role}
          </div>
        </div>
      </div>
    </aside>
  )
}
