import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { initSchema } from './database/schema'
import authRouter from './routes/auth'
import settingsRouter from './routes/settings'
import usersRouter from './routes/users'
import projectsRouter from './routes/projects'
import roomsRouter from './routes/rooms'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

initSchema()

app.use('/api/auth', authRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/users', usersRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/rooms', roomsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT}`)
})
