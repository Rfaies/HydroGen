const crypto = require('crypto')
const Device = require('../models/Device')

async function authenticateDevice(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id']
    const credential = req.headers['x-device-key']

    if (!deviceId || !credential) {
      return res.status(401).json({
        success: false,
        message: 'Device credentials are missing'
      })
    }

    const device = await Device.findOne({ deviceId })
      .select('+credentialHash')

    if (!device || !device.credentialHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device credentials'
      })
    }

    const receivedHash = crypto
      .createHash('sha256')
      .update(credential)
      .digest('hex')

    const receivedBuffer = Buffer.from(receivedHash, 'hex')
    const storedBuffer = Buffer.from(device.credentialHash, 'hex')

    if (
      receivedBuffer.length !== storedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, storedBuffer)
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device credentials'
      })
    }

    device.status = 'online'
    device.lastSeen = new Date()
    await device.save()

    req.device = device

    next()
  } catch (error) {
    console.error('Device authentication error:', error.message)

    return res.status(500).json({
      success: false,
      message: 'Device authentication failed'
    })
  }
}

module.exports = authenticateDevice