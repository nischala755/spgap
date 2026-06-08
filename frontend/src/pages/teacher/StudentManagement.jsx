import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'

export default function StudentManagement() {
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchStudents = () => {
    setLoading(true)
    api.get('/teachers/students', { params: { page, per_page: perPage, search: search || undefined } })
      .then(res => { setStudents(res.data.students); setTotal(res.data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStudents() }, [page, search])

  const totalPages = Math.ceil(total / perPage)

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    await api.delete(`/teachers/students/${id}`)
    fetchStudents()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Student Management</h1>
        <p>View and manage all registered students</p>
      </div>
      <div className="page-body">
        {/* Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            className="input-field"
            placeholder="Search by name or USN..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ maxWidth: 360 }}
          />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-primary">{total} students</span>
          </div>
        </div>

        {/* Table */}
        <motion.div className="card" style={{ overflow: 'hidden' }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>USN</th>
                  <th>Department</th>
                  <th>Sem</th>
                  <th>Section</th>
                  <th>Domain</th>
                  <th>Contact</th>
                  <th>Team</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 18, width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : students.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No students found</td></tr>
                ) : students.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><span className="badge badge-neutral">{s.usn}</span></td>
                    <td>{s.department}</td>
                    <td>{s.semester}</td>
                    <td>{s.section}</td>
                    <td>{s.domain || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{s.contact_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{s.team_id ? <span className="badge badge-accent">Team #{s.team_id}</span> : <span style={{ color: 'var(--text-muted)' }}>None</span>}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <button className="btn btn-sm btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
