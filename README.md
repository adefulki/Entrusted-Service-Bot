# 🛡️ Entrusted Service — Escrow Marketplace & POS

A full-stack Escrow/Middleman Marketplace with integrated Discord Bot and Web Dashboard.

## 📁 Project Structure

```
entrusted-service/
├── apps/
│   ├── web/                    # Next.js Web Dashboard
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/
│   │   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   │   ├── listings/route.ts
│   │   │   │   │   ├── listings/[id]/route.ts
│   │   │   │   │   ├── offers/route.ts
│   │   │   │   │   └── admin/
│   │   │   │   │       ├── stats/route.ts
│   │   │   │   │       └── transactions/route.ts
│   │   │   │   ├── auth/signin/page.tsx
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── marketplace/page.tsx
│   │   │   │   ├── marketplace/create/page.tsx
│   │   │   │   ├── marketplace/[id]/page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── globals.css
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts
│   │   │   │   └── discord-notify.ts
│   │   │   ├── components/
│   │   │   │   └── providers/auth-provider.tsx
│   │   │   └── types/next-auth.d.ts
│   │   ├── Dockerfile
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── bot/                    # Discord Bot
│       ├── src/
│       │   ├── index.ts
│       │   ├── deploy-commands.ts
│       │   ├── api/
│       │   │   ├── server.ts
│       │   │   └── routes/notify-offer.ts
│       │   ├── commands/
│       │   │   ├── index.ts
│       │   │   └── katalog.ts
│       │   └── handlers/
│       │       ├── interaction.ts
│       │       └── button-handler.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── database/               # Prisma Schema & Client
│       ├── prisma/schema.prisma
│       ├── src/index.ts
│       └── package.json
│
├── .env.example
├── package.json                # Workspace root
├── railway.toml
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Discord Application (Bot Token + OAuth2)

### 1. Clone & Install

```bash
git clone <repo-url>
cd entrusted-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in all required values
```

### 3. Set Up Database

```bash
npm run db:generate
npm run db:push
```

### 4. Deploy Discord Commands

```bash
npm run dev:bot -- --once  # or
cd apps/bot && npx tsx src/deploy-commands.ts
```

### 5. Run Development

```bash
# Terminal 1 - Web Dashboard
npm run dev:web

# Terminal 2 - Discord Bot
npm run dev:bot
```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DISCORD_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | OAuth2 application client ID |
| `DISCORD_CLIENT_SECRET` | OAuth2 application client secret |
| `DISCORD_GUILD_ID` | Your Discord server ID |
| `DISCORD_NOTIFICATION_CHANNEL_ID` | Channel for offer notifications |
| `DISCORD_TICKET_CATEGORY_ID` | Category for ticket channels |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `NEXTAUTH_URL` | Web app URL (http://localhost:3000 in dev) |
| `BOT_API_URL` | Bot internal API (http://localhost:4000 in dev) |
| `BOT_INTERNAL_SECRET` | Shared secret between web & bot services |

## 🚂 Railway Deployment

### Multi-Service Setup

1. Create a new Railway project
2. Add **PostgreSQL** plugin → copy the `DATABASE_URL`
3. Add **Service 1: Web Dashboard**
   - Root directory: `/` (uses `apps/web/Dockerfile`)
   - Set all env vars above
4. Add **Service 2: Discord Bot**
   - Root directory: `/` (uses `apps/bot/Dockerfile`)
   - Set all env vars above
5. Connect services via Railway's internal networking:
   - `BOT_API_URL` on the web service = bot service's internal Railway URL

### Discord OAuth2 Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create Application → Bot → Copy Token
3. OAuth2 → Add Redirect URL: `https://your-app.railway.app/api/auth/callback/discord`
4. Enable `identify` and `guilds` scopes

## 📋 Features

### Web Dashboard
- ✅ Discord OAuth2 Authentication
- ✅ Marketplace Board (WTS / WTB listings)
- ✅ Post & Offer System
- ✅ Admin POS Panel (Stats, Revenue, Transactions)

### Discord Bot
- ✅ Offer Notification with @mentions and Buttons
- ✅ Accept → Auto Ticket Channel Creation
- ✅ Escrow Guidelines Embed in Tickets
- ✅ `/katalog` Slash Command
- ✅ Reject & Counter Offer handling

### Integration
- ✅ Web → Bot notification via internal REST API
- ✅ Shared Prisma database for state sync
- ✅ Real-time status reflection across platforms
