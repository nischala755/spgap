import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'

export default function AllocationView() {
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/students/me/allocation')
      .then(res => setAllocation(res.data.allocation))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page-body" style={{ paddingTop: 40 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Allocation</h1>
        <p>View your assigned project and guide</p>
      </div>
      <div className="page-body">
        {allocation ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
            {/* Project */}
            {allocation.project && (
              <motion.div
                className="card"
                style={{ padding: 28 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16, marginBottom: 16,
                  background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>📁</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Assigned Project
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>
                  {allocation.project.title}
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span className="badge badge-primary">{allocation.project.domain}</span>
                  <span className="badge badge-neutral">{allocation.project.difficulty}</span>
                </div>
                {allocation.project.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {allocation.project.description}
                  </p>
                )}
              </motion.div>
            )}

            {/* Guide */}
            {allocation.guide && (
              <motion.div
                className="card"
                style={{ padding: 28 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 16, marginBottom: 16,
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                }}>🧑‍🏫</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Assigned Guide
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {allocation.guide.name}
                </h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Designation</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {allocation.guide.designation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Employee ID</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {allocation.guide.employee_id}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Allocation Meta */}
            <motion.div
              className="card"
              style={{ padding: 24, gridColumn: '1 / -1' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Allocation Details</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span className="badge badge-primary">Mode: {allocation.mode}</span>
                <span className="badge badge-accent">Score: {allocation.score}</span>
                {allocation.is_frozen && <span className="badge badge-danger">🔒 Finalized</span>}
              </div>
              {allocation.reasoning && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6, padding: 16, borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                  <strong>Reasoning:</strong> {allocation.reasoning}
                </p>
              )}
            </motion.div>
          </div>
        ) : (
          <motion.div className="card" style={{ padding: 64, textAlign: 'center', maxWidth: 500 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Allocation Pending</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your project and guide haven't been assigned yet. Make sure you've joined a team with 3-4 members, and your teacher will run the allocation engine soon.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
