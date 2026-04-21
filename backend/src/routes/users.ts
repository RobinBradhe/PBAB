import { Router, Response } from 'express'
import bcrypt from 'bcrypt'
import db from '../database/db'
import { requireAdmin, AuthRequest } from '../middleware/auth'

const router = Router()

type UserRow = { id: number; username: string; role: string; first_name: string | null; last_name: string | null; email: string | null; phone: string | null; created_at: string }

router.get('/', requireAdmin, (_req: AuthRequest, res: Response) => {
  const users = db.prepare('SELECT id, username, role, first_name, last_name, email, phone, created_at FROM users').all() as UserRow[]
  res.json(users)
})

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { username, password, role, first_name, last_name, email, phone } = req.body
  if (!username || !password || !role) { res.status(400).json({ error: 'username, password and role required' }); return }
  if (!['admin', 'staff'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return }
  const hash = bcrypt.hashSync(password, 10)
  try {
    const result = db.prepare('INSERT INTO users (username, password, role, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?)').run(username, hash, role, first_name ?? null, last_name ?? null, email ?? null, phone ?? null)
    res.status(201).json({ id: result.lastInsertRowid, username, role, first_name, last_name, email, phone })
  } catch {
    res.status(409).json({ error: 'Username already exists' })
  }
})

router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const { username, password, role, first_name, last_name, email, phone } = req.body
  if (role && !['admin', 'staff'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return }

  const hash = password ? bcrypt.hashSync(password, 10) : null
  db.prepare(`UPDATE users SET
    username = COALESCE(?, username),
    role = COALESCE(?, role),
    first_name = ?, last_name = ?, email = ?, phone = ?,
    password = CASE WHEN ? IS NOT NULL THEN ? ELSE password END
    WHERE id = ?`)
    .run(username ?? null, role ?? null, first_name ?? null, last_name ?? null, email ?? null, phone ?? null, hash, hash, id)

  const user = db.prepare('SELECT id, username, role, first_name, last_name, email, phone FROM users WHERE id = ?').get(id)
  res.json(user)
})

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const requesterId = (req as AuthRequest).user?.id
  if (String(requesterId) === req.params.id) { res.status(400).json({ error: 'Cannot delete yourself' }); return }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
