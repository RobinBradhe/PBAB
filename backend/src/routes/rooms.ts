import { Router, Response } from 'express'
import db from '../database/db'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

type RoomRow = {
  id: number
  project_id: number
  room_type: string
  work_types: string
  notes: string | null
  sort_order: number
}

type PriceRow = {
  id: number
  room_id: number
  work_type: string
  hours: number
  rate: number
  include_vat: number
  user_id: number | null
}

router.get('/', requireAuth, (req: AuthRequest, res: Response) => {
  const { project_id } = req.query
  if (!project_id) { res.status(400).json({ error: 'project_id is required' }); return }
  const rooms = db.prepare('SELECT * FROM rooms WHERE project_id = ? ORDER BY sort_order').all(project_id) as RoomRow[]
  const roomIds = rooms.map(r => r.id)
  const prices: PriceRow[] = roomIds.length > 0
    ? db.prepare(`SELECT * FROM prices WHERE room_id IN (${roomIds.map(() => '?').join(',')}) ORDER BY id`).all(...roomIds) as PriceRow[]
    : []
  res.json(rooms.map(r => ({
    ...r,
    work_types: JSON.parse(r.work_types),
    prices: prices.filter(p => p.room_id === r.id).map(p => ({ ...p, include_vat: Boolean(p.include_vat) })),
  })))
})

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { project_id, room_type, work_types = [], notes } = req.body
  if (!project_id || !room_type) { res.status(400).json({ error: 'project_id and room_type are required' }); return }
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM rooms WHERE project_id = ?').get(project_id) as { m: number | null }).m ?? -1
  const result = db.prepare(
    'INSERT INTO rooms (project_id, room_type, work_types, notes, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(project_id, room_type, JSON.stringify(work_types), notes ?? null, maxOrder + 1)
  res.status(201).json({ id: result.lastInsertRowid, project_id, room_type, work_types, notes, sort_order: maxOrder + 1 })
})


router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { room_type, work_types, notes } = req.body
  if (!room_type) { res.status(400).json({ error: 'room_type is required' }); return }
  db.prepare('UPDATE rooms SET room_type = ?, work_types = ?, notes = ? WHERE id = ?')
    .run(room_type, JSON.stringify(work_types ?? []), notes ?? null, req.params.id)
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id) as RoomRow
  res.json({ ...room, work_types: JSON.parse(room.work_types) })
})

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.post('/:id/prices', requireAdmin, (req: AuthRequest, res: Response) => {
  const { work_type, hours, rate, include_vat = false, user_id = null } = req.body
  if (!work_type || hours == null || rate == null) { res.status(400).json({ error: 'work_type, hours, and rate are required' }); return }
  const result = db.prepare('INSERT INTO prices (room_id, work_type, hours, rate, include_vat, user_id) VALUES (?, ?, ?, ?, ?, ?)')
    .run(req.params.id, work_type, hours, rate, include_vat ? 1 : 0, user_id)
  res.status(201).json({ id: result.lastInsertRowid, room_id: Number(req.params.id), work_type, hours, rate, include_vat, user_id })
})

router.put('/:id/prices/:priceId', requireAdmin, (req: AuthRequest, res: Response) => {
  const { work_type, hours, rate, include_vat = false, user_id = null } = req.body
  if (!work_type || hours == null || rate == null) { res.status(400).json({ error: 'work_type, hours, and rate are required' }); return }
  db.prepare('UPDATE prices SET work_type = ?, hours = ?, rate = ?, include_vat = ?, user_id = ? WHERE id = ? AND room_id = ?')
    .run(work_type, hours, rate, include_vat ? 1 : 0, user_id, req.params.priceId, req.params.id)
  res.json({ id: Number(req.params.priceId), room_id: Number(req.params.id), work_type, hours, rate, include_vat, user_id })
})

router.delete('/:id/prices/:priceId', requireAdmin, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM prices WHERE id = ? AND room_id = ?').run(req.params.priceId, req.params.id)
  res.json({ ok: true })
})

export default router
