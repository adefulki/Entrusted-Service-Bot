import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show all available commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("📖 Entrusted Service — Commands")
      .setColor(0x5865f2)
      .setDescription("Here are all available commands:")
      .addFields(
        {
          name: "🏪 /katalog",
          value:
            "Browse active listings with buttons to offer, edit, or delete.\n" +
            "Options: `type` (WTS/WTB), `search` (item name), `min_price`, `max_price`",
        },
        {
          name: "📦 /item create",
          value: "Create a new listing (type, name, price, quantity, description, image).",
        },
        {
          name: "📋 /item list",
          value: "View your active listings with their IDs.",
        },
        {
          name: "✏️ /item edit",
          value: "Edit one of your listings by ID (name, price, quantity, description, image).",
        },
        {
          name: "🗑️ /item delete",
          value: "Delete one of your listings by ID.",
        },
        {
          name: "💰 /offer",
          value: "Make an offer on a listing by ID with price and optional message.",
        },
        {
          name: "🔔 /subscribe",
          value:
            "Set notification channel and ticket category for this server. **Admin only.**",
        },
        {
          name: "🌐 /web",
          value: "Get quick links to the web dashboard (Marketplace, My Listings, My Offers).",
        },
        {
          name: "❓ /help",
          value: "Show this help message.",
        }
      )
      .setFooter({
        text: "Tip: Use /katalog for interactive buttons — no need to copy IDs!",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
