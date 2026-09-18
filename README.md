# Mark Driller — Full-Stack React + TypeScript & Express Application

Professional refactor of the Mark Driller landing page into a unified, high-performance **React + TypeScript** application powered by **MUI**, **Bootstrap / React-Bootstrap**, **Zustand**, **TanStack React Query**, and a production-grade **Express + TypeScript** backend in a **single unified project**.

---

## 🎯 Full-Stack Architecture

### Frontend Layer
- **React 18 & TypeScript**: Strongly typed component architecture with strict compiler checks (`tsc --noEmit`).
- **MUI (Material-UI v6)**: ThemeProvider system configured with exact project color tokens, typography scales, and modal dialogs.
- **Bootstrap 5 & React-Bootstrap**: Responsive offcanvas mobile drawer, grid alignment, and utility foundation.
- **Zustand**: Global client state management for mobile menu navigation drawer, interactive exam board chip selection, and modal dialogs.
- **TanStack React Query**: Cached query infrastructure and scalable server-state management querying live API endpoints.
- **Vite 6**: High-speed bundler and development server with automatic proxying to the Express API (`/api`).

### Backend Layer (`src/server/`)
- **Express + TypeScript**: Secure, lightweight REST API managed within the root `package.json`.
- **Security & Protection**:
  - `helmet`: Comprehensive HTTP security headers.
  - `cors`: Configurable CORS origins with environment support.
  - `express-rate-limit`: Rate limiting on global API routes and strict limiting on student lead submissions.
  - Payload size limits (`10kb`) to prevent DoS attacks.
- **Validation**: Strict schema validation using **Zod** for external user inputs.
- **Safe Error Handling**: Structured error responses that suppress stack traces in production (`NODE_ENV === 'production'`).
- **Unified Production Serving**: Express serves compiled static frontend assets from `dist/` and handles API requests under one roof.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service health status, uptime, and timestamp |
| `GET` | `/api/exam-boards` | Catalog of 9 West African exam boards with question counts and verified syllabi |
| `POST` | `/api/leads` | Validates student signup/consultation requests, generates reference ticket IDs |

---

## 🎨 Visual System & Fidelity

Preserves 100% of the original visual identity, fonts, colors, and content structure:
- **Palette**: `--ink: #14181c`, `--ink-soft: #3a4048`, `--paper: #eceee6`, `--paper-dim: #e0e3d9`, `--steel: #3e6e8e`, `--steel-deep: #294a60`, `--amber: #e29a3c`, `--rust: #a8562f`, `--white: #f8f7f2`.
- **Typography**: Google Fonts `Space Grotesk`, `Source Serif 4`, and `JetBrains Mono`.
- **Sections**:
  1. Sticky navigation header with SVG mark icon and responsive mobile offcanvas drawer.
  2. Hero section with lede, call to action buttons, and student stats footnote.
  3. Metric Gauge Strip (`120K+`, `9`, `40K+`, `6`).
  4. Feature cards: Study Materials, Past Questions Bank, and CBT Practice.
  5. Exam Boards chip selection (backed by live TanStack query to `/api/exam-boards`).
  6. "How it works" 4-step sequential workflow.
  7. Testimonial section.
  8. Final CTA conversion banner.
  9. Comprehensive 4-column footer and copyright strip.
  10. Interactive Auth/Inquiry Modal connected to `/api/leads` via TanStack mutation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Development (Frontend + Backend concurrently)
```bash
npm run dev
```
- Frontend: `http://localhost:3009`
- Backend API: `http://localhost:5009` (proxied automatically via `/api`)

### Type Checking
```bash
npm run type-check
```
Validates both client and server TypeScript compiler configurations.

### Production Build
```bash
npm run build
```
Compiles both Vite frontend assets (`dist/`) and Express server artifacts (`dist/server/`).

### Start Production Full-Stack Server
```bash
npm start
```
Runs the unified Node.js server serving both API endpoints and the compiled React SPA.

---

## 🔒 Security & Environment
- Environment configuration managed through `.env` and `.env.example`.
- Public frontend variables prefixed with `VITE_`.
- Server secrets and runtime ports isolated to Node.js backend.
- Zero hardcoded secrets, database credentials, or tokens.
