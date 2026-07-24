import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { prisma } from "@entrusted/database";

export const katalogCommand = {
  data: new SlashCommandBuilder()
    .setName("katalog")
    .setDescription("View active store listings")
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Filter by listing type")
        .addChoices(
          { name: "All", value: "ALL" },
          { name: "Want to Sell", value: "WTS" },
          { name: "Want to Buy", value: "WTB" }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const type = interaction.options.getString("type") || "ALL";

    const where: any = { status: "OPEN" };
    if (type !== "ALL") {
      where.type = type;
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        owner: { select: { username: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (listings.length === 0) {
      return interaction.editReply("📭 No active listings found.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🏪 Katalog — Active Listings")
      .setColor(0x5865f2)
      .setDescription(
        listings
          .map(
            (l, i) =>
              `**${i + 1}.** \`${l.type}\` **${l.itemName}**\n` +
              `   💰 Rp ${l.initialPrice.toLocaleString("id-ID")} • ` +
              `👤 ${l.owner.username} • ` +
              `📨 ${l._count.offers} offers`
          )
          .join("\n\n")
      )
      .setFooter({
        text: `Showing ${listings.length} listing(s) • Use the web dashboard for more`,
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
