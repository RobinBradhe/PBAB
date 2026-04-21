import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { authFetch } from '../api'
import './Users.css'

interface User {
  id: number
  username: string
  role: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
}

const emptyForm = { username: '', password: '', role: 'staff', first_name: '', last_name: '', email: '', phone: '' }

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#%'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function Users({ role }: { role: string }) {
  const { t } = useTranslation()
  const isAdmin = role === 'admin'
  const [users, setUsers] = useState<User[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    const res = await authFetch('/users')
    setUsers(await res.json())
  }

  function openAdd() {
    setForm(emptyForm)
    setShowPassword(false)
    setModal('add')
  }

  function openEdit(user: User) {
    setSelected(user)
    setForm({ username: user.username, password: '', role: user.role, first_name: user.first_name ?? '', last_name: user.last_name ?? '', email: user.email ?? '', phone: user.phone ?? '' })
    setShowPassword(false)
    setModal('edit')
  }

  function openDelete(user: User) {
    setSelected(user)
    setModal('delete')
  }

  function closeModal() { setModal(null); setSelected(null) }

  function handleGenerate() {
    const pwd = generatePassword()
    setForm(f => ({ ...f, password: pwd }))
    setShowPassword(true)
  }

  async function handleSave() {
    const method = modal === 'add' ? 'POST' : 'PUT'
    const path = modal === 'add' ? '/users' : `/users/${selected!.id}`
    await authFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    await fetchUsers()
    closeModal()
  }

  async function handleDelete() {
    await authFetch(`/users/${selected!.id}`, { method: 'DELETE' })
    await fetchUsers()
    closeModal()
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="page-content">
      <header className="dashboard-header">
        <h1 className="page-title">{t('users.pageTitle')}</h1>
        {isAdmin && <button className="add-btn" onClick={openAdd}>{t('users.addUser')}</button>}
      </header>

      <div className="users-body">
        {users.length === 0 ? (
          <div className="empty-state">{t('users.noUsers')}</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('users.firstName')} / {t('users.lastName')}</th>
                <th>{t('users.username')}</th>
                <th>{t('users.email')}</th>
                <th>{t('users.phone')}</th>
                <th>{t('users.role')}</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}</td>
                  <td className="td-muted">{u.username}</td>
                  <td className="td-muted">{u.email || '—'}</td>
                  <td className="td-muted">{u.phone || '—'}</td>
                  <td><span className={`role-badge role-${u.role}`}>{t(`users.role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}`)}</span></td>
                  {isAdmin && (
                    <td className="td-actions">
                      <button className="row-btn" onClick={() => openEdit(u)}>✎</button>
                      <button className="row-btn row-btn-danger" onClick={() => openDelete(u)}>✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'add' ? t('users.addUser') : t('users.editUser')}</h2>
              <button className="modal-close-btn" aria-label={t('users.close')} onClick={closeModal}>✕</button>
            </div>
            <div className="modal-grid">
              <div className="form-field">
                <label className="form-label">{t('users.firstName')}</label>
                <input className="form-input" value={form.first_name} onChange={f('first_name')} />
              </div>
              <div className="form-field">
                <label className="form-label">{t('users.lastName')}</label>
                <input className="form-input" value={form.last_name} onChange={f('last_name')} />
              </div>
              <div className="form-field">
                <label className="form-label">{t('users.email')}</label>
                <input className="form-input" type="email" value={form.email} onChange={f('email')} />
              </div>
              <div className="form-field">
                <label className="form-label">{t('users.phone')}</label>
                <input className="form-input" type="tel" value={form.phone} onChange={f('phone')} />
              </div>
              <div className="form-field">
                <label className="form-label">{t('users.username')}</label>
                <input className="form-input" value={form.username} onChange={f('username')} />
              </div>
              <div className="form-field">
                <label className="form-label">{t('users.role')}</label>
                <select className="form-input" value={form.role} onChange={f('role')}>
                  <option value="staff">{t('users.roleStaff')}</option>
                  <option value="admin">{t('users.roleAdmin')}</option>
                </select>
              </div>
              <div className="form-field form-field-full">
                <label className="form-label">{t('users.password')}{modal === 'edit' && <span className="label-hint"> — {t('users.leaveBlankPassword')}</span>}</label>
                <div className="password-row">
                  <input className="form-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={f('password')} />
                  <button type="button" className="gen-btn" onClick={handleGenerate}>{t('users.generatePassword')}</button>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>{t('users.cancel')}</button>
              <button className="save-btn" onClick={handleSave}>{t('users.save')}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{t('users.deleteUser')}</h2>
              <button className="modal-close-btn" aria-label={t('users.close')} onClick={closeModal}>✕</button>
            </div>
            <p className="modal-text">{t('users.deleteConfirm')}</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>{t('users.cancel')}</button>
              <button className="delete-btn" onClick={handleDelete}>{t('users.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
