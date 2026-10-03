import { NextResponse } from "next/server";
import { registerUser } from "../../../../lib/auth.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const result = await registerUser(body?.username, body?.password);
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ user: result.user }, { status: 201 });
}