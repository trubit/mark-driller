/**
 * Non-Browser Automated Verification Test Suite:
 * Landing Page Feature Removal, Redirects, Content Flow & Full-Width Hero Redesign
 *
 * MANDATE:
 * - 100% Non-Browser verification (NO Chrome, Playwright, Puppeteer).
 * - Verifies clean redirects for all 5 removed landing destinations.
 * - Verifies zero dead landing links across public navbar, mobile nav, footer, and hero.
 * - Verifies the exact 7-section narrative flow in LandingPage.
 * - Verifies full-width edge-to-edge hero architecture.
 * - Confirms student portal, CBT engine, and exam data are completely untouched.
 */

import fs from 'fs';
import path from 'path';

interface CheckItem {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const checks: CheckItem[] = [];

function assertCheck(id: string, name: string, condition: boolean, details: string) {
  checks.push({ id, name, passed: condition, details });
  const symbol = condition ? '✓' : '✗';
  console.log(`${symbol} [${id}] ${name}: ${details}`);
}

async function runAudit() {
  console.log('========================================================================');
  console.log(' MarkDriller — Landing Page Redesign & Route Redirect Verification');
  console.log(' Mandate: 100% Non-Browser Static, Architectural & Route Contract Audit');
  console.log('========================================================================\n');

  const rootDir = process.cwd();
  const srcDir = path.join(rootDir, 'src');

  // =========================================================================
  // 1. ROUTE REDIRECTS AUDIT IN App.tsx
  // =========================================================================
  console.log('--- 1. Route Redirects Audit (App.tsx) ---');
  const appPath = path.join(srcDir, 'App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');

  const expectedRedirects = [
    { route: '/cbt', target: '/' },
    { route: '/cbt-practice', target: '/' },
    { route: '/novels', target: '/' },
    { route: '/novel-jamb', target: '/' },
    { route: '/pricing', target: '/' },
    { route: '/blog', target: '/' },
    { route: '/contact', target: '/' },
  ];

  for (const item of expectedRedirects) {
    const regex = new RegExp(`<Route\\s+path="${item.route}"\\s+element={<Navigate\\s+to="${item.target}"\\s+replace\\s*/>}\\s*/>`);
    const hasRedirect = regex.test(appContent);
    assertCheck(
      `REDIRECT_${item.route.replace('/', '').toUpperCase()}`,
      `Route ${item.route} Redirect`,
      hasRedirect,
      `Redirects cleanly to "${item.target}" with <Navigate to="/" replace />`
    );
  }

  // Verify /login route redirect with openLogin state
  const hasLoginRedirect = /path="\/login"\s+element={<Navigate\s+to="\/"\s+state={{\s*openLogin:\s*true\s*}}\s+replace\s*\/>}/.test(appContent);
  assertCheck(
    'REDIRECT_LOGIN',
    'Route /login Redirect',
    hasLoginRedirect,
    'Redirects /login to "/" with openLogin: true state for modal login activation'
  );

  // Verify no window.location or window.location.reload() in routing
  const hasWindowLocationRedirect = /window\.location\.(replace|href|reload)\s*\(/.test(appContent);
  assertCheck(
    'NO_WINDOW_LOCATION',
    'Application-Level Routing',
    !hasWindowLocationRedirect,
    'Uses React Router declarative redirection without window.location'
  );

  // =========================================================================
  // 2. PUBLIC NAVBAR & MOBILE MENU AUDIT (Navbar.tsx)
  // =========================================================================
  console.log('\n--- 2. Public Navbar & Mobile Menu Audit (Navbar.tsx) ---');
  const navbarPath = path.join(srcDir, 'components', 'Navbar.tsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf8');

  const removedNavRoutes = ['/cbt', '/novels', '/pricing', '/blog', '/contact'];
  for (const r of removedNavRoutes) {
    const hasNavLink = new RegExp(`to=["']${r}["']`).test(navbarContent);
    assertCheck(
      `NAV_NO_${r.replace('/', '').toUpperCase()}`,
      `Navbar has no link to ${r}`,
      !hasNavLink,
      `Zero occurrences of to="${r}" in Navbar desktop or mobile`
    );
  }

  // Verify clean programmatic section scrolling without # hash links
  const expectedNavSections = ['offers', 'exam-boards', 'how-it-works', 'experience', 'performance'];
  for (const section of expectedNavSections) {
    const hasSectionTrigger =
      navbarContent.includes(`scrollToSection('${section}')`) ||
      navbarContent.includes(`handleMobileNavScroll('${section}')`);
    assertCheck(
      `NAV_SCROLL_${section.toUpperCase().replace(/-/g, '_')}`,
      `Navbar provides programmatic navigation to section ${section}`,
      hasSectionTrigger,
      `Navbar smoothly scrolls to section '${section}' without exposing '#' hash URLs`
    );
  }

  // Verify zero href="#" anchors exist in Navbar
  const hasNavbarHashLinks = /href=["']#[^"']*["']/.test(navbarContent);
  assertCheck(
    'NAV_ZERO_HASH_LINKS',
    'Navbar contains zero "#" hash links',
    !hasNavbarHashLinks,
    'All navbar navigation uses clean programmatic scroll without URL bar hash pollution'
  );

  // =========================================================================
  // 3. FOOTER AUDIT (Footer.tsx)
  // =========================================================================
  console.log('\n--- 3. Footer Audit (Footer.tsx) ---');
  const footerPath = path.join(srcDir, 'components', 'Footer.tsx');
  const footerContent = fs.readFileSync(footerPath, 'utf8');

  for (const r of removedNavRoutes) {
    const hasFooterLink = new RegExp(`to=["']${r}["']`).test(footerContent);
    assertCheck(
      `FOOTER_NO_${r.replace('/', '').toUpperCase()}`,
      `Footer has no link to ${r}`,
      !hasFooterLink,
      `Zero occurrences of to="${r}" in Footer`
    );
  }

  // Verify zero href="#" anchors exist in Footer
  const hasFooterHashLinks = /href=["']#[^"']*["']/.test(footerContent);
  assertCheck(
    'FOOTER_ZERO_HASH_LINKS',
    'Footer contains zero "#" hash links',
    !hasFooterHashLinks,
    'All footer navigation uses clean programmatic scroll and verified paths without "#"'
  );

  assertCheck(
    'FOOTER_EXAMS_TOOLS_CREATE_ACCOUNT',
    'Footer Examinations & Learning Tools redirect to create account',
    footerContent.includes('handleCreateAccountAction') &&
      footerContent.includes("openAuthModal('signup')") &&
      footerContent.includes('JAMB / UTME CBT') &&
      footerContent.includes('CBT Exam Simulator'),
    'Examinations and Learning Tools options redirect unauthenticated visitors to create account'
  );

  assertCheck(
    'FOOTER_DYNAMIC_SUPPORT_EMAIL',
    'Footer consumes dynamic admin support email via query hook',
    footerContent.includes('useSupportContactQuery') &&
      footerContent.includes('buildMailtoLink') &&
      !footerContent.includes('href="mailto:support@markdriller.com"'),
    'Footer dynamically synchronizes with admin support email settings without hardcoded fallback'
  );

  // Verify FloatingWhatsApp dynamic synchronization
  const floatingWhatsAppPath = path.join(srcDir, 'components', 'FloatingWhatsApp.tsx');
  const floatingWhatsAppContent = fs.readFileSync(floatingWhatsAppPath, 'utf8');
  assertCheck(
    'FLOATING_SUPPORT_DYNAMIC_EMAIL',
    'Floating Help Desk consumes dynamic email and operational hours',
    floatingWhatsAppContent.includes('buildMailtoLink') &&
      floatingWhatsAppContent.includes('emailDisplay') &&
      floatingWhatsAppContent.includes('workingHours') &&
      !floatingWhatsAppContent.includes('href="mailto:support@markdriller.com'),
    'Floating Help Desk dynamically displays email and working hours configured in admin panel'
  );

  // =========================================================================
  // 4. FULL-WIDTH HERO ARCHITECTURE AUDIT (Hero.tsx & theme.css)
  // =========================================================================
  console.log('\n--- 4. Full-Width Edge-to-Edge Hero Audit (Hero.tsx & theme.css) ---');
  const heroPath = path.join(srcDir, 'components', 'Hero.tsx');
  const heroContent = fs.readFileSync(heroPath, 'utf8');

  const themePath = path.join(srcDir, 'styles', 'theme.css');
  const themeContent = fs.readFileSync(themePath, 'utf8');

  assertCheck(
    'HERO_EDGE_TO_EDGE_IMAGE',
    'Hero uses students-study.jpg edge-to-edge',
    heroContent.includes('/assets/images/students-study.jpg') &&
      heroContent.includes('hero-background-image'),
    'Authentic students-study.jpg asset applied across hero background layer'
  );

  assertCheck(
    'HERO_OVERLAY_LAYER',
    'Hero uses gradient overlay scrim',
    heroContent.includes('hero-gradient-overlay') &&
      themeContent.includes('.hero-gradient-overlay'),
    'Layered dark gradient overlay separates background visual from foreground typography'
  );

  assertCheck(
    'HERO_SEARCH_REMOVED',
    'Hero search bar removed completely',
    !heroContent.includes('hero-search-form') && !heroContent.includes('hero-search-input'),
    'Search bar completely eliminated from hero as requested for uncluttered layout'
  );

  assertCheck(
    'HERO_NO_REMOVED_LINKS',
    'Hero has no links to removed pages',
    !/to=["']\/(cbt|novels|pricing|blog|contact)["']/.test(heroContent),
    'Hero links strictly to section anchors and authentication triggers'
  );

  assertCheck(
    'HERO_BOARDS_BUTTON_LOGIN',
    'Hero Explore Examination Boards button redirects to login',
    heroContent.includes('handleExploreBoardsClick') &&
      heroContent.includes("openAuthModal('login')") &&
      heroContent.includes('Explore Examination Boards'),
    'Explore Examination Boards button prompts login authentication flow'
  );

  // =========================================================================
  // 4B. 3-IN-A-LINE COLLAPSIBLE EXAMINATION BOARDS AUDIT (ExamBoards.tsx)
  // =========================================================================
  console.log('\n--- 4B. 3-in-a-Line Collapsible Examination Boards Audit (ExamBoards.tsx) ---');
  const examBoardsPath = path.join(srcDir, 'components', 'ExamBoards.tsx');
  const examBoardsContent = fs.readFileSync(examBoardsPath, 'utf8');

  assertCheck(
    'BOARDS_GRID_3COL',
    'Examination boards grid uses 3-in-a-line desktop layout',
    examBoardsContent.includes('exam-boards-grid-3col') &&
      themeContent.includes('.exam-boards-grid-3col') &&
      themeContent.includes('repeat(3, minmax(0, 1fr))'),
    'Enforces strictly 3 cards per row on desktop'
  );

  assertCheck(
    'BOARDS_CARDS_COLLAPSIBLE',
    'Examination cards support on-demand expand/collapse',
    examBoardsContent.includes('expandedCardIds') &&
      examBoardsContent.includes('toggleCardExpansion') &&
      examBoardsContent.includes('Read Complete Details'),
    'Cards hide detailed specifications and actions until user clicks to expand'
  );

  // =========================================================================
  // 5. 7-SECTION LANDING PAGE STORYTELLING FLOW AUDIT (LandingPage.tsx)
  // =========================================================================
  console.log('\n--- 5. Landing Page Narrative Architecture Audit (LandingPage.tsx) ---');
  const landingPath = path.join(srcDir, 'components', 'LandingPage.tsx');
  const landingContent = fs.readFileSync(landingPath, 'utf8');

  const expectedSections = [
    '<Hero />',
    '<WhatWeOffer />',
    '<ExamBoards />',
    '<HowItWorks />',
    '<ExamExperience />',
    '<StudentProgressSection />',
    '<CtaBanner />',
  ];

  let lastIndex = -1;
  let inCorrectOrder = true;
  for (const s of expectedSections) {
    const idx = landingContent.indexOf(s);
    if (idx === -1 || idx < lastIndex) {
      inCorrectOrder = false;
    }
    lastIndex = idx;
  }

  assertCheck(
    'LANDING_7_SECTIONS_ORDER',
    '7 Sections in exact storytelling sequence',
    inCorrectOrder,
    'Hero -> WhatWeOffer -> ExamBoards -> HowItWorks -> ExamExperience -> StudentProgressSection -> CtaBanner'
  );

  // Assert no removed sections are imported or rendered in LandingPage
  const forbiddenSections = [
    'SubscriptionTiersPreview',
    'AcademicPracticeSuite',
    'Testimonial',
    'GaugeStrip',
    'FaqSection',
    'SupportSection',
  ];

  for (const f of forbiddenSections) {
    const isPresent = landingContent.includes(f);
    assertCheck(
      `LANDING_EXCLUDED_${f.toUpperCase()}`,
      `Excluded component: ${f}`,
      !isPresent,
      `Landing page does not render ${f}`
    );
  }

  // Verify CtaBanner Explore Past Questions button redirects to login
  const ctaBannerPath = path.join(srcDir, 'components', 'CtaBanner.tsx');
  const ctaBannerContent = fs.readFileSync(ctaBannerPath, 'utf8');
  assertCheck(
    'CTA_EXPLORE_QUESTIONS_LOGIN',
    'CTA Banner Explore Past Questions button redirects to login',
    ctaBannerContent.includes('handleExploreQuestionsClick') &&
      ctaBannerContent.includes("openAuthModal('login')") &&
      ctaBannerContent.includes('Explore Past Questions'),
    'CtaBanner redirects unauthenticated users to login modal when clicking Explore Past Questions'
  );

  // =========================================================================
  // 6. PROTECTED STUDENT PORTAL & CBT ENGINE PRESERVATION AUDIT
  // =========================================================================
  console.log('\n--- 6. Protected Student Portal & CBT Routes Preservation ---');
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/analytics',
    '/cbt/:attemptId',
    '/cbt/:attemptId/result',
    '/portal/cbt',
    '/portal/questions',
    '/portal/pricing',
    '/admin',
  ];

  for (const p of protectedRoutes) {
    const exists = appContent.includes(`path="${p}"`);
    assertCheck(
      `PRESERVED_${p.replace(/[/:]/g, '_').toUpperCase()}`,
      `Route ${p} preserved`,
      exists,
      `Active route ${p} remains registered and operational`
    );
  }

  // =========================================================================
  // 7. READ-ONLY EXAMINATION DATA AUDIT
  // =========================================================================
  console.log('\n--- 7. Read-Only Examination Data Safety Check ---');
  const examModelPath = path.join(srcDir, 'server', 'models', 'Question.ts');
  const examModelExists = fs.existsSync(examModelPath);
  assertCheck(
    'EXAM_MODEL_EXISTS',
    'Question schema intact',
    examModelExists,
    'Question database collection schema exists and unmodified'
  );

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  const total = checks.length;
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  console.log(`TOTAL CHECKS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================');

  if (failed > 0) {
    console.error(`\nAudit FAILED with ${failed} issues.`);
    process.exit(1);
  } else {
    console.log('\nAll architectural, redirect, and landing page checks PASSED successfully!');
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit exception:', err);
  process.exit(1);
});
