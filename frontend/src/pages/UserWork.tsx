import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authFetch } from '../api'
import { fetchUsers } from '../api/projects'
import type { User } from '../types/interface'
import './ProjectDetail.css'
import './UserWork.css'

interface WorkItem {
  id: number
  work_type: string
  hours: number
  rate: number
  include_vat: boolean
  room_id: number
  room_type: string
  project_id: number
  project_name: string
}

function fmt(n: number) {
  return n.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

export default function UserWork() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<WorkItem[]>([])

  useEffect(() => {
    async function load() {
      const [users, workRes] = await Promise.all([fetchUsers(), authFetch(`/users/${id}/work`)])
      setUser(users.find(u => u.id === Number(id)) ?? null)
      setItems(await workRes.json())
    }
    load()
  }, [id])

  const byProject = items.reduce<Record<number, { name: string; rows: WorkItem[] }>>((acc, item) => {
    if (!acc[item.project_id]) acc[item.project_id] = { name: item.project_name, rows: [] }
    acc[item.project_id].rows.push(item)
    return acc
  }, {})

  const totalHours = items.reduce((sum, i) => sum + i.hours, 0)
  const totalPris = items.reduce((sum, i) => sum + i.hours * i.rate, 0)
  const totalMoms = items.filter(i => !i.include_vat).reduce((sum, i) => sum + i.hours * i.rate * 0.25, 0)

  const userName = user
    ? (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username)
    : '...'

  return (
    <div className="page-content">
      <header className="dashboard-header">
        <div className="work-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <h1 className="page-title">{t('work.pageTitle')} — {userName}</h1>
        </div>
      </header>

      <div className="work-content">
        {items.length === 0 ? (
          <div className="empty-state">{t('work.noWork')}</div>
        ) : (
          <>
            {Object.values(byProject).map(proj => (
              <div key={proj.name} className="work-project-section">
                <h2 className="work-project-title">{proj.name}</h2>
                <table className="price-table">
                  <thead>
                    <tr>
                      <th>{t('rooms.prices.colWorkType')}</th>
                      <th>{t('rooms.prices.colTime')}</th>
                      <th>{t('rooms.prices.colTotal')}</th>
                      <th>{t('rooms.prices.colVat')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proj.rows.map(row => (
                      <tr key={row.id}>
                        <td className="price-work-type">{t(`rooms.workTypes.${row.work_type}`)}</td>
                        <td className="price-formula">{row.hours}h × {row.rate.toLocaleString('sv-SE')} kr/h</td>
                        <td className="price-total">{fmt(row.hours * row.rate)}</td>
                        <td>{row.include_vat && <span className="price-vat-badge">moms</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

            <div className="work-totals room-total">
              <span className="room-total-label">{t('work.totalHours')}:</span>
              <span className="room-total-value">{totalHours}h</span>
              <span className="room-total-label">Pris:</span>
              <span className="room-total-value">{fmt(totalPris)}</span>
              <span className="room-total-label">Moms:</span>
              <span className="room-total-value">{fmt(totalMoms)}</span>
              <span className="room-total-label">{t('work.totalSum')}:</span>
              <span className="room-total-value">{fmt(totalPris + totalMoms)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
