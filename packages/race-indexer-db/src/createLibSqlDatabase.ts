import { createClient, type Client as LibSqlClient } from "@libsql/client";
import {drizzle, LibSQLDatabase} from "drizzle-orm/libsql";
import * as schema from "./schema"
export type DbClientConfig = {
    url: string;
    authToken?: string;
}

/**
 * Creates a libSQL client based on environment configuration.
 * Supports both local and Turso Cloud databases.
 *
 * Usage:
 * - Local file: DATABASE_URL=file:local.db
 * - Local server: DATABASE_URL=http://127.0.0.1:8080
 * - Turso Cloud: DATABASE_URL=libsql://your-db.turso.io + DATABASE_AUTH_TOKEN=your-token
 */
function createLibSqlClient({url, authToken}: DbClientConfig): LibSqlClient {

  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it to a local file (file:local.db) or Turso Cloud URL (libsql://...)",
    );
  }

  // Detect connection type
  const isLocalFile = url.startsWith("file:");
  const isLocalServer =
    url.startsWith("http://127.0.0.1") ||
    url.startsWith("http://localhost");
  const isTursoCloud = url.startsWith("libsql://");

  if (isLocalFile) {
    console.log("📁 Using local SQLite file:", url);
    return createClient({
      url: url,
    });
  }

  if (isLocalServer) {
    console.log("🔌 Using local libSQL server:", url);
    return createClient({
      url: url,
    });
  }

  if (isTursoCloud) {
    if (!authToken) {
      throw new Error(
        "DATABASE_AUTH_TOKEN is required for Turso Cloud connections",
      );
    }
    console.log("☁️  Using Turso Cloud:", url);
    return createClient({
      url: url,
      authToken,
    });
  }

  // Fallback: try to connect anyway
  console.warn("⚠️  Unknown database URL format, attempting connection...");
  return createClient({
    url: url,
    authToken: authToken,
  });
}

export type RaceIndexerDatabase = LibSQLDatabase<typeof schema> & { $client: LibSqlClient };

export const createLibSqlDatabase = (cfg: DbClientConfig):
    RaceIndexerDatabase => {
    return drizzle(createLibSqlClient(cfg), {schema});
};
