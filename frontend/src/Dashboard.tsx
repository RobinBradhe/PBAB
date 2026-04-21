import { useTranslation } from 'react-i18next'
import './Dashboard.css'

interface Props {
  username: string
  role: string
  onLogout: () => void
}

export default function Dashboard({ username, role, onLogout }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-main">Svedia Bygg</span>
          <span className="logo-sub">AB</span>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-item active">{t('nav.overview')}</a>
          <a className="nav-item">{t('nav.bookings')}</a>
          <a className="nav-item">{t('nav.prices')}</a>
          {role === 'admin' && <a className="nav-item">{t('nav.users')}</a>}
        </nav>
        <div className="sidebar-bottom">
          <div className="lang-bar">
            <button className={`lang-btn${i18n.language === 'sv' ? ' active' : ''}`} onClick={() => i18n.changeLanguage('sv')}>SV</button>
            <button className={`lang-btn${i18n.language === 'en' ? ' active' : ''}`} onClick={() => i18n.changeLanguage('en')}>EN</button>
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
    </div>
  )
}
