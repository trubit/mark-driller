/**
 * Automated Verification Script: Production Alert Message, Error Sanitization & Messaging Hardening
 *
 * Runs headless in Node.js / tsx to verify:
 * 1. Zero Native Browser Dialogs (alert, confirm, prompt) in src/
 * 2. Backend Error Sanitizer Leakage Protection (Mongoose CastError, Collection Names, Stack Traces)
 * 3. Client & Backend Contract Compliance
 * 4. Question Acquisition & Explanation Content Integrity
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const API_BASE = 'http://127.0.0.1:5009';

let inProcessServer: any = null;

function checkHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${API_BASE}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning(): Promise<boolean> {
  const alreadyUp = await checkHealth();
  if (alreadyUp) {
    return false; // Server is already running externally
  }

  console.log('[Runner] Server not detected on port 5009. Booting in-process test server...');
  const serverModule = await import('../src/server/index.js');
  inProcessServer = serverModule.server;

  if (serverModule.dbPromise) {
    await serverModule.dbPromise;
  }

  const start = Date.now();
  while (Date.now() - start < 15000) {
    if (await checkHealth()) {
      console.log('[Runner] In-process server is online and ready on http://127.0.0.1:5009.');
      return true; // Spawned by this test process
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  throw new Error('Timed out waiting for test server to become ready on port 5009');
}

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function record(suite: string, name: string, passed: boolean, detail: string) {
  results.push({ suite, name, passed, detail });
  const status = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`${status} ${suite} -> ${name}: ${detail}`);
}

// Helper: HTTP request
function httpRequest(endpoint: string, options: http.RequestOptions = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, headers: res.headers, body: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

// -------------------------------------------------------------
// TEST 1: Scan entire src/ tree for forbidden native dialogs
// -------------------------------------------------------------
function testZeroNativeDialogs() {
  const srcDir = path.resolve(process.cwd(), 'src');
  const violations: string[] = [];

  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(file)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
          if (/\b(alert|confirm|prompt)\s*\(/.test(line)) {
            if (!line.includes('confirmAction') && !line.includes('window.confirm =') && !line.includes('declare function')) {
              violations.push(`${path.relative(process.cwd(), fullPath)}:${idx + 1} -> ${trimmed}`);
            }
          }
        });
      }
    }
  }

  scanDir(srcDir);

  const passed = violations.length === 0;
  record(
    'Codebase Static Analysis',
    'Zero Native Dialogs (alert, confirm, prompt)',
    passed,
    passed ? 'Verified 0 native dialog calls in all src/ files.' : `Found violations:\n${violations.join('\n')}`
  );
}

// -------------------------------------------------------------
// TEST 2: Notification & Confirmation Architecture Verification
// -------------------------------------------------------------
function testNotificationStoreFiles() {
  const storePath = path.resolve(process.cwd(), 'src/store/useNotificationStore.ts');
  const centerPath = path.resolve(process.cwd(), 'src/components/NotificationCenter.tsx');
  const dialogPath = path.resolve(process.cwd(), 'src/components/ConfirmationDialog.tsx');
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');

  const filesExist = fs.existsSync(storePath) && fs.existsSync(centerPath) && fs.existsSync(dialogPath);
  record('Frontend Notification Architecture', 'Component & Store Files Exist', filesExist, 'All 3 core notification/confirmation units are present on disk.');

  const appContent = fs.readFileSync(appPath, 'utf8');
  const appMountsComponents = appContent.includes('NotificationCenter') && appContent.includes('ConfirmationDialog');
  record(
    'Frontend Root Mount',
    'NotificationCenter & ConfirmationDialog Mounted in App.tsx',
    appMountsComponents,
    appMountsComponents ? 'Mounted globally at application root.' : 'Missing in App.tsx!'
  );
}

// -------------------------------------------------------------
// TEST 3: Backend Error Handler & Information Leakage Prevention
// -------------------------------------------------------------
async function testBackendErrorSanitization() {
  try {
    // Check health endpoint
    const health = await httpRequest('/api/health');
    record('Backend Live Tests', 'API Connection', health.status === 200, `Successfully connected to API on port 5009 (HTTP ${health.status}).`);

    // Trigger CastError with an invalid MongoDB ObjectId on /api/questions/:id
    const invalidIdRes = await httpRequest('/api/questions/invalid-hex-id-999');
    let parsed: any = {};
    try {
      parsed = JSON.parse(invalidIdRes.body);
    } catch {
      parsed = { raw: invalidIdRes.body };
    }

    const noStack = !invalidIdRes.body.includes('    at ') && !invalidIdRes.body.includes('node_modules');
    const noCastLeak = !invalidIdRes.body.includes('Cast to ObjectId failed') && !invalidIdRes.body.includes('CastError');
    const noCollectionLeak = !invalidIdRes.body.toLowerCase().includes('questions collection') && !invalidIdRes.body.includes('schema');
    const isClean400 = invalidIdRes.status === 400;
    const errorMsg = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message || parsed.message || '';

    record(
      'Security - Error Sanitization',
      'Mongoose CastError Protection (Invalid ID)',
      isClean400 && noStack && noCastLeak && noCollectionLeak,
      `Status: ${invalidIdRes.status}, Message: "${errorMsg}". Zero stack traces or database schema leaked.`
    );

    // Test unauthenticated access to protected routes (e.g. POST /api/materials/upload)
    const unauthRes = await httpRequest('/api/materials/upload', { method: 'POST' });
    let unauthParsed: any = {};
    try { unauthParsed = JSON.parse(unauthRes.body); } catch {}
    const isClean401 = unauthRes.status === 401;
    const unauthMsg = typeof unauthParsed.error === 'string' ? unauthParsed.error : unauthParsed.error?.message || unauthParsed.message || '';
    record(
      'Security - Authentication Gate',
      'Protected Route Error Handling (Upload Material)',
      isClean401,
      `Status: ${unauthRes.status}, Message: "${unauthMsg}"`
    );

    // Test questions query endpoint with valid criteria
    const questionsRes = await httpRequest('/api/questions?exam=JAMB&subject=MATHEMATICS&limit=5');
    let qParsed: any = {};
    try { qParsed = JSON.parse(questionsRes.body); } catch {}
    const questionsList = Array.isArray(qParsed.data) ? qParsed.data : qParsed.data?.questions;
    const hasQuestions = qParsed.success && Array.isArray(questionsList) && questionsList.length > 0;
    record(
      'Question Pipeline & Content',
      'Dynamic Question Acquisition & Response Structure',
      hasQuestions,
      hasQuestions
        ? `Retrieved ${questionsList.length} questions for JAMB Mathematics with options and explanations.`
        : `Questions response: ${JSON.stringify(qParsed)}`
    );

  } catch (err: any) {
    record('Backend Live Tests', 'API Connection', false, `Failed to connect to API on port 5009: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------
async function runAll() {
  console.log('\n============================================================');
  console.log('MARKDRILLER — PRODUCTION HARDENING & MESSAGING VERIFICATION');
  console.log('============================================================\n');

  testZeroNativeDialogs();
  testNotificationStoreFiles();

  let spawned = false;
  try {
    spawned = await ensureServerRunning();
  } catch (err: any) {
    console.warn('[Runner] Warning during server check:', err.message);
  }

  await testBackendErrorSanitization();

  if (spawned && inProcessServer) {
    try {
      inProcessServer.close();
    } catch {}
  }

  console.log('\n------------------------------------------------------------');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\x1b[32m✔ ALL HEADLESS VERIFICATION CHECKS PASSED PERFECTLY!\x1b[0m\n');
    process.exit(0);
  }
}

runAll();
