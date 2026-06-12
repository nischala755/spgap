import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'

export default function TeamManagement() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedTeam, setExpandedTeam] = useState(null)

  const fetchTeams = () => {
    setLoading(true)
    api.get('/teams', { params: { search: search || undefined } })
      .then(res => setTeams(res.data.teams))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeams() }, [search])

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/export-teams', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'spgap_all_teams.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to export CSV')
    }
  }

  const statusBadge = (status) => {
    const map = {
      open: 'badge-accent', full: 'badge-primary',
      allocated: 'badge-warning', frozen: 'badge-danger',
    }
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Team Management</h1>
            <p>View and manage all student teams</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>📥 Export CSV</button>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input className="input-field" placeholder="Search teams..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
          <span className="badge badge-primary" style={{ marginLeft: 'auto', alignSelf: 'center' }}>{teams.length} teams</span>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)
          ) : teams.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>No teams formed yet</div>
          ) : teams.map((team, i) => (
            <motion.div
              key={team.id}
              className="card"
              style={{ padding: 24, cursor: 'pointer' }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 16,
                  }}>
                    {team.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{team.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Code: <strong>{team.team_code}</strong> · {team.department} · Sem {team.semester} · Sec {team.section}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge badge-neutral">{team.member_count}/4 members</span>
                  {statusBadge(team.status)}
                </div>
              </div>

              {/* Expanded members */}
              {expandedTeam === team.id && team.members && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Team Members</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                    {team.members.map(m => (
                      <div key={m.student_id} style={{
                        padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: team.leader_id === m.student_id ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'var(--border-color)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: team.leader_id === m.student_id ? 'white' : 'var(--text-muted)',
                        }}>
                          {team.leader_id === m.student_id ? '★' : m.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.usn} · {m.domain || 'No domain'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
