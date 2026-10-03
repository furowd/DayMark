import { execute } from "./db.js";
import { validateTaskText } from "./validation.js";

function toTask(row) {
  return {
    id: Number(row.id),
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export async function listTasks(userId) {
  const result = await execute(
    "SELECT id, text, completed, created_at FROM tasks WHERE user_id = ? ORDER BY completed ASC, created_at DESC, id DESC",
    [userId],
  );
  return result.rows.map(toTask);
}

export async function addTask(userId, text) {
  const validated = validateTaskText(text);
  if (validated.error) return { error: validated.error };
  const result = await execute(
    "INSERT INTO tasks (user_id, text) VALUES (?, ?)",
    [userId, validated.text],
  );
  const inserted = await execute(
    "SELECT id, text, completed, created_at FROM tasks WHERE id = ? AND user_id = ?",
    [result.lastInsertRowid, userId],
  );
  return { task: toTask(inserted.rows[0]) };
}

export async function setTaskCompleted(userId, taskId, completed) {
  if (typeof completed !== "boolean") return { error: "Completed must be true or false." };
  const result = await execute(
    "UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?",
    [completed ? 1 : 0, taskId, userId],
  );
  if (Number(result.rowsAffected) === 0) return { error: "Task not found.", status: 404 };
  const updated = await execute(
    "SELECT id, text, completed, created_at FROM tasks WHERE id = ? AND user_id = ?",
    [taskId, userId],
  );
  return { task: toTask(updated.rows[0]) };
}

export async function removeTask(userId, taskId) {
  const result = await execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", [taskId, userId]);
  return Number(result.rowsAffected) > 0;
}