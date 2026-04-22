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

    CREATE TABLE IF NOT EXISTS projects (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      address    TEXT,
      zip_code   TEXT,
      city       TEXT,
      sqm_total  REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS text_blocks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      content    TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      room_type  TEXT NOT NULL,
      work_types TEXT NOT NULL DEFAULT '[]',
      notes      TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prices (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id     INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      work_type   TEXT NOT NULL,
      hours       REAL NOT NULL,
      rate        REAL NOT NULL,
      include_vat INTEGER NOT NULL DEFAULT 0
    );
  `)

  migrateUsers()
  migrateProjects()
  migratePrices()
  seedDefaultUsers()
  seedDefaultSettings()
}

function migrateProjects() {
  try { db.exec(`ALTER TABLE projects ADD COLUMN image TEXT`) } catch {}
}

function migratePrices() {
  try { db.exec('DROP TABLE IF EXISTS price') } catch {}
  db.exec(`CREATE TABLE IF NOT EXISTS prices (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id     INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    work_type   TEXT NOT NULL,
    hours       REAL NOT NULL,
    rate        REAL NOT NULL,
    include_vat INTEGER NOT NULL DEFAULT 0
  )`)
}

function migrateUsers() {
  const cols = ['first_name', 'last_name', 'email', 'phone', 'work_types']
  for (const col of cols) {
    try { db.exec(`ALTER TABLE users ADD COLUMN ${col} TEXT`) } catch {}
  }
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
