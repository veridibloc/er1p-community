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

### Building the Package

```bash
# From monorepo root
turbo build --filter=@er1p-community/race-indexer-db

# Or from package directory
cd packages/race-indexer-db
bun run build
```

### Making Schema Changes

1. **Edit the schema** in `src/schema.ts`
2. **Rebuild the package**: `bun run build`
3. **Generate migrations** in the app using this package:
   ```bash
   cd apps/race-indexer
   bun run db:generate
   ```
4. **Test the migration**:
   ```bash
   bun run db:push  # Or db:migrate
   ```

### Type Safety

All schema exports are fully typed with TypeScript:

```typescript
import type { Race, Checkpoint, LiveLeaderboard } from '@er1p-community/race-indexer-db';

// Types are inferred from Drizzle schema
const race: Race = await db.query.races.findFirst();
```

## Building Custom Applications

This package can be used to build any application that needs to query race data:

### Example: Custom API Server

```typescript
import { createDatabase, type Database } from '@er1p-community/race-indexer-db';
import { createClient } from '@libsql/client';

const db = createDatabase(createClient({ url: process.env.DATABASE_URL! }));

// Build your API routes
app.get('/api/races', async (req, res) => {
  const races = await db.query.races.findMany({ limit: 20 });
  res.json(races);
});
```

### Example: Analytics Dashboard

```typescript
import { createDatabase, liveLeaderboards, races } from '@er1p-community/race-indexer-db';
import { eq, and, gte } from 'drizzle-orm';

// Query for analytics
const recentFinishers = await db
  .select()
  .from(liveLeaderboards)
  .where(
    and(
      eq(liveLeaderboards.raceId, raceId),
      eq(liveLeaderboards.status, 'finished')
    )
  );
```

### Example: Mobile App

```typescript
// Use in React Native with Expo
import { createDatabase } from '@er1p-community/race-indexer-db';
import { createClient } from '@libsql/client/web';

const client = createClient({
  url: 'https://your-db.turso.io',
  authToken: process.env.EXPO_PUBLIC_DB_TOKEN
});

const db = createDatabase(client);
```

## Schema Overview

### Core Tables

- **races**: Immutable race definitions from blockchain
- **checkpoints**: Checkpoint details for each race
- **raceFlowEvents**: Race state change history (started, stopped, etc.)
- **participantEvents**: Participant confirmations/disqualifications
- **checkpointPassages**: Participant checkpoint passage records

### Live Race Tables

- **liveRaces**: Currently active races
- **liveLeaderboards**: Real-time leaderboards (updated as events arrive)

### Historical Tables

- **historicalLeaderboards**: Permanent race results after race ends

## Contributing

We welcome contributions to improve the database schema and package functionality!

### Bug Reports

Found an issue? [Open an issue](https://github.com/veridibloc/er1p-community/issues) with:
- Description of the problem
- Database operation that failed
- Error messages
- Database type (local SQLite, Turso local, Turso Cloud)

### Feature Requests

Have an idea for schema improvements? [Start a discussion](https://github.com/veridibloc/er1p-community/discussions) describing:
- The new table or field you need
- Your use case
- How it integrates with existing schema

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/schema-improvement`
3. **Make schema changes** in `src/schema.ts`
4. **Add types** to exported types
5. **Rebuild**: `bun run build`
6. **Test in both apps** (race-indexer and race-radar)
7. **Update documentation** in this README
8. **Commit**: `git commit -m "feat: add new schema table"`
9. **Push and create a PR**

### Development Guidelines

- **Schema Changes**: Must be backward compatible or include migration path
- **Types**: All tables must export both Select and Insert types
- **Indexes**: Add indexes for frequently queried columns
- **Documentation**: Update README with new table descriptions
- **Relations**: Use Drizzle relations for foreign keys
- **Naming**: Follow existing naming conventions (camelCase for fields)

### Areas We Need Help With

- 📊 **Analytics Views** - Materialized views for common queries
- 🔍 **Full-text Search** - Search functionality for races/runners
- 🗂️ **Archival Strategy** - Moving old data to archive tables
- 📈 **Performance Optimization** - Query optimization and indexes
- 🧪 **Testing** - Schema validation tests
- 📚 **Examples** - More usage examples for different platforms

## Publishing

This package is published to npm as `@er1p-community/race-indexer-db`.

To publish a new version:

```bash
# Update version in package.json
# Then publish (maintainers only)
npm publish
```

## License

MIT License - See [LICENSE](../../LICENSE)

## Links

- **Main README**: [Root README](../../README.md)
- **race-indexer**: [Blockchain indexer](../../apps/race-indexer)
- **race-radar**: [Web app](../../apps/race-radar)
- **Drizzle ORM Docs**: [orm.drizzle.team](https://orm.drizzle.team)
- **Turso Docs**: [docs.turso.tech](https://docs.turso.tech)
