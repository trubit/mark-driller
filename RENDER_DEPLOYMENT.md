# Deploying MarkDriller on Render (Complete Guide)

MarkDriller is architected as a high-performance, unified full-stack application. In production, the compiled Node.js/Express server serves both the high-concurrency REST API (`/api/*`) and the pre-rendered React Single Page Application (`dist/`) on port 10000.

---

## 🚀 Quick Deploy via Render Blueprint (Recommended)

MarkDriller includes a production [`render.yaml`](./render.yaml) blueprint file.

### Step 1: Connect Repository to Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation and select **Blueprint**.
3. Connect your GitHub repository: `https://github.com/trubit/mark-driller`.
4. Render will detect `render.yaml` and configure the **markdriller** Web Service automatically.

---

## 🔑 Required Environment Variables

When creating the Blueprint or Web Service, Render will prompt you for the following secrets:

| Variable | Description | Example / Source |
| :--- | :--- | :--- |
| `MONGODB_URI` | Production MongoDB connection string | `mongodb+srv://user:pass@cluster0.mongodb.net/markdriller?retryWrites=true&w=majority` |
| `PAYSTACK_SECRET_KEY` | Paystack Live Secret Key | `sk_live_...` (from Paystack Dashboard > Settings > API Keys) |
| `PAYSTACK_PUBLIC_KEY` | Paystack Live Public Key | `pk_live_...` (from Paystack Dashboard > Settings > API Keys) |
| `PAYSTACK_WEBHOOK_SECRET`| Paystack Live Secret Key or Webhook secret | Used to verify HMAC signatures for real-time payments |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name | For uploaded study materials and syllabus PDFs |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | Cloudinary Dashboard |
| `BREVO_API_KEY` | Brevo (Sendinblue) Transactional API Key | For student registration OTPs and password resets |

### Auto-Generated Variables (Zero Manual Setup)
- `JWT_SECRET`: Render generates a cryptographically secure string automatically.
- `SESSION_SECRET`: Render generates a cryptographically secure string automatically.
- `PORT`: Automatically set to `10000`.
- `NODE_ENV`: Set to `production`.

---

## 🌐 Custom Domain Setup (`markdriller.com`)

1. In the Render Dashboard, open your **markdriller** Web Service.
2. Go to **Settings** > **Custom Domains**.
3. Add `markdriller.com` and `www.markdriller.com`.
4. Render will provide DNS records (ANAME / ALIAS for apex domain and CNAME for `www`).
5. Update your domain DNS records at your domain registrar.
6. Render automatically provisions and renews **free Let's Encrypt SSL/TLS certificates**.

---

## ⚡ Paystack Webhook Configuration

1. Go to your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer).
2. Under **Webhook URL**, enter:
   ```text
   https://markdriller.com/api/subscriptions/webhook
   ```
   *(or `https://<your-render-subdomain>.onrender.com/api/subscriptions/webhook` before custom domain activation)*
3. Set your webhook events: `charge.success`, `subscription.create`, `subscription.disable`.

---

## 🩺 Health Check & Monitoring

- **Health Endpoint**: `https://markdriller.com/api/health`
- Returns HTTP 200 with database connectivity status and uptime.
- Render actively pings this endpoint to manage zero-downtime rolling deploys.
