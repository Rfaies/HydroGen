import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function RegisterDevice() {
  const [waterBodies, setWaterBodies] = useState([])
  const [devices, setDevices] = useState([])
  const [selectedWaterBodyId, setSelectedWaterBodyId] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [credential, setCredential] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      api.get('/water-bodies', { signal: controller.signal }),
      api.get('/devices', { signal: controller.signal })
    ])
      .then(([bodyResponse, deviceResponse]) => {
        if (controller.signal.aborted) return
        const bodies = bodyResponse.data.waterBodies || []
        const assigned = deviceResponse.data.devices || []
        const assignedIds = new Set(assigned.map((device) => String(device.waterBodyId?._id || device.waterBodyId)))
        const available = bodies.filter((body) => !assignedIds.has(String(body._id)))
        setWaterBodies(available)
        setDevices(assigned)
        setSelectedWaterBodyId(available[0]?._id || '')
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Could not load available water bodies.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const availableBodies = useMemo(() => {
    const assignedIds = new Set(devices.map((device) => String(device.waterBodyId?._id || device.waterBodyId)))
    return waterBodies.filter((body) => !assignedIds.has(String(body._id)))
  }, [devices, waterBodies])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!deviceId.trim() || !selectedWaterBodyId) {
      setError('Enter a Glob device ID and select an available water body.')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/devices/register', {
        deviceId: deviceId.trim(),
        waterBodyId: selectedWaterBodyId
      })
      setCredential(response.data.deviceCredential)
      setDevices((current) => [...current, response.data.device])
      setDeviceId('')
      setCopied(false)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not register this device.')
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCredential() {
    try {
      await navigator.clipboard.writeText(credential)
      setCopied(true)
    } catch {
      setError('Clipboard access was unavailable. Select and copy the credential manually.')
    }
  }

  return (
    <section className="page-stack narrow-page">
      <header className="page-heading">
        <div>
          <p className="section-kicker">GLOB DEVICE SETUP</p>
          <h2>Register Device</h2>
          <p>Assign one dedicated Glob device to a water body.</p>
        </div>
      </header>

      {loading ? <p className="inline-state">Loading available water bodies…</p> : (
        <>
          {error && !credential && <p className="inline-error" role="alert">{error}</p>}
          {availableBodies.length === 0 && !credential && !error ? (
            <div className="empty-panel">
              <h3>No unassigned water bodies</h3>
              <p>Create a water body or choose one without a device assignment.</p>
              <Link className="text-link" to="/water-bodies/register">Register a water body</Link>
            </div>
          ) : availableBodies.length > 0 && !credential && (
            <form className="form-panel" onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="device-water-body">Water body</label>
              <select
                id="device-water-body"
                value={selectedWaterBodyId}
                onChange={(event) => setSelectedWaterBodyId(event.target.value)}
                required
              >
                {availableBodies.map((body) => (
                  <option key={body._id} value={body._id}>{body.name}{body.location ? ` · ${body.location}` : ''}</option>
                ))}
              </select>

              <label className="field-label" htmlFor="glob-device-id">Glob device ID</label>
              <input
                id="glob-device-id"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                required
                autoComplete="off"
                maxLength={100}
              />
              <button className="button button-primary" type="submit" disabled={submitting}>
                {submitting ? 'Registering…' : 'Register Glob Device'}
              </button>
            </form>
          )}

          {credential && (
            <section className="credential-panel" aria-labelledby="credential-title">
              <p className="section-kicker">ONE-TIME DEVICE CREDENTIAL</p>
              <h3 id="credential-title">Device registered</h3>
              <p>Copy and store this credential securely. HydroGen will not show it again after you close or refresh this page.</p>
              <code>{credential}</code>
              <div className="form-actions">
                <button className="button button-primary" type="button" onClick={copyCredential}>
                  {copied ? 'Copied' : 'Copy Credential'}
                </button>
                <button className="button button-secondary" type="button" onClick={() => setCredential('')}>
                  Close Credential
                </button>
                <Link className="button button-secondary" to="/water-bodies">View Water Bodies</Link>
              </div>
            </section>
          )}
          {error && credential && <p className="inline-error" role="alert">{error}</p>}
        </>
      )}
    </section>
  )
}

export default RegisterDevice
