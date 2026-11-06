
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Login from './pages/Login'
import WaterBodies from './pages/WaterBodies'
import Analytics from './pages/Analytics'
import Alerts from './pages/Alerts'
import RegisterWaterBody from './pages/RegisterWaterBody'
import RegisterDevice from './pages/RegisterDevice'
import About from './pages/About'
import AuthenticatedLayout from './components/AuthenticatedLayout'

const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Navigate to="/water-quality" replace />} />
          <Route path="/water-quality" element={
            <Suspense fallback={<main className="auth-check">Loading Water Quality…</main>}>
              <Dashboard />
            </Suspense>
          } />
          <Route path="/water-bodies" element={<WaterBodies />} />
          <Route path="/water-bodies/register" element={<RegisterWaterBody />} />
          <Route path="/devices/register" element={<RegisterDevice />} />
          <Route path="/about" element={<About />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
