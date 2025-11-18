# @er1p/race-indexer-db

Database schema and client for ER1P race indexer.

## Overview

This package provides the shared database schema and client configuration for the ER1P race indexer system. It uses Drizzle ORM with libSQL (SQLite/Turso) for data persistence.

## Features

- Complete database schema for races, checkpoints, participants, and leaderboards
- Drizzle ORM integration with typed schema
- Support for libSQL (SQLite/Turso) databases
- TypeScript types for all database entities
- Environment-agnostic (works on Vercel, Edge, Node.js, etc.)
- Zero runtime overhead for type-only imports

## Installation

```bash
bun add @er1p-community/race-indexer-db @libsql/client drizzle-orm
```

> **Note:** `@libsql/client` and `drizzle-orm` are peer dependencies. You must install them in your project.

### Additional for Node.js environments

If deploying to Node.js environments (like Vercel Node.js runtime), also install:

```bash
bun add ws
```

## Usage

### Basic Setup

```typescript
import { createClient } from '@libsql/client';
import { createDatabase } from '@er1p-community/race-indexer-db';

// Create the libSQL client
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

// Create the database instance with typed schema
const db = createDatabase(client);

// Use the db client for queries
const allRaces = await db.query.races.findMany();
```

### Environment-Specific Examples

#### Local Development

```typescript
import { createClient } from '@libsql/client';
import { createDatabase } from '@er1p-community/race-indexer-db';

const client = createClient({ url: 'file:local.db' });
const db = createDatabase(client);
```

#### Vercel / Production (Turso Cloud)

```typescript
import { createClient } from '@libsql/client';
import { createDatabase } from '@er1p-community/race-indexer-db';

const client = createClient({
  url: process.env.DATABASE_URL!, // e.g., libsql://your-db.turso.io
  authToken: process.env.DATABASE_AUTH_TOKEN
});
const db = createDatabase(client);
```

#### Vercel Edge Runtime

```typescript
import { createClient } from '@libsql/client/web';
import { createDatabase } from '@er1p-community/race-indexer-db';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN
});
const db = createDatabase(client);
```

### Using with TypeScript

```typescript
import type { Database } from '@er1p-community/race-indexer-db';

// Use Database type for function parameters
function queryRaces(db: Database) {
  return db.query.races.findMany();
}
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
} from '@er1p-community/race-indexer-db';
```

## Environment Configuration

Configure your database connection using environment variables:

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
