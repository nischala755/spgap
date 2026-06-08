import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../api/axios'
import { useDomains } from '../../hooks/useDomains'

const DESIGNATIONS = [
  { value: 'assistant_professor', label: 'Assistant Professor', cap: 2 },
  { value: 'associate_professor', label: 'Associate Professor', cap: 3 },
  { value: 'professor', label: 'Professor', cap: 3 },
]

export default function GuideManagement() {
  const { domains } = useDomains()
  const [guides, setGuides] = useState([])
  const [customDomain, setCustomDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', employee_id: '', designation: 'assistant_professor', domains: [] })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const fetchGuides = () => {
    setLoading(true)
    api.get('/guides').then(res => setGuides(res.data.guides)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchGuides() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/guides/${editId}`, form)
      } else {
        await api.post('/guides', form)
      }
      setShowModal(false)
      setEditId(null)
      setForm({ name: '', employee_id: '', designation: 'assistant_professor', domains: [] })
      fetchGuides()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save guide')
    } finally {
      setSaving(false)
    }
  }

  const toggleDomain = (d) => {
    setForm(prev => ({
      ...prev,
      domains: prev.domains.includes(d) ? prev.domains.filter(x => x !== d) : [...prev.domains, d],
    }))
  }

  const addCustomDomain = () => {
    const trimmed = customDomain.trim()
    if (!trimmed || form.domains.includes(trimmed)) return
    setForm(prev => ({ ...prev, domains: [...prev.domains, trimmed] }))
    setCustomDomain('')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this guide?')) return
    try { await api.delete(`/guides/${id}`); fetchGuides() } catch (err) { alert(err.response?.data?.detail || 'Failed') }
  }

  const desigLabel = (d) => DESIGNATIONS.find(x => x.value === d)?.label || d

  return (
    <div>
      <div className="page-header">
        <h1>Guide Management</h1>
        <p>Manage faculty guides and their domain expertise</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', marginBottom: 24 }}>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setShowModal(true); setEditId(null); setForm({ name: '', employee_id: '', designation: 'assistant_professor', domains: [] }) }}>
            + Add Guide
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)
          ) : guides.map((g, i) => (
            <motion.div key={g.id} className="card" style={{ padding: 24 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 18,
                }}>
                  {g.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{g.employee_id} · {desigLabel(g.designation)}</div>
                </div>
              </div>

              {/* Workload bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Workload</span>
                  <span style={{ color: 'var(--text-muted)' }}>{g.current_load}/{g.max_capacity}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-tertiary)' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, transition: 'width 0.5s ease',
                    width: `${(g.current_load / g.max_capacity) * 100}%`,
                    background: g.current_load >= g.max_capacity ? 'var(--color-danger)' : 'var(--color-accent)',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
                {g.domains.map(d => <span key={d} className="badge badge-primary" style={{ fontSize: 11 }}>{d}</span>)}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-outline" onClick={() => { setForm({ name: g.name, employee_id: g.employee_id, designation: g.designation, domains: g.domains }); setEditId(g.id); setShowModal(true) }}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(g.id)}>Delete</button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
              <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <h2 className="modal-title">{editId ? 'Edit Guide' : 'Add New Guide'}</h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div><label className="input-label">Name</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div><label className="input-label">Employee ID</label><input className="input-field" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required disabled={!!editId} /></div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="input-label">Designation</label>
                    <select className="select-field" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })}>
                      {DESIGNATIONS.map(d => <option key={d.value} value={d.value}>{d.label} (Max {d.cap} teams)</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label className="input-label">Domains of Expertise</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {domains.map(d => (
                        <button
                          key={d} type="button"
                          className={`badge ${form.domains.includes(d) ? 'badge-primary' : 'badge-neutral'}`}
                          style={{ cursor: 'pointer', fontSize: 12, padding: '6px 14px' }}
                          onClick={() => toggleDomain(d)}
                        >
                          {form.domains.includes(d) ? '✓ ' : ''}{d}
                        </button>
                      ))}
                      {form.domains.filter(d => !domains.includes(d)).map(d => (
                        <button
                          key={d} type="button"
                          className="badge badge-primary"
                          style={{ cursor: 'pointer', fontSize: 12, padding: '6px 14px' }}
                          onClick={() => toggleDomain(d)}
                        >
                          ✓ {d}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input
                        className="input-field"
                        placeholder="Add custom domain..."
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomDomain())}
                      />
                      <button type="button" className="btn btn-outline" onClick={addCustomDomain}>Add</button>
                    </div>
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
