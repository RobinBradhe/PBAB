import { Router, Request, Response } from 'express'
import db from '../database/db'
import { requireAdmin } from '../middleware/auth'

const router = Router()
const VALID_THEMES = ['default', 'green', 'purple', 'amber', 'red']

router.get('/theme', (_req: Request, res: Response) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'theme'").get() as { value: string } | undefined
  res.json({ theme: row?.value ?? 'default' })
})

router.put('/theme', requireAdmin, (req: Request, res: Response) => {
  const { theme } = req.body
  if (!VALID_THEMES.includes(theme)) {
    res.status(400).json({ error: 'Invalid theme' })
    return
  }
  db.prepare("UPDATE settings SET value = ? WHERE key = 'theme'").run(theme)
  res.json({ theme })
})

export default router
