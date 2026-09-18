import { v2 as cloudinary } from 'cloudinary';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../src/server/config/env.js';
import { CloudinaryService } from '../src/server/services/cloudinaryService.js';
import https from 'node:https';

async function verifyCloudinary(): Promise<void> {
  console.log('============================================================');
  console.log('CLOUDINARY FILE STORAGE VERIFICATION & LIVE TEST');
  console.log('============================================================\n');

  console.log('1. Verifying Environment Variables:');
  console.log(`   STORAGE_PROVIDER:      ${env.STORAGE_PROVIDER}`);
  console.log(`   CLOUDINARY_CLOUD_NAME: ${env.CLOUDINARY_CLOUD_NAME ? '✓ Configured (' + env.CLOUDINARY_CLOUD_NAME + ')' : '✗ MISSING'}`);
  console.log(`   CLOUDINARY_API_KEY:    ${env.CLOUDINARY_API_KEY ? '✓ Configured (' + env.CLOUDINARY_API_KEY.slice(0, 4) + '...' + env.CLOUDINARY_API_KEY.slice(-3) + ')' : '✗ MISSING'}`);
  console.log(`   CLOUDINARY_API_SECRET: ${env.CLOUDINARY_API_SECRET ? '✓ Configured (length: ' + env.CLOUDINARY_API_SECRET.length + ')' : '✗ MISSING'}`);
  console.log(`   CLOUDINARY_FOLDER:     ${env.CLOUDINARY_FOLDER}\n`);

  if (!CloudinaryService.isConfigured()) {
    console.error('❌ CloudinaryService reports credentials are not fully configured.');
    process.exit(1);
  }

  // 2. Ping Cloudinary API directly
  console.log('2. Pinging Cloudinary API with credentials...');
  try {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const pingRes = await cloudinary.api.ping();
    console.log('   ✓ Cloudinary API Ping Successful:', JSON.stringify(pingRes));
  } catch (err: any) {
    console.error('   ❌ Cloudinary API Ping Failed:', err.message || err);
    process.exit(1);
  }

  // 3. Create a valid test PDF file
  console.log('\n3. Creating temporary sample test PDF...');
  const tempDir = path.resolve(process.cwd(), 'scratch');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const testPdfPath = path.join(tempDir, `cloudinary_test_${Date.now()}.pdf`);
  const testPdfContent = Buffer.from(
    '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources <<>> /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000015 00000 n \n0000000068 00000 n \n0000000125 00000 n \ntrailer\n<< /Root 1 0 R /Size 4 >>\nstartxref\n218\n%%EOF\n',
    'utf-8'
  );
  fs.writeFileSync(testPdfPath, testPdfContent);
  console.log(`   ✓ Sample PDF generated at: ${testPdfPath} (${testPdfContent.length} bytes)`);

  let uploadedPublicId = '';
  let uploadedUrl = '';

  try {
    // 4. Test upload through CloudinaryService
    console.log('\n4. Uploading sample PDF via CloudinaryService.uploadFile()...');
    const uploadResult = await CloudinaryService.uploadFile(testPdfPath, 'MarkDriller_Verification_Test.pdf');
    uploadedPublicId = uploadResult.publicId;
    uploadedUrl = uploadResult.secureUrl;

    console.log('   ✓ Upload Succeeded!');
    console.log(`     Public ID:   ${uploadResult.publicId}`);
    console.log(`     Secure URL:  ${uploadResult.secureUrl}`);
    console.log(`     Bytes:       ${uploadResult.bytes}`);
    console.log(`     Format:      ${uploadResult.format}`);

    // 5. Test secure streaming from Cloudinary
    console.log('\n5. Testing secure streaming from Cloudinary URL...');
    const stream = await CloudinaryService.streamFromCloudinary(uploadedUrl);
    console.log(`   ✓ Connected to Cloudinary stream. HTTP Status: ${stream.statusCode}`);

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });

    const downloadedBuffer = Buffer.concat(chunks);
    const magicHeader = downloadedBuffer.subarray(0, 5).toString('ascii');
    console.log(`   ✓ Streamed ${downloadedBuffer.length} bytes successfully.`);
    console.log(`   ✓ Validated PDF Magic Header: "${magicHeader}" (expected "%PDF-")`);

    if (magicHeader !== '%PDF-') {
      throw new Error(`Invalid PDF header received from Cloudinary: ${magicHeader}`);
    }

    // 6. Test file cleanup on Cloudinary
    console.log('\n6. Cleaning up test file on Cloudinary (CloudinaryService.deleteFile)...');
    await CloudinaryService.deleteFile(uploadedPublicId);
    console.log(`   ✓ File ${uploadedPublicId} deleted successfully from Cloudinary.`);

    console.log('\n============================================================');
    console.log('✔ CLOUDINARY STORAGE FULLY VERIFIED AND WORKING 100%!');
    console.log('============================================================');
  } catch (err: any) {
    console.error('\n❌ Cloudinary Verification Failed:', err.message || err);
    if (uploadedPublicId) {
      try {
        await CloudinaryService.deleteFile(uploadedPublicId);
      } catch (_) {}
    }
    process.exit(1);
  } finally {
    if (fs.existsSync(testPdfPath)) {
      fs.unlinkSync(testPdfPath);
    }
  }
}

verifyCloudinary().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
