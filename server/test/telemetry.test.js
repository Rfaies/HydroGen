const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const express = require('express')
const http = require('node:http')
const Device = require('../models/Device')
const deviceIngressRoutes = require('../routes/deviceIngressRoutes')
const receiveTelemetry = require('../controllers/telemetryController')

function makeDevice(credential = 'telemetry-secret') {
  return {
    deviceId: 'glob-assigned',
    waterBodyId: 'body-assigned',
    credentialHash: crypto.createHash('sha256').update(credential).digest('hex'),
    save: async function save() {}
  }
}

async function startTestServer(t) {
  const app = express()
  app.use(express.json())
  app.use('/api/device', deviceIngressRoutes)
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve) => server.close(resolve)))
  return `http://127.0.0.1:${server.address().port}`
}

async function postJson(baseUrl, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : JSON.stringify(body)
    const request = http.request(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (response) => {
      let responseBody = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { responseBody += chunk })
      response.on('end', () => resolve({
        status: response.statusCode,
        body: responseBody ? JSON.parse(responseBody) : null,
        raw: responseBody
      }))
    })
    request.on('error', reject)
    if (payload) request.write(payload)
    request.end()
  })
}

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
}

test('authenticated telemetry is accepted and body identity cannot spoof assigned identity', async (t) => {
  const credential = 'telemetry-secret'
  const device = makeDevice(credential)
  t.mock.method(Device, 'findOne', () => ({ select: async () => device }))
  const baseUrl = await startTestServer(t)

  const response = await postJson(baseUrl, '/api/device/telemetry', {
    temperature: 23.5,
    pH: 7.2,
    salinity: 0.4,
    ammonia: 0.08,
    deviceId: 'spoofed-device',
    waterBodyId: 'spoofed-body'
  }, { 'x-device-id': device.deviceId, 'x-device-key': credential })

  assert.equal(response.status, 200)
  assert.equal(response.body.success, true)
  assert.equal(response.body.deviceId, 'glob-assigned')
  assert.equal(response.body.waterBodyId, 'body-assigned')
  assert.deepEqual(response.body.telemetry, {
    temperature: 23.5,
    pH: 7.2,
    salinity: 0.4,
    ammonia: 0.08
  })
  assert.equal(response.raw.includes(credential), false)
  assert.equal(response.raw.includes(device.credentialHash), false)
  assert.equal(response.raw.includes('spoofed'), false)
})

test('telemetry endpoint rejects missing and incorrect device credentials', async (t) => {
  const device = makeDevice()
  t.mock.method(Device, 'findOne', () => ({ select: async () => device }))
  const baseUrl = await startTestServer(t)
  const payload = { temperature: 20, pH: 7, salinity: 0, ammonia: 0 }

  const missing = await postJson(baseUrl, '/api/device/telemetry', payload)
  const incorrect = await postJson(baseUrl, '/api/device/telemetry', payload, {
    'x-device-id': device.deviceId,
    'x-device-key': 'wrong-secret'
  })

  assert.equal(missing.status, 401)
  assert.equal(incorrect.status, 401)
})

test('telemetry validation rejects missing, non-numeric, non-finite and out-of-range values', () => {
  const device = { deviceId: 'trusted-device', waterBodyId: 'trusted-body' }
  const base = { temperature: 20, pH: 7, salinity: 0, ammonia: 0 }
  const missingTemperature = Object.fromEntries(
    Object.entries(base).filter(([field]) => field !== 'temperature')
  )
  const invalidPayloads = [
    missingTemperature,
    { ...base, temperature: '20' },
    { ...base, temperature: NaN },
    { ...base, temperature: Infinity },
    { ...base, ammonia: -0.1 },
    { ...base, salinity: -0.1 },
    { ...base, pH: -0.01 },
    { ...base, pH: 14.01 }
  ]

  for (const payload of invalidPayloads) {
    const res = responseRecorder()
    receiveTelemetry({ body: payload, device }, res)
    assert.equal(res.statusCode, 400, JSON.stringify(payload))
    assert.equal(res.body.success, false)
    assert.ok(Array.isArray(res.body.errors))
  }
})

test('telemetry accepts boundary values and ignores unsupported extra fields', () => {
  const res = responseRecorder()
  receiveTelemetry({
    device: { deviceId: 'trusted-device', waterBodyId: 'trusted-body' },
    body: { temperature: -500, pH: 14, salinity: 0, ammonia: 0, extra: 'ignored' }
  }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.telemetry.temperature, -500)
  assert.equal(res.body.telemetry.pH, 14)
  assert.equal('extra' in res.body.telemetry, false)
})
