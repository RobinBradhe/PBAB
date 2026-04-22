import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { authFetch, UPLOADS_URL } from '../api'
import { WORK_TYPES, type WorkType } from '../constants'
import './ProjectDetail.css'
import React from 'react'

const ROOM_TYPES = ['rum', 'toalett', 'kok', 'badrum', 'hall', 'vardagsrum', 'sovrum'] as const

function renderText(text: string) {
  const lines = text.split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    if (lines[i].trim() === '') { i++; continue }

    if (/^- /.test(lines[i])) {
      const items: string[] = []
      while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++ }
      out.push(<ul key={key++}>{items.map((t, j) => <li key={j}>{t}</li>)}</ul>)
      continue
    }

    if (/^\d+\.\s/.test(lines[i])) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++ }
      out.push(<ol key={key++}>{items.map((t, j) => <li key={j}>{t}</li>)}</ol>)
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^- /.test(lines[i]) && !/^\d+\.\s/.test(lines[i])) {
      para.push(lines[i]); i++
    }
    out.push(
      <p key={key++}>
        {para.map((l, j) => <React.Fragment key={j}>{j > 0 && <br />}{l}</React.Fragment>)}
      </p>
    )
  }

  return out
}


interface Price {
  id: number
  room_id: number
  work_type: string
  hours: number
  rate: number
  include_vat: boolean
}

type PriceData = { work_type: string; hours: number; rate: number; include_vat: boolean }

interface Room {
  id: number
  project_id: number
  room_type: string
  work_types: WorkType[]
  notes: string | null
  sort_order: number
  prices: Price[]
}

interface TextBlock {
  id: number
  project_id: number
  content: string
  sort_order: number
}

type ListItem = { kind: 'room'; data: Room } | { kind: 'text'; data: TextBlock }

interface Project {
  id: number
  name: string
  address: string | null
  zip_code: string | null
  city: string | null
  sqm_total: number | null
  image: string | null
}

const emptyRoomForm = { room_type: 'rum', work_types: [] as WorkType[], notes: '' }

function itemKey(item: ListItem) {
  return `${item.kind}-${item.data.id}`
}

const emptyPriceForm = { work_type: WORK_TYPES[0] as string, hours: '', rate: '', include_vat: false }

function fmt(n: number) {
  return n.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

function SortableRoomCard({
  room, isAdmin, t, onEdit, onDelete, onAddPrice, onUpdatePrice, onDeletePrice,
}: {
  room: Room
  isAdmin: boolean
  t: (k: string) => string
  onEdit: (r: Room) => void
  onDelete: (r: Room) => void
  onAddPrice: (roomId: number, data: PriceData) => Promise<void>
  onUpdatePrice: (roomId: number, priceId: number, data: PriceData) => Promise<void>
  onDeletePrice: (roomId: number, priceId: number) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `room-${room.id}` })

  const [editPriceId, setEditPriceId] = useState<number | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [priceForm, setPriceForm] = useState(emptyPriceForm)

  function startEdit(p: Price) {
    setEditPriceId(p.id)
    setShowAdd(false)
    setPriceForm({ work_type: p.work_type, hours: String(p.hours), rate: String(p.rate), include_vat: p.include_vat })
  }

  function startAdd() {
    setShowAdd(true)
    setEditPriceId(null)
    setPriceForm({ ...emptyPriceForm, work_type: room.work_types[0] ?? WORK_TYPES[0] })
  }

  async function saveAdd() {
    if (!priceForm.hours || !priceForm.rate) return
    await onAddPrice(room.id, { work_type: priceForm.work_type, hours: Number(priceForm.hours), rate: Number(priceForm.rate), include_vat: priceForm.include_vat })
    setShowAdd(false)
  }

  async function saveEdit() {
    if (editPriceId == null || !priceForm.hours || !priceForm.rate) return
    await onUpdatePrice(room.id, editPriceId, { work_type: priceForm.work_type, hours: Number(priceForm.hours), rate: Number(priceForm.rate), include_vat: priceForm.include_vat })
    setEditPriceId(null)
  }

  const pris = room.prices.reduce((sum, p) => sum + p.hours * p.rate, 0)
  const moms = room.prices.filter(p => !p.include_vat).reduce((sum, p) => sum + p.hours * p.rate * 0.25, 0)
  const totaltPris = pris + moms
  const showPrices = isAdmin || room.prices.length > 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`room-card${isDragging ? ' dragging' : ''}`}
    >
      <div className="room-card-header">
        {isAdmin && <button className="drag-handle" {...attributes} {...listeners} aria-label="drag">⠿</button>}
        <span className="room-type-badge">{t(`rooms.types.${room.room_type}`)}</span>
        <div className="room-work-types">
          {room.work_types.map(wt => (
            <span key={wt} className="work-type-tag">{t(`rooms.workTypes.${wt}`)}</span>
          ))}
        </div>
        {isAdmin && (
          <div className="room-actions">
            <button className="row-btn" onClick={() => onEdit(room)}>✎</button>
            <button className="row-btn row-btn-danger" onClick={() => onDelete(room)}>✕</button>
          </div>
        )}
      </div>
      {room.notes && <div className="room-notes">{renderText(room.notes)}</div>}

      {showPrices && (
        <div className="room-prices">
          {room.prices.length > 0 && (
            <table className="price-table">
              <tbody>
                {room.prices.map(p =>
                  editPriceId === p.id ? (
                    <tr key={p.id}>
                      <td colSpan={5}>
                        <div className="price-form-row">
                          <select name="work_type" className="price-form-input price-form-select" value={priceForm.work_type}
                            onChange={e => setPriceForm(prev => ({ ...prev, work_type: e.target.value }))}>
                            {WORK_TYPES.map(wt => <option key={wt} value={wt}>{t(`rooms.workTypes.${wt}`)}</option>)}
                          </select>
                          <input aria-label="Timmar" name="hours" className="price-form-input price-form-number" type="number" min="0" step="0.5" placeholder="Tim"
                            value={priceForm.hours} onChange={e => setPriceForm(prev => ({ ...prev, hours: e.target.value }))} />
                          <span className="price-form-unit">h ×</span>
                          <input aria-label="Pris per timme" name="rate" className="price-form-input price-form-number" type="number" min="0" placeholder="kr/h"
                            value={priceForm.rate} onChange={e => setPriceForm(prev => ({ ...prev, rate: e.target.value }))} />
                          <span className="price-form-unit">kr/h</span>
                          <label className="price-form-vat">
                            <input type="checkbox" checked={priceForm.include_vat}
                              onChange={e => setPriceForm(prev => ({ ...prev, include_vat: e.target.checked }))} />
                            Moms
                          </label>
                          <div className="price-form-actions">
                            <button className="save-btn price-form-btn" onClick={saveEdit}>✓</button>
                            <button className="cancel-btn price-form-btn" onClick={() => setEditPriceId(null)}>✕</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={p.id}>
                      <td className="price-work-type">{t(`rooms.workTypes.${p.work_type}`)}</td>
                      <td className="price-formula">{p.hours}h × {p.rate.toLocaleString('sv-SE')} kr/h</td>
                      <td className="price-total">{fmt(p.hours * p.rate)}</td>
                      <td>{p.include_vat && <span className="price-vat-badge">moms</span>}</td>
                      {isAdmin && (
                        <td className="price-actions">
                          <button className="row-btn" onClick={() => startEdit(p)}>✎</button>
                          <button className="row-btn row-btn-danger" onClick={() => onDeletePrice(room.id, p.id)}>✕</button>
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

          {room.prices.length > 0 && (
            <div className="room-total">
              <span className="room-total-label">Pris:</span>
              <span className="room-total-value">{fmt(pris)}</span>
              <span className="room-total-label">Moms:</span>
              <span className="room-total-value">{fmt(moms)}</span>
              <span className="room-total-label">Totalt pris:</span>
              <span className="room-total-value">{fmt(totaltPris)}</span>
            </div>
          )}

          {isAdmin && !showAdd && (
            <button className="price-add-btn" onClick={startAdd}>+ {t('rooms.prices.addPrice')}</button>
          )}
          {isAdmin && showAdd && (
            <div className="price-form-row">
              <select name="work_type" className="price-form-input price-form-select" value={priceForm.work_type}
                onChange={e => setPriceForm(prev => ({ ...prev, work_type: e.target.value }))}>
                {WORK_TYPES.map(wt => <option key={wt} value={wt}>{t(`rooms.workTypes.${wt}`)}</option>)}
              </select>
              <input aria-label="Timmar" name="hours" className="price-form-input price-form-number" type="number" min="0" step="0.5" placeholder="Tim"
                value={priceForm.hours} onChange={e => setPriceForm(prev => ({ ...prev, hours: e.target.value }))} />
              <span className="price-form-unit">h ×</span>
              <input aria-label="Pris per timme" name="rate" className="price-form-input price-form-number" type="number" min="0" placeholder="kr/h"
                value={priceForm.rate} onChange={e => setPriceForm(prev => ({ ...prev, rate: e.target.value }))} />
              <span className="price-form-unit">kr/h</span>
              <label className="price-form-vat">
                <input type="checkbox" checked={priceForm.include_vat}
                  onChange={e => setPriceForm(prev => ({ ...prev, include_vat: e.target.checked }))} />
                Moms
              </label>
              <div className="price-form-actions">
                <button className="save-btn price-form-btn" onClick={saveAdd}>✓</button>
                <button className="cancel-btn price-form-btn" onClick={() => setShowAdd(false)}>✕</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SortableTextBlock({
  block, isAdmin, t, onDelete, onSave,
}: {
  block: TextBlock
  isAdmin: boolean
  t: (k: string) => string
  onDelete: (b: TextBlock) => void
  onSave: (id: number, content: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `text-${block.id}` })
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(block.content)

  function handleSave() {
    onSave(block.id, value)
    setEditing(false)
  }

  function handleCancel() {
    setValue(block.content)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSave() }
    if (e.key === 'Escape') { e.preventDefault(); handleCancel() }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`text-block-card${isDragging ? ' dragging' : ''}`}
    >
      {isAdmin && <button className="drag-handle" {...attributes} {...listeners} aria-label="drag">⠿</button>}
      {isAdmin && editing ? (
        <>
          <textarea
            name="text_block" className="text-block-area"
            aria-label={t('rooms.textBlockPlaceholder')}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('rooms.textBlockPlaceholder')}
            rows={3}
            autoFocus
          />
          <div className="text-block-actions">
            <button className="row-btn text-block-save" onClick={handleSave}>✓</button>
            <button className="row-btn" onClick={handleCancel}>✕</button>
          </div>
        </>
      ) : (
        <>
          <div className="text-block-content" onClick={isAdmin ? () => setEditing(true) : undefined}>
            {block.content ? renderText(block.content) : isAdmin && <span className="text-block-placeholder">{t('rooms.textBlockPlaceholder')}</span>}
          </div>
          {isAdmin && (
            <div className="text-block-actions">
              <button className="row-btn" onClick={() => setEditing(true)}>✎</button>
              <button className="row-btn row-btn-danger" onClick={() => onDelete(block)}>✕</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ProjectDetail({ role }: { role: string }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isAdmin = role === 'admin'

  const [project, setProject] = useState<Project | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Room | null>(null)
  const [roomForm, setRoomForm] = useState(emptyRoomForm)

  const sensors = useSensors(useSensor(PointerSensor))

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    const [projRes, roomsRes, textRes] = await Promise.all([
      authFetch(`/projects`),
      authFetch(`/rooms?project_id=${id}`),
      authFetch(`/projects/${id}/text-blocks`),
    ])
    const projects: Project[] = await projRes.json()
    const rooms: Room[] = await roomsRes.json()
    const texts: TextBlock[] = await textRes.json()
    setProject(projects.find(p => p.id === Number(id)) ?? null)

    const merged: ListItem[] = [
      ...rooms.map(r => ({ kind: 'room' as const, data: r })),
      ...texts.map(b => ({ kind: 'text' as const, data: b })),
    ].sort((a, b) => a.data.sort_order - b.data.sort_order)
    setItems(merged)
  }

  function openAdd() { setRoomForm(emptyRoomForm); setModal('add') }
  function openEdit(room: Room) {
    setSelected(room)
    setRoomForm({ room_type: room.room_type, work_types: room.work_types, notes: room.notes ?? '' })
    setModal('edit')
  }
  function openDeleteRoom(room: Room) { setSelected(room); setModal('delete') }
  function closeModal() { setModal(null); setSelected(null) }

  function toggleWorkType(wt: WorkType) {
    setRoomForm(prev => ({
      ...prev,
      work_types: prev.work_types.includes(wt)
        ? prev.work_types.filter(w => w !== wt)
        : [...prev.work_types, wt],
    }))
  }

  async function handleSaveRoom() {
    const method = modal === 'add' ? 'POST' : 'PUT'
    const path = modal === 'add' ? '/rooms' : `/rooms/${selected!.id}`
    await authFetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...roomForm, project_id: Number(id) }),
    })
    await fetchAll()
    closeModal()
  }

  async function handleDeleteRoom() {
    await authFetch(`/rooms/${selected!.id}`, { method: 'DELETE' })
    await fetchAll()
    closeModal()
  }

  async function handleAddTextBlock() {
    await authFetch(`/projects/${id}/text-blocks`, { method: 'POST' })
    await fetchAll()
  }

  async function handleSaveTextBlock(blockId: number, content: string) {
    await authFetch(`/projects/${id}/text-blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
  }

  async function handleDeleteTextBlock(block: TextBlock) {
    await authFetch(`/projects/${id}/text-blocks/${block.id}`, { method: 'DELETE' })
    await fetchAll()
  }


  async function handleAddPrice(roomId: number, data: PriceData) {
    await authFetch(`/rooms/${roomId}/prices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchAll()
  }

  async function handleUpdatePrice(roomId: number, priceId: number, data: PriceData) {
    await authFetch(`/rooms/${roomId}/prices/${priceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await fetchAll()
  }

  async function handleDeletePrice(roomId: number, priceId: number) {
    await authFetch(`/rooms/${roomId}/prices/${priceId}`, { method: 'DELETE' })
    await fetchAll()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(item => itemKey(item) === active.id)
    const newIndex = items.findIndex(item => itemKey(item) === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    await authFetch(`/projects/${id}/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: reordered.map(item => ({ type: item.kind === 'room' ? 'room' : 'text', id: item.data.id })),
      }),
    })
  }

  return (
    <div className="page-content">
      <header className="dashboard-header">
        <div className="detail-breadcrumb">
          <button className="back-btn" onClick={() => navigate('/dashboard/projects')}>← {t('projects.pageTitle')}</button>
          <span className="breadcrumb-sep">/</span>
          <h1 className="page-title">{project?.name ?? '...'}</h1>
        </div>
        {isAdmin && (
          <div className="detail-actions">
            <button className="add-btn add-btn-secondary" onClick={handleAddTextBlock}>{t('rooms.addTextBlock')}</button>
            <button className="add-btn" onClick={openAdd}>{t('rooms.addRoom')}</button>
          </div>
        )}
      </header>

      {project && (
        <div className="project-meta">
          {project.image && (
            <img src={`${UPLOADS_URL}/${project.image}`} alt="" className="project-detail-image" />
          )}
          <div className="project-meta-fields">
            {project.address && <span>{project.address}</span>}
            {project.zip_code && <span>{project.zip_code}</span>}
            {project.city && <span>{project.city}</span>}
            {project.sqm_total != null && <span>{project.sqm_total} m²</span>}
          </div>
        </div>
      )}

      <div className="rooms-body">
        {items.length === 0 ? (
          <div className="empty-state">{t('rooms.noRooms')}</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(itemKey)} strategy={verticalListSortingStrategy}>
              {items.map(item =>
                item.kind === 'room' ? (
                  <SortableRoomCard
                    key={itemKey(item)}
                    room={item.data}
                    isAdmin={isAdmin}
                    t={t}
                    onEdit={openEdit}
                    onDelete={openDeleteRoom}
                    onAddPrice={handleAddPrice}
                    onUpdatePrice={handleUpdatePrice}
                    onDeletePrice={handleDeletePrice}
                  />
                ) : (
                  <SortableTextBlock
                    key={itemKey(item)}
                    block={item.data}
                    isAdmin={isAdmin}
                    t={t}
                    onDelete={handleDeleteTextBlock}
                    onSave={handleSaveTextBlock}
                  />
                )
              )}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{modal === 'add' ? t('rooms.addRoom') : t('rooms.editRoom')}</h2>
              <button className="modal-close-btn" aria-label={t('rooms.close')} onClick={closeModal}>✕</button>
            </div>
            <div className="modal-grid">
              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="room-type">{t('rooms.roomType')}</label>
                <select
                  id="room-type" name="room_type" className="form-input"
                  value={roomForm.room_type}
                  onChange={e => setRoomForm(prev => ({ ...prev, room_type: e.target.value }))}
                >
                  {ROOM_TYPES.map(rt => (
                    <option key={rt} value={rt}>{t(`rooms.types.${rt}`)}</option>
                  ))}
                </select>
              </div>
              <div className="form-field form-field-full">
                <label className="form-label">{t('rooms.workTypesLabel')}</label>
                <div className="checkbox-group">
                  {WORK_TYPES.map(wt => (
                    <label key={wt} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={roomForm.work_types.includes(wt)}
                        onChange={() => toggleWorkType(wt)}
                      />
                      {t(`rooms.workTypes.${wt}`)}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="room-notes">{t('rooms.notes')}</label>
                <textarea
                  id="room-notes" name="notes" className="form-input form-textarea"
                  value={roomForm.notes}
                  onChange={e => setRoomForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>{t('rooms.cancel')}</button>
              <button className="save-btn" onClick={handleSaveRoom}>{t('rooms.save')}</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'delete' && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2 className="modal-title">{t('rooms.deleteRoom')}</h2>
              <button className="modal-close-btn" aria-label={t('rooms.close')} onClick={closeModal}>✕</button>
            </div>
            <p className="modal-text">{t('rooms.deleteConfirm')}</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeModal}>{t('rooms.cancel')}</button>
              <button className="delete-btn" onClick={handleDeleteRoom}>{t('rooms.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
