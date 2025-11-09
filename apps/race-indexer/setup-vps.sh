#!/bin/bash
# VPS Setup Script for ER1P Race Indexer
# Tested on: Ubuntu 22.04, Debian 12
#
# This script installs all dependencies and sets up the race-indexer
# to run alongside a Signum node (optional) using PM2.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/your-repo/er1p-community/main/apps/race-indexer/setup-vps.sh | bash
#   # or
#   wget -qO- https://raw.githubusercontent.com/your-repo/er1p-community/main/apps/race-indexer/setup-vps.sh | bash

set -e

echo "========================================="
echo "ER1P Race Indexer - VPS Setup"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please do not run as root. Run as a regular user with sudo access.${NC}"
    exit 1
fi

echo -e "${GREEN}[1/7] Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

echo -e "${GREEN}[2/7] Installing dependencies...${NC}"
sudo apt-get install -y git curl unzip

echo -e "${GREEN}[3/7] Installing Bun...${NC}"
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash

    # Add bun to PATH for this session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"

    # Add to shell profile
    echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc

    echo -e "${GREEN}Bun installed successfully!${NC}"
else
    echo -e "${YELLOW}Bun already installed, skipping...${NC}"
fi

echo -e "${GREEN}[4/7] Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    bun add -g pm2
    echo -e "${GREEN}PM2 installed successfully!${NC}"
else
    echo -e "${YELLOW}PM2 already installed, skipping...${NC}"
fi

echo -e "${GREEN}[5/7] Cloning repository...${NC}"
read -p "Enter GitHub repository URL (or press Enter for default): " REPO_URL
REPO_URL=${REPO_URL:-"https://github.com/veridibloc/er1p-community.git"}

if [ ! -d "er1p-community" ]; then
    git clone "$REPO_URL"
    cd er1p-community/apps/race-indexer
else
    echo -e "${YELLOW}Repository already exists. Pulling latest changes...${NC}"
    cd er1p-community
    git pull
    cd apps/race-indexer
fi

echo -e "${GREEN}[6/7] Installing dependencies...${NC}"
bun install

echo -e "${GREEN}[7/7] Setting up environment...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${YELLOW}Please edit .env file with your configuration:${NC}"
    echo -e "  nano .env"
    echo ""
    echo -e "${YELLOW}Required variables:${NC}"
    echo -e "  - DATABASE_URL (use file:local.db for local SQLite or Turso Cloud URL)"
    echo -e "  - NODE_HOST (Signum node URL, e.g., http://localhost:6876)"
    echo -e "  - START_BLOCK (block to start indexing from)"
fi

# Create logs directory
mkdir -p logs

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Edit environment file: ${YELLOW}nano .env${NC}"
echo -e "  2. Update ecosystem.config.js paths: ${YELLOW}nano ecosystem.config.js${NC}"
echo -e "  3. Run database migrations: ${YELLOW}bun run db:push${NC}"
echo -e "  4. Start the indexer: ${YELLOW}pm2 start ecosystem.config.js${NC}"
echo -e "  5. Save PM2 configuration: ${YELLOW}pm2 save${NC}"
echo -e "  6. Enable auto-start on reboot: ${YELLOW}pm2 startup${NC}"
echo ""
echo -e "Useful PM2 commands:"
echo -e "  ${YELLOW}pm2 status${NC}        - Show running processes"
echo -e "  ${YELLOW}pm2 logs${NC}          - View logs"
echo -e "  ${YELLOW}pm2 restart all${NC}   - Restart all processes"
echo -e "  ${YELLOW}pm2 stop all${NC}      - Stop all processes"
echo -e "  ${YELLOW}pm2 monit${NC}         - Monitor CPU/Memory usage"
echo ""
