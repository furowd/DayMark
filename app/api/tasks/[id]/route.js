import { NextResponse } from "next/server";
import { withApiErrors } from "../../../../lib/api-response.js";
import { getCookieToken, getSessionUser } from "../../../../lib/auth.js";
import { removeTask, setTaskCompleted } from "../../../../lib/tasks.js";

async function taskContext(request, context) {
  const user = await getSessionUser(getCookieToken(request));
  const { id } = await context.params;
  if (!user) return { response: NextResponse.json({ error: "Please log in to continue." }, { status: 401 }) };
  if (!/^\d+$/.test(id) || Number(id) < 1) {
    return { response: NextResponse.json({ error: "Task not found." }, { status: 404 }) };
  }
  return { user, id: Number(id) };
}

export const PATCH = withApiErrors(async (request, context) => {
  const state = await taskContext(request, context);
  if (state.response) return state.response;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const result = await setTaskCompleted(state.user.id, state.id, body?.completed);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status || 400 });
  return NextResponse.json({ task: result.task });
});

export const DELETE = withApiErrors(async (request, context) => {
  const state = await taskContext(request, context);
  if (state.response) return state.response;
  const deleted = await removeTask(state.user.id, state.id);
  if (!deleted) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
});