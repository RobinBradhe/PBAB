import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { authFetch } from '../api'
import { THEMES, type Theme } from '../constants'
import './Interface.css'

const THEME_COLORS: Record<Theme, string> = {
  default: '#4f6ef7',
  green:   '#3db87a',
  purple:  '#9b5de5',
  amber:   '#e8a020',
  red:     '#e05555',
}

interface Props {
  currentTheme: Theme
  onThemeChange: (theme: Theme) => void
}

export default function Interface({ currentTheme, onThemeChange }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Theme>(currentTheme)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await authFetch('/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: selected }),
      })
      onThemeChange(selected)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-content">
      <header className="dashboard-header">
        <h1 className="page-title">{t('interface.pageTitle')}</h1>
      </header>

      <div className="settings-body">
        <div className="settings-section">
          <div className="settings-label">{t('interface.themeLabel')}</div>
          <div className="theme-grid">
            {THEMES.map(theme => (
              <button
                key={theme}
                className={`theme-card${selected === theme ? ' selected' : ''}`}
                onClick={() => setSelected(theme)}
                style={{ '--theme-color': THEME_COLORS[theme] } as React.CSSProperties}
              >
                <span className="theme-swatch" />
                <span className="theme-name">{t(`interface.themes.${theme}`)}</span>
                {selected === theme && <span className="theme-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving || selected === currentTheme}
        >
          {saved ? t('interface.saved') : t('interface.save')}
        </button>
      </div>
    </div>
  )
}
