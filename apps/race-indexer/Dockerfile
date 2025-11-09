# Dockerfile for race-indexer
# Optimized for Bun runtime

FROM oven/bun:1.2.15-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

# Copy source code
FROM base AS prerelease
COPY --from=install /app/node_modules node_modules
COPY . .

# Final production image
FROM base AS release
COPY --from=install /app/node_modules node_modules
COPY --from=prerelease /app .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Run the indexer
USER bun
ENTRYPOINT [ "bun", "run", "index.ts" ]
