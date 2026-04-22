import { Router, Response } from 'express'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import db from '../database/db'
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth'

const UPLOADS_DIR = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `project-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

type ProjectRow = {
  id: number
  name: string
  address: string | null
  zip_code: string | null
  city: string | null
  sqm_total: number | null
  image: string | null
  created_at: string
}

router.get('/', requireAuth, (_req: AuthRequest, res: Response) => {
  const projects = db.prepare('SELECT * FROM projects ORDER BY name').all() as ProjectRow[]
  res.json(projects)
})

router.post('/', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, address, zip_code, city, sqm_total } = req.body
  if (!name) { res.status(400).json({ error: 'name is required' }); return }
  const result = db.prepare(
    'INSERT INTO projects (name, address, zip_code, city, sqm_total) VALUES (?, ?, ?, ?, ?)'
  ).run(name, address ?? null, zip_code ?? null, city ?? null, sqm_total ?? null)
  res.status(201).json({ id: result.lastInsertRowid, name, address, zip_code, city, sqm_total })
})

router.put('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, address, zip_code, city, sqm_total } = req.body
  if (!name) { res.status(400).json({ error: 'name is required' }); return }
  db.prepare(
    'UPDATE projects SET name = ?, address = ?, zip_code = ?, city = ?, sqm_total = ? WHERE id = ?'
  ).run(name, address ?? null, zip_code ?? null, city ?? null, sqm_total ?? null, req.params.id)
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  res.json(project)
})

router.delete('/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const project = db.prepare('SELECT image FROM projects WHERE id = ?').get(req.params.id) as ProjectRow | undefined
  if (project?.image) {
    const filePath = path.join(UPLOADS_DIR, project.image)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.post('/:id/image', requireAdmin, upload.single('image'), (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return }
  const project = db.prepare('SELECT image FROM projects WHERE id = ?').get(req.params.id) as ProjectRow | undefined
  if (project?.image) {
    const oldPath = path.join(UPLOADS_DIR, project.image)
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
  }
  db.prepare('UPDATE projects SET image = ? WHERE id = ?').run(req.file.filename, req.params.id)
  res.json({ image: req.file.filename })
})

// Reorder rooms + text_blocks together within a project
router.put('/:id/reorder', requireAdmin, (req: AuthRequest, res: Response) => {
  const { items } = req.body as { items: Array<{ type: 'room' | 'text', id: number }> }
  if (!Array.isArray(items)) { res.status(400).json({ error: 'items array required' }); return }
  const updateRoom = db.prepare('UPDATE rooms SET sort_order = ? WHERE id = ?')
  const updateText = db.prepare('UPDATE text_blocks SET sort_order = ? WHERE id = ?')
  db.transaction(() => {
    items.forEach((item, index) => {
      if (item.type === 'room') updateRoom.run(index, item.id)
      else updateText.run(index, item.id)
    })
  })()
  res.json({ ok: true })
})

// Text blocks CRUD
router.get('/:id/text-blocks', requireAuth, (req: AuthRequest, res: Response) => {
  const blocks = db.prepare('SELECT * FROM text_blocks WHERE project_id = ? ORDER BY sort_order').all(req.params.id)
  res.json(blocks)
})

router.post('/:id/text-blocks', requireAdmin, (req: AuthRequest, res: Response) => {
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM text_blocks WHERE project_id = ?').get(req.params.id) as { m: number | null }).m ?? -1
  const result = db.prepare('INSERT INTO text_blocks (project_id, content, sort_order) VALUES (?, ?, ?)').run(req.params.id, '', maxOrder + 1)
  res.status(201).json({ id: result.lastInsertRowid, project_id: Number(req.params.id), content: '', sort_order: maxOrder + 1 })
})

router.put('/:id/text-blocks/:blockId', requireAdmin, (req: AuthRequest, res: Response) => {
  const { content } = req.body
  db.prepare('UPDATE text_blocks SET content = ? WHERE id = ?').run(content ?? '', req.params.blockId)
  res.json({ ok: true })
})

router.delete('/:id/text-blocks/:blockId', requireAdmin, (req: AuthRequest, res: Response) => {
  db.prepare('DELETE FROM text_blocks WHERE id = ?').run(req.params.blockId)
  res.json({ ok: true })
})

export default router
