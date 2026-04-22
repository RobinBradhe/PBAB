import { Router, Response } from 'express'
import bcrypt from 'bcrypt'
import db from '../database/db'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

type UserRow = { id: number; username: string; role: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; work_types: string | null; created_at: string }

router.get('/', requireAuth, (_req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, username, role, first_name, last_name, email, phone, work_types FROM users').all() as UserRow[]
  res.json(users.map(u => ({ ...u, work_types: JSON.parse(u.work_types ?? '[]') })))
})

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { username, password, role, first_name, last_name, email, phone, work_types = [] } = req.body
  if (!username || !password || !role) { res.status(400).json({ error: 'username, password and role required' }); return }
  if (!['admin', 'staff'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return }
  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = db.prepare('INSERT INTO users (username, password, role, first_name, last_name, email, phone, work_types) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(username, hash, role, first_name ?? null, last_name ?? null, email ?? null, phone ?? null, JSON.stringify(work_types))
    res.status(201).json({ id: result.lastInsertRowid, username, role, first_name, last_name, email, phone, work_types })
  } catch {
    res.status(409).json({ error: 'Username already exists' })
  }
})

router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { username, password, role, first_name, last_name, email, phone, work_types } = req.body
  if (role && !['admin', 'staff'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return }

  const hash = password ? bcrypt.hashSync(password, 10) : null
  db.prepare(`UPDATE users SET
    username = COALESCE(?, username),
    role = COALESCE(?, role),
    first_name = ?, last_name = ?, email = ?, phone = ?,
    work_types = COALESCE(?, work_types),
    password = CASE WHEN ? IS NOT NULL THEN ? ELSE password END
    WHERE id = ?`)
    .run(username ?? null, role ?? null, first_name ?? null, last_name ?? null, email ?? null, phone ?? null, work_types !== undefined ? JSON.stringify(work_types) : null, hash, hash, id)

  const user = db.prepare('SELECT id, username, role, first_name, last_name, email, phone, work_types FROM users WHERE id = ?').get(id) as UserRow
  res.json({ ...user, work_types: JSON.parse(user.work_types ?? '[]') })
})

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const requesterId = (req as AuthRequest).user?.id
  if (String(requesterId) === req.params.id) { res.status(400).json({ error: 'Cannot delete yourself' }); return }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

type WorkRow = {
  id: number; work_type: string; hours: number; rate: number; include_vat: number
  room_id: number; room_type: string
  project_id: number; project_name: string
}

router.get('/:id/work', requireAdmin, (req: AuthRequest, res: Response) => {
  const rows = db.prepare(`
    SELECT p.id, p.work_type, p.hours, p.rate, p.include_vat,
           r.id as room_id, r.room_type,
           proj.id as project_id, proj.name as project_name
    FROM prices p
    JOIN rooms r ON p.room_id = r.id
    JOIN projects proj ON r.project_id = proj.id
    WHERE p.user_id = ?
    ORDER BY proj.id, r.sort_order
  `).all(req.params.id) as WorkRow[]
  res.json(rows.map(r => ({ ...r, include_vat: Boolean(r.include_vat) })))
})

export default router
