FROM node:20-alpine AS base
RUN apk add --no-cache openssl

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
RUN npm install --workspace=apps/web --workspace=packages/database

# Generate Prisma Client and build database package
FROM base AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma
WORKDIR /app/packages/database
RUN npx tsc

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/packages/database ./packages/database
COPY apps/web ./apps/web
COPY package.json ./
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone output includes monorepo structure: apps/web/server.js + node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# Static files go relative to the app
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
