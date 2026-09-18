# Deploying MarkDriller on Render (Everything Self-Hosted on Render)

MarkDriller is configured to run **100% on Render**. You do **not** need a MongoDB Atlas account, AWS account, or any external database provider.

Render hosts both:
1. **The Web Application (`markdriller`)**: Node.js 22 LTS serving the React SPA and Express REST API.
2. **The MongoDB Database (`markdriller-mongodb`)**: Official `mongo:7.0` container with a 10 GB persistent Render Disk (`/data/db`), connected privately inside Render's secure internal network.

---

## 🚀 1-Click Deploy via Render Blueprint

MarkDriller includes a complete [`render.yaml`](./render.yaml) Blueprint that provisions both the web service and the MongoDB database automatically.

### Step 1: Open Render Blueprint
1. Go to your **[Render Dashboard](https://dashboard.render.com)**.
2. Click **New +** in the top-right corner and choose **Blueprint**.
3. Select your repository: **`trubit/mark-driller`** (branch: `main`).

### Step 2: Review Services
Render will automatically detect `render.yaml` and show:
- **`markdriller`**: Web Service (Node.js 22, Port 10000, connected to internal MongoDB).
- **`markdriller-mongodb`**: Private Service (Docker `mongo:7.0` with 10 GB persistent disk).

### Step 3: Enter Only Your Service Keys
Render will auto-configure `MONGODB_URI` to `mongodb://markdriller-mongodb:27017/markdriller`.
You only need to enter:
1. `PAYSTACK_SECRET_KEY`: `sk_live_...`
2. `PAYSTACK_PUBLIC_KEY`: `pk_live_...`
3. `PAYSTACK_WEBHOOK_SECRET`: Your Paystack secret key
4. `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: For PDF past question uploads
5. `BREVO_API_KEY`: For sending verification email OTPs

> [!NOTE]
> `MONGODB_URI`, `JWT_SECRET`, `SESSION_SECRET`, `NODE_ENV`, and `PORT` are configured automatically by Render with zero manual entry required!

### Step 4: Click "Apply"
Click **Apply**. Render will:
1. Start `markdriller-mongodb` and mount the 10GB persistent storage disk.
2. Build the MarkDriller application (`npm ci --include=dev && npm run build`).
3. Connect `markdriller` to `markdriller-mongodb` inside Render's internal private network.
4. Launch the live service!

---

## 🌐 Connect Your Custom Domain (`markdriller.com`)

1. Open your **markdriller** Web Service in Render.
2. Go to **Settings** > **Custom Domains**.
3. Add `markdriller.com` and `www.markdriller.com`.
4. Point your domain DNS records to Render (ANAME / ALIAS to `markdriller.onrender.com` and CNAME for `www`).
5. Render automatically issues and renews free SSL certificates!

---

## ⚡ Paystack Live Webhook

In your [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer):
- **Live Webhook URL**: `https://markdriller.com/api/subscriptions/webhook`
- **Events**: `charge.success`, `subscription.create`, `subscription.disable`
