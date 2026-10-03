import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { execute } from "./db.js";
import { validateCredentials } from "./validation.js";

export const SESSION_COOKIE = "daymark_session";
const SESSION_DAYS = 30;

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser(username, password) {
  const validated = validateCredentials(username, password);
  if (validated.error) return { error: validated.error, status: 400 };

  const passwordHash = await bcrypt.hash(validated.password, 12);
  try {
    const result = await execute(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [validated.username, passwordHash],
    );
    return { user: { id: Number(result.lastInsertRowid), username: validated.username } };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || /unique constraint/i.test(error.message)) {
      return { error: "That username is already taken.", status: 409 };
    }
    throw error;
  }
}

export async function authenticateUser(username, password) {
  const validated = validateCredentials(username, password);
  if (validated.error) return null;

  const result = await execute(
    "SELECT id, username, password_hash FROM users WHERE username = ? COLLATE NOCASE",
    [validated.username],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(validated.password, user.password_hash))) return null;
  return { id: Number(user.id), username: user.username };
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await execute(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    [hashToken(token), userId, expiresAt],
  );
  return { token, expiresAt };
}

export async function getSessionUser(token) {
  if (!token) return null;
  const result = await execute(
    `SELECT users.id, users.username
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
    [hashToken(token), new Date().toISOString()],
  );
  const user = result.rows[0];
  return user ? { id: Number(user.id), username: user.username } : null;
}

export async function deleteSession(token) {
  if (!token) return;
  await execute("DELETE FROM sessions WHERE token_hash = ?", [hashToken(token)]);
}

export function getCookieToken(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookie = cookieHeader.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : null;
}