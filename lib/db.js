import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./todo.db";
const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE CHECK (length(trim(username)) > 0),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL CHECK (length(trim(text)) > 0),
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  "CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS tasks_user_created_idx ON tasks(user_id, created_at DESC)",
];

let initialization;

async function initialize() {
  for (const statement of schemaStatements) {
    await client.execute(statement);
  }
}

export async function execute(statement, args = []) {
  if (process.env.VERCEL === "1" && !process.env.TURSO_DATABASE_URL) {
    const error = new Error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the Vercel project environment settings.");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }
  initialization ||= initialize();
  await initialization;
  return client.execute({ sql: statement, args });
}

export async function closeDatabase() {
  if (initialization) await initialization;
  await client.close();
}