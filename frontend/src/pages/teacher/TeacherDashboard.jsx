import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import api from '../../api/axios'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const statCards = [
  { key: 'total_students', label: 'Total Students', icon: '👨‍🎓', gradient: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { key: 'total_teams', label: 'Total Teams', icon: '👥', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' },
  { key: 'total_projects', label: 'Total Projects', icon: '📁', gradient: 'linear-gradient(135deg, #06b6d4, #67e8f9)' },
  { key: 'total_guides', label: 'Total Guides', icon: '🧑‍🏫', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
  { key: 'pending_allocations', label: 'Pending', icon: '⏳', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  { key: 'completed_allocations', label: 'Completed', icon: '✅', gradient: 'linear-gradient(135deg, #14b8a6, #5eead4)' },
]

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null)
  const [workload, setWorkload] = useState([])
  const [domains, setDomains] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/teachers/dashboard'),
      api.get('/reports/workload'),
      api.get('/reports/domains'),
    ]).then(([s, w, d]) => {
      setStats(s.data)
      setWorkload(w.data)
      setDomains(d.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-body" style={{ paddingTop: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 16 }} />)}
        </div>
      </div>
    )
  }

  const workloadChartData = {
    labels: workload.map(g => g.name),
    datasets: [
      {
        label: 'Current Load',
        data: workload.map(g => g.current_load),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Max Capacity',
        data: workload.map(g => g.max_capacity),
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  }

  const domainChartData = domains ? {
    labels: domains.project_domains.map(d => d.domain),
    datasets: [{
      data: domains.project_domains.map(d => d.count),
      backgroundColor: [
        '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
        '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
      ],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  } : null

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Monitor your department's allocation progress at a glance</p>
        {stats?.frozen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 12, padding: '8px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)',
              fontSize: 13, fontWeight: 600,
            }}
          >
            🔒 System is FROZEN — allocations are locked
          </motion.div>
        )}
      </div>

      <div className="page-body">
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 32 }}>
          {statCards.map((card, i) => (
            <motion.div
              key={card.key}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="stat-icon" style={{ background: card.gradient, color: 'white' }}>
                {card.icon}
              </div>
              <div className="stat-value">{stats?.[card.key] ?? 0}</div>
              <div className="stat-label">{card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
          {/* Workload Chart */}
          <motion.div
            className="card"
            style={{ padding: 28 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Guide Workload Distribution
            </h3>
            <div style={{ height: 280 }}>
              {workload.length > 0 ? (
                <Bar
                  data={workloadChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'top', labels: { color: 'var(--text-secondary)', font: { family: 'Inter' } } } },
                    scales: {
                      x: { ticks: { color: 'var(--text-muted)', font: { family: 'Inter', size: 11 } }, grid: { display: false } },
                      y: { ticks: { color: 'var(--text-muted)', stepSize: 1, font: { family: 'Inter' } }, grid: { color: 'var(--border-color)' } },
                    },
                  }}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  No guides added yet
                </div>
              )}
            </div>
          </motion.div>

          {/* Domain Distribution */}
          <motion.div
            className="card"
            style={{ padding: 28 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>
              Project Domain Distribution
            </h3>
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {domainChartData && domainChartData.labels.length > 0 ? (
                <Doughnut
                  data={domainChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: { position: 'bottom', labels: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 11 }, padding: 12 } },
                    },
                  }}
                />
              ) : (
                <div style={{ color: 'var(--text-muted)' }}>No projects added yet</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
