import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import db from '../database/db'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as
    | { id: number; username: string; password: string; role: string }
    | undefined

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const secret = process.env.JWT_SECRET!
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, { expiresIn: '2h' })

  res.json({ token, username: user.username, role: user.role })
})

export default router
