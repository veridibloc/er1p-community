import {createLibSqlDatabase} from "@er1p-community/race-indexer-db";
export const dbClient = createLibSqlDatabase({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
})
