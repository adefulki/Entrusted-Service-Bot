import { Guild } from "discord.js";
import { prisma } from "@entrusted/database";

export async function handleGuildCreate(guild: Guild) {
  try {
    // Auto-register the guild when the bot joins a server
    await prisma.guild.upsert({
      where: { guildId: guild.id },
      update: {
        name: guild.name,
        active: true,
      },
      create: {
        guildId: guild.id,
        name: guild.name,
      },
    });

    console.log(`[Bot] Joined guild: ${guild.name} (${guild.id})`);
  } catch (error) {
    console.error(`[Bot] Error registering guild ${guild.id}:`, error);
  }
}
