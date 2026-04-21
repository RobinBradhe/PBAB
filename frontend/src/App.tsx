import { useState } from 'react'

export default function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('Login:', { username, password })
  }

  return (
    <div style={styles.wrapper}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>Sign in</h1>

        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter username"
            style={styles.input}
            autoComplete="username"
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            style={styles.input}
            autoComplete="current-password"
          />
        </div>

        <button type="submit" style={styles.button}>Login</button>
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
