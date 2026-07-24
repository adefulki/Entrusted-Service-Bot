import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import { prisma } from "@entrusted/database";

export const offerCommand = {
  data: new SlashCommandBuilder()
    .setName("offer")
    .setDescription("Make an offer on a listing")
    .addStringOption((opt) =>
      opt
        .setName("listing_id")
        .setDescription("The listing ID to make an offer on")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("price")
        .setDescription("Your offer price in Rupiah")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("Optional message to the listing owner")
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const listingId = interaction.options.getString("listing_id", true);
    const offerPrice = interaction.options.getNumber("price", true);
    const message = interaction.options.getString("message");

    // Get or create the offerer
    const offerer = await prisma.user.upsert({
      where: { discordId: interaction.user.id },
      update: { username: interaction.user.username },
      create: { discordId: interaction.user.id, username: interaction.user.username },
    });

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { owner: true },
    });

    if (!listing) {
      return interaction.editReply("❌ Listing not found. Check the ID and try again.");
    }

    if (listing.status !== "OPEN") {
      return interaction.editReply("❌ This listing is no longer open for offers.");
    }

    if (listing.ownerId === offerer.id) {
      return interaction.editReply("❌ You can't make an offer on your own listing.");
    }

    // Check if user already has a pending offer on this listing
    const existingOffer = await prisma.offer.findFirst({
      where: {
        listingId,
        offererId: offerer.id,
        status: "PENDING",
      },
    });

    if (existingOffer) {
      return interaction.editReply(
        "❌ You already have a pending offer on this listing. Wait for the owner to respond first."
      );
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        listingId,
        offererId: offerer.id,
        offerPrice,
        message,
      },
    });

    // Send notification to the notification channel
    await sendOfferNotification(interaction, listing, offer, offerer, offerPrice, message);

    const embed = new EmbedBuilder()
      .setTitle("✅ Offer Sent!")
      .setColor(0x00ff88)
      .addFields(
        { name: "Item", value: listing.itemName, inline: true },
        { name: "Listed Price", value: `Rp ${listing.initialPrice.toLocaleString("id-ID")}`, inline: true },
        { name: "Your Offer", value: `Rp ${offerPrice.toLocaleString("id-ID")}`, inline: true },
        { name: "Owner", value: listing.owner.username, inline: true },
        { name: "Status", value: "⏳ Pending", inline: true }
      )
      .setFooter({ text: `Offer ID: ${offer.id}` })
      .setTimestamp();

    if (message) {
      embed.addFields({ name: "Your Message", value: message });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};

async function sendOfferNotification(
  interaction: ChatInputCommandInteraction,
  listing: any,
  offer: any,
  offerer: any,
  offerPrice: number,
  message: string | null
) {
  try {
    const guildId = interaction.guildId;
    if (!guildId) return;

    // Get notification channel from database
    const guildConfig = await prisma.guild.findUnique({
      where: { guildId },
    });

    const channelId = guildConfig?.notificationChannelId || process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
    if (!channelId) return;

    const channel = await interaction.client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) return;

    const embed = new EmbedBuilder()
      .setTitle("📩 New Offer Received!")
      .setColor(listing.type === "WTS" ? 0x00ff88 : 0x0088ff)
      .addFields(
        { name: "Item", value: listing.itemName, inline: true },
        { name: "Type", value: listing.type, inline: true },
        { name: "Listed Price", value: `Rp ${listing.initialPrice.toLocaleString("id-ID")}`, inline: true },
        { name: "Offer Price", value: `Rp ${offerPrice.toLocaleString("id-ID")}`, inline: true },
        { name: "From", value: offerer.username, inline: true }
      )
      .setTimestamp();

    if (message) {
      embed.addFields({ name: "Message", value: message });
    }

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`offer_accept:${offer.id}`)
        .setLabel("✅ Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`offer_reject:${offer.id}`)
        .setLabel("❌ Reject")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`offer_counter:${offer.id}`)
        .setLabel("💬 Counter")
        .setStyle(ButtonStyle.Secondary)
    );

    await channel.send({
      content: `<@${listing.owner.discordId}> — You received a new offer!`,
      embeds: [embed],
      components: [actionRow],
    });
  } catch (error) {
    console.error("[Offer Notify] Error:", error);
  }
}
