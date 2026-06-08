import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import SelectWithCustom from '../../components/SelectWithCustom'
import { useDomains } from '../../hooks/useDomains'

const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function ProjectManagement() {
  const { domains } = useDomains()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', domain: 'AI/ML', description: '', difficulty: 'medium', required_skills: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const fetchProjects = () => {
    setLoading(true)
    api.get('/projects', { params: { search: search || undefined, per_page: 100 } })
      .then(res => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [search])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      required_skills: form.required_skills.split(',').map(s => s.trim()).filter(Boolean),
    }
    try {
      if (editId) {
        await api.put(`/projects/${editId}`, payload)
      } else {
        await api.post('/projects', payload)
      }
      setShowModal(false)
      setEditId(null)
      setForm({ title: '', domain: 'AI/ML', description: '', difficulty: 'medium', required_skills: '' })
      fetchProjects()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (p) => {
    setForm({ title: p.title, domain: p.domain, description: p.description || '', difficulty: p.difficulty, required_skills: p.required_skills.join(', ') })
    setEditId(p.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return
    try {
      await api.delete(`/projects/${id}`)
      fetchProjects()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const diffColor = { easy: 'badge-accent', medium: 'badge-warning', hard: 'badge-danger' }

  return (
    <div>
      <div className="page-header">
        <h1>Project Management</h1>
        <p>Create and manage available projects for allocation</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input className="input-field" placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setShowModal(true); setEditId(null); setForm({ title: '', domain: 'AI/ML', description: '', difficulty: 'medium', required_skills: '' }) }}>
            + Add Project
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {loading ? (
            [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)
          ) : projects.map((p, i) => (
            <motion.div
              key={p.id}
              className="card"
              style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, marginRight: 8 }}>{p.title}</h3>
                {p.is_locked && <span className="badge badge-danger">🔒 Locked</span>}
                {p.is_allocated && !p.is_locked && <span className="badge badge-warning">Allocated</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{p.domain}</span>
                <span className={`badge ${diffColor[p.difficulty]}`}>{p.difficulty}</span>
              </div>
              {p.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </p>
              )}
              {p.required_skills.length > 0 && (
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {p.required_skills.map(s => (
                    <span key={s} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              )}
              {!p.is_locked && (
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(p)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">{editId ? 'Edit Project' : 'Add New Project'}</h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: 14 }}>
                    <label className="input-label">Title</label>
                    <input className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <SelectWithCustom
                        label="Domain"
                        value={form.domain}
                        onChange={v => setForm({ ...form, domain: v })}
                        options={domains}
                        customPlaceholder="Enter custom domain..."
                      />
                    </div>
                    <div>
                      <label className="input-label">Difficulty</label>
                      <select className="select-field" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="input-label">Description</label>
                    <textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="input-label">Required Skills (comma-separated)</label>
                    <input className="input-field" placeholder="Machine Learning, NLP, React" value={form.required_skills} onChange={e => setForm({ ...form, required_skills: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
