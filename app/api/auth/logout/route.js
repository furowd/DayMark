import { NextResponse } from "next/server";
import { withApiErrors } from "../../../../lib/api-response.js";
import { deleteSession, getCookieToken, SESSION_COOKIE } from "../../../../lib/auth.js";

export const POST = withApiErrors(async (request) => {
  await deleteSession(getCookieToken(request));
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
});