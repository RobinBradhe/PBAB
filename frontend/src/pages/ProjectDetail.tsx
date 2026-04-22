import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { EmptyRoomForm, type Project, type Room, type TextBlock, type ListItem, type PriceData } from '../types/interface'
import { WORK_TYPES, type WorkType, ROOM_TYPES } from '../types/constants'
import {
  fetchProjectAll, createRoom, updateRoom, deleteRoom,
  createTextBlock, updateTextBlock, deleteTextBlock,
  addPrice, updatePrice, deletePrice, reorderItems,
} from '../api/projects'
import './ProjectDetail.css'
import ProjectHeader from '../components/ProjectDetail/ProjectHeader'
import ProjectMeta from '../components/ProjectDetail/ProjectMeta'
import ProjectBody from '../components/ProjectDetail/ProjectBody'

type RoomFormState = { room_type: string; work_types: WorkType[]; notes: string }

export default function ProjectDetail({ role }: { role: string }) {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const isAdmin = role === 'admin'

  const [project, setProject] = useState<Project | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Room | null>(null)
  const [roomForm, setRoomForm] = useState<RoomFormState>(EmptyRoomForm)

  useEffect(() => { refresh() }, [id])

  async function refresh() {
    const result = await fetchProjectAll(id!)
    setProject(result.project)
    setItems(result.items)
  }

  function openAdd() { setRoomForm(EmptyRoomForm); setModal('add') }
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
    const projectId = Number(id)
    if (modal === 'add') {
      await createRoom(projectId, roomForm)
    } else {
      await updateRoom(selected!.id, projectId, roomForm)
    }
    await refresh()
    closeModal()
  }

  async function handleDeleteRoom() {
    await deleteRoom(selected!.id)
    await refresh()
    closeModal()
  }

  async function handleAddTextBlock() {
    await createTextBlock(Number(id))
    await refresh()
  }

  async function handleSaveTextBlock(blockId: number, content: string) {
    await updateTextBlock(Number(id), blockId, content)
    await refresh()
  }

  async function handleDeleteTextBlock(block: TextBlock) {
    await deleteTextBlock(Number(id), block.id)
    await refresh()
  }

  async function handleAddPrice(roomId: number, data: PriceData) {
    await addPrice(roomId, data)
    await refresh()
  }

  async function handleUpdatePrice(roomId: number, priceId: number, data: PriceData) {
    await updatePrice(roomId, priceId, data)
    await refresh()
  }

  async function handleDeletePrice(roomId: number, priceId: number) {
    await deletePrice(roomId, priceId)
    await refresh()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(item => `${item.kind}-${item.data.id}` === active.id)
    const newIndex = items.findIndex(item => `${item.kind}-${item.data.id}` === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    await reorderItems(Number(id), reordered.map(item => ({ type: item.kind === 'room' ? 'room' : 'text', id: item.data.id })))
  }

  return (
    <div className="page-content">
      <ProjectHeader
        project={project}
        isAdmin={isAdmin}
        onAddRoom={openAdd}
        onAddTextBlock={handleAddTextBlock}
      />

      <ProjectMeta project={project} />

      <div className="rooms-body">
        <ProjectBody
          items={items}
          isAdmin={isAdmin}
          onDragEnd={handleDragEnd}
          onEditRoom={openEdit}
          onDeleteRoom={openDeleteRoom}
          onAddPrice={handleAddPrice}
          onUpdatePrice={handleUpdatePrice}
          onDeletePrice={handleDeletePrice}
          onDeleteTextBlock={handleDeleteTextBlock}
          onSaveTextBlock={handleSaveTextBlock}
        />
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
