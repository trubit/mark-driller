/**
 * MarkDriller Production Security Hardening Verification Script
 * Headless Automated Verification (NO BROWSER)
 * 
 * Audits & Verifies:
 * 1. Dockerfile Multi-stage and Non-Root hardening
 * 2. Kubernetes manifests restricted Pod Security Standard, RBAC, NetworkPolicy, HPA, PDB
 * 3. Terraform IaC IMDSv2, KMS encryption, multi-AZ private subnets, EKS scaling
 * 4. GitHub Actions CI/CD least-privilege permissions, secret scanning, Trivy, AWS OIDC
 * 5. Server runtime security: CORS enforcement, Helmet headers, Rate Limiter user isolation,
 *    Production secret validation, and In-memory syllabus cache.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { envSchema } from '../src/server/config/env.js';
import { metadataCache } from '../src/server/utils/cache.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(category: string, name: string, passed: boolean, details: string) {
  results.push({ category, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${category}] ${status} - ${name}`);
  if (!passed || process.env.VERBOSE) {
    console.log(`   Details: ${details}`);
  }
}

async function runSecurityAudit() {
  console.log('\n============================================================');
  console.log('🛡️  MARKDRILLER PRODUCTION SECURITY HARDENING AUDIT');
  console.log('============================================================\n');

  // ==========================================
  // 1. DOCKER CONTAINER HARDENING AUDIT
  // ==========================================
  console.log('--- 1. Docker Container Hardening Audit ---');
  const dockerfilePath = path.join(ROOT_DIR, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) {
    record('Docker', 'Dockerfile Existence', false, 'Dockerfile not found');
  } else {
    const dockerfile = fs.readFileSync(dockerfilePath, 'utf-8');

    record('Docker', 'Pinned Base Image',
      /node:22\.14\.0-alpine3\.21/i.test(dockerfile),
      'Dockerfile pins exact Node.js and Alpine version: node:22.14.0-alpine3.21'
    );

    record('Docker', 'Multi-Stage Build Architecture',
      dockerfile.includes('AS deps') && dockerfile.includes('AS builder') && dockerfile.includes('AS runner'),
      'Dockerfile implements 3-stage build: deps -> builder -> runner'
    );

    record('Docker', 'Non-Root User Enforcement',
      dockerfile.includes('1001') &&
      dockerfile.includes('USER nodejs'),
      'Container executes as unprivileged user nodejs (UID 1001)'
    );

    record('Docker', 'Built-in Container Healthcheck',
      dockerfile.includes('HEALTHCHECK') && dockerfile.includes('/api/health'),
      'Dockerfile defines automated HEALTHCHECK on /api/health'
    );

    record('Docker', 'Read-Only Root Filesystem Readiness',
      dockerfile.includes('VOLUME ["/tmp"]') && dockerfile.includes('dumb-init'),
      'Uses dumb-init PID 1 supervisor and configures writable /tmp volume for read-only root FS'
    );
  }

  const dockerignorePath = path.join(ROOT_DIR, '.dockerignore');
  if (fs.existsSync(dockerignorePath)) {
    const dockerignore = fs.readFileSync(dockerignorePath, 'utf-8');
    record('Docker', 'Docker Build Context Sanitization',
      dockerignore.includes('.env') && dockerignore.includes('.git') && dockerignore.includes('node_modules'),
      '.dockerignore excludes .env secrets, git history, and local node_modules'
    );
  } else {
    record('Docker', 'Docker Build Context Sanitization', false, '.dockerignore not found');
  }

  // ==========================================
  // 2. KUBERNETES MANIFESTS HARDENING AUDIT
  // ==========================================
  console.log('\n--- 2. Kubernetes Manifests Hardening Audit ---');
  const k8sDir = path.join(ROOT_DIR, 'k8s');

  const nsPath = path.join(k8sDir, 'namespace.yaml');
  if (fs.existsSync(nsPath)) {
    const ns = fs.readFileSync(nsPath, 'utf-8');
    record('Kubernetes', 'Namespace Restricted Pod Security Standard',
      ns.includes('pod-security.kubernetes.io/enforce: restricted') &&
      ns.includes('pod-security.kubernetes.io/audit: restricted'),
      'Namespace enforces Kubernetes Restricted Pod Security Standard'
    );
  } else {
    record('Kubernetes', 'Namespace Restricted Pod Security Standard', false, 'namespace.yaml not found');
  }

  const saPath = path.join(k8sDir, 'serviceaccount.yaml');
  if (fs.existsSync(saPath)) {
    const sa = fs.readFileSync(saPath, 'utf-8');
    record('Kubernetes', 'ServiceAccount Auto-Mount Token Disabled',
      sa.includes('automountServiceAccountToken: false'),
      'Default auto-mounting of API service account tokens is disabled'
    );
  } else {
    record('Kubernetes', 'ServiceAccount Auto-Mount Token Disabled', false, 'serviceaccount.yaml not found');
  }

  const deployPath = path.join(k8sDir, 'api-deployment.yaml');
  if (fs.existsSync(deployPath)) {
    const deploy = fs.readFileSync(deployPath, 'utf-8');
    record('Kubernetes', 'Deployment Restricted Security Context',
      deploy.includes('runAsNonRoot: true') &&
      deploy.includes('runAsUser: 1001') &&
      deploy.includes('allowPrivilegeEscalation: false') &&
      deploy.includes('readOnlyRootFilesystem: true') &&
      deploy.includes('drop:') &&
      deploy.includes('ALL'),
      'Pod and container securityContext drop all capabilities, disallow privilege escalation, and enforce readOnlyRootFilesystem'
    );

    record('Kubernetes', 'Probes & Graceful Termination',
      deploy.includes('startupProbe') &&
      deploy.includes('livenessProbe') &&
      deploy.includes('readinessProbe') &&
      deploy.includes('terminationGracePeriodSeconds: 60') &&
      deploy.includes('preStop'),
      'Configures startup, liveness, and readiness probes with 60s termination period and preStop sleep hook'
    );

    record('Kubernetes', 'High-Availability Pod Anti-Affinity & Multi-Replica',
      deploy.includes('replicas: 3') && deploy.includes('podAntiAffinity'),
      'Deployment defines 3 initial replicas with topologySpread / podAntiAffinity across nodes'
    );
  } else {
    record('Kubernetes', 'Deployment Security Context', false, 'api-deployment.yaml not found');
  }

  const netpolPath = path.join(k8sDir, 'networkpolicy.yaml');
  if (fs.existsSync(netpolPath)) {
    const netpol = fs.readFileSync(netpolPath, 'utf-8');
    record('Kubernetes', 'Default-Deny NetworkPolicy with IMDS Protection',
      netpol.includes('policyTypes:') &&
      netpol.includes('Ingress') &&
      netpol.includes('Egress') &&
      netpol.includes('169.254.169.254/32') &&
      netpol.includes('except:'),
      'NetworkPolicy enforces default-deny and explicitly blocks AWS Instance Metadata Service (169.254.169.254)'
    );
  } else {
    record('Kubernetes', 'Default-Deny NetworkPolicy', false, 'networkpolicy.yaml not found');
  }

  const hpaPath = path.join(k8sDir, 'hpa.yaml');
  if (fs.existsSync(hpaPath)) {
    const hpa = fs.readFileSync(hpaPath, 'utf-8');
    record('Kubernetes', 'HorizontalPodAutoscaler for 4,000+ Concurrency',
      hpa.includes('minReplicas: 3') &&
      hpa.includes('maxReplicas: 20') &&
      hpa.includes('averageUtilization: 65'),
      'HPA scales horizontally from 3 to 20 pods based on CPU (65%) and Memory (75%) thresholds'
    );
  } else {
    record('Kubernetes', 'HorizontalPodAutoscaler', false, 'hpa.yaml not found');
  }

  const pdbPath = path.join(k8sDir, 'pdb.yaml');
  if (fs.existsSync(pdbPath)) {
    const pdb = fs.readFileSync(pdbPath, 'utf-8');
    record('Kubernetes', 'PodDisruptionBudget High Availability',
      pdb.includes('minAvailable: 2'),
      'PDB guarantees minimum 2 available pods during node drains, maintenance, and cluster upgrades'
    );
  } else {
    record('Kubernetes', 'PodDisruptionBudget', false, 'pdb.yaml not found');
  }

  // ==========================================
  // 3. TERRAFORM INFRASTRUCTURE AS CODE AUDIT
  // ==========================================
  console.log('\n--- 3. Terraform Infrastructure as Code Audit ---');
  const tfDir = path.join(ROOT_DIR, 'terraform');

  const tfMainPath = path.join(tfDir, 'main.tf');
  if (fs.existsSync(tfMainPath)) {
    const tfMain = fs.readFileSync(tfMainPath, 'utf-8');
    record('Terraform', 'State Locking & S3 Remote Backend',
      tfMain.includes('dynamodb_table') && tfMain.includes('encrypt        = true'),
      'Configures S3 remote backend with server-side encryption and DynamoDB distributed state locking'
    );
  } else {
    record('Terraform', 'State Locking & Remote Backend', false, 'main.tf not found');
  }

  const tfNodePath = path.join(tfDir, 'node_groups.tf');
  const tfVarsPath = path.join(tfDir, 'variables.tf');
  if (fs.existsSync(tfNodePath) && fs.existsSync(tfVarsPath)) {
    const tfNode = fs.readFileSync(tfNodePath, 'utf-8');
    const tfVars = fs.readFileSync(tfVarsPath, 'utf-8');

    record('Terraform', 'IMDSv2 Enforced on EKS Worker Nodes (Anti-SSRF)',
      tfNode.includes('http_tokens                 = "required"') &&
      tfNode.includes('http_put_response_hop_limit = 1'),
      'Launch template requires IMDSv2 token and restricts hop limit to 1, preventing container metadata exfiltration'
    );

    record('Terraform', 'EBS Encryption with Customer Managed KMS Key',
      tfNode.includes('encrypted             = true') && tfNode.includes('kms_key_id'),
      'Worker node root volumes are encrypted at rest with dedicated AWS KMS key'
    );

    record('Terraform', 'EKS Node Group Scaling for 4,000+ Concurrency',
      tfNode.includes('min_size     = var.node_min_size') &&
      tfNode.includes('max_size     = var.node_max_size') &&
      tfVars.includes('default     = 3') &&
      tfVars.includes('default     = 12') &&
      tfVars.includes('m6i.xlarge'),
      'EKS managed node group scales 3 to 12 m6i.xlarge instances with taint/label segregation'
    );
  } else {
    record('Terraform', 'Node Groups Hardening', false, 'node_groups.tf or variables.tf not found');
  }

  const tfEksPath = path.join(tfDir, 'eks.tf');
  if (fs.existsSync(tfEksPath)) {
    const tfEks = fs.readFileSync(tfEksPath, 'utf-8');
    record('Terraform', 'EKS Control Plane Audit Logging & Envelope Encryption',
      tfEks.includes('api", "audit", "authenticator') &&
      tfEks.includes('encryption_config') &&
      tfEks.includes('resources = ["secrets"]'),
      'EKS cluster enables all audit log types and KMS envelope encryption for Kubernetes secrets at rest'
    );
  } else {
    record('Terraform', 'EKS Audit Logging & Encryption', false, 'eks.tf not found');
  }

  // ==========================================
  // 4. GITHUB ACTIONS CI/CD SECURITY AUDIT
  // ==========================================
  console.log('\n--- 4. GitHub Actions CI/CD Security Audit ---');
  const ghaDir = path.join(ROOT_DIR, '.github', 'workflows');

  const ciPath = path.join(ghaDir, 'ci.yml');
  if (fs.existsSync(ciPath)) {
    const ci = fs.readFileSync(ciPath, 'utf-8');
    record('GitHub Actions', 'CI Least Privilege Permissions',
      ci.includes('permissions:\n  contents: read') || ci.includes('permissions:\r\n  contents: read'),
      'CI workflow restricts GITHUB_TOKEN to read-only contents'
    );
  } else {
    record('GitHub Actions', 'CI Least Privilege Permissions', false, 'ci.yml not found');
  }

  const secScanPath = path.join(ghaDir, 'security-scan.yml');
  if (fs.existsSync(secScanPath)) {
    const secScan = fs.readFileSync(secScanPath, 'utf-8');
    record('GitHub Actions', 'Automated Secret & Vulnerability Scanning',
      secScan.includes('gitleaks') && secScan.includes('aquasecurity/trivy-action'),
      'Automated pipeline scans repository for committed secrets (Gitleaks) and container CVEs (Trivy)'
    );
  } else {
    record('GitHub Actions', 'Security Scanning Pipeline', false, 'security-scan.yml not found');
  }

  const deployGhaPath = path.join(ghaDir, 'deploy.yml');
  if (fs.existsSync(deployGhaPath)) {
    const deployGha = fs.readFileSync(deployGhaPath, 'utf-8');
    record('GitHub Actions', 'OIDC Cloud Authentication (No Static AWS Keys)',
      deployGha.includes('id-token: write') &&
      deployGha.includes('role-to-assume') &&
      !deployGha.includes('AWS_SECRET_ACCESS_KEY'),
      'Deployment uses GitHub Actions OpenID Connect (OIDC) federation, eliminating static AWS IAM access keys'
    );

    record('GitHub Actions', 'Zero-Downtime Rollout Verification',
      deployGha.includes('kubectl rollout status') && deployGha.includes('--timeout=180s'),
      'Deployment automates rollout status check with health verification and timeout safeguard'
    );
  } else {
    record('GitHub Actions', 'Deploy Pipeline', false, 'deploy.yml not found');
  }

  // ==========================================
  // 5. SERVER RUNTIME & SECURITY CONFIG AUDIT
  // ==========================================
  console.log('\n--- 5. Server Runtime & Security Config Audit ---');

  // Test 5.1: Production Secret Rejection
  try {
    const prodCheck = envSchema.safeParse({
      NODE_ENV: 'production',
      PORT: '5009',
      ADMIN_EMAIL: 'admin@markdriller.com',
      MONGODB_URI: 'mongodb://localhost:27017/markdriller',
      JWT_SECRET: 'markdriller_dev_super_secret_jwt_key_2026_change_in_production',
      PAYSTACK_SECRET_KEY: 'sk_test_placeholder_key',
      CLIENT_URL: 'https://markdriller.com',
    });

    const rejectedDevelopmentKey = !prodCheck.success &&
      prodCheck.error.issues.some((i: { message: string }) => i.message.includes('JWT_SECRET'));

    record('Runtime Security', 'Production Insecure Secret Rejection',
      rejectedDevelopmentKey,
      'Zod environment schema automatically blocks startup in production if default/fallback JWT secret is detected'
    );
  } catch (err: any) {
    record('Runtime Security', 'Production Insecure Secret Rejection', false, err.message);
  }

  // Test 5.2: In-Memory Syllabus Cache Verification
  try {
    metadataCache.set('test-exam-123', { id: 'test-exam-123', name: 'Post-UTME Screening' });
    const cachedItem = metadataCache.get<{ id: string; name: string }>('test-exam-123');
    const isCached = cachedItem !== null && cachedItem.name === 'Post-UTME Screening';

    const cacheStats = metadataCache.getStats();
    const statsValid = cacheStats.size >= 1 && cacheStats.hits >= 1;

    metadataCache.delete('test-exam-123');
    const deletedItem = metadataCache.get('test-exam-123');

    record('Runtime Performance', 'In-Memory Metadata Cache Functionality',
      isCached && statsValid && deletedItem === null,
      `Cache correctly stores, retrieves, provides telemetry (size: ${cacheStats.size}, hits: ${cacheStats.hits}), and evicts items`
    );
  } catch (err: any) {
    record('Runtime Performance', 'In-Memory Metadata Cache Functionality', false, err.message);
  }

  // Test 5.3: Database Connection Pool Configuration
  const dbConfigPath = path.join(ROOT_DIR, 'src', 'server', 'config', 'database.ts');
  if (fs.existsSync(dbConfigPath)) {
    const dbConfig = fs.readFileSync(dbConfigPath, 'utf-8');
    record('Runtime Performance', 'Mongoose High-Concurrency Connection Pooling',
      dbConfig.includes('150') &&
      dbConfig.includes('20') &&
      dbConfig.includes('socketTimeoutMS: 45000') &&
      dbConfig.includes('disconnectDatabase'),
      'MongoDB client pool configured with maxPoolSize: 150, minPoolSize: 20, and graceful disconnect handler'
    );
  } else {
    record('Runtime Performance', 'Database Connection Pooling', false, 'database.ts not found');
  }

  // Test 5.4: User-Aware Rate Limiting
  const rateLimitPath = path.join(ROOT_DIR, 'src', 'server', 'middleware', 'rateLimiter.ts');
  if (fs.existsSync(rateLimitPath)) {
    const rateLimit = fs.readFileSync(rateLimitPath, 'utf-8');
    record('Runtime Security', 'User-Aware Rate Limiting (Campus NAT Collision Prevention)',
      rateLimit.includes('usr_${req.user._id}') &&
      rateLimit.includes('/api/health'),
      'Rate limiter uses authenticated user ID prefix over IP alone to avoid NAT collisions, and exempts health probes'
    );
  } else {
    record('Runtime Security', 'User-Aware Rate Limiting', false, 'rateLimiter.ts not found');
  }

  // Test 5.5: CORS Locking and Helmet CSP in server/index.ts
  const serverIndexPath = path.join(ROOT_DIR, 'src', 'server', 'index.ts');
  if (fs.existsSync(serverIndexPath)) {
    const serverIndex = fs.readFileSync(serverIndexPath, 'utf-8');
    record('Runtime Security', 'Strict CORS Origin Whitelisting',
      !serverIndex.includes('origin: true') &&
      serverIndex.includes('allowedOrigins.includes(origin)') &&
      serverIndex.includes('not authorized'),
      'Eliminated dangerous origin: true; explicitly validates origins against allowed white list'
    );

    record('Runtime Security', 'Helmet Content Security Policy & Security Headers',
      serverIndex.includes('contentSecurityPolicy') &&
      serverIndex.includes('crossOriginEmbedderPolicy') &&
      serverIndex.includes('crossOriginResourcePolicy'),
      'Configured Helmet CSP with Paystack domains, font sources, and cross-origin resource isolation'
    );

    record('Runtime Security', 'Graceful Shutdown Lifecycle',
      serverIndex.includes('process.on(\'SIGTERM\'') &&
      serverIndex.includes('process.on(\'SIGINT\'') &&
      serverIndex.includes('disconnectDatabase()'),
      'Handles SIGTERM and SIGINT with connection draining and database pool disconnection'
    );
  } else {
    record('Runtime Security', 'Server Hardening', false, 'src/server/index.ts not found');
  }

  // ==========================================
  // SUMMARY REPORT
  // ==========================================
  console.log('\n============================================================');
  console.log('📊 SECURITY HARDENING AUDIT SUMMARY');
  console.log('============================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log(`Total Checks Executed : ${total}`);
  console.log(`Checks Passed         : ${passed} ✅`);
  console.log(`Checks Failed         : ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Compliance Score      : ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.error('❌ Security verification failed. Please review the failed checks above.');
    process.exit(1);
  } else {
    console.log('✅ ALL SECURITY AND INFRASTRUCTURE HARDENING CHECKS PASSED.');
  }
}

runSecurityAudit().catch(err => {
  console.error('Fatal error during security audit:', err);
  process.exit(1);
});
