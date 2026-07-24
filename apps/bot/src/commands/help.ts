import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
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
          name: "/help",
          value: "Show this help message with all available commands.",
        },
        {
          name: "/katalog",
          value:
            "View active store listings. Use the `type` option to filter by WTS (Want to Sell) or WTB (Want to Buy).",
        },
        {
          name: "/subscribe",
          value:
            "Set the notification channel and ticket category for this server. **Admin only.**",
        }
      )
      .setFooter({
        text: "Entrusted Service Bot • Use the web dashboard for full features",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
