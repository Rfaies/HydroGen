
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import '../App.css'

let googleInitialized = false
let activeGoogleCredentialHandler = null
const renderedGoogleButtons = new WeakSet()

function Login() {
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    let mountedCredentialHandler = null

    const initializeGoogle = () => {
      const googleId = window.google?.accounts?.id
      const button = googleButtonRef.current
      if (!googleId || !button || !isMounted) return

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

      if (!clientId) {
        setError('Google Client ID is not configured.')
        return
      }

      mountedCredentialHandler = async (response) => {
        if (!isMounted) return
        try {
          setLoading(true)
          setError('')

          await api.post('/auth/google', { credential: response.credential })

          navigate('/water-quality')
        } catch (err) {
          console.error('Login failed:', err)
          setError(
            err.response?.data?.message ||
            'Google login failed. Please try again.'
          )
        } finally {
          if (isMounted) setLoading(false)
        }
      }
      activeGoogleCredentialHandler = mountedCredentialHandler

      if (!googleInitialized) {
        googleId.initialize({
          client_id: clientId,
          callback: (response) => activeGoogleCredentialHandler?.(response)
        })
        googleInitialized = true
      }

      if (!renderedGoogleButtons.has(button)) {
        googleId.renderButton(button, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(
            340,
            button.clientWidth || 340
          )
        })
        renderedGoogleButtons.add(button)
      }
    }

    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    )
    const handleScriptError = () => {
      if (isMounted) setError('Google sign-in could not be loaded. Refresh the page and try again.')
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else if (script) {
      script.addEventListener('load', initializeGoogle)
      script.addEventListener('error', handleScriptError)
    } else {
      handleScriptError()
    }

    return () => {
      isMounted = false
      if (activeGoogleCredentialHandler === mountedCredentialHandler) {
        activeGoogleCredentialHandler = null
      }
      script?.removeEventListener('load', initializeGoogle)
      script?.removeEventListener('error', handleScriptError)
    }
  }, [navigate])

  return (
    <main className="login-page">
      <section className="login-container">
        <div className="brand">HydroGen</div>

        <div className="login-content">
          <p className="eyebrow">WATER QUALITY MONITORING</p>

          <h1>Welcome back</h1>

          <p className="login-description">
            Monitor your water bodies.
            Understand your data.
            Protect water quality.
          </p>

          <div
            ref={googleButtonRef}
            className="google-button-slot"
          />

          {loading && (
            <p className="privacy-note">
              Signing you in...
            </p>
          )}

          {error && (
            <p className="login-error">
              {error}
            </p>
          )}

          <p className="privacy-note">
            Secure access to your HydroGen account.
          </p>
        </div>

        <footer className="login-footer">
          <span>HydroGen</span>
          <span>Water quality, made measurable.</span>
        </footer>

      </section>
    </main>
  )
}

export default Login
