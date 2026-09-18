# ==============================================================================
# MarkDriller Production Multi-Stage Hardened Dockerfile
# Base: Node.js 22 LTS on Alpine Linux 3.21
# Security: Non-Root Execution, Minimal Attack Surface, Dropped Capabilities
# ==============================================================================

# Stage 1: Dependency Resolution
FROM node:22.14.0-alpine3.21 AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Compilation & Asset Bundling
FROM node:22.14.0-alpine3.21 AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npm run build
# Prune development dependencies after build
RUN npm prune --production

# Stage 3: Production Minimal Hardened Runner
FROM node:22.14.0-alpine3.21 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5009
ENV CLIENT_URL=http://127.0.0.1:3009

# Create unprivileged application user and group (Least Privilege)
RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    mkdir -p /app/uploads/materials /app/scratch /tmp && \
    chown -R nodejs:nodejs /app /tmp

# Copy production artifacts from builder
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/index.html ./index.html

# Read-only root filesystem temporary scratch space
VOLUME ["/tmp"]

# Switch to non-root execution
USER nodejs

# Network configuration
EXPOSE 5009

# Container liveness check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5009/api/health || exit 1

# Process supervisor handles PID 1 signals cleanly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Default entrypoint runs API server (overridable in worker deployments)
CMD ["node", "dist/server/index.js"]
