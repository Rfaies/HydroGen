import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../App.css'

const API_BASE_URL = 'http://localhost:5000/api'

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

function formatTimestamp(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'Timestamp unavailable'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [waterBodies, setWaterBodies] = useState([])
  const [devices, setDevices] = useState([])
  const [selectedWaterBodyId, setSelectedWaterBodyId] = useState('')
  const [waterBodiesLoading, setWaterBodiesLoading] = useState(true)
  const [devicesLoading, setDevicesLoading] = useState(true)
  const [waterBodiesError, setWaterBodiesError] = useState('')
  const [devicesError, setDevicesError] = useState('')
  const [readingResult, setReadingResult] = useState({
    waterBodyId: '',
    reading: null,
    error: ''
  })
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      let authenticatedUser

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          withCredentials: true,
          signal: controller.signal
        })
        authenticatedUser = response.data.user
        setUser(authenticatedUser)
      } catch {
        if (!controller.signal.aborted) {
          navigate('/', { replace: true })
        }
        return
      } finally {
        if (!controller.signal.aborted) setSessionLoading(false)
      }

      if (!authenticatedUser || controller.signal.aborted) return

      const [waterBodiesResult, devicesResult] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/water-bodies`, {
          withCredentials: true,
          signal: controller.signal
        }),
        axios.get(`${API_BASE_URL}/devices`, {
          withCredentials: true,
          signal: controller.signal
        })
      ])

      if (controller.signal.aborted) return

      if (waterBodiesResult.status === 'fulfilled') {
        const bodies = waterBodiesResult.value.data.waterBodies || []
        setWaterBodies(bodies)
        setSelectedWaterBodyId((current) =>
          bodies.some((body) => body._id === current)
            ? current
            : bodies[0]?._id || ''
        )
      } else {
        setWaterBodiesError(getErrorMessage(
          waterBodiesResult.reason,
          'Could not load your water bodies.'
        ))
      }

      if (devicesResult.status === 'fulfilled') {
        setDevices(devicesResult.value.data.devices || [])
      } else {
        setDevicesError(getErrorMessage(
          devicesResult.reason,
          'Could not load your devices.'
        ))
      }

      setWaterBodiesLoading(false)
      setDevicesLoading(false)
    }

    loadDashboard()
    return () => controller.abort()
  }, [navigate])

  useEffect(() => {
    if (!selectedWaterBodyId) {
      return undefined
    }

    const controller = new AbortController()

    async function loadLatestReading() {
      try {
        const response = await axios.get(`${API_BASE_URL}/readings`, {
          params: {
            waterBodyId: selectedWaterBodyId,
            page: 1,
            limit: 1
          },
          withCredentials: true,
          signal: controller.signal
        })
        if (!controller.signal.aborted) {
          setReadingResult({
            waterBodyId: selectedWaterBodyId,
            reading: response.data.readings?.[0] || null,
            error: ''
          })
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setReadingResult({
            waterBodyId: selectedWaterBodyId,
            reading: null,
            error: getErrorMessage(error, 'Could not load the latest reading.')
          })
        }
      }
    }

    loadLatestReading()
    return () => controller.abort()
  }, [selectedWaterBodyId])

  async function handleLogout() {
    setLogoutError('')
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      )
      navigate('/', { replace: true })
    } catch (error) {
      setLogoutError(getErrorMessage(error, 'Logout failed. Please try again.'))
    }
  }

  if (sessionLoading) {
    return <main className="dashboard-loading">Checking your session...</main>
  }

  if (!user) return null

  const selectedWaterBody = waterBodies.find((body) => body._id === selectedWaterBodyId)
  const readingMatchesSelection = readingResult.waterBodyId === selectedWaterBodyId
  const latestReading = readingMatchesSelection ? readingResult.reading : null
  const readingError = readingMatchesSelection ? readingResult.error : ''
  const readingLoading = Boolean(selectedWaterBodyId && !readingMatchesSelection)
  const assignedDevice = devices.find((device) => {
    const deviceWaterBodyId = device.waterBodyId?._id || device.waterBodyId
    return String(deviceWaterBodyId) === String(selectedWaterBodyId)
  })

  const metrics = latestReading ? [
    { label: 'Temperature', qualifier: '', value: latestReading.temperature, unit: '°C' },
    { label: 'pH', qualifier: '', value: latestReading.pH, unit: '' },
    { label: 'Salinity', qualifier: 'Unit unspecified', value: latestReading.salinity, unit: '' },
    { label: 'Ammonia', qualifier: 'TAN-N', value: latestReading.ammonia, unit: 'mg/L' }
  ] : []

  return (
    <div className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link className="dashboard-brand" to="/dashboard" aria-label="HydroGen dashboard">
          <span className="dashboard-brand-mark">H</span>
          <span>HydroGen</span>
        </Link>

        <div className="dashboard-account">
          {user.picture && (
            <img className="dashboard-avatar" src={user.picture} alt="" />
          )}
          <span className="dashboard-user-name">{user.name}</span>
          <button className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-heading-row">
          <div>
            <p className="dashboard-eyebrow">WATER QUALITY / OVERVIEW</p>
            <h1>Monitoring dashboard</h1>
            <p className="dashboard-intro">
              Review the latest stored sensor reading and device connection status.
            </p>
          </div>
          <Link className="dashboard-manage-link" to="/water-bodies">
            Manage water bodies
          </Link>
        </div>

        {logoutError && <p className="dashboard-error" role="alert">{logoutError}</p>}

        <section className="dashboard-selection-panel" aria-labelledby="water-body-label">
          <div className="dashboard-selection-copy">
            <label id="water-body-label" htmlFor="dashboard-water-body">Selected water body</label>
            {selectedWaterBody && (
              <p>
                {selectedWaterBody.name}
                {selectedWaterBody.location ? ` · ${selectedWaterBody.location}` : ''}
              </p>
            )}
          </div>
          <select
            id="dashboard-water-body"
            value={selectedWaterBodyId}
            onChange={(event) => setSelectedWaterBodyId(event.target.value)}
            disabled={waterBodiesLoading || waterBodies.length === 0}
          >
            {waterBodies.length === 0 && <option value="">No water bodies available</option>}
            {waterBodies.map((waterBody) => (
              <option key={waterBody._id} value={waterBody._id}>{waterBody.name}</option>
            ))}
          </select>
        </section>

        {waterBodiesLoading ? (
          <p className="dashboard-state">Loading water bodies...</p>
        ) : waterBodiesError ? (
          <p className="dashboard-error" role="alert">{waterBodiesError}</p>
        ) : waterBodies.length === 0 ? (
          <section className="dashboard-empty-panel">
            <h2>No water bodies registered</h2>
            <p>Add a water body to connect a Glob device and view sensor readings.</p>
            <Link to="/water-bodies">Register a water body</Link>
          </section>
        ) : (
          <>
            <section className="dashboard-overview-grid" aria-label="Device and reading status">
              <div className="dashboard-info-panel">
                <p className="dashboard-panel-label">GLOB DEVICE</p>
                {devicesLoading ? (
                  <p className="dashboard-state">Loading device status...</p>
                ) : devicesError ? (
                  <p className="dashboard-error" role="alert">{devicesError}</p>
                ) : assignedDevice ? (
                  <div className="dashboard-device-row">
                    <div>
                      <h2>{assignedDevice.deviceId}</h2>
                      <p>Assigned to {selectedWaterBody?.name}</p>
                    </div>
                    <span className={`dashboard-status dashboard-status-${assignedDevice.status}`}>
                      <span className="dashboard-status-mark" />
                      {assignedDevice.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ) : (
                  <div className="dashboard-empty-copy">
                    <h2>No device assigned</h2>
                    <p>This water body does not have a Glob device yet.</p>
                  </div>
                )}
              </div>

              <div className="dashboard-info-panel dashboard-reading-freshness">
                <p className="dashboard-panel-label">LATEST STORED READING</p>
                {readingLoading ? (
                  <p className="dashboard-state">Checking for readings...</p>
                ) : readingError ? (
                  <p className="dashboard-error" role="alert">{readingError}</p>
                ) : latestReading ? (
                  <p className="dashboard-reading-time">
                    {formatTimestamp(latestReading.recordedAt)}
                  </p>
                ) : (
                  <p className="dashboard-state">No stored reading available</p>
                )}
              </div>
            </section>

            <section className="dashboard-readings-section" aria-labelledby="latest-readings-title" aria-live="polite">
              <div className="dashboard-section-heading">
                <div>
                  <p className="dashboard-eyebrow">SENSOR TELEMETRY</p>
                  <h2 id="latest-readings-title">Latest readings</h2>
                </div>
                <p className="dashboard-data-note">
                  Latest stored sample · not a live sensor stream
                </p>
              </div>

              {readingLoading ? (
                <p className="dashboard-state dashboard-state-bordered">Loading latest reading...</p>
              ) : readingError ? (
                <p className="dashboard-error dashboard-state-bordered" role="alert">{readingError}</p>
              ) : !latestReading ? (
                <div className="dashboard-empty-panel dashboard-reading-empty">
                  <h3>No readings recorded</h3>
                  <p>Sensor values will appear here after the device submits a reading.</p>
                </div>
              ) : (
                <div className="dashboard-metric-grid">
                  {metrics.map((metric) => (
                    <article className="dashboard-metric" key={metric.label}>
                      <div className="dashboard-metric-label-row">
                        <h3>{metric.label}</h3>
                        {metric.qualifier && <span>{metric.qualifier}</span>}
                      </div>
                      <p className="dashboard-metric-value">
                        {metric.value ?? '—'}{metric.value != null && metric.unit ? ` ${metric.unit}` : ''}
                      </p>
                      <p className="dashboard-metric-time">
                        Recorded {formatTimestamp(latestReading.recordedAt)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

export default Dashboard
