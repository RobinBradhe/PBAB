import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { authFetch, UPLOADS_URL } from '../api'
import './Projects.css'

interface Project {
  id: number
  name: string
  address: string | null
  zip_code: string | null
  city: string | null
  sqm_total: number | null
  image: string | null
}

const emptyForm = { name: '', address: '', zip_code: '', city: '', sqm_total: '' }

export default function Projects({ role }: { role: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const isAdmin = role === 'admin'
  const [projects, setProjects] = useState<Project[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Project | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFile, setImageFile] = useState<File | null>(null)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    const res = await authFetch('/projects')
    setProjects(await res.json())
  }

  function openAdd() {
    setForm(emptyForm)
    setImageFile(null)
    setModal('add')
  }

  function openEdit(project: Project) {
    setSelected(project)
    setForm({
      name: project.name,
      address: project.address ?? '',
      zip_code: project.zip_code ?? '',
      city: project.city ?? '',
      sqm_total: project.sqm_total != null ? String(project.sqm_total) : '',
    })
    setImageFile(null)
    setModal('edit')
  }

  function openDelete(project: Project) {
    setSelected(project)
    setModal('delete')
  }

  function closeModal() { setModal(null); setSelected(null) }

  async function handleSave() {
    const method = modal === 'add' ? 'POST' : 'PUT'
    const urlPath = modal === 'add' ? '/projects' : `/projects/${selected!.id}`
    const res = await authFetch(urlPath, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        sqm_total: form.sqm_total !== '' ? Number(form.sqm_total) : null,
      }),
    })
    if (imageFile) {
      const project = await res.json()
      const projectId = modal === 'add' ? project.id : selected!.id
      const fd = new FormData()
      fd.append('image', imageFile)
      await authFetch(`/projects/${projectId}/image`, { method: 'POST', body: fd })
    }
    await fetchProjects()
    closeModal()
  }

  async function handleDelete() {
    await authFetch(`/projects/${selected!.id}`, { method: 'DELETE' })
    await fetchProjects()
    closeModal()
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="page-content">
      <header className="dashboard-header">
        <h1 className="page-title">{t('projects.pageTitle')}</h1>
        {isAdmin && <button className="add-btn" onClick={openAdd}>{t('projects.addProject')}</button>}
      </header>

      <div className="projects-body">
        {projects.length === 0 ? (
          <div className="empty-state">{t('projects.noProjects')}</div>
        ) : (
          <table className="projects-table">
            <thead>
              <tr>
                <th></th>
                <th>{t('projects.name')}</th>
                <th>{t('projects.address')}</th>
                <th>{t('projects.zipCode')}</th>
                <th>{t('projects.city')}</th>
                <th>{t('projects.sqmTotal')}</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td className="td-thumb">
                    {p.image
                      ? <img src={`${UPLOADS_URL}/${p.image}`} alt="" className="project-thumb" />
                      : <div className="project-thumb-placeholder" />}
                  </td>
                  <td><button className="project-link" onClick={() => navigate(`/dashboard/projects/${p.id}`)}>{p.name}</button></td>
                  <td className="td-muted">{p.address || '—'}</td>
                  <td className="td-muted">{p.zip_code || '—'}</td>
                  <td className="td-muted">{p.city || '—'}</td>
                  <td className="td-muted">{p.sqm_total != null ? `${p.sqm_total} m²` : '—'}</td>
                  {isAdmin && (
                    <td className="td-actions">
                      <button className="row-btn" onClick={() => openEdit(p)}>✎</button>
                      <button className="row-btn row-btn-danger" onClick={() => openDelete(p)}>✕</button>
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
              <h2 className="modal-title">{modal === 'add' ? t('projects.addProject') : t('projects.editProject')}</h2>
              <button className="modal-close-btn" aria-label={t('projects.close')} onClick={closeModal}>✕</button>
            </div>
            <div className="modal-grid">
              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="proj-name">{t('projects.name')}</label>
                <input id="proj-name" name="name" className="form-input" value={form.name} onChange={f('name')} />
              </div>
              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="proj-address">{t('projects.address')}</label>
                <input id="proj-address" name="address" className="form-input" value={form.address} onChange={f('address')} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="proj-zip">{t('projects.zipCode')}</label>
                <input id="proj-zip" name="zip_code" className="form-input" value={form.zip_code} onChange={f('zip_code')} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="proj-city">{t('projects.city')}</label>
                <input id="proj-city" name="city" className="form-input" value={form.city} onChange={f('city')} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="proj-sqm">{t('projects.sqmTotal')}</label>
                <input id="proj-sqm" name="sqm_total" className="form-input" type="number" min="0" value={form.sqm_total} onChange={f('sqm_total')} />
              </div>
              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="proj-image">{t('projects.image')}</label>
                {modal === 'edit' && selected?.image && !imageFile && (
                  <img src={`${UPLOADS_URL}/${selected.image}`} alt="" className="modal-image-preview" />
                )}
                <input className="form-input" id="proj-image" name="image" type="file" accept="image/*"
                  onChange={e => setImageFile(e.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>{t('projects.cancel')}</button>
              <button className="save-btn" onClick={handleSave}>{t('projects.save')}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{t('projects.deleteProject')}</h2>
              <button className="modal-close-btn" aria-label={t('projects.close')} onClick={closeModal}>✕</button>
            </div>
            <p className="modal-text">{t('projects.deleteConfirm')}</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>{t('projects.cancel')}</button>
              <button className="delete-btn" onClick={handleDelete}>{t('projects.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
