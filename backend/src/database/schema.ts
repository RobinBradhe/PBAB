import db from './db'
import bcrypt from 'bcrypt'

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT    NOT NULL UNIQUE,
      password  TEXT    NOT NULL,
      role      TEXT    NOT NULL CHECK(role IN ('admin', 'staff')),
      created_at TEXT   NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  seedDefaultUsers()
  seedDefaultSettings()
}

function seedDefaultSettings() {
  const exists = db.prepare("SELECT 1 FROM settings WHERE key = 'theme'").get()
  if (!exists) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('theme', 'default')").run()
  }
}

function seedDefaultUsers() {
  const count = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n
  if (count > 0) return

  const adminHash = bcrypt.hashSync('admin123', 10)
  const staffHash = bcrypt.hashSync('staff123', 10)

  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', adminHash, 'admin')
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('staff', staffHash, 'staff')

  console.log('Seeded default users: admin / staff')
}
