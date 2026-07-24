import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { prisma } from "@entrusted/database";

export const subscribeCommand = {
  data: new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("Set the notification channel and ticket category for this server")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("notification_channel")
        .setDescription("Channel where offer notifications will be sent")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("ticket_category")
        .setDescription("Category where ticket channels will be created")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) {
      return interaction.editReply("This command can only be used in a server.");
    }

    // Only allow the server owner or admins
    if (
      interaction.user.id !== guild.ownerId &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.editReply(
        "❌ Only the server owner or administrators can use this command."
      );
    }

    const notificationChannel = interaction.options.getChannel("notification_channel", true);
    const ticketCategory = interaction.options.getChannel("ticket_category", false);

    // Upsert guild config in database
    await prisma.guild.upsert({
      where: { guildId: guild.id },
      update: {
        notificationChannelId: notificationChannel.id,
        ticketCategoryId: ticketCategory?.id || null,
        name: guild.name,
      },
      create: {
        guildId: guild.id,
        name: guild.name,
        notificationChannelId: notificationChannel.id,
        ticketCategoryId: ticketCategory?.id || null,
      },
    });

    let reply = `✅ Subscribed! Notifications will be sent to <#${notificationChannel.id}>.`;
    if (ticketCategory) {
      reply += `\n📁 Ticket channels will be created under **${ticketCategory.name}**.`;
    }

    await interaction.editReply(reply);
  },
};
