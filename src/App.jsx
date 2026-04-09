import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Personnel from './pages/Personnel'
import TimeAttendance from './pages/TimeAttendance'
import Payroll from './pages/Payroll'
import Config from './pages/Config'
import { configApi } from './api/client'
import { getToken, storeToken, validateToken, redirectToSignin } from './auth/useAuth'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Absorb token from URL if redirected from signin
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      storeToken(urlToken)
      params.delete('token')
      const clean = params.toString()
      window.history.replaceState({}, '', clean ? `?${clean}` : window.location.pathname)
    }

    // Validate stored token — must exist, be unexpired, and belong to this tenant
    const token = getToken()
    if (!validateToken(token)) {
      redirectToSignin()
      return
    }
    setAuthed(true)
  }, [])

  const fetchConfig = async () => {
    try {
      const data = await configApi.getAll()
      setConfig(data)
      setError(null)
    } catch (err) {
      // 404 = tenant not found (bad subdomain)
      if (err.response?.status === 404) {
        setError('Tenant not found. Please check the URL.')
      } else {
        setError('Could not connect to API.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (authed) fetchConfig() }, [authed])

  if (!authed) return null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🐦</div>
          <p className="text-slate-500 text-sm">Loading Hummingbird HR…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-slate-700 font-semibold">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <Layout config={config}>
      <Routes>
        <Route path="/" element={<Home config={config} />} />
        <Route path="/personnel/*" element={<Personnel />} />
        <Route path="/time-attendance" element={<TimeAttendance />} />
        <Route path="/payroll" element={<Payroll config={config} />} />
        <Route path="/config" element={<Config config={config} onSave={fetchConfig} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
