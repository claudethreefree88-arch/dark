/**
 * DARK SYNDICATE — Production Deployment Asset Preparation Script
 * Ensures .next/standalone has all static assets and public files for standalone execution on Hostinger.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

console.log('📦  Preparing standalone production deployment bundle...');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(standaloneDir)) {
  console.error('❌  Error: .next/standalone does not exist. Run "npm run build" first.');
  process.exit(1);
}

try {
  // 1. Copy public directory
  console.log('   ➔ Copying public assets to standalone bundle...');
  copyDirRecursive(publicSrc, publicDest);

  // 2. Copy .next/static directory
  console.log('   ➔ Copying .next/static files to standalone bundle...');
  copyDirRecursive(staticSrc, staticDest);

  // 3. Create logs directory for PM2
  const logsDir = path.join(rootDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  console.log('✅  Standalone bundle successfully prepared for Hostinger deployment!');
  console.log('    Run: pm2 start ecosystem.config.js --env production');
} catch (err) {
  console.error('❌  Failed to prepare standalone bundle:', err);
  process.exit(1);
}
