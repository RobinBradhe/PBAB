import { useTranslation } from 'react-i18next'

interface Props {
  username: string
  role: string
  onLogout: () => void
}

export default function Dashboard({ username, role, onLogout }: Props) {
  const { t, i18n } = useTranslation()

  return (
    <div style={s.layout}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.logoMain}>Svedia Bygg</span>
          <span style={s.logoSub}>AB</span>
        </div>
        <nav style={s.nav}>
          <a style={{ ...s.navItem, ...s.navActive }}>{t('nav.overview')}</a>
          <a style={s.navItem}>{t('nav.bookings')}</a>
          <a style={s.navItem}>{t('nav.prices')}</a>
          {role === 'admin' && <a style={s.navItem}>{t('nav.users')}</a>}
        </nav>
        <div style={s.sidebarBottom}>
          <div style={s.langBar}>
            <button style={i18n.language === 'sv' ? s.langActive : s.lang} onClick={() => i18n.changeLanguage('sv')}>SV</button>
            <button style={i18n.language === 'en' ? s.langActive : s.lang} onClick={() => i18n.changeLanguage('en')}>EN</button>
          </div>
          <div style={s.userInfo}>
            <span style={s.userDot} />
            <div>
              <div style={s.userName}>{username}</div>
              <div style={s.userRole}>{role}</div>
            </div>
          </div>
          <button onClick={onLogout} style={s.logoutBtn}>{t('user.logout')}</button>
        </div>
      </aside>

      <main style={s.main}>
        <header style={s.header}>
          <h1 style={s.pageTitle}>{t('dashboard.pageTitle')}</h1>
        </header>

        <div style={s.cards}>
          <div style={s.card}>
            <div style={s.cardLabel}>{t('dashboard.todayBookings')}</div>
            <div style={s.cardValue}>—</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>{t('dashboard.upcomingBookings')}</div>
            <div style={s.cardValue}>—</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>{t('dashboard.availableSpaces')}</div>
            <div style={s.cardValue}>—</div>
          </div>
          <div style={s.card}>
            <div style={s.cardLabel}>{t('dashboard.monthlyRevenue')}</div>
            <div style={s.cardValue}>—</div>
          </div>
        </div>

        <div style={s.section}>
          <h2 style={s.sectionTitle}>{t('dashboard.recentBookings')}</h2>
          <div style={s.empty}>{t('dashboard.noBookings')}</div>
        </div>
      </main>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    height: '100vh',
    background: '#0f0f0f',
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: '220px',
    background: '#1a1a1a',
    borderRight: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    flexShrink: 0,
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0 24px 28px',
    borderBottom: '1px solid #2a2a2a',
    marginBottom: '16px',
  },
  logoMain: {
    color: '#f5f5f5',
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    lineHeight: 1.2,
  },
  logoSub: {
    color: '#555',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '3px',
    marginTop: '2px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 12px',
    flex: 1,
  },
  navItem: {
    color: '#888',
    fontSize: '14px',
    padding: '9px 12px',
    borderRadius: '7px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  navActive: {
    color: '#f5f5f5',
    background: '#2a2a2a',
  },
  sidebarBottom: {
    padding: '16px 12px 0',
    borderTop: '1px solid #2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  langBar: {
    display: 'flex',
    gap: '6px',
  },
  lang: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#555',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 8px',
  },
  langActive: {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: '6px',
    color: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
    padding: '3px 8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 0',
  },
  userDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4f6ef7',
    flexShrink: 0,
  },
  userName: {
    color: '#f5f5f5',
    fontSize: '13px',
    fontWeight: 500,
  },
  userRole: {
    color: '#555',
    fontSize: '11px',
    textTransform: 'capitalize',
  },
  logoutBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: '7px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '8px 12px',
    textAlign: 'left',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  header: {
    padding: '28px 32px 20px',
    borderBottom: '1px solid #1e1e1e',
  },
  pageTitle: {
    color: '#f5f5f5',
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    padding: '28px 32px',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '10px',
    padding: '20px',
  },
  cardLabel: {
    color: '#666',
    fontSize: '12px',
    marginBottom: '10px',
  },
  cardValue: {
    color: '#f5f5f5',
    fontSize: '26px',
    fontWeight: 600,
  },
  section: {
    padding: '0 32px 32px',
  },
  sectionTitle: {
    color: '#f5f5f5',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '14px',
  },
  empty: {
    color: '#444',
    fontSize: '14px',
    padding: '24px',
    background: '#1a1a1a',
    borderRadius: '10px',
    border: '1px solid #2a2a2a',
    textAlign: 'center',
  },
}
