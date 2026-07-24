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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/web ./apps/web
COPY packages/database/prisma ./packages/database/prisma
COPY package.json ./

WORKDIR /app/apps/web
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "npx prisma db push --schema=/app/packages/database/prisma/schema.prisma --skip-generate && npx next start -p ${PORT:-3000}"]
