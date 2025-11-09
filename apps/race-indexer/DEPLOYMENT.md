# Deployment Guide for Race Indexer

Welcome! This guide provides **multiple deployment options** for the ER1P Race Indexer, from simple cloud platforms to custom VPS setups. Choose what works best for you!

## Quick Links

- [Standalone Executable (NEW!)](#standalone-executable) - Single binary, no dependencies
- [VPS Setup (Recommended for Community)](#option-1-vps-recommended-for-community) - Full control, runs alongside Signum node
- [Railway (Easiest)](#option-2-railway-easiest) - One-click deploy
- [Fly.io (Free Tier)](#option-3-flyio-free-tier) - Generous free tier
- [Docker](#option-4-docker-any-platform) - Portable containers
- [Systemd Service](#option-5-systemd-service-alternative-to-pm2) - Alternative to PM2

---

## Prerequisites

Before deploying, ensure you have:

1. **Database Setup**: Create a Turso database
   ```bash
   turso db create race-indexer
   turso db show race-indexer --url
   turso db tokens create race-indexer
   ```

2. **Environment Variables**: Set these on your platform:
   - `DATABASE_URL` - Your Turso database URL
   - `DATABASE_AUTH_TOKEN` - Your Turso auth token
   - `NODE_HOST` - Signum blockchain node URL
   - `START_BLOCK` - Block height to start indexing from
   - `VERBOSE` - Set to "true" for detailed logging

3. **Run Migrations**: Apply database schema
   ```bash
   bun run db:push
   # or
   bun run db:migrate
   ```

---

## Standalone Executable

**New!** The race-indexer can be compiled into a standalone executable with zero dependencies.

### Quick Start

```bash
# Download the binary for your platform
wget https://github.com/your-org/er1p-community/releases/latest/download/race-indexer-linux
chmod +x race-indexer-linux

# Create .env file
cp .env.example .env
nano .env

# Run it!
./race-indexer-linux
```

**Benefits:**
- ✅ Single file, no Bun/Node.js installation needed
- ✅ ~90MB binary includes everything
- ✅ Faster startup times
- ✅ Perfect for distribution to non-technical users

**See [BUILD.md](BUILD.md) for detailed build instructions and GitHub Actions setup.**

---

## Option 1: VPS (Recommended for Community)

**Perfect for:** Running indexer alongside your own Signum node, full control, cost-effective

### Why VPS?
- ✅ Cheapest option ($4-6/month)
- ✅ Run multiple services (indexer + Signum node + more)
- ✅ Full control over environment
- ✅ Use local SQLite or Turso Cloud
- ✅ PM2 for process management

### Automated Setup Script

The easiest way to set up on a VPS:

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/your-org/er1p-community/main/apps/race-indexer/setup-vps.sh | bash

# Or download first, review, then run
wget https://raw.githubusercontent.com/your-org/er1p-community/main/apps/race-indexer/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

This script will:
1. Install Bun runtime
2. Install PM2 process manager
3. Clone the repository
4. Install dependencies
5. Create environment template

### Manual Setup

If you prefer manual setup:

#### 1. Choose a VPS Provider

- **[Hetzner](https://www.hetzner.com/)** - €3.79/month (recommended, EU)
- **[DigitalOcean](https://www.digitalocean.com/)** - $6/month (global)
- **[Vultr](https://www.vultr.com/)** - $6/month (global)
- **[Contabo](https://contabo.com/)** - €4.50/month (budget option)

Minimum specs: 1 vCPU, 1GB RAM, 25GB SSD

#### 2. Initial Server Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system
apt update && apt upgrade -y

# Create a non-root user (recommended)
adduser deploy
usermod -aG sudo deploy
su - deploy
```

#### 3. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun --version
```

#### 4. Install PM2

```bash
# Install PM2 globally with Bun
bun add -g pm2
```

#### 5. Clone and Setup Repository

```bash
git clone https://github.com/your-org/er1p-community.git
cd er1p-community/apps/race-indexer
bun install
```

#### 6. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

Set these variables:
```env
# For local database (simplest)
DATABASE_URL=file:local.db

# Or for Turso Cloud
# DATABASE_URL=libsql://your-db.turso.io
# DATABASE_AUTH_TOKEN=your-token

# Blockchain node
NODE_HOST=http://localhost:6876  # If running local node
# NODE_HOST=http://europe3.testnet.signum.network:6876  # Or public node

START_BLOCK=800000
VERBOSE=false
```

#### 7. Setup Database

```bash
# Generate and apply migrations
bun run db:push
```

#### 8. Configure PM2 Ecosystem

```bash
# Edit ecosystem.config.js
nano ecosystem.config.js
```

Update the path in the file:
```javascript
cwd: '/home/deploy/er1p-community/apps/race-indexer', // Your actual path
```

#### 9. Start with PM2

```bash
# Start the indexer
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs race-indexer

# Monitor
pm2 monit
```

#### 10. Enable Auto-Start on Reboot

```bash
# Generate startup script
pm2 startup

# Copy and run the command it outputs (something like):
# sudo env PATH=$PATH:/home/deploy/.bun/bin pm2 startup systemd -u deploy --hp /home/deploy

# Save PM2 configuration
pm2 save
```

### Running Alongside Signum Node

Edit `ecosystem.config.js` and uncomment the Signum node section:

```javascript
{
  name: 'signum-node',
  script: 'java',
  args: '-jar signum-node.jar',
  cwd: '/path/to/signum-node',
  // ... rest of config
}
```

Then restart PM2:
```bash
pm2 restart ecosystem.config.js
pm2 save
```

### Useful PM2 Commands

```bash
# Status of all processes
pm2 status

# View logs
pm2 logs                      # All processes
pm2 logs race-indexer         # Specific process
pm2 logs --lines 100          # Last 100 lines

# Restart
pm2 restart race-indexer      # Specific process
pm2 restart all               # All processes

# Stop
pm2 stop race-indexer
pm2 stop all

# Delete process
pm2 delete race-indexer

# Monitor CPU/Memory
pm2 monit

# Save current state
pm2 save

# Update PM2
bun update -g pm2
pm2 update
```

### Updating the Indexer

```bash
cd ~/er1p-community/apps/race-indexer
git pull
bun install
pm2 restart race-indexer
```

### Monitoring

Set up log rotation:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Option 2: Railway (Easiest)

### Initial Setup

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login and create project:
   ```bash
   railway login
   railway init
   ```

3. Set environment variables:
   ```bash
   railway variables set DATABASE_URL=libsql://your-db.turso.io
   railway variables set DATABASE_AUTH_TOKEN=your-token
   railway variables set NODE_HOST=http://your-signum-node.com
   railway variables set START_BLOCK=800000
   railway variables set VERBOSE=false
   ```

4. Deploy:
   ```bash
   railway up
   ```

### Update Deployment

```bash
git push  # Railway auto-deploys on push if connected to GitHub
# or
railway up
```

### Monitor

```bash
railway logs
railway status
```

**Cost**: ~$5-10/month for continuous operation

---

## Option 2: Fly.io (Free Tier Available)

### Initial Setup

1. Install Fly CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login and launch:
   ```bash
   fly auth login
   fly launch
   ```

3. Set secrets:
   ```bash
   fly secrets set DATABASE_URL=libsql://your-db.turso.io
   fly secrets set DATABASE_AUTH_TOKEN=your-token
   fly secrets set NODE_HOST=http://your-signum-node.com
   ```

4. Deploy:
   ```bash
   fly deploy
   ```

### Update Deployment

```bash
fly deploy
```

### Monitor

```bash
fly logs
fly status
```

**Cost**: Free tier covers 3 small VMs

---

## Option 5: Systemd Service (Alternative to PM2)

If you prefer systemd over PM2:

```bash
# Edit the service file
nano race-indexer.service

# Update paths and username
# Then install:
sudo cp race-indexer.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable race-indexer
sudo systemctl start race-indexer

# Check status
sudo systemctl status race-indexer

# View logs
sudo journalctl -u race-indexer -f
```

---

## Option 6: VPS (Manual Setup - Legacy)

**Note:** This section is kept for reference. Use Option 1 (VPS with automated setup) instead.

---

## Option 4: Docker (Any Platform)

You can deploy the Docker image to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Any platform supporting Docker

### Build and Run Locally

```bash
# Build
docker build -t race-indexer .

# Run
docker run -d \
  --name race-indexer \
  -e DATABASE_URL=libsql://your-db.turso.io \
  -e DATABASE_AUTH_TOKEN=your-token \
  -e NODE_HOST=http://your-node.com \
  -e START_BLOCK=800000 \
  race-indexer
```

### Deploy to Docker Hub

```bash
docker tag race-indexer your-username/race-indexer:latest
docker push your-username/race-indexer:latest
```

---

## Monitoring & Maintenance

### Health Checks

The indexer should run continuously. Monitor these:

1. **Process is running**: Check logs for activity
2. **Database connection**: Verify events are being indexed
3. **Blockchain sync**: Check current block vs chain height

### Recommended Monitoring

- **Uptime monitoring**: [UptimeRobot](https://uptimerobot.com/) (free)
- **Error tracking**: Check platform logs
- **Database size**: Monitor Turso usage

### Backup Strategy

Since Turso Cloud handles backups automatically, you just need to:
1. Keep your auth tokens secure
2. Document your environment variables
3. Keep your code in version control

---

## Cost Comparison

| Platform         | Cost/Month | Pros                                      | Best For                          |
|------------------|------------|-------------------------------------------|-----------------------------------|
| **VPS + PM2**    | $4-6       | Full control, run multiple services       | Community, alongside Signum node  |
| **Railway**      | $5-10      | Zero config, auto-deploy                  | Quick start, no server management |
| **Fly.io**       | Free-$5    | Free tier, global edge                    | Hobby projects, testing           |
| **Docker**       | Varies     | Portable, works anywhere                  | Teams, scalability                |
| **Systemd**      | $4-6       | Native Linux, no PM2 needed               | Minimalists                       |

---

## Recommended Setups

### For Community Members (Running Own Node)
```
Hetzner VPS ($4/mo) + PM2 + Local SQLite
├── Signum Node (own blockchain node)
└── Race Indexer (indexes race events)
```

### For Quick Start
```
Railway ($5-10/mo) + Turso Cloud (free)
└── Race Indexer (managed hosting)
```

### For Free Tier / Testing
```
Fly.io (free) + Turso Cloud (free)
└── Race Indexer
```

### For Production / High Availability
```
Docker + Cloud Provider + Turso Cloud
└── Scalable, managed infrastructure
```

---

## Troubleshooting

### Indexer stops syncing
- Check blockchain node is accessible
- Verify START_BLOCK is valid
- Check database connection

### Out of memory
- Increase VM size
- Reduce batch processing if implemented

### Database connection errors
- Verify DATABASE_URL and DATABASE_AUTH_TOKEN
- Check Turso database exists: `turso db list`
- Regenerate token if needed: `turso db tokens create race-indexer`

---

## Next Steps

1. Choose your deployment platform
2. Set up database (Turso Cloud)
3. Configure environment variables
4. Deploy!
5. Monitor logs to verify indexing is working

For questions, check the main README or open an issue.
