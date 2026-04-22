import { useState, useEffect } from 'react'
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
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import { WORK_TYPES } from '../../types/constants'
import type { Price, Room, TextBlock, PriceData, ListItem } from '../../types/interface'

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

function fmt(n: number) {
  return n.toLocaleString('sv-SE', { maximumFractionDigits: 0 }) + ' kr'
}

function itemKey(item: ListItem) {
  return `${item.kind}-${item.data.id}`
}

const emptyPriceForm = { work_type: WORK_TYPES[0] as string, hours: '', rate: '', include_vat: false }

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
  onSave: (id: number, content: string) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `text-${block.id}` })
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(block.content)

  useEffect(() => {
    if (!editing) setValue(block.content)
  }, [block.content, editing])

  async function handleSave() {
    await onSave(block.id, value)
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

interface Props {
  items: ListItem[]
  isAdmin: boolean
  onDragEnd: (event: DragEndEvent) => void
  onEditRoom: (r: Room) => void
  onDeleteRoom: (r: Room) => void
  onAddPrice: (roomId: number, data: PriceData) => Promise<void>
  onUpdatePrice: (roomId: number, priceId: number, data: PriceData) => Promise<void>
  onDeletePrice: (roomId: number, priceId: number) => Promise<void>
  onDeleteTextBlock: (b: TextBlock) => void
  onSaveTextBlock: (id: number, content: string) => Promise<void>
}

export default function ProjectBody({
  items, isAdmin, onDragEnd, onEditRoom, onDeleteRoom,
  onAddPrice, onUpdatePrice, onDeletePrice, onDeleteTextBlock, onSaveTextBlock,
}: Props) {
  const { t } = useTranslation()
  const sensors = useSensors(useSensor(PointerSensor))

  if (items.length === 0) {
    return <div className="empty-state">{t('rooms.noRooms')}</div>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map(itemKey)} strategy={verticalListSortingStrategy}>
        {items.map(item =>
          item.kind === 'room' ? (
            <SortableRoomCard
              key={itemKey(item)}
              room={item.data}
              isAdmin={isAdmin}
              t={t}
              onEdit={onEditRoom}
              onDelete={onDeleteRoom}
              onAddPrice={onAddPrice}
              onUpdatePrice={onUpdatePrice}
              onDeletePrice={onDeletePrice}
            />
          ) : (
            <SortableTextBlock
              key={itemKey(item)}
              block={item.data}
              isAdmin={isAdmin}
              t={t}
              onDelete={onDeleteTextBlock}
              onSave={onSaveTextBlock}
            />
          )
        )}
      </SortableContext>
    </DndContext>
  )
}
