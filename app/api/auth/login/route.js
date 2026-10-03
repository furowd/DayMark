import { NextResponse } from "next/server";
import { withApiErrors } from "../../../../lib/api-response.js";
import { authenticateUser, createSession, SESSION_COOKIE } from "../../../../lib/auth.js";

export const POST = withApiErrors(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }
  const user = await authenticateUser(body?.username, body?.password);
  if (!user) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }
  const session = await createSession(user.id);
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  return response;
});