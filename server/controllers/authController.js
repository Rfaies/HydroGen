const { OAuth2Client } = require('google-auth-library')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

async function googleLogin(req, res) {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is missing'
      })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()

    if (!payload.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Google email is not verified'
      })
    }

    const user = await User.findOneAndUpdate(
      { googleId: payload.sub },
      {
        $set: {
          name: payload.name,
          email: payload.email,
          picture: payload.picture || ''
        },
        $setOnInsert: {
          googleId: payload.sub
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    )

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({
      success: true,
      message: 'Google login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture
      }
    })
  } catch (error) {
    console.error('Google login error:', error.message)

    return res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    })
  }
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId).select(
      'name email picture'
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    return res.json({
      success: true,
      user
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Could not fetch user'
    })
  }
}

function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  })

  return res.json({
    success: true,
    message: 'Logged out successfully'
  })
}

module.exports = { googleLogin, getMe, logout }