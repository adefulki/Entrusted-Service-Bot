import {
  ModalSubmitInteraction,
  Client,
  EmbedBuilder,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { prisma } from "@entrusted/database";

export async function handleModalSubmit(
  interaction: ModalSubmitInteraction,
  client: Client
) {
  const [action, id] = interaction.customId.split(":");

  if (!id) return;

  switch (action) {
    case "modal_offer":
      await handleOfferSubmit(interaction, id);
      break;
    case "modal_edit":
      await handleEditSubmit(interaction, id);
      break;
  }
}

async function handleOfferSubmit(interaction: ModalSubmitInteraction, listingId: string) {
  await interaction.deferReply({ ephemeral: true });

  const priceStr = interaction.fields.getTextInputValue("offer_price");
  const message = interaction.fields.getTextInputValue("offer_message") || null;

  const offerPrice = parseFloat(priceStr);
  if (isNaN(offerPrice) || offerPrice <= 0) {
    return interaction.editReply("❌ Invalid price. Please enter a valid number.");
  }

  // Get or create offerer
  const offerer = await prisma.user.upsert({
    where: { discordId: interaction.user.id },
    update: { username: interaction.user.username },
    create: { discordId: interaction.user.id, username: interaction.user.username },
  });

  // Find listing
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { owner: true },
  });

  if (!listing) {
    return interaction.editReply("❌ Listing not found.");
  }

  if (listing.status !== "OPEN") {
    return interaction.editReply("❌ This listing is no longer open for offers.");
  }

  if (listing.ownerId === offerer.id) {
    return interaction.editReply("❌ You can't offer on your own listing.");
  }

  // Check duplicate pending offer
  const existing = await prisma.offer.findFirst({
    where: { listingId, offererId: offerer.id, status: "PENDING" },
  });
  if (existing) {
    return interaction.editReply("❌ You already have a pending offer on this listing.");
  }

  // Create offer
  const offer = await prisma.offer.create({
    data: {
      listingId,
      offererId: offerer.id,
      offerPrice,
      message,
    },
  });

  // Send notification to channel
  try {
    const guildId = interaction.guildId;
    if (guildId) {
      const guildConfig = await prisma.guild.findUnique({ where: { guildId } });
      const channelId = guildConfig?.notificationChannelId;

      if (channelId) {
        const channel = await client.channels.fetch(channelId);
        if (channel instanceof TextChannel) {
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
        }
      }
    }
  } catch (error) {
    console.error("[Modal Offer Notify] Error:", error);
  }

  await interaction.editReply(
    `✅ Offer sent! **Rp ${offerPrice.toLocaleString("id-ID")}** for **${listing.itemName}**`
  );
}

async function handleEditSubmit(interaction: ModalSubmitInteraction, listingId: string) {
  await interaction.deferReply({ ephemeral: true });

  const newName = interaction.fields.getTextInputValue("edit_name");
  const priceStr = interaction.fields.getTextInputValue("edit_price");
  const quantityStr = interaction.fields.getTextInputValue("edit_quantity");
  const description = interaction.fields.getTextInputValue("edit_description") || null;

  const newPrice = parseFloat(priceStr);
  const newQuantity = parseInt(quantityStr);

  if (isNaN(newPrice) || newPrice <= 0) {
    return interaction.editReply("❌ Invalid price.");
  }
  if (isNaN(newQuantity) || newQuantity < 1) {
    return interaction.editReply("❌ Invalid quantity.");
  }

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    return interaction.editReply("❌ User not found.");
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return interaction.editReply("❌ Listing not found.");
  }
  if (listing.ownerId !== user.id) {
    return interaction.editReply("❌ You can only edit your own listings.");
  }
  if (listing.status !== "OPEN") {
    return interaction.editReply("❌ Can only edit listings with OPEN status.");
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: {
      itemName: newName,
      initialPrice: newPrice,
      quantity: newQuantity,
      description,
    },
  });

  const embed = new EmbedBuilder()
    .setTitle("✏️ Listing Updated!")
    .setColor(0xffd700)
    .addFields(
      { name: "Item", value: updated.itemName, inline: true },
      { name: "Price", value: `Rp ${updated.initialPrice.toLocaleString("id-ID")}`, inline: true },
      { name: "Qty", value: updated.quantity.toString(), inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
