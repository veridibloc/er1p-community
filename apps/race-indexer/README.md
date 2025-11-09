# Race Indexer

A blockchain indexer for ER1P race events on the Signum blockchain. This application walks the Signum blockchain, indexes race-related events, and stores them in a database for easy querying.

## Features

- Indexes race creation events, participant confirmations, checkpoint passages, and more
- Supports both local and cloud database options (Turso/libSQL)
- Uses Drizzle ORM for type-safe database operations
- Continuous blockchain monitoring with catch-up sync
- Configurable starting block height

## Prerequisites

- [Bun](https://bun.sh) runtime (v1.2.15 or later)
- Access to a Signum blockchain node
- Database: Choose one of the following:
  - **Option 1**: Local SQLite file (no setup required)
  - **Option 2**: Local Turso/libSQL server
  - **Option 3**: Turso Cloud account (free tier available at [turso.tech](https://turso.tech))

## Installation

1. Install dependencies:

```bash
bun install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Configure your database (see [Database Configuration](#database-configuration))

## Database Configuration

The race-indexer supports three database options. Edit your `.env` file and choose one:

### Option 1: Local SQLite File (Recommended for Getting Started)

The simplest option - no setup required. Data is stored in a local file.

```env
DATABASE_URL=file:local.db
```

### Option 2: Local Turso/libSQL Server

Run a local libSQL server for development that mimics Turso Cloud behavior.

1. Install Turso CLI:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

2. Start a local server:

```bash
turso dev --db-file local.db --port 8080
```

3. Configure your `.env`:

```env
DATABASE_URL=http://127.0.0.1:8080
```

### Option 3: Turso Cloud (Recommended for Production)

Use Turso's managed cloud database with automatic backups and global replication.

1. Create a Turso account:

```bash
turso auth signup
```

2. Create a database:

```bash
turso db create race-indexer
```

3. Get your database URL:

```bash
turso db show race-indexer --url
```

4. Create an auth token:

```bash
turso db tokens create race-indexer
```

5. Configure your `.env`:

```env
DATABASE_URL=libsql://your-database-name.turso.io
DATABASE_AUTH_TOKEN=your-auth-token-here
```

## Database Setup

Once you've configured your database connection, set up the database schema:

### Generate Migration Files

```bash
bun run db:generate
```

This creates migration SQL files in `db/migrations/` based on your schema.

### Apply Migrations

```bash
bun run db:migrate
```

Or use push for development (applies schema changes directly):

```bash
bun run db:push
```

### View Your Database (Optional)

Launch Drizzle Studio to browse your database in a web UI:

```bash
bun run db:studio
```

This opens a browser at `https://local.drizzle.studio`

## Configuration

Edit `.env` to configure the indexer:

```env
# Blockchain Node Configuration
NODE_HOST=http://localhost:6876        # Your Signum node URL
START_BLOCK=800000                     # Block to start indexing from
VERBOSE=false                          # Enable verbose logging

# Database Configuration (see above)
DATABASE_URL=file:local.db
```

## Usage

### Development Mode

Run the indexer with auto-restart on file changes:

```bash
bun run dev
```

### Production Mode

**Option 1: Run from source**
```bash
bun run start
```

**Option 2: Build and run executable** (recommended for deployment)
```bash
# Build for your platform
bun run build

# Run the executable
./race-indexer
```

See [BUILD.md](BUILD.md) for building executables for different platforms.

## How It Works

1. **Sync Phase**: The indexer catches up from `START_BLOCK` to the current blockchain height
2. **Listen Phase**: Continuously monitors for new blocks and indexes events in real-time
3. **Event Processing**: Recognizes and stores:
   - Race creation events
   - Participant confirmations/disqualifications
   - Checkpoint passages
   - Generic race flow events

## Database Schema

The indexer creates the following tables:

- `races` - Race metadata and details
- `checkpoints` - Race checkpoint information
- `participants` - Participant registrations and status
- `checkpoint_passages` - Records of participants passing checkpoints

All tables include blockchain metadata (block height, timestamp, transaction ID) for traceability.

## Database Scripts Reference

| Command               | Description                                       |
| --------------------- | ------------------------------------------------- |
| `bun run db:generate` | Generate migration files from schema              |
| `bun run db:migrate`  | Apply pending migrations                          |
| `bun run db:push`     | Push schema changes directly (dev only)           |
| `bun run db:studio`   | Launch Drizzle Studio database browser            |
| `bun run db:drop`     | Drop tables (use with caution)                    |

## Architecture

```
race-indexer/
├── db/
│   ├── client.ts           # Database connection with auto-detection
│   ├── schema/
│   │   ├── races.ts        # Race-related table schemas
│   │   └── index.ts        # Schema exports
│   └── migrations/         # Generated migration files
├── drizzle.config.ts       # Drizzle Kit configuration
├── config.ts               # Application configuration
├── index.ts                # Main indexer application
└── .env                    # Environment variables
```

## Switching Between Database Options

You can easily switch between local and cloud databases by changing the `DATABASE_URL` in your `.env` file. The indexer automatically detects the connection type and configures itself accordingly.

**Example: Switch from local to cloud**

```bash
# Before (local)
DATABASE_URL=file:local.db

# After (cloud)
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-token
```

Then restart the indexer. No code changes needed!

## Troubleshooting

### "DATABASE_URL is required" error

Make sure you've created a `.env` file and set `DATABASE_URL`.

### Migration errors

If you encounter migration errors, you can reset your database:

```bash
bun run db:drop
bun run db:push
```

**Warning**: This deletes all data!

### Connection issues with Turso Cloud

- Verify your auth token is correct
- Check that your database exists: `turso db list`
- Ensure you're authenticated: `turso auth login`

## Contributing

Contributions are welcome! Please ensure:

- All database operations use the Drizzle ORM
- Schema changes include migration generation
- Code follows the project's TypeScript conventions

## License

MIT
