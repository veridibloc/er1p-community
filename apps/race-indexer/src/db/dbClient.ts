
import { createClient } from '@libsql/client';

import {createDatabase} from "@er1p-community/race-indexer-db";

const client = createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
})

export const dbClient = createDatabase(client)
