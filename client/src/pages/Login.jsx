
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../App.css'

function Login() {
  const navigate = useNavigate()
  const googleButtonRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) return

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

      if (!clientId) {
        setError('Google Client ID is not configured.')
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,

        callback: async (response) => {
          try {
            setLoading(true)
            setError('')

            await axios.post(
              'http://localhost:5000/api/auth/google',
              {
                credential: response.credential
              },
              {
                withCredentials: true
              }
            )

            navigate('/dashboard')
          } catch (err) {
            console.error('Login failed:', err)
            setError(
              err.response?.data?.message ||
              'Google login failed. Please try again.'
            )
          } finally {
            setLoading(false)
          }
        }
      })

      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: Math.min(
            340,
            googleButtonRef.current.clientWidth || 340
          )
        }
      )
    }

    if (window.google?.accounts?.id) {
      initializeGoogle()
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      )

      if (script) {
        script.addEventListener('load', initializeGoogle)
      }

      return () => {
        script?.removeEventListener('load', initializeGoogle)
      }
    }
  }, [navigate])

  return (
    <main className="login-page">
      <section className="login-container">

        <div className="brand">
          <div className="brand-icon">H</div>
          <span>HydroGen</span>
        </div>

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
