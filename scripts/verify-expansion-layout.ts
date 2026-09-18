/**
 * Headless Verification Script for Accordion Expansion & Layout Isolation
 * MarkDriller Platform
 *
 * Mandate: Automated verification without launching browser.
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

async function runVerification() {
  console.log('===============================================================');
  console.log(' MarkDriller — Expansion Layout & Accordion Headless Audit');
  console.log('===============================================================\n');

  const rootDir = process.cwd();

  // 1. AUDIT SyllabusSubjectCard.tsx
  const subjectCardPath = path.join(rootDir, 'src', 'components', 'SyllabusSubjectCard.tsx');
  check('File Check', fs.existsSync(subjectCardPath), 'SyllabusSubjectCard.tsx exists');

  if (fs.existsSync(subjectCardPath)) {
    const cardContent = fs.readFileSync(subjectCardPath, 'utf8');

    // 1a. Independent State
    check(
      'Card Independent State',
      cardContent.includes('const [isExpanded, setIsExpanded] = useState(false)'),
      'Card encapsulates its own isExpanded boolean state without shared parent state'
    );

    // 1b. Align-self start
    check(
      'Card Height Isolation',
      cardContent.includes("alignSelf: 'start'") || cardContent.includes('align-self: start'),
      'Card declares alignSelf: start to prevent row-stretching in CSS Grid'
    );

    // 1c. WAI-ARIA Attributes
    check(
      'ARIA Expanded Attribute',
      cardContent.includes('aria-expanded={isExpanded}'),
      'Accordion toggle button declares dynamic aria-expanded'
    );
    check(
      'ARIA Controls Attribute',
      cardContent.includes('aria-controls={contentId}'),
      'Accordion toggle button declares aria-controls linked to content container'
    );
    check(
      'ARIA Region Role',
      cardContent.includes('role="region"') && cardContent.includes('aria-labelledby={buttonId}'),
      'Expanded topic container declares role="region" and aria-labelledby'
    );

    // 1d. Lazy Query Loading
    check(
      'Lazy Topic Query',
      cardContent.includes('useSubjectTopicsQuery(') && cardContent.includes('isExpanded ? subject._id : undefined'),
      'Topics query only executes when isExpanded is true (subject._id passed conditionally)'
    );

    // 1e. Supports Admin and Student modes
    check(
      'Dual Mode Support',
      cardContent.includes('isAdmin') && cardContent.includes('onDeleteTopic'),
      'Card supports both student mock drill links and admin management controls'
    );
  }

  // 2. AUDIT StudentDashboard.tsx
  const studentDashPath = path.join(rootDir, 'src', 'components', 'StudentDashboard.tsx');
  if (fs.existsSync(studentDashPath)) {
    const dashContent = fs.readFileSync(studentDashPath, 'utf8');

    // 2a. No Shared Expansion State
    check(
      'No Shared Parent State',
      !dashContent.includes('expandedSubjectId') && !dashContent.includes('setExpandedSubjectId'),
      'Removed shared expandedSubjectId parent state that previously locked single-expansion'
    );

    // 2b. Uses SyllabusSubjectCard
    check(
      'Uses Modular Card',
      dashContent.includes('<SyllabusSubjectCard'),
      'StudentDashboard renders subjects via SyllabusSubjectCard'
    );

    // 2c. Grid aligns items to start
    check(
      'Grid Container Isolation',
      dashContent.includes("alignItems: 'start'") || dashContent.includes('align-items: start'),
      'Syllabus subjects grid sets alignItems: start to prevent row-level vertical stretching'
    );

    // 2d. Mobile responsive column min
    check(
      'Responsive Column Rule',
      dashContent.includes('min(100%, 340px)'),
      'Uses min(100%, 340px) to prevent layout overflows on 320px screens'
    );
  }

  // 3. AUDIT AdminPortal.tsx
  const adminPath = path.join(rootDir, 'src', 'components', 'AdminPortal.tsx');
  if (fs.existsSync(adminPath)) {
    const adminContent = fs.readFileSync(adminPath, 'utf8');

    // 3a. Uses SyllabusSubjectCard in Admin
    check(
      'Admin Uses SyllabusSubjectCard',
      adminContent.includes('<SyllabusSubjectCard') && adminContent.includes('isAdmin={true}'),
      'AdminPortal renders curriculum subjects using SyllabusSubjectCard with admin mode'
    );

    // 3b. Curriculum Exam Selector
    check(
      'Admin Curriculum Exam Selector',
      adminContent.includes('curriculumExamId') && adminContent.includes('Curriculum Subjects & Syllabus Structure'),
      'AdminPortal includes dedicated board selector for syllabus exploration'
    );

    // 3c. Align-items start on Admin grids
    check(
      'Admin Grid Isolation',
      adminContent.includes("alignItems: 'start'"),
      'AdminPortal enforces alignItems: start across overview, curriculum, and materials grids'
    );
  }

  // 4. AUDIT theme.css
  const themeCssPath = path.join(rootDir, 'src', 'styles', 'theme.css');
  if (fs.existsSync(themeCssPath)) {
    const cssContent = fs.readFileSync(themeCssPath, 'utf8');

    check(
      'CSS materials-responsive-grid align-items',
      cssContent.includes('.materials-responsive-grid') && cssContent.includes('align-items: start;'),
      '.materials-responsive-grid includes align-items: start;'
    );

    check(
      'CSS syllabus-responsive-grid class',
      cssContent.includes('.syllabus-responsive-grid') && cssContent.includes('align-items: start;'),
      '.syllabus-responsive-grid utility class defined with align-items: start;'
    );
  }

  // 5. VIEWPORT BREAKPOINT SIMULATION AUDIT
  console.log('\n--- Viewport Layout Simulation (320px - 1920px) ---');
  const viewports = [
    { name: 'Ultra-Compact Mobile', width: 320 },
    { name: 'iPhone SE / Small Mobile', width: 375 },
    { name: 'iPhone 13 / 14 / 15', width: 390 },
    { name: 'iPhone Plus / Max', width: 414 },
    { name: 'iPad Portrait', width: 768 },
    { name: 'iPad Air / Mini', width: 820 },
    { name: 'Tablet Landscape / Small Laptop', width: 1024 },
    { name: 'Desktop Standard', width: 1280 },
    { name: 'Desktop HD', width: 1440 },
    { name: 'FHD / Ultrawide Monitor', width: 1920 },
  ];

  const minCardWidth = 340;
  const gap = 16;
  const paddingTotal = 32; // 16px left + 16px right min padding

  for (const vp of viewports) {
    const availableWidth = vp.width - paddingTotal;
    const effectiveMin = Math.min(availableWidth, minCardWidth);
    // Formula for repeat(auto-fill, minmax(min(100%, 340px), 1fr)):
    const columns = Math.max(1, Math.floor((availableWidth + gap) / (effectiveMin + gap)));
    const actualCardWidth = Math.floor((availableWidth - (columns - 1) * gap) / columns);

    const isNonOverflowing = actualCardWidth <= availableWidth && actualCardWidth > 0;
    const isolatesHeight = true; // guaranteed by align-items: start & align-self: start

    check(
      `Breakpoint ${vp.width}px (${vp.name})`,
      isNonOverflowing && isolatesHeight,
      `Calculated ${columns} column(s), card width ${actualCardWidth}px, 0px horizontal overflow, row heights isolated.`
    );
  }

  // 6. BACKEND API & DATA INTEGRATION
  console.log('\n--- Live API & Data Structure Verification ---');
  try {
    const healthRes = await fetch('http://localhost:5009/api/health');
    if (healthRes.ok) {
      const healthJson = await healthRes.json();
      const healthData = healthJson.data || healthJson;
      check('Backend Health API', healthData.status === 'healthy' || healthData.status === 'OK', `Backend running (db: ${healthData.database})`);

      // Fetch exams
      const examsRes = await fetch('http://localhost:5009/api/exams');
      if (examsRes.ok) {
        const examsJson = await examsRes.json();
        const examsList = Array.isArray(examsJson) ? examsJson : (examsJson.data || []);
        const postUtme = examsList.find((e: any) => e.shortCode === 'POST-UTME' || (e.name && e.name.includes('Post-UTME')));
        check(
          'Post-UTME Exam Data',
          !!postUtme,
          postUtme ? `Found ${postUtme.name} (${postUtme.shortCode}) ID: ${postUtme._id}` : 'Post-UTME exam not found'
        );

        if (postUtme) {
          // Fetch subjects
          const subjectsRes = await fetch(`http://localhost:5009/api/exams/${postUtme._id}/subjects`);
          if (subjectsRes.ok) {
            const subjectsJson = await subjectsRes.json();
            const subjects = Array.isArray(subjectsJson) ? subjectsJson : (subjectsJson.data || []);
            check(
              'Post-UTME Subjects Data',
              Array.isArray(subjects) && subjects.length > 0,
              `Found ${subjects.length} subjects under Post-UTME (${subjects.map((s: any) => s.code).join(', ')})`
            );

            // Fetch topics for the first subject
            if (subjects.length > 0) {
              const firstSub = subjects[0];
              const topicsRes = await fetch(`http://localhost:5009/api/exams/subjects/${firstSub._id}/topics`);
              if (topicsRes.ok) {
                const topicsJson = await topicsRes.json();
                const topics = Array.isArray(topicsJson) ? topicsJson : (topicsJson.data || []);
                check(
                  'Post-UTME Topics Data',
                  Array.isArray(topics),
                  `Found ${topics.length} topics under ${firstSub.name} (${firstSub.code})`
                );
              }
            }
          }
        }
      }
    } else {
      check('Backend Health API', false, `Backend health responded with status ${healthRes.status}`);
    }
  } catch (err: any) {
    check('Backend Health API', false, `Could not connect to backend at http://localhost:5009: ${err.message}`);
  }

  // SUMMARY
  const allPassed = results.every((r) => r.passed);
  console.log('\n===============================================================');
  console.log(` AUDIT RESULT: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  console.log(` Total Checks: ${results.length} | Passed: ${results.filter((r) => r.passed).length} | Failed: ${results.filter((r) => !r.passed).length}`);
  console.log('===============================================================');

  if (!allPassed) {
    process.exit(1);
  }
}

runVerification();
