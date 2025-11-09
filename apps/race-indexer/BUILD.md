# Building Race Indexer

The race-indexer can be compiled into a **standalone executable** using Bun's compile feature. This creates a single binary with no external dependencies (except the database).

## Benefits of Building Executables

✅ **Single File Distribution** - No need to install Bun or Node.js
✅ **No Dependencies** - Everything bundled in one binary
✅ **Faster Startup** - Pre-compiled, no JIT overhead
✅ **Easy Deployment** - Just copy the binary to your server
✅ **Cross-Platform** - Build for Linux, macOS, and Windows

---

## Quick Start

### Build for Your Platform

```bash
# Builds for your current OS/architecture
bun run build

# This creates:
# - race-indexer (Linux/macOS)
# - race-indexer.exe (Windows)
```

### Build for Specific Platforms

```bash
# Linux (most common for VPS deployment)
bun run build:linux

# Windows
bun run build:windows

# macOS
bun run build:macos

# All platforms at once
bun run build:all
```

---

## Output Files

After building, you'll have:

```
race-indexer/
├── race-indexer-linux          # Linux x64 binary (~90MB)
├── race-indexer-windows.exe    # Windows x64 binary (~90MB)
└── race-indexer-macos          # macOS x64 binary (~90MB)
```

---

## Running the Executable

### On Linux/macOS

```bash
# Make executable
chmod +x race-indexer-linux

# Run directly
./race-indexer-linux

# Or move to system path
sudo mv race-indexer-linux /usr/local/bin/race-indexer
race-indexer
```

### On Windows

```bash
# Just run it
race-indexer-windows.exe
```

---

## Deployment with Executables

### Option 1: Direct Execution (Simplest)

```bash
# On your VPS
wget https://github.com/your-org/er1p-community/releases/download/v1.0.0/race-indexer-linux
chmod +x race-indexer-linux

# Create .env file
cat > .env << EOF
DATABASE_URL=file:local.db
NODE_HOST=http://localhost:6876
START_BLOCK=800000
VERBOSE=false
EOF

# Run database migrations first
# (You still need Bun installed for drizzle-kit, or run migrations locally first)
bun run db:push

# Run the indexer
./race-indexer-linux
```

### Option 2: With PM2

Update `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'race-indexer',
    script: './race-indexer-linux',  // Use the executable
    cwd: '/path/to/race-indexer',
    instances: 1,
    autorestart: true,
    // ... rest of config
  }]
};
```

Then:
```bash
pm2 start ecosystem.config.js
pm2 save
```

### Option 3: With Systemd

Update `race-indexer.service`:

```ini
[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/race-indexer
ExecStart=/home/your-username/race-indexer/race-indexer-linux

# Environment file
EnvironmentFile=/home/your-username/race-indexer/.env
# ... rest of config
```

Then:
```bash
sudo systemctl enable race-indexer
sudo systemctl start race-indexer
```

---

## GitHub Releases Workflow

Create executables for all platforms and attach to releases:

### Manual Release

```bash
# Build all platforms
bun run build:all

# Create release on GitHub
gh release create v1.0.0 \
  race-indexer-linux \
  race-indexer-windows.exe \
  race-indexer-macos \
  --title "Race Indexer v1.0.0" \
  --notes "Release notes here"
```

### Automated with GitHub Actions

Create `.github/workflows/release.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        include:
          - os: ubuntu-latest
            target: bun-linux-x64
            artifact: race-indexer-linux
          - os: windows-latest
            target: bun-windows-x64
            artifact: race-indexer-windows.exe
          - os: macos-latest
            target: bun-darwin-x64
            artifact: race-indexer-macos

    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        working-directory: apps/race-indexer
        run: bun install

      - name: Build executable
        working-directory: apps/race-indexer
        run: bun build ./index.ts --compile --target=${{ matrix.target }} --outfile ${{ matrix.artifact }}

      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.artifact }}
          path: apps/race-indexer/${{ matrix.artifact }}

  release:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v3

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            race-indexer-linux/race-indexer-linux
            race-indexer-windows.exe/race-indexer-windows.exe
            race-indexer-macos/race-indexer-macos
```

---

## Important Notes

### Database Migrations

The executable doesn't include `drizzle-kit`. You need to handle migrations separately:

**Option 1: Run migrations before building**
```bash
bun run db:push
# Then deploy the executable + the generated database
```

**Option 2: Keep Bun installed for migrations**
```bash
# On your server
bun install  # Only install deps for drizzle-kit
bun run db:push
./race-indexer-linux  # Run the executable
```

**Option 3: Use Turso Cloud**
```bash
# Migrations run locally
bun run db:push

# Executable connects to cloud
# No local database setup needed!
```

### Environment Variables

The executable still reads `.env` files and environment variables normally:

```bash
# Using .env file
./race-indexer-linux

# Or inline
DATABASE_URL=file:local.db NODE_HOST=http://localhost:6876 ./race-indexer-linux
```

### File Size

Executables are ~90MB because they include:
- Bun runtime
- TypeScript
- All dependencies
- Your application code

This is normal and acceptable for modern systems.

### Cross-Compilation

You can build for other platforms from any platform:

```bash
# Build Linux binary from macOS
bun run build:linux

# Build Windows binary from Linux
bun run build:windows
```

---

## Troubleshooting

### "Permission denied" on Linux/macOS

```bash
chmod +x race-indexer-linux
```

### "Cannot find module" errors

Make sure all imports in your code use relative paths and don't rely on dynamic imports that can't be resolved at compile time.

### Binary doesn't run

Check you're using the correct binary for your platform:
- Linux: `race-indexer-linux`
- Windows: `race-indexer-windows.exe`
- macOS: `race-indexer-macos`

---

## Distribution Strategies

### For Community Members

1. **GitHub Releases** (Recommended)
   - Attach binaries to releases
   - Users download for their platform
   - Simple and trusted

2. **Direct Download**
   - Host on your own server
   - Provide direct download links
   - Include checksums for verification

3. **Package Managers** (Advanced)
   - Create `.deb` package for Debian/Ubuntu
   - Create `.rpm` package for RedHat/Fedora
   - Use tools like `fpm` to package the binary

### Example Download Instructions for Users

```bash
# Download latest release
wget https://github.com/your-org/er1p-community/releases/latest/download/race-indexer-linux

# Verify (optional, if you provide checksums)
sha256sum race-indexer-linux

# Make executable
chmod +x race-indexer-linux

# Run
./race-indexer-linux
```

---

## Comparison: Source vs. Executable

| Aspect | Source Code | Executable Binary |
|--------|-------------|-------------------|
| Setup | Install Bun + deps | Just download |
| Size | ~50MB (node_modules) | ~90MB (single file) |
| Startup | ~100ms | ~50ms (faster) |
| Updates | `git pull && bun install` | Download new binary |
| Debugging | Easy (source maps) | Harder |
| Flexibility | Can edit on server | Need to rebuild |
| Best For | Development, customization | Production, distribution |

---

## Recommended Approach

**For Development:**
```bash
bun run dev
```

**For Self-Hosting:**
```bash
pm2 start ecosystem.config.js  # Using source
```

**For Community Distribution:**
```bash
bun run build:all  # Create executables
# Upload to GitHub Releases
```

This gives everyone the flexibility to choose what works best for them!
