import {createDatabase, type Database} from "@er1p-community/race-indexer-db"
import {createClient} from "@libsql/client"

const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
    authToken: process.env.TURSO_DATABASE_AUTH_TOKEN,
})
// Use the database factory from the race-indexer-db package
// This ensures proper TypeScript types for the schema
export const db: Database = createDatabase(client)

