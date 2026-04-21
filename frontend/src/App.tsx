import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Dashboard from './Dashboard'
import './App.css'

const API = 'http://localhost:3000/api'

interface User {
  username: string
  role: string
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem('session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(loadSession)

  function handleLogin(user: User) {
    localStorage.setItem('session', JSON.stringify(user))
    setUser(user)
  }

  function handleLogout() {
    localStorage.removeItem('session')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard username={user.username} role={user.role} onLogout={handleLogout} /> : <Navigate to="/" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function LoginPage({ onLogin }: { onLogin: (user: User) => void }) {
  const { t, i18n } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(t('login.invalidCredentials'))
        return
      }
      localStorage.setItem('token', data.token)
      onLogin({ username: data.username, role: data.role })
    } catch {
      setError(t('login.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-lang-bar">
        <button className={`lang-btn${i18n.language === 'sv' ? ' active' : ''}`} onClick={() => i18n.changeLanguage('sv')}>SV</button>
        <button className={`lang-btn${i18n.language === 'en' ? ' active' : ''}`} onClick={() => i18n.changeLanguage('en')}>EN</button>
      </div>
      <form onSubmit={handleSubmit} className="login-card">
        <h1 className="login-title">{t('login.title')}</h1>

        <div className="form-field">
          <label className="form-label">{t('login.username')}</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t('login.usernamePlaceholder')}
            className="form-input"
            autoComplete="username"
          />
        </div>

        <div className="form-field">
          <label className="form-label">{t('login.password')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
            className="form-input"
            autoComplete="current-password"
          />
        </div>

        {error && <div className="login-error">{error}</div>}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? '...' : t('login.button')}
        </button>
      </form>
    </div>
  )
}
