import { Request, Response } from "express";
import {
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";

interface OfferPayload {
  offerId: string;
  listingId: string;
  itemName: string;
  listingType: string;
  initialPrice: number;
  offerPrice: number;
  offerMessage: string | null;
  ownerDiscordId: string;
  ownerUsername: string;
  offererUsername: string;
}

export async function handleOfferNotification(
  req: Request,
  res: Response,
  client: Client
) {
  try {
    const payload: OfferPayload = req.body;
    const {
      offerId,
      listingId,
      itemName,
      listingType,
      initialPrice,
      offerPrice,
      offerMessage,
      ownerDiscordId,
      offererUsername,
    } = payload;

    const channelId = process.env.DISCORD_NOTIFICATION_CHANNEL_ID;
    if (!channelId) {
      return res.status(500).json({ error: "Notification channel not configured" });
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      return res.status(500).json({ error: "Channel not found or not text channel" });
    }

    // Build the embed
    const embed = new EmbedBuilder()
      .setTitle("📩 New Offer Received!")
      .setColor(listingType === "WTS" ? 0x00ff88 : 0x0088ff)
      .addFields(
        { name: "Item", value: itemName, inline: true },
        { name: "Type", value: listingType, inline: true },
        { name: "Listed Price", value: `Rp ${initialPrice.toLocaleString("id-ID")}`, inline: true },
        { name: "Offer Price", value: `Rp ${offerPrice.toLocaleString("id-ID")}`, inline: true },
        { name: "From", value: offererUsername, inline: true }
      )
      .setTimestamp();

    if (offerMessage) {
      embed.addFields({ name: "Message", value: offerMessage });
    }

    // Build interactive buttons
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`offer_accept:${offerId}`)
        .setLabel("✅ Accept")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`offer_reject:${offerId}`)
        .setLabel("❌ Reject")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`offer_counter:${offerId}`)
        .setLabel("💬 Counter Offer")
        .setStyle(ButtonStyle.Secondary)
    );

    // Send notification mentioning the owner
    await channel.send({
      content: `<@${ownerDiscordId}> — You received a new offer!`,
      embeds: [embed],
      components: [actionRow],
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("[Notify Offer] Error:", error);
    return res.status(500).json({ error: "Failed to send notification" });
  }
}
