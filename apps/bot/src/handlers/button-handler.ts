import {
  ButtonInteraction,
  Client,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
} from "discord.js";
import { prisma } from "@entrusted/database";

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  client: Client
) {
  const [action, id] = interaction.customId.split(":");

  if (!id) return;

  switch (action) {
    case "offer_accept":
      await handleAcceptOffer(interaction, id);
      break;
    case "offer_reject":
      await handleRejectOffer(interaction, id);
      break;
    case "offer_counter":
      await handleCounterOffer(interaction, id);
      break;
    case "listing_offer":
      await handleListingOffer(interaction, id);
      break;
    case "listing_edit":
      await handleListingEdit(interaction, id);
      break;
    case "listing_delete":
      await handleListingDelete(interaction, id);
      break;
    case "listing_detail":
      await handleListingDetail(interaction, id);
      break;
  }
}

// ─── Listing Button Handlers ──────────────────────────────────────────────────

async function handleListingOffer(interaction: ButtonInteraction, listingId: string) {
  // Show a modal for the user to enter their offer
  const modal = new ModalBuilder()
    .setCustomId(`modal_offer:${listingId}`)
    .setTitle("Make an Offer");

  const priceInput = new TextInputBuilder()
    .setCustomId("offer_price")
    .setLabel("Your offer price (Rp)")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("e.g., 450000")
    .setRequired(true);

  const messageInput = new TextInputBuilder()
    .setCustomId("offer_message")
    .setLabel("Message (optional)")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder("Any message for the seller...")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(priceInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(messageInput)
  );

  await interaction.showModal(modal);
}

async function handleListingEdit(interaction: ButtonInteraction, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return interaction.reply({ content: "❌ Listing not found.", ephemeral: true });
  }

  // Verify ownership
  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user || listing.ownerId !== user.id) {
    return interaction.reply({ content: "❌ You can only edit your own listings.", ephemeral: true });
  }

  // Show modal with current values
  const modal = new ModalBuilder()
    .setCustomId(`modal_edit:${listingId}`)
    .setTitle("Edit Listing");

  const nameInput = new TextInputBuilder()
    .setCustomId("edit_name")
    .setLabel("Item Name")
    .setStyle(TextInputStyle.Short)
    .setValue(listing.itemName)
    .setRequired(true);

  const priceInput = new TextInputBuilder()
    .setCustomId("edit_price")
    .setLabel("Price (Rp)")
    .setStyle(TextInputStyle.Short)
    .setValue(listing.initialPrice.toString())
    .setRequired(true);

  const quantityInput = new TextInputBuilder()
    .setCustomId("edit_quantity")
    .setLabel("Quantity")
    .setStyle(TextInputStyle.Short)
    .setValue(listing.quantity.toString())
    .setRequired(true);

  const descInput = new TextInputBuilder()
    .setCustomId("edit_description")
    .setLabel("Description")
    .setStyle(TextInputStyle.Paragraph)
    .setValue(listing.description || "")
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(priceInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(quantityInput),
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(descInput)
  );

  await interaction.showModal(modal);
}

async function handleListingDelete(interaction: ButtonInteraction, listingId: string) {
  await interaction.deferReply({ ephemeral: true });

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { transactions: true } } },
  });

  if (!listing) {
    return interaction.editReply("❌ Listing not found.");
  }

  const user = await prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user || listing.ownerId !== user.id) {
    return interaction.editReply("❌ You can only delete your own listings.");
  }

  if (listing._count.transactions > 0) {
    return interaction.editReply("❌ Cannot delete a listing with active transactions.");
  }

  await prisma.offer.deleteMany({ where: { listingId } });
  await prisma.listing.delete({ where: { id: listingId } });

  await interaction.editReply(`🗑️ **${listing.itemName}** has been deleted.`);

  // Remove the original message buttons
  try {
    await interaction.message.edit({
      components: [],
      content: `~~${interaction.message.embeds[0]?.title || "Listing"}~~ — **DELETED**`,
      embeds: [],
    });
  } catch {}
}

async function handleListingDetail(interaction: ButtonInteraction, listingId: string) {
  await interaction.deferReply({ ephemeral: true });

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      owner: { select: { username: true } },
      offers: {
        include: { offerer: { select: { username: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!listing) {
    return interaction.editReply("❌ Listing not found.");
  }

  const embed = new EmbedBuilder()
    .setTitle(`📋 ${listing.itemName}`)
    .setColor(listing.type === "WTS" ? 0x00ff88 : 0x0088ff)
    .addFields(
      { name: "Type", value: listing.type, inline: true },
      { name: "Price", value: `Rp ${listing.initialPrice.toLocaleString("id-ID")}`, inline: true },
      { name: "Quantity", value: listing.quantity.toString(), inline: true },
      { name: "Status", value: listing.status, inline: true },
      { name: "Seller", value: listing.owner.username, inline: true },
      { name: "Created", value: listing.createdAt.toLocaleDateString("id-ID"), inline: true }
    );

  if (listing.description) {
    embed.setDescription(listing.description);
  }

  if (listing.offers.length > 0) {
    const offerList = listing.offers
      .map((o) => `• Rp ${o.offerPrice.toLocaleString("id-ID")} by ${o.offerer.username} (${o.status})`)
      .join("\n");
    embed.addFields({ name: `Offers (${listing.offers.length})`, value: offerList });
  }

  embed.setFooter({ text: `ID: ${listing.id}` });

  await interaction.editReply({ embeds: [embed] });
}

async function handleAcceptOffer(
  interaction: ButtonInteraction,
  offerId: string
) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Get offer details
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: { include: { owner: true } },
        offerer: true,
      },
    });

    if (!offer) {
      return interaction.editReply({ content: "Offer not found." });
    }

    // Verify the interacting user is the listing owner
    if (offer.listing.owner.discordId !== interaction.user.id) {
      return interaction.editReply({
        content: "Only the listing owner can accept this offer.",
      });
    }

    if (offer.status !== "PENDING") {
      return interaction.editReply({
        content: "This offer has already been processed.",
      });
    }

    // Determine buyer and seller
    const isSelling = offer.listing.type === "WTS";
    const buyerId = isSelling ? offer.offererId : offer.listing.ownerId;
    const sellerId = isSelling ? offer.listing.ownerId : offer.offererId;

    // Update offer status
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED" },
    });

    // Update listing status
    await prisma.listing.update({
      where: { id: offer.listingId },
      data: { status: "IN_TRANSACTION" },
    });

    // Create the Ticket Channel
    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply({ content: "Guild not found." });
    }

    // Get ticket category from database
    const guildConfig = await prisma.guild.findUnique({
      where: { guildId: guild.id },
    });
    const categoryId = guildConfig?.ticketCategoryId || process.env.DISCORD_TICKET_CATEGORY_ID;
    const ticketChannel = await guild.channels.create({
      name: `ticket-${offer.listing.itemName.slice(0, 20).replace(/\s+/g, "-").toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: categoryId || undefined,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: offer.listing.owner.discordId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: offer.offerer.discordId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    // Also add admin role access if configured
    // (You can extend this with DISCORD_ADMIN_ROLE_ID env var)

    // Create Transaction record
    const transaction = await prisma.transaction.create({
      data: {
        listingId: offer.listingId,
        offerId: offer.id,
        buyerId,
        sellerId,
        totalAmount: offer.offerPrice,
        ticketChannelId: ticketChannel.id,
      },
    });

    // Send Escrow guidelines in the ticket channel
    const escrowEmbed = new EmbedBuilder()
      .setTitle("🔒 Escrow Transaction Started")
      .setColor(0xffd700)
      .setDescription(
        "A transaction has been initiated. Please follow the guidelines below."
      )
      .addFields(
        { name: "Item", value: offer.listing.itemName, inline: true },
        {
          name: "Amount",
          value: `Rp ${offer.offerPrice.toLocaleString("id-ID")}`,
          inline: true,
        },
        {
          name: "Seller",
          value: `<@${isSelling ? offer.listing.owner.discordId : offer.offerer.discordId}>`,
          inline: true,
        },
        {
          name: "Buyer",
          value: `<@${isSelling ? offer.offerer.discordId : offer.listing.owner.discordId}>`,
          inline: true,
        }
      )
      .addFields({
        name: "📋 Escrow Guidelines",
        value: [
          "1️⃣ **Buyer** sends payment to the designated escrow account.",
          "2️⃣ **Admin** verifies payment receipt.",
          "3️⃣ **Seller** ships/delivers the item.",
          "4️⃣ **Buyer** confirms receipt of item.",
          "5️⃣ **Admin** releases payment to seller.",
          "",
          "⚠️ Do NOT send payment directly to the seller.",
          "🛡️ Admin will mediate any disputes.",
        ].join("\n"),
      })
      .setFooter({ text: `Transaction ID: ${transaction.id}` })
      .setTimestamp();

    await ticketChannel.send({
      content: `<@${offer.listing.owner.discordId}> <@${offer.offerer.discordId}>`,
      embeds: [escrowEmbed],
    });

    await interaction.editReply({
      content: `✅ Offer accepted! Ticket created: <#${ticketChannel.id}>`,
    });

    // Disable original message buttons
    await interaction.message.edit({
      components: [],
      content: interaction.message.content + "\n\n✅ **Offer Accepted** — Ticket created.",
    });
  } catch (error) {
    console.error("[Accept Offer] Error:", error);
    await interaction.editReply({
      content: "An error occurred while processing the offer.",
    });
  }
}

async function handleRejectOffer(
  interaction: ButtonInteraction,
  offerId: string
) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: { include: { owner: true } } },
    });

    if (!offer) {
      return interaction.editReply({ content: "Offer not found." });
    }

    if (offer.listing.owner.discordId !== interaction.user.id) {
      return interaction.editReply({
        content: "Only the listing owner can reject this offer.",
      });
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "REJECTED" },
    });

    await interaction.editReply({ content: "❌ Offer rejected." });

    await interaction.message.edit({
      components: [],
      content: interaction.message.content + "\n\n❌ **Offer Rejected**",
    });
  } catch (error) {
    console.error("[Reject Offer] Error:", error);
    await interaction.editReply({ content: "An error occurred." });
  }
}

async function handleCounterOffer(
  interaction: ButtonInteraction,
  offerId: string
) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: { include: { owner: true } } },
    });

    if (!offer) {
      return interaction.editReply({ content: "Offer not found." });
    }

    if (offer.listing.owner.discordId !== interaction.user.id) {
      return interaction.editReply({
        content: "Only the listing owner can counter this offer.",
      });
    }

    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "COUNTERED" },
    });

    await interaction.editReply({
      content:
        "💬 Offer marked as countered. Please submit your counter offer on the web dashboard or DM the buyer.",
    });
  } catch (error) {
    console.error("[Counter Offer] Error:", error);
    await interaction.editReply({ content: "An error occurred." });
  }
}
