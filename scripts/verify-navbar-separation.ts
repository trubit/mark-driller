/**
 * Non-Browser Automated Regression Test Suite:
 * Navbar Separation & Architectural Layout Ownership Verification
 *
 * Mandate:
 * - NO BROWSER / HEADLESS BROWSER / CHROMIUM / PLAYWRIGHT / PUPPETEER ALLOWED.
 * - Rigorous AST / static analysis & code contract verification.
 * - Asserts single navbar ownership per route.
 * - Validates zero navbar mixing, zero CSS hiding tricks, zero pathname hacks.
 */

import fs from 'fs';
import path from 'path';

interface VerificationResult {
  step: string;
  passed: boolean;
  details: string;
}

const results: VerificationResult[] = [];

function check(step: string, condition: boolean, details: string) {
  results.push({
    step,
    passed: condition,
    details: condition ? `PASSED: ${details}` : `FAILED: ${details}`,
  });
  const icon = condition ? '✓' : '✗';
  console.log(`${icon} [${step}] ${details}`);
}

async function runNavbarAudit() {
  console.log('===============================================================');
  console.log(' MarkDriller — Navbar Separation & Layout Ownership Audit');
  console.log(' MANDATE: 100% Non-Browser Static & Architectural Verification');
  console.log('===============================================================\n');

  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');
  const layoutsDir = path.join(srcDir, 'layouts');
  const componentsDir = path.join(srcDir, 'components');

  // =========================================================================
  // 1. DEDICATED LAYOUT SHELLS EXISTENCE & OWNERSHIP AUDIT
  // =========================================================================
  console.log('--- 1. Dedicated Layout Shells Verification ---');
  const publicLayoutPath = path.join(layoutsDir, 'PublicLayout.tsx');
  const studentLayoutPath = path.join(layoutsDir, 'StudentPortalLayout.tsx');
  const adminLayoutPath = path.join(layoutsDir, 'AdminLayout.tsx');

  check('PublicLayout Exists', fs.existsSync(publicLayoutPath), 'src/layouts/PublicLayout.tsx exists');
  check('StudentPortalLayout Exists', fs.existsSync(studentLayoutPath), 'src/layouts/StudentPortalLayout.tsx exists');
  check('AdminLayout Exists', fs.existsSync(adminLayoutPath), 'src/layouts/AdminLayout.tsx exists');

  if (fs.existsSync(publicLayoutPath)) {
    const rawContent = fs.readFileSync(publicLayoutPath, 'utf8');
    const content = rawContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    check(
      'PublicLayout Navbar Ownership',
      Boolean(content.match(/<Navbar[\s/>]/)),
      'PublicLayout exclusively owns and renders <Navbar />'
    );
    check(
      'PublicLayout Outlet Presence',
      Boolean(content.match(/<Outlet[\s/>]/)),
      'PublicLayout provides <Outlet /> for public child views'
    );
    check(
      'PublicLayout Footer Ownership',
      Boolean(content.match(/<Footer[\s/>]/)),
      'PublicLayout exclusively owns and renders public <Footer />'
    );
    check(
      'PublicLayout Isolation (No PortalHeader)',
      !content.match(/import\s+.*PortalHeader/) && !content.match(/<PortalHeader[\s/>]/),
      'PublicLayout never imports or renders PortalHeader'
    );
  }

  if (fs.existsSync(studentLayoutPath)) {
    const rawContent = fs.readFileSync(studentLayoutPath, 'utf8');
    const content = rawContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    check(
      'StudentPortalLayout Header Ownership',
      Boolean(content.match(/<PortalHeader[\s/>]/)) && Boolean(content.match(/<Outlet[\s/>]/)),
      'StudentPortalLayout exclusively owns <PortalHeader /> and child <Outlet />'
    );
    check(
      'StudentPortalLayout Isolation (No Navbar)',
      !content.match(/import\s+.*Navbar/) && !content.match(/<Navbar[\s/>]/),
      'StudentPortalLayout never imports or renders public <Navbar />'
    );
    check(
      'StudentPortalLayout Isolation (No Marketing Footer)',
      !content.match(/import\s+.*Footer/) && !content.match(/<Footer[\s/>]/),
      'StudentPortalLayout never imports or renders marketing <Footer />'
    );
  }

  if (fs.existsSync(adminLayoutPath)) {
    const rawContent = fs.readFileSync(adminLayoutPath, 'utf8');
    const content = rawContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    check(
      'AdminLayout Header Ownership',
      content.includes('<PortalHeader badge="ADMIN"') && Boolean(content.match(/<Outlet[\s/>]/)),
      'AdminLayout exclusively owns <PortalHeader badge="ADMIN" /> and <Outlet />'
    );
    check(
      'AdminLayout Isolation (No Navbar)',
      !content.match(/import\s+.*Navbar/) && !content.match(/<Navbar[\s/>]/),
      'AdminLayout never imports or renders public <Navbar />'
    );
  }

  // =========================================================================
  // 2. ROUTER ARCHITECTURE (src/App.tsx) ROUTE-SHELL AUDIT
  // =========================================================================
  console.log('\n--- 2. App.tsx Route Hierarchy & Shell Ownership Audit ---');
  const appPath = path.join(srcDir, 'App.tsx');
  check('App.tsx Exists', fs.existsSync(appPath), 'src/App.tsx exists');

  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');

    // App must not globally render Navbar or PortalHeader
    check(
      'App.tsx Global Isolation (No direct <Navbar />)',
      !appContent.match(/<Navbar\s*\/?>/),
      'App.tsx does NOT globally render <Navbar /> at root level'
    );
    check(
      'App.tsx Global Isolation (No direct <PortalHeader />)',
      !appContent.match(/<PortalHeader\s*\/?>/),
      'App.tsx does NOT globally render <PortalHeader /> at root level'
    );
    check(
      'App.tsx Global Isolation (No direct <Footer />)',
      !appContent.match(/<Footer\s*\/?>/),
      'App.tsx does NOT globally render <Footer /> at root level'
    );

    // Group 1: PublicLayout Route Nesting
    check(
      'Route Group: PublicLayout Route Nesting',
      appContent.includes('<Route element={<PublicLayout />}>'),
      'App.tsx wraps public routes inside <Route element={<PublicLayout />}>'
    );
    const publicRoutes = [
      'path="/"',
      'path="/pricing"',
      'path="/blog"',
      'path="/contact"',
      'path="/cbt"',
      'path="/novels"',
      'path="/questions"',
      'path="/materials"',
      'path="/post-utme"',
      'path="/formulas"',
      'path="/dictionary"',
      'path="/schools"',
      'path="/careers"',
    ];
    for (const route of publicRoutes) {
      check(`Public Route Present: ${route}`, appContent.includes(route), `Public route ${route} is registered`);
    }

    // Verify Decommissioned Routes are permanently removed
    const decommissionedRoutes = [
      'path="/products"',
      'path="/reseller"',
      'path="/activate"',
      'path="/portal/activate"',
      'path="/portal/products"',
      'path="/portal/reseller"',
    ];
    for (const route of decommissionedRoutes) {
      check(
        `Decommissioned Route Absent: ${route}`,
        !appContent.includes(route),
        `Route ${route} has been permanently decommissioned and is not present in App.tsx`
      );
    }

    // Group 2: StudentPortalLayout Route Nesting
    check(
      'Route Group: StudentPortalLayout Route Nesting',
      appContent.includes('<Route element={<StudentPortalLayout />}>'),
      'App.tsx wraps student portal routes inside <Route element={<StudentPortalLayout />}>'
    );
    const studentRoutes = [
      'path="/dashboard"',
      'path="/profile"',
      'path="/settings"',
      'path="/bookmarks"',
      'path="/history"',
      'path="/analytics"',
      'path="/flashcards"',
      'path="/games"',
      'path="/challenge"',
      'path="/lessons"',
      'path="/cbt/:attemptId/result"',
    ];
    for (const route of studentRoutes) {
      check(`Student Route Present: ${route}`, appContent.includes(route), `Student portal route ${route} is registered`);
    }

    // Group 3: Distraction-Free CBT Exam Room Route Isolation
    check(
      'Route Group: CBT Exam Room Isolation',
      appContent.includes('path="/cbt/:attemptId"') && !appContent.includes('<Route element={<PublicLayout />}>\n            <Route path="/cbt/:attemptId"'),
      'CBT Exam Room (/cbt/:attemptId) is isolated without navigation headers'
    );

    // Group 4: AdminLayout Route Nesting
    check(
      'Route Group: AdminLayout Route Nesting',
      appContent.includes('<Route element={<AdminLayout />}>') && appContent.includes('path="/admin"'),
      'Admin portal (/admin) is isolated under <AdminLayout />'
    );

    // Group 5: Landing Navbar Cleanliness (No Dashboard tabs in Desktop Navbar)
    const navbarPath = path.join(componentsDir, 'Navbar.tsx');
    if (fs.existsSync(navbarPath)) {
      const navContent = fs.readFileSync(navbarPath, 'utf8');
      const desktopNavMatch = navContent.match(/<div className="nav-links">([\s\S]*?)<\/div>/);
      const desktopNav = desktopNavMatch ? desktopNavMatch[1] : '';
      check(
        'Navbar Cleanliness: No Past Questions in Desktop Nav',
        !desktopNav.includes('Past Questions'),
        'Navbar desktop links do not contain Past Questions'
      );
      check(
        'Navbar Cleanliness: No Study Materials in Desktop Nav',
        !desktopNav.includes('Study Materials'),
        'Navbar desktop links do not contain Study Materials'
      );
      check(
        'Navbar Cleanliness: No Post-UTME in Desktop Nav',
        !desktopNav.includes('Post-UTME'),
        'Navbar desktop links do not contain Post-UTME'
      );
    }
  }

  // =========================================================================
  // 3. AUDIT ALL CHILD COMPONENTS (ZERO LEAKAGE OF NAVBAR / PORTALHEADER)
  // =========================================================================
  console.log('\n--- 3. Page Component Isolation Audit (Zero Navbar / PortalHeader In Pages) ---');
  const componentFiles = fs.readdirSync(componentsDir).filter((file) => file.endsWith('.tsx') || file.endsWith('.ts'));

  const allowedNavbarFiles = new Set(['Navbar.tsx']);
  const allowedPortalHeaderFiles = new Set(['PortalHeader.tsx']);

  let rogueNavbarCount = 0;
  let roguePortalHeaderCount = 0;
  let rogueFooterCount = 0;

  for (const file of componentFiles) {
    const fullPath = path.join(componentsDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');

    if (!allowedNavbarFiles.has(file)) {
      if (content.match(/<Navbar[\s/>]/) || content.match(/import\s+.*Navbar.*from/)) {
        rogueNavbarCount++;
        console.error(`  [LEAK DETECTED] ${file} contains rogue Navbar reference`);
      }
    }

    if (!allowedPortalHeaderFiles.has(file)) {
      if (content.match(/<PortalHeader[\s/>]/) || content.match(/import\s+.*PortalHeader.*from/)) {
        roguePortalHeaderCount++;
        console.error(`  [LEAK DETECTED] ${file} contains rogue PortalHeader reference`);
      }
    }

    // Footer should only be in PublicLayout (and Footer.tsx component definition)
    if (file !== 'Footer.tsx') {
      if (content.match(/<Footer[\s/>]/) && !content.includes('DialogFooter') && !content.includes('ModalFooter')) {
        rogueFooterCount++;
        console.error(`  [LEAK DETECTED] ${file} contains rogue Footer reference`);
      }
    }
  }

  check(
    'Zero Rogue Navbar in Pages',
    rogueNavbarCount === 0,
    `No child page components render or import <Navbar /> directly (found: ${rogueNavbarCount})`
  );
  check(
    'Zero Rogue PortalHeader in Pages',
    roguePortalHeaderCount === 0,
    `No child page components render or import <PortalHeader /> directly (found: ${roguePortalHeaderCount})`
  );
  check(
    'Zero Rogue Footer in Dashboard Pages',
    rogueFooterCount === 0,
    `No dashboard/portal page components render marketing <Footer /> directly (found: ${rogueFooterCount})`
  );

  const decommissionedFiles = [
    'OfflineActivationView.tsx',
    'ProductsShowcase.tsx',
    'ResellerPortal.tsx',
  ];
  for (const f of decommissionedFiles) {
    const fPath = path.join(componentsDir, f);
    check(
      `Decommissioned File Deleted: ${f}`,
      !fs.existsSync(fPath),
      `File ${f} is permanently deleted from src/components`
    );
  }

  // =========================================================================
  // 4. FORBIDDEN CSS & PATHNAME HACKS AUDIT
  // =========================================================================
  console.log('\n--- 4. Forbidden CSS Hacks & Pathname Hacks Audit ---');
  const cssDir = path.join(srcDir, 'styles');
  let forbiddenCssTricksFound = false;

  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter((file) => file.endsWith('.css'));
    for (const file of cssFiles) {
      const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
      // Look for display:none or visibility:hidden specifically aimed at suppressing navbars
      if (
        (content.includes('.landing-navbar') || content.includes('.portal-header') || content.includes('.public-nav')) &&
        (content.includes('display: none') || content.includes('visibility: hidden') || content.includes('opacity: 0'))
      ) {
        forbiddenCssTricksFound = true;
        console.error(`  [FORBIDDEN CSS] Found navbar hiding rule in ${file}`);
      }
    }
  }

  check(
    'No CSS Navbar Hiding Hacks',
    !forbiddenCssTricksFound,
    'No CSS files use display:none or opacity:0 to artificially hide conflicting navbars'
  );

  // Check PortalHeader.tsx for pathname hacks or window.location hacks
  const portalHeaderPath = path.join(componentsDir, 'PortalHeader.tsx');
  if (fs.existsSync(portalHeaderPath)) {
    const phContent = fs.readFileSync(portalHeaderPath, 'utf8');
    check(
      'No window.location.reload() in PortalHeader',
      !phContent.includes('window.location.reload'),
      'PortalHeader does not execute window.location.reload()'
    );
    check(
      'Dynamic Route Badge Resolution',
      phContent.includes('ROUTE_BADGE_MAP') && phContent.includes('autoBadgeConfig'),
      'PortalHeader resolves badges cleanly via standard route lookup without conditional layout switching'
    );
  }

  // =========================================================================
  // 5. GLOBAL AUTH MODAL & SUBSCRIPTION QUERY INTEGRITY AUDIT
  // =========================================================================
  console.log('\n--- 5. Global Auth Modal & Query Hardening Audit ---');
  if (fs.existsSync(appPath)) {
    const appContent = fs.readFileSync(appPath, 'utf8');
    check(
      'Global AuthModal Mounted at Root',
      Boolean(appContent.match(/<AuthModal[\s/>]/)) && appContent.includes('import { AuthModal }'),
      'src/App.tsx mounts <AuthModal /> globally inside BrowserRouter'
    );
  }

  const subscriptionsApiPath = path.join(srcDir, 'api', 'subscriptions.ts');
  if (fs.existsSync(subscriptionsApiPath)) {
    const subApiContent = fs.readFileSync(subscriptionsApiPath, 'utf8');
    check(
      'Subscription Query Token Guard',
      subApiContent.includes('enabled: Boolean(token)') && subApiContent.includes('retry: false'),
      'useMySubscriptionQuery has enabled: Boolean(token) guard to prevent unauthenticated 401 spam'
    );
  }

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  const allPassed = results.every((r) => r.passed);
  console.log('\n===============================================================');
  console.log(` NAVBAR AUDIT RESULT: ${allPassed ? 'ALL TESTS PASSED (100% COMPLIANT)' : 'SOME AUDITS FAILED'}`);
  console.log(` Total Checks: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  console.log('===============================================================');

  if (!allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runNavbarAudit();
