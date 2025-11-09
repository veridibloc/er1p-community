/**
 * PM2 Ecosystem Configuration for Race Indexer
 *
 * This file allows you to run the race-indexer alongside a Signum node
 * or any other services on the same machine.
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'race-indexer',
      script: 'bun',
      args: 'run index.ts',
      cwd: '/path/to/er1p-community/apps/race-indexer', // Update this path!
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'file:local.db', // Change for Turso Cloud
        // DATABASE_AUTH_TOKEN: 'your-token', // Uncomment for Turso Cloud
        NODE_HOST: 'http://localhost:6876', // Local Signum node
        START_BLOCK: '800000',
        VERBOSE: 'false'
      },
      error_file: './logs/race-indexer-error.log',
      out_file: './logs/race-indexer-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart strategy
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },

    // Uncomment if you're running a Signum node on the same machine
    /*
    {
      name: 'signum-node',
      script: 'java',
      args: '-jar signum-node.jar',
      cwd: '/path/to/signum-node', // Update this path!
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/signum-node-error.log',
      out_file: './logs/signum-node-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    */

    // Example: Add more services as needed
    /*
    {
      name: 'race-api',
      script: 'bun',
      args: 'run server.ts',
      cwd: '/path/to/race-api',
      instances: 1,
      autorestart: true,
      env: {
        PORT: 3000,
        DATABASE_URL: 'file:../race-indexer/local.db'
      }
    }
    */
  ],

  // Optional: Deploy configuration for multiple environments
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/er1p-community.git',
      path: '/var/www/er1p-community',
      'post-deploy': 'cd apps/race-indexer && bun install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
