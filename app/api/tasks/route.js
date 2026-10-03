import { NextResponse } from "next/server";
import { getCookieToken, getSessionUser } from "../../../lib/auth.js";
import { addTask, listTasks } from "../../../lib/tasks.js";

async function currentUser(request) {
  return getSessionUser(getCookieToken(request));
}

export async function GET(request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  return NextResponse.json({ user: { username: user.username }, tasks: await listTasks(user.id) });
}

export async function POST(request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const result = await addTask(user.id, body?.text);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ task: result.task }, { status: 201 });
}