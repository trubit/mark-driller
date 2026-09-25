import fs from 'fs';
import path from 'path';

console.log('🖼️ Running MarkDriller Production Image Inventory & Integrity Verification...\n');

let failed = false;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    failed = true;
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

// 1. Check public assets directory structure
const publicImagesDir = path.resolve(process.cwd(), 'public/assets/images');
const publicLogosDir = path.resolve(process.cwd(), 'public/assets/logos');

assert(fs.existsSync(publicImagesDir), 'public/assets/images directory exists');
assert(fs.existsSync(publicLogosDir), 'public/assets/logos directory exists');

// 2. Expected core photographic images
const requiredImages = [
  'cbt-practice.jpg',
  'students-study.jpg',
  'university-screening.jpg',
  'admin-desk.jpg',
  'classroom-study.jpg',
  'exam-hall.jpg',
  'library-revision.jpg',
  'technical-workshop.jpg',
  'digital-cbt.jpg',
  'books-study.jpg',
  'science-lab.jpg',
  'study-space.jpg',
  'verified-candidate-passport.jpg',
  'avatar-1.jpg',
  'avatar-2.jpg',
  'avatar-3.jpg',
];

console.log('\n--- Checking Required Photographic Images on Disk ---');
for (const img of requiredImages) {
  const fullPath = path.join(publicImagesDir, img);
  const exists = fs.existsSync(fullPath);
  assert(exists, `Required image ${img} exists in public/assets/images`);
  if (exists) {
    const stat = fs.statSync(fullPath);
    assert(stat.size > 1000, `Image ${img} is non-empty (${stat.size} bytes)`);
  }
}

// 3. Expected official board logos
const requiredLogos = [
  'jamb.png',
  'waec.png',
  'neco.png',
  'nabteb.png',
];

console.log('\n--- Checking Official Examination Board Logos ---');
for (const logo of requiredLogos) {
  const fullPath = path.join(publicLogosDir, logo);
  const exists = fs.existsSync(fullPath);
  assert(exists, `Board logo ${logo} exists in public/assets/logos`);
  if (exists) {
    const stat = fs.statSync(fullPath);
    assert(stat.size > 500, `Logo ${logo} is valid (${stat.size} bytes)`);
  }
}

// 4. Linux case-sensitivity check
console.log('\n--- Verifying Exact Filename Casing (Linux Case-Sensitivity) ---');
const actualImageFiles = fs.readdirSync(publicImagesDir);
for (const img of requiredImages) {
  assert(actualImageFiles.includes(img), `Image file casing matches exactly: ${img}`);
}
const actualLogoFiles = fs.readdirSync(publicLogosDir);
for (const logo of requiredLogos) {
  assert(actualLogoFiles.includes(logo), `Logo file casing matches exactly: ${logo}`);
}

// 5. Code audit: verify no external unsplash.com remains in src/
console.log('\n--- Auditing Source Code for Unreliable External CDN References ---');
function scanDir(dir: string, regex: RegExp, matches: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
      scanDir(fullPath, regex, matches);
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (regex.test(content)) {
        matches.push(fullPath);
      }
    }
  }
}

const unsplashMatches: string[] = [];
scanDir(path.resolve(process.cwd(), 'src'), /images\.unsplash\.com/i, unsplashMatches);
assert(unsplashMatches.length === 0, `Zero external images.unsplash.com links in src/ (found: ${unsplashMatches.length})`);

// 6. Verify SafeImage component exists
const safeImagePath = path.resolve(process.cwd(), 'src/components/SafeImage.tsx');
assert(fs.existsSync(safeImagePath), 'SafeImage.tsx component is implemented and present in src/components/');

if (failed) {
  console.error('\n❌ Image inventory verification encountered failures.');
  process.exit(1);
} else {
  console.log('\n✨ ALL PRODUCTION IMAGE INVENTORY CHECKS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}
