# 🚀 DARK SYNDICATE GAMING WORLD — Hostinger Production Deployment Guide

This guide provides instructions for deploying the **Dark Syndicate Gaming World** platform to **Hostinger Node.js Hosting** or **Hostinger VPS**.

---

## 📋 1. Prerequisites on Hostinger

- **Node.js**: Version `20.x LTS` (or `18.x+`) selected in hPanel.
- **Database**: MariaDB 10.6+ or MySQL 8.0+ created in hPanel Database Manager.
- **Process Manager**: PM2 (installed globally: `npm install -g pm2`).
- **Domain**: Pointing to Hostinger nameservers / DNS with active SSL.

---

## 🗄️ 2. Database Setup in Hostinger hPanel

1. Log in to **Hostinger hPanel** ➔ **Databases** ➔ **Management**.
2. Click **Create New MySQL Database and User**:
   - **Database Name**: `u123456789_darksyndicate`
   - **Username**: `u123456789_dsadmin`
   - **Password**: Generate a strong password (e.g. `DsGaming#Secure2026`).
3. Note your Hostinger MySQL connection string:
   ```env
   DATABASE_URL="mysql://u123456789_dsadmin:DsGaming#Secure2026@127.0.0.1:3306/u123456789_darksyndicate"
   ```

---

## ⚙️ 3. Environment Variables Configuration

Create a `.env` file in the project root directory:

```env
# Database (Hostinger MariaDB)
DATABASE_URL="mysql://u123456789_dsadmin:DsGaming#Secure2026@127.0.0.1:3306/u123456789_darksyndicate"

# JWT Authentication (64-character minimum)
JWT_SECRET="9f8a3c8e5d2b71a4f06e3d2c1b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# App URL (Your production domain)
NEXT_PUBLIC_APP_URL="https://darksyndicate.in"
NEXT_PUBLIC_APP_NAME="DARK SYNDICATE GAMING WORLD"
NODE_ENV="production"
PORT=3000

# Payment Gateways (Live mode)
PAYMENT_MODE="live"
RAZORPAY_KEY_ID="rzp_live_your_key_id"
RAZORPAY_KEY_SECRET="your_live_key_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Notifications & Timezone
APP_TIMEZONE="Asia/Kolkata"
```

---

## 🛠️ 4. Build & Deployment Execution

Connect to your server via SSH or the hPanel Web Terminal:

```bash
# 1. Clone repository
git clone https://github.com/hariharan-developer-31/darksyndicate.git
cd darksyndicate

# 2. Install dependencies
npm install

# 3. Synchronize database schema and default venue seed
npm run db:push
npm run db:seed

# 4. Compile optimized standalone production bundle
npm run build

# 5. Prepare standalone assets (copies public & static assets)
npm run deploy:prepare
```

---

## 🔄 5. Start with PM2 Process Manager

The project includes an optimized `ecosystem.config.js` with clustering and automatic memory limits:

```bash
# Start cluster
pm2 start ecosystem.config.js --env production

# Save process list to restart automatically on server reboot
pm2 save
pm2 startup
```

Verify the process is running:
```bash
pm2 status
pm2 logs dark-syndicate
```

---

## 🌐 6. Hostinger Node.js Application Manager / Reverse Proxy

If using **Hostinger Web Hosting (Node.js Application Manager)**:
1. In hPanel, go to **Node.js**.
2. Set:
   - **Node.js version**: `20.x`
   - **Application root**: `/public_html/darksyndicate`
   - **Application startup file**: `.next/standalone/server.js` (or custom startup script)
   - **Application URL**: `darksyndicate.in`
3. Click **Save** and **Restart**.

If using **Hostinger VPS with Nginx Reverse Proxy**:
```nginx
server {
    listen 80;
    server_name darksyndicate.in www.darksyndicate.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name darksyndicate.in www.darksyndicate.in;

    ssl_certificate /etc/letsencrypt/live/darksyndicate.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/darksyndicate.in/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🩺 7. Health & Uptime Monitoring

Once deployed, point your uptime monitor (e.g. UptimeRobot, Pingdom, Better Uptime) to:
```
https://darksyndicate.in/api/health
```

Expected JSON response (`200 OK`):
```json
{
  "status": "healthy",
  "release": "1.0.0-phase6",
  "system": "DARK SYNDICATE GAMING WORLD",
  "uptime": { "seconds": 3600, "formatted": "1h 0m 0s" },
  "database": { "status": "healthy", "latencyMs": 4 },
  "memory": { "rssMB": 85, "heapUsedMB": 42 }
}
```

---

## 🛡️ 8. Post-Deployment Security Checklist

- [x] Change all default seed passwords (`Admin@123456`, `Staff@123456`) in `/admin/staff`.
- [x] Verify SSL is forced across all HTTP traffic.
- [x] Run `npm run test:security` to confirm RBAC and header enforcement.
- [x] Run `npm run test:load` to confirm throughput under simulated traffic.
- [x] Verify backup automation in Hostinger Database Manager.
