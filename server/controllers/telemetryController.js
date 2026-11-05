const sensorFields = ['temperature', 'pH', 'salinity', 'ammonia']

function receiveTelemetry(req, res) {
  const body = req.body

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: 'A JSON object containing sensor values is required',
      errors: sensorFields.map((field) => ({ field, message: 'is required' }))
    })
  }

  const errors = []

  for (const field of sensorFields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) {
      errors.push({ field, message: 'is required' })
    } else if (typeof body[field] !== 'number' || !Number.isFinite(body[field])) {
      errors.push({ field, message: 'must be a finite number' })
    }
  }

  if (typeof body.ammonia === 'number' && Number.isFinite(body.ammonia) && body.ammonia < 0) {
    errors.push({ field: 'ammonia', message: 'must be zero or greater' })
  }

  if (typeof body.salinity === 'number' && Number.isFinite(body.salinity) && body.salinity < 0) {
    errors.push({ field: 'salinity', message: 'must be zero or greater' })
  }

  if (typeof body.pH === 'number' && Number.isFinite(body.pH) && (body.pH < 0 || body.pH > 14)) {
    errors.push({ field: 'pH', message: 'must be between 0 and 14' })
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Sensor telemetry validation failed',
      errors
    })
  }

  return res.status(200).json({
    success: true,
    message: 'Sensor telemetry accepted',
    deviceId: req.device.deviceId,
    waterBodyId: req.device.waterBodyId,
    telemetry: {
      temperature: body.temperature,
      pH: body.pH,
      salinity: body.salinity,
      ammonia: body.ammonia
    }
  })
}

module.exports = receiveTelemetry
