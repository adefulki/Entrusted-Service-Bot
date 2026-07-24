FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY apps/bot/package.json ./apps/bot/
COPY packages/database/package.json ./packages/database/
RUN npm install --workspace=apps/bot --workspace=packages/database

# Generate Prisma Client
FROM base AS prisma
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/database ./packages/database
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=prisma /app/node_modules ./node_modules
COPY --from=prisma /app/packages/database ./packages/database
COPY apps/bot ./apps/bot
COPY package.json ./
WORKDIR /app/apps/bot
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/bot/dist ./dist
COPY --from=builder /app/packages/database ./packages/database

EXPOSE 4000

CMD ["node", "dist/index.js"]
