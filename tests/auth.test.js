import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

const directory = await mkdtemp(join(tmpdir(), "daymark-auth-"));
process.env.DATABASE_URL = `file:${join(directory, "auth.db")}`;
const { authenticateUser, registerUser } = await import("../lib/auth.js");
const { execute, closeDatabase } = await import("../lib/db.js");

after(async () => {
  await closeDatabase();
  await rm(directory, { recursive: true, force: true });
});

test("login succeeds with the correct password", async () => {
  const registered = await registerUser("alice", "correct-horse-1");
  assert.equal(registered.user.username, "alice");
  const user = await authenticateUser("alice", "correct-horse-1");
  assert.equal(user.id, registered.user.id);

  const stored = await execute("SELECT password_hash FROM users WHERE username = ?", ["alice"]);
  assert.notEqual(stored.rows[0].password_hash, "correct-horse-1");
});

test("login rejects a wrong password", async () => {
  assert.equal(await authenticateUser("alice", "incorrect-pass"), null);
});

test("login rejects an unknown username", async () => {
  assert.equal(await authenticateUser("nobody", "correct-horse-1"), null);
});

test("registration rejects duplicate usernames regardless of case", async () => {
  const duplicate = await registerUser("ALICE", "another-password");
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.error, /already taken/i);
});