# @er1p/race-indexer-db

Database schema and client for ER1P race indexer.

## Overview

This package provides the shared database schema and client configuration for the ER1P race indexer system. It uses Drizzle ORM with libSQL (SQLite/Turso) for data persistence.

## Features

- Complete database schema for races, checkpoints, participants, and leaderboards
- Pre-configured libSQL client with support for:
  - Local SQLite files
  - Local libSQL servers
  - Turso Cloud databases
- TypeScript types for all database entities
- Zero runtime overhead for type-only imports

## Installation

```bash
bun add @er1p/race-indexer-db
```

## Usage

### Import the database client

```typescript
import { createLibSqlDatabase } from "@er1p/race-indexer-db";

const db = createLibSqlDatabase({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN});

// Use the db client for queries
const races = await db.select().from(races);
```

### Import schema tables and types

```typescript
import {
  races,
  checkpoints,
  liveLeaderboards,
  type Race,
  type Checkpoint,
  type LiveLeaderboard
} from "@er1p/race-indexer-db";
```

## Environment Configuration

It's recommended to use a separate `.env` file for database configuration.
The client requires `url` and optional `authToken` (for Turso Cloud databases) 

Here some possible environment variables:

- `DATABASE_URL`: Database connection string
  - Local file: `file:local.db`
  - Local server: `http://127.0.0.1:8080`
  - Turso Cloud: `libsql://your-db.turso.io`
- `DATABASE_AUTH_TOKEN`: Authentication token (required for Turso Cloud)

## Schema

The package includes the following tables:

- `races` - Race definitions from blockchain
- `checkpoints` - Checkpoint details for each race
- `raceFlowEvents` - Race state change history
- `participantEvents` - Participant confirmation/disqualification events
- `checkpointPassages` - Participant checkpoint passages
- `liveRaces` - Currently active races
- `liveLeaderboards` - Real-time race leaderboards
- `historicalLeaderboards` - Final race results

## Development

This package is part of the ER1P community monorepo and follows the workspace conventions.
