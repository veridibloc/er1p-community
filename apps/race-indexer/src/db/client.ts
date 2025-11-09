import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

/**
 * Creates a libSQL client based on environment configuration.
 * Supports both local and Turso Cloud databases.
 *
 * Usage:
 * - Local file: DATABASE_URL=file:local.db
 * - Local server: DATABASE_URL=http://127.0.0.1:8080
 * - Turso Cloud: DATABASE_URL=libsql://your-db.turso.io + DATABASE_AUTH_TOKEN=your-token
 */
export function createDbClient(): Client {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Set it to a local file (file:local.db) or Turso Cloud URL (libsql://...)",
    );
  }

  // Detect connection type
  const isLocalFile = databaseUrl.startsWith("file:");
  const isLocalServer =
    databaseUrl.startsWith("http://127.0.0.1") ||
    databaseUrl.startsWith("http://localhost");
  const isTursoCloud = databaseUrl.startsWith("libsql://");

  if (isLocalFile) {
    console.log("📁 Using local SQLite file:", databaseUrl);
    return createClient({
      url: databaseUrl,
    });
  }

  if (isLocalServer) {
    console.log("🔌 Using local libSQL server:", databaseUrl);
    return createClient({
      url: databaseUrl,
    });
  }

  if (isTursoCloud) {
    if (!authToken) {
      throw new Error(
        "DATABASE_AUTH_TOKEN is required for Turso Cloud connections",
      );
    }
    console.log("☁️  Using Turso Cloud:", databaseUrl);
    return createClient({
      url: databaseUrl,
      authToken,
    });
  }

  // Fallback: try to connect anyway
  console.warn("⚠️  Unknown database URL format, attempting connection...");
  return createClient({
    url: databaseUrl,
    authToken: authToken,
  });
}

// Create and export the database client
export const db = drizzle(createDbClient());
