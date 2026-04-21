import { useState, useEffect, useRef } from 'react'
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
import { authFetch } from '../api'
import './ProjectDetail.css'

const ROOM_TYPES = ['rum', 'toalett', 'kok', 'badrum', 'hall', 'vardagsrum', 'sovrum'] as const
const WORK_TYPES = ['painting_walls', 'painting_ceiling', 'electricity', 'vvs'] as const
type WorkType = typeof WORK_TYPES[number]

interface Room {
  id: number
  project_id: number
  room_type: string
  work_types: WorkType[]
  notes: string | null
  sort_order: number
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
}

const emptyRoomForm = { room_type: 'rum', work_types: [] as WorkType[], notes: '' }

function itemKey(item: ListItem) {
  return `${item.kind}-${item.data.id}`
}

function SortableRoomCard({
  room, isAdmin, t, onEdit, onDelete,
}: {
  room: Room
  isAdmin: boolean
  t: (k: string) => string
  onEdit: (r: Room) => void
  onDelete: (r: Room) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `room-${room.id}` })

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
      {room.notes && <p className="room-notes">{room.notes}</p>}
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
  const [value, setValue] = useState(block.content)
  const savedRef = useRef(block.content)

  function handleBlur() {
    if (value !== savedRef.current) {
      savedRef.current = value
      onSave(block.id, value)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`text-block-card${isDragging ? ' dragging' : ''}`}
    >
      {isAdmin && <button className="drag-handle" {...attributes} {...listeners} aria-label="drag">⠿</button>}
      {isAdmin ? (
        <textarea
          className="text-block-area"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={t('rooms.textBlockPlaceholder')}
          rows={3}
        />
      ) : (
        <p className="text-block-content">{block.content}</p>
      )}
      {isAdmin && (
        <button className="row-btn row-btn-danger text-block-delete" onClick={() => onDelete(block)}>✕</button>
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
          {project.address && <span>{project.address}</span>}
          {project.zip_code && <span>{project.zip_code}</span>}
          {project.city && <span>{project.city}</span>}
          {project.sqm_total != null && <span>{project.sqm_total} m²</span>}
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
                <label className="form-label">{t('rooms.roomType')}</label>
                <select
                  className="form-input"
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
                <label className="form-label">{t('rooms.notes')}</label>
                <textarea
                  className="form-input form-textarea"
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
