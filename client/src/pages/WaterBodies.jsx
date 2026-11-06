import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api from '../services/api'

function WaterBodies() {
  const location = useLocation()
  const notice = location.state?.notice
  const [waterBodies, setWaterBodies] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deviceError, setDeviceError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadWaterBodies() {
      try {
        const [bodyResult, deviceResult] = await Promise.allSettled([
          api.get('/water-bodies', { signal: controller.signal }),
          api.get('/devices', { signal: controller.signal })
        ])
        if (controller.signal.aborted) return
        if (bodyResult.status === 'fulfilled') {
          setWaterBodies(bodyResult.value.data.waterBodies || [])
        } else {
          setError(bodyResult.reason.response?.data?.message || 'Could not load your water bodies.')
        }
        if (deviceResult.status === 'fulfilled') {
          setDevices(deviceResult.value.data.devices || [])
        } else {
          setDeviceError(deviceResult.reason.response?.data?.message || 'Device information is unavailable.')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadWaterBodies()
    return () => controller.abort()
  }, [])

  function deviceForBody(waterBodyId) {
    return devices.find((device) => {
      const assignedId = device.waterBodyId?._id || device.waterBodyId
      return String(assignedId) === String(waterBodyId)
    })
  }

  return (
    <section className="page-stack">
      <header className="page-heading">
        <div>
          <p className="section-kicker">WATER BODY MANAGEMENT</p>
          <h2>My Water Bodies</h2>
          <p>Water bodies registered to your HydroGen account.</p>
        </div>
        <Link className="button button-primary" to="/water-bodies/register">Register Water Body</Link>
      </header>

      {notice && <p className="inline-success" role="status">{notice}</p>}
      {loading && <p className="inline-state">Loading your water bodies…</p>}
      {error && <p className="inline-error" role="alert">{error}</p>}
      {!loading && !error && waterBodies.length === 0 && (
        <div className="empty-panel">
          <h3>No water bodies registered</h3>
          <p>Register a pond, lake, river, or fish farm to begin monitoring.</p>
          <Link className="text-link" to="/water-bodies/register">Register your first water body</Link>
        </div>
      )}

      {!loading && !error && waterBodies.length > 0 && (
        <div className="water-body-list">
          {waterBodies.map((waterBody) => {
            const device = deviceForBody(waterBody._id)
            return (
              <article className="water-body-row" key={waterBody._id}>
                <div className="water-body-main">
                  <p className="section-kicker">{waterBody.waterType}</p>
                  <h3>{waterBody.name}</h3>
                  <p>{waterBody.location || 'Location not specified'}</p>
                </div>
                <div className="water-body-device">
                  {deviceError ? <span>Device status unavailable</span> : device ? (
                    <>
                      <span className={`status-label status-${device.status}`}>
                        <span className="status-dot" />{device.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                      <span>{device.deviceId}</span>
                    </>
                  ) : <span>No Glob device assigned</span>}
                </div>
                <div className="row-actions">
                  <Link className="button button-secondary" to={`/water-quality?waterBodyId=${encodeURIComponent(waterBody._id)}`}>
                    View Water Quality
                  </Link>
                  <Link className="text-link" to={`/water-bodies/register?edit=${encodeURIComponent(waterBody._id)}`}>
                    Edit
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default WaterBodies
