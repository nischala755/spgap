import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import api from '../../api/axios'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function ReportsPage() {
  const [workload, setWorkload] = useState([])
  const [domains, setDomains] = useState(null)
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/workload'),
      api.get('/reports/domains'),
      api.get('/reports/teams'),
    ]).then(([w, d, t]) => {
      setWorkload(w.data)
      setDomains(d.data)
      setTeams(t.data)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleExport = async () => {
    try {
      const res = await api.get('/reports/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'spgap_allocations.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to export CSV')
    }
  }

  if (loading) {
    return (
      <div className="page-body" style={{ paddingTop: 40 }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16, marginBottom: 16 }} />)}
      </div>
    )
  }

  const workloadData = {
    labels: workload.map(g => g.name),
    datasets: [{
      label: 'Teams Assigned',
      data: workload.map(g => g.current_load),
      backgroundColor: workload.map(g => g.current_load >= g.max_capacity ? 'rgba(239,68,68,0.7)' : 'rgba(99,102,241,0.7)'),
      borderRadius: 8,
      borderSkipped: false,
    }],
  }

  const studentDomainData = domains ? {
    labels: domains.student_domains.map(d => d.domain),
    datasets: [{
      data: domains.student_domains.map(d => d.count),
      backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'],
      borderWidth: 0,
    }],
  } : null

  const teamStatusData = {
    labels: [...new Set(teams.map(t => t.status))],
    datasets: [{
      data: [...new Set(teams.map(t => t.status))].map(s => teams.filter(t => t.status === s).length),
      backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }],
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1>Reports & Analytics</h1>
            <p>Visualize allocation data and export reports</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>📥 Export CSV</button>
        </div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Workload */}
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Guide Workload</h3>
            <div style={{ height: 280 }}>
              {workload.length > 0 ? (
                <Bar data={workloadData} options={{
                  responsive: true, maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { color: 'var(--text-muted)', font: { family: 'Inter', size: 11 } }, grid: { display: false } },
                    y: { ticks: { color: 'var(--text-muted)', stepSize: 1 }, grid: { color: 'var(--border-color)' } },
                  },
                }} />
              ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>No data</div>}
            </div>
          </motion.div>

          {/* Student Domains */}
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Student Domains</h3>
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {studentDomainData && studentDomainData.labels.length > 0 ? (
                <Doughnut data={studentDomainData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 11 }, padding: 10 } } } }} />
              ) : <div style={{ color: 'var(--text-muted)' }}>No data</div>}
            </div>
          </motion.div>

          {/* Team Status */}
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, color: 'var(--text-primary)' }}>Team Status Distribution</h3>
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {teams.length > 0 ? (
                <Doughnut data={teamStatusData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 11 }, padding: 10 } } } }} />
              ) : <div style={{ color: 'var(--text-muted)' }}>No teams</div>}
            </div>
          </motion.div>

          {/* Team Size Table */}
          <motion.div className="card" style={{ overflow: 'hidden' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Team Sizes</h3>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 300 }}>
              <table className="data-table">
                <thead><tr><th>Team</th><th>Members</th><th>Section</th><th>Status</th></tr></thead>
                <tbody>
                  {teams.map(t => (
                    <tr key={t.team_name}>
                      <td style={{ fontWeight: 600 }}>{t.team_name}</td>
                      <td>{t.member_count}</td>
                      <td>{t.department}-{t.section}</td>
                      <td><span className={`badge ${t.status === 'frozen' ? 'badge-danger' : t.status === 'allocated' ? 'badge-warning' : 'badge-accent'}`}>{t.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
