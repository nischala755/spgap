import { useState, useEffect } from 'react'
import api from '../api/axios'

export const DEFAULT_DOMAINS = [
  'AI/ML', 'Web Development', 'Cybersecurity', 'IoT',
  'Cloud Computing', 'Data Science', 'Blockchain', 'Mobile Development',
]

export function useDomains() {
  const [domains, setDomains] = useState(DEFAULT_DOMAINS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/domains')
      .then(res => {
        const names = res.data.domains?.map(d => d.name) || []
        if (names.length > 0) setDomains(names)
      })
      .catch(() => setDomains(DEFAULT_DOMAINS))
      .finally(() => setLoading(false))
  }, [])

  return { domains, loading }
}
