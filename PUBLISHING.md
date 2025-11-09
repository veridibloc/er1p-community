# Publishing Packages

This guide explains how to publish packages from the ER1P Community monorepo using changesets.

## Published Packages

- `@er1p/event-ledger` - Event ledger functionality for ER1P blockchain interactions
- `@er1p/race-indexer-db` - Database schema and client for ER1P race indexer

## Workflow

### 1. Making Changes

When you make changes to a published package, create a changeset to document what changed:

```bash
bun run changeset
```

This will prompt you to:
1. Select which packages changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of the changes

The changeset will be saved as a markdown file in `.changeset/`.

### 2. Version Bumping

When you're ready to release, update package versions based on changesets:

```bash
bun run version-packages
```

This will:
- Update package versions in `package.json` files
- Update dependencies between workspace packages
- Generate/update `CHANGELOG.md` files
- Delete consumed changeset files

### 3. Publishing

Build and publish the packages to npm:

```bash
bun run release
```

This command will:
1. Build all packages (`turbo run build`)
2. Publish changed packages to npm (`changeset publish`)

## Version Types

- **patch** (0.0.X): Bug fixes, small changes
- **minor** (0.X.0): New features, backwards compatible
- **major** (X.0.0): Breaking changes

## Example Workflow

```bash
# 1. Make your changes to packages/event-ledger or packages/race-indexer-db

# 2. Create a changeset
bun run changeset
# Select: @er1p/event-ledger
# Type: patch
# Summary: "Fix validation bug in race created event"

# 3. Commit your changes AND the changeset
git add .
git commit -m "fix: validation bug in race created event"

# 4. When ready to release (usually on main branch)
bun run version-packages
git add .
git commit -m "chore: version packages"

# 5. Publish to npm
bun run release

# 6. Push tags
git push --follow-tags
```

## CI/CD

For automated releases, you can set up GitHub Actions:

1. Add `NPM_TOKEN` to your repository secrets
2. Changesets will automatically create PR with version updates
3. Merging the PR will trigger publishing

See [Changesets documentation](https://github.com/changesets/changesets) for more details.

## Building Packages Locally

To test package builds before publishing:

```bash
# Build a specific package
bun run --filter @er1p/event-ledger build
bun run --filter @er1p/race-indexer-db build

# Or build all packages
bun run build
```

## Package Structure

Both packages are built with:
- **Bun** for JavaScript compilation
- **TypeScript** for type declaration generation
- Output goes to `dist/` folder
- Source files use `.ts` extensions (transformed during build)

## Important Notes

- Always create a changeset for any changes to published packages
- Version bumps should be done on the `main` branch
- Ensure all tests pass before publishing
- Check that builds are successful before releasing
