import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

const WEB_URL = process.env.NEXT_PUBLIC_APP_URL || "https://entrusted-service-web-production.up.railway.app";

export const webCommand = {
  data: new SlashCommandBuilder()
    .setName("web")
    .setDescription("Get links to the web dashboard"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("🌐 Entrusted Service — Web Dashboard")
      .setColor(0x5865f2)
      .setDescription("Access the full marketplace and manage your listings from the web.")
      .setTimestamp();

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("🏪 Marketplace")
        .setStyle(ButtonStyle.Link)
        .setURL(`${WEB_URL}/marketplace`),
      new ButtonBuilder()
        .setLabel("➕ Create Listing")
        .setStyle(ButtonStyle.Link)
        .setURL(`${WEB_URL}/marketplace/create`),
      new ButtonBuilder()
        .setLabel("📦 My Listings")
        .setStyle(ButtonStyle.Link)
        .setURL(`${WEB_URL}/marketplace/my-listings`),
      new ButtonBuilder()
        .setLabel("📨 My Offers")
        .setStyle(ButtonStyle.Link)
        .setURL(`${WEB_URL}/marketplace/my-offers`)
    );

    await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
  },
};
