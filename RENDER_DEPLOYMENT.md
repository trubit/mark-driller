# Deploying MarkDriller on Render & MongoDB Atlas

MarkDriller production deployment combines **GitHub CI/CD**, **Render** (Node.js Web Service hosting the Vite React SPA + Express REST API), and **MongoDB Atlas** (Managed Cloud Database).

---

## 🏗️ Architecture Overview

```text
Developer Push → GitHub (main branch)
        ↓
GitHub Actions CI
  ├─ TypeScript validation (npm run type-check)
  ├─ Production build compilation (npm run build)
  ├─ Responsive layout verification (npm run test:responsive)
  ├─ Security hardening & concurrency SLOs (npm test)
  ├─ Paystack payment flows (npm run test:paystack)
  ├─ Student lifecycle tests (npm run test:journey)
  └─ Supply chain audit (npm audit)
        ↓ (Checks Pass)
Render Web Service Auto-Deploy
        ↓
Connects to MongoDB Atlas Cloud Cluster
        ↓
Health Check Endpoint Passes (/api/health)
        ↓
Production Live: Students & Administrators Access via Internet
```

---

## 🚀 Deployment Instructions via Render Blueprint

MarkDriller includes an official [`render.yaml`](./render.yaml) Blueprint that provisions the web service automatically.

### Step 1: Push Code to GitHub
Ensure all code and configuration changes are pushed to your repository's production branch (`main`).

### Step 2: Connect MongoDB Atlas
1. In your **[MongoDB Atlas Dashboard](https://cloud.mongodb.com/)**:
   - Create or select your cluster (e.g. Cluster0).
   - Go to **Database Access** → Add a Database User with `readWriteAnyDatabase` or `readWrite@markdriller` permissions.
   - Go to **Network Access** → Add IP Access List entry.
     - *Note*: Render Web Services use dynamic egress IP addresses. For Render web services, add `0.0.0.0/0` (Allow Access from Anywhere) with a strong user password and TLS enabled.
   - Click **Connect** → **Drivers (Node.js)** to get your connection URI:
     `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/markdriller?retryWrites=true&w=majority`

### Step 3: Launch on Render
1. Go to your **[Render Dashboard](https://dashboard.render.com/)**.
2. Click **New +** → **Blueprint**.
3. Select your repository: **`trubit/mark-driller`** (branch: `main`).
4. Render detects [`render.yaml`](./render.yaml) and lists the `markdriller` web service.
5. In the settings, provide the required sync environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `PAYSTACK_SECRET_KEY`: Paystack secret key (`sk_live_...` or `sk_test_...`).
   - `PAYSTACK_PUBLIC_KEY`: Paystack public key (`pk_live_...` or `pk_test_...`).
   - `PAYSTACK_WEBHOOK_SECRET`: Paystack webhook signing secret.
   - `BREVO_API_KEY`: Brevo API key for transactional emails/OTPs.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For PDF study materials.
   - `ADMIN_EMAIL`: Email address authorized for production administrator access (e.g. `admin@markdriller.com`).
   - `ADMIN_INITIAL_PASSWORD`: (Optional) Initial password if running admin bootstrap seed.

### Step 4: Configure Auto-Deploy Mode
Render supports two auto-deploy modes for GitHub services:
- **`On Commit`**: Deploys immediately upon any push to the `main` branch.
- **`After CI Checks Pass`** *(Recommended)*: Render listens for GitHub commit status checks and automatically triggers deployment ONLY when the GitHub Actions CI pipeline passes.

To enable this:
1. In the Render Web Service settings, locate **Auto-Deploy**.
2. Set auto-deploy to **Yes** and select **After CI checks pass**.

---

## 🌐 Custom Domain & Production Routing

1. In Render Web Service settings, go to **Custom Domains**.
2. Add your production domain: `markdriller.com` and `www.markdriller.com`.
3. Configure your DNS provider with the CNAME and ALIAS records provided by Render.
4. Render automatically provisions and renews TLS/SSL certificates at zero cost.

---

## 🛡️ Production Admin Access via Internet

The MarkDriller Admin Portal (`/admin`) is securely protected both client-side and server-side:
- **Backend Authentication & RBAC**: Every `/api/admin/*` endpoint strictly enforces `authenticateToken` and `requireAdmin` middleware. Requests verify that the user's role in MongoDB is `ADMIN` or the verified email matches `process.env.ADMIN_EMAIL`.
- **Database Index Synchronization**: Run `npm run db:index` or trigger index synchronization to ensure all compound query indexes on users, exams, subjects, questions, and subscriptions are live on MongoDB Atlas.
- **Zero Hardcoded Credentials**: Passwords are securely hashed with bcrypt (salt rounds: 12). No default passwords exist in production code.

---

## ⚡ Paystack Webhook Configuration

In your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer):
- **Live Webhook URL**: `https://markdriller.com/api/subscriptions/webhook`
- **Supported Events**: `charge.success`, `subscription.create`, `subscription.disable`
