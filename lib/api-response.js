import { NextResponse } from "next/server";

export function withApiErrors(handler) {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API request failed:", error);
      const databaseNotConfigured = error.code === "DATABASE_NOT_CONFIGURED";
      const invalidDatabaseConfiguration = error.code === "DATABASE_CONFIGURATION_INVALID";
      return NextResponse.json(
        {
          error: databaseNotConfigured
            ? "Database is not configured. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel project settings, then redeploy."
            : invalidDatabaseConfiguration
              ? "TURSO_DATABASE_URL must be a valid libsql:// or https:// URL. Check the Vercel project environment settings."
            : "The server could not complete this request. Check the Vercel function logs for details.",
        },
        { status: databaseNotConfigured || invalidDatabaseConfiguration ? 503 : 500 },
      );
    }
  };
}