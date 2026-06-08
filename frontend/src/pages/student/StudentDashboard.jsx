import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [team, setTeam] = useState(null)
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/students/me'),
      api.get('/students/me/team'),
      api.get('/students/me/allocation'),
    ]).then(([p, t, a]) => {
      setProfile(p.data)
      setTeam(t.data.team)
      setAllocation(a.data.allocation)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-body" style={{ paddingTop: 40 }}>
        <div style={{ display: 'grid', gap: 20 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {profile?.name || user?.name}! 👋</h1>
        <p>Your academic portal overview</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Profile Card */}
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 22,
                boxShadow: '0 8px 20px rgba(99,102,241,0.3)',
              }}>
                {profile?.name?.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profile?.usn}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Department', profile?.department],
                ['Semester', profile?.semester],
                ['Section', profile?.section],
                ['Domain', profile?.domain || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team Card */}
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              👥 Team Status
            </h3>
            {team ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{team.name}</div>
                  <span className={`badge ${team.status === 'frozen' ? 'badge-danger' : team.status === 'allocated' ? 'badge-warning' : 'badge-accent'}`}>
                    {team.status}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  Code: <strong style={{ color: 'var(--color-primary)' }}>{team.team_code}</strong> · {team.member_count}/4 members
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {team.members?.map(m => (
                    <div key={m.student_id} style={{
                      padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: team.leader_id === m.student_id ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: team.leader_id === m.student_id ? 'white' : 'var(--text-muted)',
                      }}>
                        {team.leader_id === m.student_id ? '★' : m.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.usn}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                <p>You haven't joined a team yet.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Go to "My Team" to create or join one.</p>
              </div>
            )}
          </motion.div>

          {/* Allocation Card */}
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              🎯 Allocation Status
            </h3>
            {allocation ? (
              <div style={{ display: 'grid', gap: 14 }}>
                {allocation.project && (
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Project</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{allocation.project.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <span className="badge badge-primary">{allocation.project.domain}</span>
                      <span className="badge badge-neutral">{allocation.project.difficulty}</span>
                    </div>
                  </div>
                )}
                {allocation.guide && (
                  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                    <div style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Assigned Guide</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{allocation.guide.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{allocation.guide.designation.replace('_', ' ')}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                  <span className="badge badge-primary">Score: {allocation.score}</span>
                  {allocation.is_frozen && <span className="badge badge-danger">🔒 Finalized</span>}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
                <p>Allocation pending.</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Your teacher will run the allocation engine soon.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
