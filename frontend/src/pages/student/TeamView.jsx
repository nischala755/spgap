import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

export default function TeamView() {
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState(null) // 'create' | 'join'
  const [teamName, setTeamName] = useState('')
  const [teamCode, setTeamCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const [projectTitle, setProjectTitle] = useState('')
  const [projectDomain, setProjectDomain] = useState('AI/ML')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectSkills, setProjectSkills] = useState('')
  const [mappedSdg, setMappedSdg] = useState('')

  const fetchTeam = () => {
    setLoading(true)
    api.get('/students/me/team')
      .then(res => setTeam(res.data.team))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeam() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      await api.post('/teams', { name: teamName })
      setAction(null); setTeamName(''); fetchTeam()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      await api.post('/teams/join', { team_code: teamCode.toUpperCase() })
      setAction(null); setTeamCode(''); fetchTeam()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return
    try {
      await api.post('/teams/leave')
      setTeam(null); fetchTeam()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to leave team')
    }
  }

  const handleRemoveMember = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to remove ${studentName} from the team?`)) return
    try {
      await api.delete(`/teams/me/members/${studentId}`)
      fetchTeam()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member')
    }
  }

  const handleProjectSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      await api.post('/teams/me/project', {
        title: projectTitle,
        domain: projectDomain,
        description: projectDesc,
        mapped_sdg: mappedSdg,
        required_skills: projectSkills.split(',').map(s => s.trim()).filter(s => s)
      })
      fetchTeam()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit project')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-body" style={{ paddingTop: 40 }}><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Team</h1>
        <p>Create, join, or manage your project team</p>
      </div>
      <div className="page-body">
        {team ? (
          /* Team exists */
          <motion.div className="card" style={{ padding: 32, maxWidth: 600 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>{team.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  {team.department} · Semester {team.semester} · Section {team.section}
                </div>
              </div>
              <span className={`badge ${team.status === 'frozen' ? 'badge-danger' : team.status === 'allocated' ? 'badge-warning' : 'badge-accent'}`} style={{ fontSize: 13 }}>
                {team.status}
              </span>
            </div>

            {/* Team Code */}
            <div style={{
              padding: 16, borderRadius: 12, marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
              border: '1px solid rgba(99,102,241,0.12)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Team Code</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: 4, fontFamily: 'monospace' }}>
                {team.team_code}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Share this code with your teammates</div>
            </div>

            {/* Members */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Members ({team.member_count}/{team.max_members || 3})
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                {team.members?.map(m => (
                  <div key={m.student_id} style={{
                    padding: '12px 16px', borderRadius: 12, background: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: team.leader_id === m.student_id ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 14,
                    }}>
                      {team.leader_id === m.student_id ? '★' : m.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.usn} · {m.domain || 'No domain'}</div>
                    </div>
                    {team.leader_id === m.student_id && <span className="badge badge-warning" style={{ fontSize: 10 }}>Leader</span>}
                    {team.leader_user_id === user.user_id && team.leader_id !== m.student_id && team.members.length > 3 && (
                      <button 
                        onClick={() => handleRemoveMember(m.student_id, m.name)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none',
                          borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 800
                        }}
                        title="Remove member (team is oversized)"
                      >
                        −
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Team Project */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Team Project
              </div>
              {team.project ? (
                <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{team.project.title}</div>
                  <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, background: 'var(--bg-secondary)', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
                    {team.project.domain}
                  </div>
                  {team.project.mapped_sdg && (
                    <div style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: 12, fontWeight: 600, marginTop: 8, marginLeft: 8 }}>
                      SDG: {team.project.mapped_sdg}
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>{team.project.description}</p>
                  {team.project.required_skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                      {team.project.required_skills.map(s => (
                        <span key={s} className="badge badge-accent" style={{ fontSize: 10 }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : team.leader_user_id === user.user_id ? (
                <div style={{ padding: 16, borderRadius: 12, background: 'var(--bg-tertiary)' }}>
                  <form onSubmit={handleProjectSubmit}>
                    <div style={{ marginBottom: 12 }}>
                      <label className="input-label">Project Title</label>
                      <input className="input-field" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="input-label">Domain</label>
                      <select className="input-field" value={projectDomain} onChange={e => setProjectDomain(e.target.value)}>
                        <option value="AI/ML">AI/ML</option>
                        <option value="Web Development">Web Development</option>
                        <option value="IoT">IoT</option>
                        <option value="Cybersecurity">Cybersecurity</option>
                        <option value="Cloud Computing">Cloud Computing</option>
                        <option value="Data Science">Data Science</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="input-label">Description</label>
                      <textarea className="input-field" value={projectDesc} onChange={e => setProjectDesc(e.target.value)} rows={3} required />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label className="input-label">Mapped SDG (Sustainable Development Goal)</label>
                      <input className="input-field" value={mappedSdg} onChange={e => setMappedSdg(e.target.value)} placeholder="e.g. Quality Education, Climate Action" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label className="input-label">Required Skills (comma separated)</label>
                      <input className="input-field" value={projectSkills} onChange={e => setProjectSkills(e.target.value)} placeholder="e.g. React, Python, PostgreSQL" />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Project'}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Waiting for team leader to submit the project details.
                </div>
              )}
            </div>

            {/* Leave button */}
            {team.status !== 'frozen' && team.status !== 'allocated' && (
              <button className="btn btn-danger" onClick={handleLeave}>Leave Team</button>
            )}
          </motion.div>
        ) : (
          /* No team — show create/join options */
          <div>
            {!action && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 600 }}>
                <motion.div
                  className="card"
                  style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => { setAction('create'); setError('') }}
                  whileHover={{ scale: 1.02, borderColor: 'var(--color-primary)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🚀</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create Team</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start a new team and invite members</p>
                </motion.div>
                <motion.div
                  className="card"
                  style={{ padding: 32, textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => { setAction('join'); setError('') }}
                  whileHover={{ scale: 1.02, borderColor: 'var(--color-accent)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🤝</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Join Team</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter a team code to join</p>
                </motion.div>
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                marginTop: 16, padding: '12px 16px', borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)', fontSize: 13, fontWeight: 500,
              }}>
                {error}
              </motion.div>
            )}

            {action === 'create' && (
              <motion.div className="card" style={{ padding: 28, maxWidth: 440, marginTop: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Create New Team</h3>
                <form onSubmit={handleCreate}>
                  <div style={{ marginBottom: 16 }}>
                    <label className="input-label">Team Name</label>
                    <input className="input-field" placeholder="e.g., Team Alpha" value={teamName} onChange={e => setTeamName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Team'}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setAction(null)}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}

            {action === 'join' && (
              <motion.div className="card" style={{ padding: 28, maxWidth: 440, marginTop: 20 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Join Existing Team</h3>
                <form onSubmit={handleJoin}>
                  <div style={{ marginBottom: 16 }}>
                    <label className="input-label">Team Code</label>
                    <input className="input-field" placeholder="Enter 8-character code" value={teamCode} onChange={e => setTeamCode(e.target.value)} maxLength={8} style={{ textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'monospace', fontSize: 18, textAlign: 'center' }} required />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-accent" disabled={submitting}>{submitting ? 'Joining...' : 'Join Team'}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setAction(null)}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
