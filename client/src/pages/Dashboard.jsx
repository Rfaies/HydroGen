
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
async function handleLogout() {
  try {
    await axios.post(
      'http://localhost:5000/api/auth/logout',
      {},
      { withCredentials: true }
    )

    navigate('/', { replace: true })
  } catch (error) {
    console.error('Logout failed:', error)
  }
}
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/auth/me',
          { withCredentials: true }
        )

        setUser(response.data.user)
      } catch (error) {
        navigate('/', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [navigate])

  if (loading) {
    return <p>Checking your session...</p>
  }

  if (!user) {
    return null
  }

  return (
    <main>
      <h1>HydroGen Dashboard</h1>
       <button onClick={handleLogout}>
       Logout
       </button>
      <p>Welcome, {user.name}</p>

      {user.picture && (
        <img
          src={user.picture}
          alt="Profile"
          width="48"
          height="48"
        />
      )}
    </main>
  )
}

export default Dashboard
