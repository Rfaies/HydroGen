
import { useEffect, useState } from 'react'
import axios from 'axios'
import '../App.css'

function WaterBodies() {
  const [waterBodies, setWaterBodies] = useState([])
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [newDeviceCredential, setNewDeviceCredential] = useState('')
  const [selectedWaterBodyId, setSelectedWaterBodyId] = useState('')
  const [registeringDevice, setRegisteringDevice] = useState(false)
  const [deviceError, setDeviceError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    waterType: 'Pond'
  })

  useEffect(() => {
    async function fetchWaterBodies() {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/water-bodies',
          { withCredentials: true }
        )

        setWaterBodies(response.data.waterBodies)
        const deviceResponse = await axios.get(
  'http://localhost:5000/api/devices',
  { withCredentials: true }
)

setDevices(deviceResponse.data.devices)
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Could not load your water bodies.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchWaterBodies()
  }, [])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }))
  }
  function handleEdit(waterBody) {
  setEditingId(waterBody._id)

  setFormData({
    name: waterBody.name,
    location: waterBody.location || '',
    waterType: waterBody.waterType
  })

  setFormError('')

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}
  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    if (!formData.name.trim()) {
      setFormError('Please enter a water body name.')
      return
    }

    try {
      setSubmitting(true)

      const waterBodyData = {
  name: formData.name.trim(),
  location: formData.location.trim(),
  waterType: formData.waterType
}

if (editingId) {
  const response = await axios.put(
    `http://localhost:5000/api/water-bodies/${editingId}`,
    waterBodyData,
    { withCredentials: true }
  )

  setWaterBodies((previous) =>
    previous.map((item) =>
      item._id === editingId
        ? response.data.waterBody
        : item
    )
  )
} else {
  const response = await axios.post(
    'http://localhost:5000/api/water-bodies',
    waterBodyData,
    { withCredentials: true }
  )

  setWaterBodies((previous) => [
    response.data.waterBody,
    ...previous
  ])
}

      setFormData({
        name: '',
        location: '',
        waterType: 'Pond'
      })
      setEditingId(null)
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        'Could not register this water body. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }
async function handleDeviceRegistration(event) {
  event.preventDefault()
  setDeviceError('')

  if (!deviceId.trim() || !selectedWaterBodyId) {
    setDeviceError('Enter a device ID and select a water body.')
    return
  }

  try {
    setRegisteringDevice(true)

    const response = await axios.post(
      'http://localhost:5000/api/devices/register',
      {
        deviceId: deviceId.trim(),
        waterBodyId: selectedWaterBodyId
      },
      { withCredentials: true }
    )

    setDevices((previous) => [
      ...previous,
      response.data.device
    ])
    setNewDeviceCredential(response.data.deviceCredential)
    setDeviceId('')
    setSelectedWaterBodyId('')
  } catch (err) {
    setDeviceError(
      err.response?.data?.message ||
      'Could not register the device. Please try again.'
    )
  } finally {
    setRegisteringDevice(false)
  }
}
  return (
    <main className="water-bodies-page">
      <header className="water-bodies-header">
        <div>
          <p className="water-bodies-eyebrow">
            HYDROGEN / MANAGEMENT
          </p>

          <h1>My Water Bodies</h1>

          <p className="water-bodies-description">
            Register and manage the water bodies monitored by your
            HydroGen devices.
          </p>
        </div>

        <span className="water-body-count">
          {waterBodies.length} registered
        </span>
      </header>

      <section className="water-body-form-section">
        <div className="section-heading">
          <h2>Register a water body</h2>
          <p>Add the details of the water body you want to monitor.</p>
        </div>

        <form onSubmit={handleSubmit} className="water-body-form">
          <div className="form-field">
            <label htmlFor="water-name">Water body name</label>

            <input
              id="water-name"
              type="text"
              name="name"
              placeholder="e.g. Central Lake"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="water-location">Location</label>

            <input
              id="water-location"
              type="text"
              name="location"
              placeholder="e.g. Bengaluru, Karnataka"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label htmlFor="water-type">Water body type</label>

            <select
              id="water-type"
              name="waterType"
              value={formData.waterType}
              onChange={handleChange}
            >
              <option value="Pond">Pond</option>
              <option value="Lake">Lake</option>
              <option value="River">River</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formError && (
            <p className="water-form-error">{formError}</p>
          )}

          <button
         type="submit"
         className="water-submit-button"
         disabled={submitting}
           >
       {submitting
    ? (editingId ? 'Saving changes...' : 'Registering...')
    : (editingId ? 'Save changes' : 'Register water body')}
</button>
        </form>
        {newDeviceCredential && (
  <div className="device-credential-box">
    <h3>Device registered successfully</h3>

    <p>
       Copy this device credential now and store it securely.
     It will not be shown again after you close or refresh this page.
    </p>

    <code>{newDeviceCredential}</code>

    <button
      type="button"
      onClick={() =>
        navigator.clipboard.writeText(newDeviceCredential)
      }
    >
      Copy credential
    </button>

    <button
      type="button"
      onClick={() => setNewDeviceCredential('')}
    >
      Close
    </button>
  </div>
)}
      </section>
       <section className="device-registration-section">
  <div className="section-heading">
    <h2>Register a Glob device</h2>
    <p>Assign one dedicated Glob device to a water body.</p>
  </div>

  <form
    onSubmit={handleDeviceRegistration}
    className="device-registration-form"
  >
    <div className="form-field">
      <label htmlFor="device-water-body">Select water body</label>

      <select
        id="device-water-body"
        value={selectedWaterBodyId}
        onChange={(event) =>
          setSelectedWaterBodyId(event.target.value)
        }
        required
      >
        <option value="">Choose a water body</option>

        {waterBodies.map((waterBody) => (
          <option
            key={waterBody._id}
            value={waterBody._id}
            disabled={devices.some(
              (device) =>
                device.waterBodyId?._id === waterBody._id ||
                device.waterBodyId === waterBody._id
            )}
          >
            {waterBody.name}
            {devices.some(
              (device) =>
                device.waterBodyId?._id === waterBody._id ||
                device.waterBodyId === waterBody._id
            )
              ? ' — Device assigned'
              : ''}
          </option>
        ))}
      </select>
    </div>

    <div className="form-field">
      <label htmlFor="glob-device-id">Glob device ID</label>

      <input
        id="glob-device-id"
        type="text"
        placeholder="Enter your Glob device ID"
        value={deviceId}
        onChange={(event) => setDeviceId(event.target.value)}
        required
      />
    </div>

    {deviceError && (
      <p className="device-form-error">{deviceError}</p>
    )}

    <button
      type="submit"
      className="water-submit-button"
      disabled={registeringDevice || waterBodies.length === 0}
    >
      {registeringDevice ? 'Registering...' : 'Register device'}
    </button>
  </form>
</section>
      <section className="registered-water-section">
        <div className="section-heading">
          <h2>Registered water bodies</h2>
          <p>Your saved water bodies appear here.</p>
        </div>

        {loading ? (
          <p className="water-state-message">Loading water bodies...</p>
        ) : error ? (
          <p className="water-state-error">{error}</p>
        ) : waterBodies.length === 0 ? (
          <div className="water-empty-state">
            <h3>No water bodies registered yet</h3>
            <p>
              Register your first water body using the form above.
            </p>
          </div>
        ) : (
          <div className="water-body-list">
            {waterBodies.map((waterBody) => (
              <article
                className="water-body-item"
                key={waterBody._id}
              >
                <div>
                    <div className="water-device-info">
  {(() => {
    const assignedDevice = devices.find(
      (device) =>
        device.waterBodyId?._id === waterBody._id ||
        device.waterBodyId === waterBody._id
    )

    return assignedDevice ? (
      <>
        <p>Glob ID: {assignedDevice.deviceId}</p>
        <p>Status: {assignedDevice.status}</p>
      </>
    ) : (
      <p>No Glob device assigned</p>
    )
  })()}
</div>
                  <h3>{waterBody.name}</h3>
                  <p>
                    {waterBody.location || 'Location not specified'}
                  </p>
                </div>

              <div className="water-body-actions">
  <span className="water-type-label">
    {waterBody.waterType}
  </span>

  <button
    type="button"
    className="water-edit-button"
    onClick={() => handleEdit(waterBody)}
  >
    Edit
  </button>
</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default WaterBodies
