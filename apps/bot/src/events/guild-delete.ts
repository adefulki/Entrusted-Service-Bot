import { Guild } from "discord.js";
import { prisma } from "@entrusted/database";

export async function handleGuildDelete(guild: Guild) {
  try {
    // Mark the guild as inactive when the bot is removed
    await prisma.guild.update({
      where: { guildId: guild.id },
      data: { active: false },
    });

    console.log(`[Bot] Removed from guild: ${guild.name} (${guild.id})`);
  } catch (error) {
    console.error(`[Bot] Error deactivating guild ${guild.id}:`, error);
  }
}
