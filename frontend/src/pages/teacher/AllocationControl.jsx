import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'

export default function AllocationControl() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)
  const [allocations, setAllocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [frozen, setFrozen] = useState(false)

  const fetchAllocations = () => {
    setLoading(true)
    Promise.all([
      api.get('/allocations'),
      api.get('/teachers/dashboard'),
    ]).then(([a, d]) => {
      setAllocations(a.data.allocations)
      setFrozen(d.data.frozen)
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAllocations() }, [])

  const handleRun = async () => {
    setRunning(true)
    setResult(null)
    try {
      const res = await api.post('/allocations/run', { mode: 'smart' })
      setResult(res.data)
      fetchAllocations()
    } catch (err) {
      alert(err.response?.data?.detail || 'Allocation failed')
    } finally {
      setRunning(false)
    }
  }

  const handleFreeze = async () => {
    if (!confirm('Freeze all allocations? Students will not be able to modify teams.')) return
    await api.post('/allocations/freeze')
    fetchAllocations()
  }

  const handleReset = async () => {
    if (!confirm('Reset ALL allocations? This will unfreeze and clear everything.')) return
    await api.post('/allocations/reset')
    setResult(null)
    fetchAllocations()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Smart Allocation Engine</h1>
        <p>Automatically matches teams to projects and guides using domain, skills, preferences, and natural-language interests</p>
      </div>
      <div className="page-body">
        <motion.div className="card" style={{ padding: 28, marginBottom: 28 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ fontSize: 36 }}>🧠</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>How Smart Allocation Works</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
                Each team is scored against every available project. Teams with fewer matching options are allocated first (optimized for ~140 students).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {[
                  ['Domain Match', '50 pts', 'Team primary domain vs project domain'],
                  ['Specializations', '30 pts each', 'Overlapping skills between team and project'],
                  ['Preferences', 'up to 20 pts', 'Ranked project domain preferences (#1 weighs most)'],
                  ['Natural Language', 'up to 15 pts', 'Free-text interests matched to project description'],
                ].map(([title, pts, desc]) => (
                  <div key={title} style={{ padding: 12, borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{title} <span style={{ color: 'var(--color-primary)' }}>{pts}</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={handleRun}
            disabled={running || frozen}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {running ? '⏳ Running Smart Allocation...' : '🚀 Run Smart Allocation'}
          </motion.button>

          {allocations.length > 0 && !frozen && (
            <button className="btn btn-accent btn-lg" onClick={handleFreeze}>
              🔒 Finalize Allocations
            </button>
          )}

          {(allocations.length > 0 || frozen) && (
            <button className="btn btn-danger btn-lg" onClick={handleReset}>
              🔄 Reset Allocations
            </button>
          )}

          {frozen && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
              borderRadius: 12, background: 'rgba(239,68,68,0.08)', color: 'var(--color-danger)',
              fontSize: 14, fontWeight: 600,
            }}>
              🔒 System is FROZEN
            </div>
          )}
        </div>

        {result && (
          <motion.div className="card" style={{ padding: 24, marginBottom: 28 }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Allocation Result</h3>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-accent)' }}>{result.allocated_teams}</span><span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>Allocated</span></div>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-warning)' }}>{result.unallocated_teams}</span><span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>Unallocated</span></div>
              <div><span style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)' }}>{result.total_teams}</span><span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>Total Teams</span></div>
              <div><span className="badge badge-primary" style={{ fontSize: 13 }}>Smart Mode</span></div>
            </div>
          </motion.div>
        )}

        <motion.div className="card" style={{ overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Allocation Results <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{allocations.length}</span>
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Project</th>
                  <th>Guide</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>{[...Array(5)].map((_, j) => <td key={j}><div className="skeleton" style={{ height: 18 }} /></td>)}</tr>
                  ))
                ) : allocations.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No allocations yet. Run smart allocation above.</td></tr>
                ) : allocations.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ fontWeight: 600 }}>{a.team_name}</td>
                    <td>{a.project_title}</td>
                    <td>{a.guide_name}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{a.score}</span></td>
                    <td>{a.is_frozen ? <span className="badge badge-danger">Frozen</span> : <span className="badge badge-accent">Active</span>}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
