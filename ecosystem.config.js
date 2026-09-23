/**
 * PM2 Process Management Configuration for Hostinger / VPS Production Deployment
 * Run with: pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'dark-syndicate',
      script: './.next/standalone/server.js',
      instances: 'max', // or 2 on shared/VPS CPU
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/pm2-err.log',
      out_file: './logs/pm2-out.log',
      time: true,
    },
  ],
};
