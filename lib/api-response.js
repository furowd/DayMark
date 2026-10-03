import { NextResponse } from "next/server";

export function withApiErrors(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API request failed:", error);
      const databaseNotConfigured = error.code === "DATABASE_NOT_CONFIGURED";
      return NextResponse.json(
        {
          error: databaseNotConfigured
            ? "Database is not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel project settings, then redeploy."
            : "The server could not complete this request. Check the Vercel function logs for details.",
        },
        { status: databaseNotConfigured ? 503 : 500 },
      );
    }
  };
}