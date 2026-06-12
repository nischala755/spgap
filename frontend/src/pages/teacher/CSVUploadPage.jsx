import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'

export default function CSVUploadPage() {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [result, setResult] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [csvStats, setCsvStats] = useState(null)

  const fetchStats = () => {
    api.get('/csv/stats').then(res => setCsvStats(res.data)).catch(console.error)
  }

  useEffect(() => { fetchStats() }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/csv/upload', formData)
      setResult(res.data)
      fetchStats()
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = async () => {
    if (!confirm(
      `This will permanently delete all ${csvStats?.csv_student_count || 0} CSV-imported students, ` +
      'their accounts, and any teams made entirely of CSV students. Continue?'
    )) return
    setResetting(true)
    try {
      const res = await api.post('/csv/reset')
      alert(res.data.message)
      setResult(null)
      setFile(null)
      fetchStats()
    } catch (err) {
      alert(err.response?.data?.detail || 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) setFile(dropped)
  }

  return (
    <div>
      <div className="page-header">
        <h1>CSV Upload</h1>
        <p>Import up to 140+ students at once. Supports Contact column and specializations.</p>
      </div>
      <div className="page-body">
        {csvStats && csvStats.csv_student_count > 0 && (
          <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {csvStats.csv_student_count} CSV-imported students in database
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Batches: {csvStats.import_batches.length > 0 ? csvStats.import_batches.join(', ') : '—'}
              </div>
            </div>
            <button className="btn btn-danger" onClick={handleReset} disabled={resetting}>
              {resetting ? 'Resetting...' : '🗑️ Reset CSV Data'}
            </button>
          </div>
        )}

        <motion.div
          className="card"
          style={{
            padding: 48, textAlign: 'center', marginBottom: 28, cursor: 'pointer',
            borderStyle: 'dashed', borderWidth: 2,
            borderColor: dragOver ? 'var(--color-primary)' : 'var(--border-color)',
            background: dragOver ? 'rgba(99,102,241,0.04)' : undefined,
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('csv-input').click()}
          whileHover={{ borderColor: 'var(--color-primary)' }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📤</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {file ? file.name : 'Drop CSV file here or click to browse'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Required: USN, Name, Email, Department, Semester, Section, Domain, Specialization<br />
            Optional: Contact (or Contact No)
          </div>
          <input id="csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
        </motion.div>

        {file && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
            <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={uploading}>
              {uploading ? '⏳ Uploading...' : '🚀 Import Students'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setFile(null); setResult(null) }}>Clear</button>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', color: 'white' }}>✓</div>
                <div className="stat-value">{result.imported}</div>
                <div className="stat-label">Imported</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', color: 'white' }}>⊘</div>
                <div className="stat-value">{result.skipped}</div>
                <div className="stat-label">Skipped (Duplicate)</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)', color: 'white' }}>✗</div>
                <div className="stat-value">{result.errors}</div>
                <div className="stat-label">Errors</div>
              </div>
            </div>

            {result.error_details.length > 0 && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Error Details</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Row</th><th>USN</th><th>Error</th></tr></thead>
                    <tbody>
                      {result.error_details.map((e, i) => (
                        <tr key={i}>
                          <td>{e.row}</td>
                          <td>{e.usn || '—'}</td>
                          <td style={{ color: 'var(--color-danger)' }}>{e.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <div className="card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>CSV Template</h3>
          <div style={{ background: 'var(--bg-tertiary)', padding: 16, borderRadius: 10, fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', overflowX: 'auto' }}>
            USN,Name,Email,Department,Semester,Section,Domain,Specialization,Contact<br />
            1RV21CS001,John Doe,john@college.edu,CSE,5,A,AI/ML,Machine Learning,9876543210<br />
            1RV21CS002,Jane Smith,jane@college.edu,CSE,5,A,Web Development,React;Node.js,9876543211
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
            Default password for each student is their USN in lowercase.<br />
            Specializations can be comma- or semicolon-separated. Contact column is optional.
          </p>
        </div>
      </div>
    </div>
  )
}
