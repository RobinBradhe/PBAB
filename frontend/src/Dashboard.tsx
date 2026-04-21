import { Routes, Route, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Interface from './pages/Interface'
import Users from './pages/Users'
import { LANGUAGES, type Theme } from './constants'
import './Dashboard.css'

interface Props {
  username: string
  role: string
  onLogout: () => void
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export default function Dashboard({ username, role, onLogout, currentTheme, onThemeChange }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-main">Svedia Bygg</span>
          <span className="logo-sub">AB</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{t('nav.overview')}</NavLink>
          <NavLink to="/dashboard/bokningar" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{t('nav.bookings')}</NavLink>
          <NavLink to="/dashboard/priser" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{t('nav.prices')}</NavLink>
          <NavLink to="/dashboard/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{t('nav.users')}</NavLink>
          {role === 'admin' && <NavLink to="/dashboard/interface" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>{t('nav.interface')}</NavLink>}
        </nav>
        <div className="sidebar-bottom">
          <div className="lang-bar">
            {LANGUAGES.map(lang => (
              <button key={lang} className={`lang-btn${i18n.language === lang ? ' active' : ''}`} onClick={() => i18n.changeLanguage(lang)}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="user-info">
            <span className="user-dot" />
            <div>
              <div className="user-name">{username}</div>
              <div className="user-role">{role}</div>
            </div>
          </div>
          <button onClick={onLogout} className="logout-btn">{t('user.logout')}</button>
        </div>
      </aside>

      <Routes>
        <Route path="/" element={<Overview t={t} />} />
        <Route path="/users" element={<Users role={role} />} />
        <Route path="/interface" element={<Interface currentTheme={currentTheme} onThemeChange={onThemeChange} />} />
      </Routes>
    </div>
  )
}

function Overview({ t }: { t: (key: string) => string }) {
  return (
    <main className="dashboard-main">
      <header className="dashboard-header">
        <h1 className="page-title">{t('dashboard.pageTitle')}</h1>
      </header>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.todayBookings')}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.upcomingBookings')}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.availableSpaces')}</div>
          <div className="stat-value">—</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t('dashboard.monthlyRevenue')}</div>
          <div className="stat-value">—</div>
        </div>
      </div>
      <div className="dashboard-section">
        <h2 className="section-title">{t('dashboard.recentBookings')}</h2>
        <div className="empty-state">{t('dashboard.noBookings')}</div>
      </div>
    </main>
  )
}
