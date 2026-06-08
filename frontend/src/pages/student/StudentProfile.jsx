import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../api/axios'
import SelectWithCustom from '../../components/SelectWithCustom'
import { useDomains } from '../../hooks/useDomains'

export default function StudentProfile() {
  const { domains } = useDomains()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    domain: '',
    specializations: '',
    domain_description: '',
    pref_domain_1: '',
    pref_domain_2: '',
    pref_domain_3: '',
    contact_number: '',
  })
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api.get('/students/me').then(res => {
      const p = res.data
      setProfile(p)
      setForm({
        domain: p.domain || '',
        specializations: (p.specializations || []).join(', '),
        domain_description: p.domain_description || '',
        pref_domain_1: p.pref_domain_1 || '',
        pref_domain_2: p.pref_domain_2 || '',
        pref_domain_3: p.pref_domain_3 || '',
        contact_number: p.contact_number || '',
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    try {
      await api.put('/students/me', {
        domain: form.domain || null,
        specializations: form.specializations.split(',').map(s => s.trim()).filter(Boolean),
        domain_description: form.domain_description || null,
        pref_domain_1: form.pref_domain_1 || null,
        pref_domain_2: form.pref_domain_2 || null,
        pref_domain_3: form.pref_domain_3 || null,
        contact_number: form.contact_number || null,
      })
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      alert(err.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="page-body" style={{ paddingTop: 40 }}><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></div>
  }

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Tell us about your skills and interests so the smart allocation engine can match you to the right project</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: 28,
            }}>
              {profile?.name?.charAt(0)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{profile?.email}</p>
            </div>
            <div style={{ marginTop: 20, display: 'grid', gap: 10 }}>
              {[
                ['USN', profile?.usn],
                ['Department', profile?.department],
                ['Semester', profile?.semester],
                ['Section', profile?.section],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="card" style={{ padding: 28 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Your Skills & Interests</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              This information powers the <strong>smart allocation</strong> algorithm. Be as specific as you can.
            </p>

            {success && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.08)', color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                ✓ {success}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16 }}>
                <SelectWithCustom
                  label="Primary Domain"
                  helpText="Your main area of study or expertise — e.g. the field you are strongest in. This is used to match your team to projects in the same domain."
                  value={form.domain}
                  onChange={v => setForm({ ...form, domain: v })}
                  options={domains}
                  placeholder="Select your primary domain..."
                  customPlaceholder="e.g. Game Development, DevOps..."
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Specializations</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Specific skills or technologies you know (comma-separated). Example: Machine Learning, React, Python
                </p>
                <input
                  className="input-field"
                  placeholder="Machine Learning, NLP, Deep Learning"
                  value={form.specializations}
                  onChange={e => setForm({ ...form, specializations: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="input-label">Describe Your Interests (Natural Language)</label>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Write freely about what kind of project you want. The smart algorithm reads this text to find better matches.
                  Example: &quot;I want to build a mobile health app using Flutter and integrate ML for symptom detection&quot;
                </p>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Describe the type of project or technology you're passionate about..."
                  value={form.domain_description}
                  onChange={e => setForm({ ...form, domain_description: e.target.value })}
                />
              </div>

              <div style={{
                padding: 16, borderRadius: 12, background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)', marginBottom: 16,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 6 }}>
                  What are Preferred Domains?
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  Preferred domains are <strong>project types you would like to work on</strong>, ranked by priority.
                  #1 is your top choice, #2 is second, #3 is third. These may differ from your primary domain —
                  for example, you might specialize in Web Development but prefer an AI/ML project.
                  The allocation engine gives higher weight to your #1 preference.
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <SelectWithCustom
                  label="Preferred Project Domain #1 (Highest Priority)"
                  value={form.pref_domain_1}
                  onChange={v => setForm({ ...form, pref_domain_1: v })}
                  options={domains}
                  placeholder="Your top choice..."
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <SelectWithCustom
                  label="Preferred Project Domain #2"
                  value={form.pref_domain_2}
                  onChange={v => setForm({ ...form, pref_domain_2: v })}
                  options={domains}
                  placeholder="Second choice..."
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <SelectWithCustom
                  label="Preferred Project Domain #3"
                  value={form.pref_domain_3}
                  onChange={v => setForm({ ...form, pref_domain_3: v })}
                  options={domains}
                  placeholder="Third choice..."
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Contact Number</label>
                <input
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={form.contact_number}
                  onChange={e => setForm({ ...form, contact_number: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
