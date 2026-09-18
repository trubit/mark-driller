#!/usr/bin/env node
import http from 'node:http';

const HEALTH_URL = 'http://127.0.0.1:5009/api/health';
const TIMEOUT_MS = 45000;
const RETRY_INTERVAL_MS = 150;

const startTime = Date.now();

function checkHealth() {
  const req = http.get(HEALTH_URL, (res) => {
    if (res.statusCode === 200) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\x1b[32m[wait-for-server] MarkDriller API server ready on port 5009 (${elapsed}s). Starting Vite...\x1b[0m`);
      process.exit(0);
    } else {
      scheduleRetry();
    }
  });

  req.on('error', () => {
    scheduleRetry();
  });

  req.setTimeout(1000, () => {
    req.destroy();
    scheduleRetry();
  });
}

function scheduleRetry() {
  if (Date.now() - startTime > TIMEOUT_MS) {
    console.warn('\x1b[33m[wait-for-server] Timeout waiting for API server. Proceeding to launch Vite anyway...\x1b[0m');
    process.exit(0);
  }
  setTimeout(checkHealth, RETRY_INTERVAL_MS);
}

// Initial check
checkHealth();
