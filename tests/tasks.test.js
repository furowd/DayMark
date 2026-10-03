import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

const directory = await mkdtemp(join(tmpdir(), "daymark-tasks-"));
process.env.DATABASE_URL = `file:${join(directory, "tasks.db")}`;
const { registerUser } = await import("../lib/auth.js");
const { addTask, listTasks, removeTask, setTaskCompleted } = await import("../lib/tasks.js");
const { closeDatabase } = await import("../lib/db.js");

const first = await registerUser("first_user", "first-password");
const second = await registerUser("second_user", "second-password");

after(async () => {
  await closeDatabase();
  await rm(directory, { recursive: true, force: true });
});

test("adds a non-empty task and rejects whitespace-only text", async () => {
  const added = await addTask(first.user.id, "  Write tests  ");
  assert.equal(added.task.text, "Write tests");
  assert.deepEqual(await listTasks(first.user.id), [added.task]);
  assert.match((await addTask(first.user.id, "  ")).error, /cannot be empty/i);
});

test("completes a task only for its owner", async () => {
  const { task } = await addTask(first.user.id, "Finish the list");
  assert.equal((await setTaskCompleted(first.user.id, task.id, true)).task.completed, true);
  assert.deepEqual(await listTasks(second.user.id), []);
  assert.equal((await setTaskCompleted(second.user.id, task.id, true)).status, 404);
});

test("deletes a task only for its owner", async () => {
  const { task } = await addTask(first.user.id, "Private task");
  assert.equal(await removeTask(second.user.id, task.id), false);
  assert.equal((await listTasks(first.user.id)).some((item) => item.id === task.id), true);
  assert.equal(await removeTask(first.user.id, task.id), true);
  assert.equal((await listTasks(first.user.id)).some((item) => item.id === task.id), false);
});

test("each user's task list contains only their own tasks", async () => {
  const listOwner = await registerUser("list_owner", "list-owner-password");
  const otherOwner = await registerUser("other_owner", "other-owner-password");
  const firstTask = await addTask(listOwner.user.id, "First user's note");
  const secondTask = await addTask(otherOwner.user.id, "Second user's note");
  assert.deepEqual((await listTasks(listOwner.user.id)).map((task) => task.id), [firstTask.task.id]);
  assert.deepEqual((await listTasks(otherOwner.user.id)).map((task) => task.id), [secondTask.task.id]);
});