# syntax=docker/dockerfile:1.7
# Multi-stage build for Inday. Runs the custom Next.js + WebSocket server
# (server.mjs), so we ship node_modules + .next rather than Next's standalone
# output (which would not include the custom server).
#
# Debian (bookworm-slim) is used instead of Alpine because Prisma's query
# engine ships glibc binaries that "just work" here without musl gymnastics.

ARG NODE_VERSION=20-bookworm-slim

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: build dependencies (incl. dev) and produce the Next.js build.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

# openssl is required by Prisma's engine at generate/runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NEXT_TELEMETRY_DISABLED=1

# Install with a warm layer cache: only re-runs when manifests/schema change.
# prisma/ is needed because `postinstall` runs `prisma generate`.
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# Build the app.
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: production-only node_modules (smaller, generated Prisma client).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma
# `prisma` itself is a runtime dependency (needed for `migrate deploy`), and
# postinstall regenerates the client against this prod tree.
RUN npm ci --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: minimal runtime image.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl wget \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Run as an unprivileged user.
RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --create-home nextjs

# Production deps (with generated Prisma client) + the build artifacts.
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder  --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=builder  --chown=nextjs:nodejs /app/public       ./public
COPY --from=builder  --chown=nextjs:nodejs /app/prisma       ./prisma
COPY --from=builder  --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder  --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder  --chown=nextjs:nodejs /app/server.mjs   ./server.mjs

USER nextjs
EXPOSE 3000

# server.mjs reads PORT and serves both HTTP and the /api/ws WebSocket.
CMD ["node", "server.mjs"]
