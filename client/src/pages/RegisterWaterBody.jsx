import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

const initialForm = { name: '', location: '', waterType: 'Pond' }

function RegisterWaterBody() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(Boolean(editId))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editId) return undefined
    const controller = new AbortController()

    api.get('/water-bodies', { signal: controller.signal })
      .then((response) => {
        if (controller.signal.aborted) return
        const body = (response.data.waterBodies || []).find((item) => item._id === editId)
        if (!body) {
          setError('Water body not found in your account.')
          return
        }
        setForm({ name: body.name, location: body.location || '', waterType: body.waterType })
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load this water body.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [editId])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError('Enter a water body name.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        waterType: form.waterType
      }
      if (editId) {
        await api.put(`/water-bodies/${encodeURIComponent(editId)}`, payload)
      } else {
        await api.post('/water-bodies', payload)
      }
      navigate('/water-bodies', {
        state: { notice: editId ? 'Water body details updated.' : 'Water body registered.' }
      })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save this water body.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-stack narrow-page">
      <header className="page-heading">
        <div>
          <p className="section-kicker">WATER BODY MANAGEMENT</p>
          <h2>{editId ? 'Edit Water Body' : 'Register Water Body'}</h2>
          <p>Provide the identifying details for the water body you monitor.</p>
        </div>
      </header>

      {loading ? <p className="inline-state">Loading water body…</p> : (
        <form className="form-panel" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="water-name">Water body name</label>
          <input id="water-name" name="name" value={form.name} onChange={handleChange} required maxLength={100} />

          <label className="field-label" htmlFor="water-location">Location</label>
          <input id="water-location" name="location" value={form.location} onChange={handleChange} placeholder="Optional" />

          <label className="field-label" htmlFor="water-type">Water body type</label>
          <select id="water-type" name="waterType" value={form.waterType} onChange={handleChange} required>
            <option value="Pond">Pond</option>
            <option value="Lake">Lake</option>
            <option value="River">River</option>
            <option value="Fish Farm">Fish Farm</option>
            <option value="Other">Other</option>
          </select>

          {error && <p className="inline-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : editId ? 'Save Changes' : 'Register Water Body'}
            </button>
            <Link className="button button-secondary" to="/water-bodies">Cancel</Link>
          </div>
        </form>
      )}
    </section>
  )
}

export default RegisterWaterBody
