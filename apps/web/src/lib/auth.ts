import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@entrusted/database";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: { scope: "identify guilds" },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;

      const discordProfile = profile as { id: string; username: string; avatar?: string };

      // Upsert user in DB
      await prisma.user.upsert({
        where: { discordId: discordProfile.id },
        update: {
          username: discordProfile.username,
          avatar: discordProfile.avatar
            ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
            : null,
        },
        create: {
          discordId: discordProfile.id,
          username: discordProfile.username,
          avatar: discordProfile.avatar
            ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
            : null,
        },
      });

      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.sub },
        });
        if (dbUser) {
          session.user = {
            ...session.user,
            id: dbUser.id,
            discordId: dbUser.discordId,
            role: dbUser.role,
          } as any;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = (profile as { id: string }).id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
};
