import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Dashboard from './Dashboard'

interface User {
  username: string
  role: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} />
        } />
        <Route path="/dashboard" element={
          user ? <Dashboard username={user.username} role={user.role} onLogout={() => setUser(null)} /> : <Navigate to="/" replace />
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Login:', { username, password })
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.langBar}>
        <button style={i18n.language === 'sv' ? styles.langActive : styles.lang} onClick={() => i18n.changeLanguage('sv')}>SV</button>
        <button style={i18n.language === 'en' ? styles.langActive : styles.lang} onClick={() => i18n.changeLanguage('en')}>EN</button>
      </div>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>{t('login.title')}</h1>

        <div style={styles.field}>
          <label style={styles.label}>{t('login.username')}</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t('login.usernamePlaceholder')}
            style={styles.input}
            autoComplete="username"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>{t('login.password')}</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
            style={styles.input}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" style={styles.button}>{t('login.button')}</button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    position: 'relative',
  },
  langBar: {
    position: 'absolute',
    top: '20px',
    right: '24px',
    display: 'flex',
    gap: '6px',
  },
  lang: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#555',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
  },
  langActive: {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '6px',
    color: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    padding: '4px 10px',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '40px 36px',
    width: '100%',
    maxWidth: '380px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  title: {
    color: '#f5f5f5',
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '4px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#a0a0a0',
    fontSize: '13px',
    fontWeight: 500,
  },
  input: {
    background: '#111',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#f5f5f5',
    fontSize: '14px',
    outline: 'none',
    padding: '10px 12px',
  },
  button: {
    background: '#4f6ef7',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    marginTop: '4px',
    padding: '11px',
  },
}
