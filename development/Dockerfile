# ─────────────────────────────────────────────────────────────────────────────
# Toolyo — Dockerfile multi-stage para Next.js standalone
# Ver docs/09-entornos-y-despliegue.md §4.1
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: deps — instala dependencias (cacheable) ──
FROM node:20-alpine AS deps
# Prisma 5 necesita OpenSSL disponible para detectar el engine correcto en Alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm ci --omit=dev && npx prisma generate

# ── Stage 2: builder — compila la app Next.js ──
FROM node:20-alpine AS builder
# Necesario también para generar el Prisma Client usado por app y seeder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# DATABASE_URL placeholder para que next build pase la validación de env.mjs.
# La URL real se inyecta en runtime vía variable de entorno.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# --include=dev: next build necesita devDependencies (typescript, @hookform/resolvers, puppeteer)
RUN npm ci --include=dev && npx prisma generate && npm run build
# Asegurar que public/ existe (puede no estar presente en el repo)
RUN mkdir -p /app/public

# ── Stage 3: runner — imagen final mínima ──
FROM node:20-alpine AS runner
# OpenSSL también es necesario en runtime para Prisma migrate deploy
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Usuario no-root (SECURITY.md)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar standalone output de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copiar migraciones Prisma y cliente generado para migrate deploy en runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
# Copiar todo el namespace @prisma (client, engines, etc.) para que prisma migrate deploy funcione
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
# Copiar el directorio .bin completo: Prisma necesita sus ficheros auxiliares .wasm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin ./node_modules/.bin

# Script de entrada: migra la BD y luego arranca Next.js
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
