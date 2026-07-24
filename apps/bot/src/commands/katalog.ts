import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@entrusted/database";

const WEB_URL = process.env.NEXT_PUBLIC_APP_URL || "https://entrusted-service-web-production.up.railway.app";

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
        owner: { select: { username: true, discordId: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (listings.length === 0) {
      return interaction.editReply("📭 No active listings found.");
    }

    // Send each listing as a separate embed with buttons
    const messages = listings.map((listing) => {
      const embed = new EmbedBuilder()
        .setTitle(`${listing.type === "WTS" ? "🟢" : "🔵"} ${listing.itemName}`)
        .setColor(listing.type === "WTS" ? 0x00ff88 : 0x0088ff)
        .addFields(
          { name: "Type", value: listing.type, inline: true },
          { name: "Price", value: `Rp ${listing.initialPrice.toLocaleString("id-ID")}`, inline: true },
          { name: "Qty", value: listing.quantity.toString(), inline: true },
          { name: "Seller", value: listing.owner.username, inline: true },
          { name: "Offers", value: listing._count.offers.toString(), inline: true }
        );

      if (listing.description) {
        embed.setDescription(listing.description);
      }

      const isOwner = listing.owner.discordId === interaction.user.id;

      const buttons = new ActionRowBuilder<ButtonBuilder>();

      if (!isOwner) {
        // Other users see "Make Offer" button
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId(`listing_offer:${listing.id}`)
            .setLabel("💰 Make Offer")
            .setStyle(ButtonStyle.Success)
        );
      } else {
        // Owner sees Edit and Delete buttons
        buttons.addComponents(
          new ButtonBuilder()
            .setCustomId(`listing_edit:${listing.id}`)
            .setLabel("✏️ Edit")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`listing_delete:${listing.id}`)
            .setLabel("🗑️ Delete")
            .setStyle(ButtonStyle.Danger)
        );
      }

      // Always add a "View on Web" link button
      buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(`listing_detail:${listing.id}`)
          .setLabel("📋 Details")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel("🌐 View on Web")
          .setStyle(ButtonStyle.Link)
          .setURL(`${WEB_URL}/marketplace/${listing.id}`)
      );

      return { embeds: [embed], components: [buttons] };
    });

    // Send the first one as the reply
    await interaction.editReply(messages[0]);

    // Send the rest as follow-ups
    for (let i = 1; i < messages.length; i++) {
      await interaction.followUp(messages[i]);
    }
  },
};
