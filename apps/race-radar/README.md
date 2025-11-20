# Race Radar

> Real-time endurance race tracking powered by blockchain

A public-facing web application for viewing live endurance races and exploring historical race data. Built for running enthusiasts, race spectators, and athletes who want to track race progress in real-time with blockchain-verified data.

## What is Race Radar?

Race Radar is the viewer interface for the ER1P ecosystem. It connects to a database populated by the race-indexer and displays:

- **Live Race Tracking**: See active races with real-time leaderboards
- **Checkpoint Progress**: Monitor runners as they pass through checkpoints
- **Historical Results**: Browse past race results and statistics
- **Runner Profiles**: View individual runner performance across races
- **Blockchain Verification**: All data is sourced from the Signum blockchain

Perfect for spectators following their favorite runners, race directors monitoring their events, and athletes reviewing their performance.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **UI Library**: [React 19](https://react.dev)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) components
- **Database**: [Drizzle ORM](https://orm.drizzle.team) + [libSQL/Turso](https://turso.tech)
- **Runtime**: [Bun](https://bun.sh)
- **Deployment**: [Vercel](https://vercel.com) (recommended)
- **Language**: TypeScript 100%

## Features

- Real-time leaderboard updates
- Responsive design (mobile, tablet, desktop)
- Dark/light theme support
- Server-side rendering with Next.js caching
- Optimized for performance (static page generation where possible)
- Powered by shared `@er1p-community/race-indexer-db` schema

## Prerequisites

- [Bun](https://bun.sh) v1.2.15 or later
- Database connection (local SQLite, Turso local server, or Turso Cloud)
- Access to a race-indexer database (see [race-indexer](../race-indexer))

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Create a `.env` file in the root of the `race-radar` directory:

```bash
cp .env.example .env
```

Edit `.env` and configure your database connection:

```env
# Database Configuration
# Local development
DATABASE_URL=file:../../apps/race-indexer/local.db

# Or Turso Cloud (production)
DATABASE_URL=libsql://your-database.turso.io
DATABASE_AUTH_TOKEN=your-auth-token-here
```

### 3. Run Development Server

```bash
bun dev
```

The app will be available at **http://localhost:3003**

### 4. Build for Production

```bash
# Build the application
bun run build

# Start production server
bun start
```

## Project Structure

```
race-radar/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page (live races)
│   ├── history/           # Historical races page
│   ├── race/[id]/         # Individual race details
│   ├── runners/           # Runners list & profiles
│   └── api/               # API routes for real-time data
├── components/            # React components
│   ├── ui/                # shadcn/ui base components
│   ├── leaderboard/       # Leaderboard components
│   ├── race-card.tsx      # Race preview card
│   └── ...
├── lib/                   # Utilities and helpers
│   ├── server/            # Server-side utilities
│   ├── types.ts           # TypeScript type definitions
│   └── utils.ts           # Client utilities
├── public/                # Static assets
└── styles/                # Global styles
```

## How It Works

### Data Flow

1. **race-indexer** syncs blockchain events → database
2. **race-radar** queries database via Drizzle ORM
3. Next.js renders pages (static or dynamic)
4. User views live/historical race data

### Caching Strategy

- **Home Page**: Revalidates every 10 seconds (live races)
- **History Page**: Revalidates hourly (historical data rarely changes)
- **Individual Race Pages**: Dynamic based on race status (live vs. ended)
- **API Routes**: No caching for real-time leaderboard updates

## Development Guide

### Running Locally

For the best local development experience:

1. **Start the race-indexer** (in another terminal):
   ```bash
   cd ../race-indexer
   bun run dev
   ```
   This ensures your database has live data to display.

2. **Start race-radar**:
   ```bash
   bun dev
   ```

3. **Point to the same database**: Make sure `DATABASE_URL` in both apps points to the same database.

### Adding New Features

#### Example: Adding a New Page

1. Create a new route in `app/`:
   ```tsx
   // app/my-page/page.tsx
   export default function MyPage() {
     return <div>My New Page</div>
   }
   ```

2. Add navigation link in `components/navbar.tsx`

3. Create server actions if you need data fetching:
   ```tsx
   // app/my-page/actions.ts
   'use server'

   import { db } from '@/lib/server/db'

   export async function getMyData() {
     return db.query.races.findMany({ limit: 10 })
   }
   ```

#### Example: Adding a UI Component

We use [shadcn/ui](https://ui.shadcn.com) components. To add a new one:

```bash
# Add a component (e.g., dialog)
bunx shadcn@latest add dialog
```

Components are added to `components/ui/` and can be imported:

```tsx
import { Dialog } from '@/components/ui/dialog'
```

### Customizing the Design

- **Colors**: Edit `tailwind.config.js` theme section
- **Fonts**: Configured in `app/layout.tsx`
- **Global Styles**: Edit `app/globals.css`
- **Dark Mode**: Uses `next-themes` - toggle in `components/theme-switcher.tsx`

## Deployment

### Deploying to Vercel (Recommended)

1. **Push your code to GitHub**

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**:
   - Add `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in Vercel dashboard
   - Use Turso Cloud for production database

4. **Deploy**:
   - Vercel automatically builds and deploys
   - Every push to `main` triggers a new deployment

### Database Recommendations

- **Local Dev**: Use local SQLite file (`file:local.db`)
- **Preview**: Use Turso local server or Turso Cloud preview database
- **Production**: Use Turso Cloud with automatic backups

## Connecting to Your Own Race Data

To use Race Radar with your own races:

1. **Set up race-indexer**: Follow [race-indexer README](../race-indexer/README.md)
2. **Point to your blockchain node**: Configure `NODE_HOST` in race-indexer
3. **Connect race-radar to the same database**: Update `DATABASE_URL`
4. **Start dispatching events**: Use `@er1p-community/event-ledger` to dispatch race events

## Customization Ideas

Race Radar is designed to be forked and customized:

- **Branding**: Replace logo, colors, and fonts
- **Additional Stats**: Add pace analysis, elevation charts, weather data
- **Social Features**: Add comments, runner following, notifications
- **Integrations**: Connect to Strava, Garmin, or other platforms
- **Analytics**: Add Google Analytics, Plausible, or similar
- **Mobile App**: Use the same API routes for a React Native app

## Performance Tips

- Use Next.js ISR (Incremental Static Regeneration) for pages that don't need to be fully dynamic
- Optimize images with `next/image`
- Implement pagination for large leaderboards
- Use React Server Components for data fetching
- Add a CDN (Vercel Edge Network is included)

## Contributing

We welcome contributions! Here's how you can help:

### Bug Reports

Found a bug? [Open an issue](https://github.com/veridibloc/er1p-community/issues) with:
- Description of the bug
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots if applicable

### Feature Requests

Have an idea? [Start a discussion](https://github.com/veridibloc/er1p-community/discussions) or open an issue describing:
- The feature you'd like to see
- Why it would be useful
- Any implementation ideas

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**
4. **Test thoroughly** (check both light and dark themes!)
5. **Ensure build passes**: `bun run build`
6. **Commit with conventional commits**: `git commit -m "feat: add new feature"`
7. **Push and create a PR**

### Development Guidelines

- Follow TypeScript best practices
- Use React Server Components when possible
- Keep components small and focused
- Use Tailwind CSS for styling (avoid inline styles)
- Test on mobile, tablet, and desktop
- Ensure accessibility (semantic HTML, ARIA labels)

## Troubleshooting

### Database Connection Issues

**Error: "Cannot connect to database"**
- Verify `DATABASE_URL` is set correctly in `.env`
- Check that race-indexer has created the database tables
- For Turso Cloud, verify your auth token is valid

### Build Errors

**Error: "Module not found"**
- Run `bun install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next`

**TypeScript errors**
- Check that `@er1p-community/race-indexer-db` is built: `turbo build --filter=race-indexer-db`

### No Data Showing

- Ensure race-indexer is running and has indexed blockchain events
- Check database has data: `cd ../race-indexer && bun run db:studio`
- Verify `DATABASE_URL` points to the correct database

## License

MIT License - see [LICENSE](../../LICENSE)

## Links

- **Main README**: [Root README](../../README.md)
- **race-indexer**: [Blockchain indexer](../race-indexer)
- **race-indexer-db**: [Database schema](../../packages/race-indexer-db)
- **Report Issues**: [GitHub Issues](https://github.com/veridibloc/er1p-community/issues)

---

**Built for the running community by developers who love endurance sports**
