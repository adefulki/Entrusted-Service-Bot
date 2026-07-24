import {
  ButtonInteraction,
  Client,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
} from "discord.js";
import { prisma } from "@entrusted/database";

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  client: Client
) {
  const [action, offerId] = interaction.customId.split(":");

  if (!offerId) return;

  switch (action) {
    case "offer_accept":
      await handleAcceptOffer(interaction, offerId);
      break;
    case "offer_reject":
      await handleRejectOffer(interaction, offerId);
      break;
    case "offer_counter":
      await handleCounterOffer(interaction, offerId);
      break;
  }
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

    const categoryId = process.env.DISCORD_TICKET_CATEGORY_ID;
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
