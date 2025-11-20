import type { Client as LibSqlClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.ts"


function _createDatabase(client: LibSqlClient) {
  return drizzle(client, { schema });
}

/**
 * Type representing the database instance returned by createDatabase.
 * Use this for type annotations in your application.
 *
 * @example
 * ```typescript
 * import type { Database } from '@er1p-community/race-indexer-db';
 *
 * function queryRaces(db: Database) {
 *   return db.query.races.findMany();
 * }
 * ```
 */
export type Database = ReturnType<typeof _createDatabase>;

/**
 * Creates a Drizzle database instance with the race indexer schema.
 *
 * @param client - A pre-configured @libsql/client instance
 * @returns Drizzle database instance with typed schema
 *
 * @example
 * ```typescript
 * import { createClient } from '@libsql/client';
 * import { createDatabase } from '@er1p-community/race-indexer-db';
 *
 * // For local development
 * const client = createClient({ url: 'file:local.db' });
 *
 * // For Turso Cloud
 * const client = createClient({
 *   url: process.env.DATABASE_URL!,
 *   authToken: process.env.DATABASE_AUTH_TOKEN
 * });
 *
 * const db = createDatabase(client);
 * ```
 */
export function createDatabase(client: LibSqlClient) : Database { return _createDatabase(client); }
