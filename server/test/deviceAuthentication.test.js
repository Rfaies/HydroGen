const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const Device = require('../models/Device')
const WaterBody = require('../models/WaterBody')
const authenticateDevice = require('../middleware/deviceAuthMiddleware')
const { getDevices } = require('../controllers/deviceController')

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(body) {
      this.body = body
      return this
    }
  }
}

test('device authentication compares the credential hash and refreshes lastSeen', async (t) => {
  const credential = 'device-secret'
  const device = {
    deviceId: 'glob-1',
    credentialHash: crypto.createHash('sha256').update(credential).digest('hex'),
    save: t.mock.fn(async function save() {})
  }
  t.mock.method(Device, 'findOne', () => ({
    select: async () => device
  }))

  const req = { headers: { 'x-device-id': 'glob-1', 'x-device-key': credential } }
  const res = responseRecorder()
  let continued = false

  await authenticateDevice(req, res, () => { continued = true })

  assert.equal(continued, true)
  assert.equal(device.status, 'online')
  assert.ok(device.lastSeen instanceof Date)
  assert.equal(device.save.mock.callCount(), 1)
})

test('device authentication rejects an incorrect credential without refreshing connectivity', async (t) => {
  const device = {
    credentialHash: crypto.createHash('sha256').update('expected').digest('hex'),
    save: t.mock.fn()
  }
  t.mock.method(Device, 'findOne', () => ({ select: async () => device }))

  const req = { headers: { 'x-device-id': 'glob-1', 'x-device-key': 'wrong' } }
  const res = responseRecorder()
  let continued = false

  await authenticateDevice(req, res, () => { continued = true })

  assert.equal(res.statusCode, 401)
  assert.equal(continued, false)
  assert.equal(device.save.mock.callCount(), 0)
})

test('device listing scopes results to owned water bodies and derives two-minute status', async (t) => {
  const ownerId = 'owner-123'
  let deviceQuery
  const now = Date.now()
  const devices = [
    { deviceId: 'recent', lastSeen: new Date(now - 30_000), toObject() { return { deviceId: this.deviceId, lastSeen: this.lastSeen, status: 'offline' } } },
    { deviceId: 'stale', lastSeen: new Date(now - 121_000), toObject() { return { deviceId: this.deviceId, lastSeen: this.lastSeen, status: 'online' } } },
    { deviceId: 'never', lastSeen: null, toObject() { return { deviceId: this.deviceId, lastSeen: this.lastSeen, status: 'online' } } }
  ]

  t.mock.method(WaterBody, 'find', (query) => {
    assert.deepEqual(query, { userId: ownerId })
    return { select: async () => [{ _id: 'owned-body' }] }
  })
  t.mock.method(Device, 'find', (query) => {
    deviceQuery = query
    return { populate: async () => devices }
  })

  const res = responseRecorder()
  await getDevices({ userId: ownerId }, res)

  assert.deepEqual(deviceQuery, { waterBodyId: { $in: ['owned-body'] } })
  assert.deepEqual(res.body.devices.map((device) => device.status), ['online', 'offline', 'offline'])
  assert.equal(res.body.devices.some((device) => 'credentialHash' in device), false)
})
