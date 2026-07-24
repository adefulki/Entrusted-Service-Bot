import {
  Interaction,
  Client,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from "discord.js";
import { handleButtonInteraction } from "./button-handler.js";
import { handleModalSubmit } from "./modal-handler.js";

export async function handleInteraction(
  interaction: Interaction,
  client: Client
) {
  // Slash commands
  if (interaction.isChatInputCommand()) {
    await handleSlashCommand(interaction, client);
  }

  // Button interactions
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction, client);
  }

  // Modal submissions
  if (interaction.isModalSubmit()) {
    await handleModalSubmit(interaction, client);
  }
}

async function handleSlashCommand(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Command] Error executing ${interaction.commandName}:`, error);
    const reply = {
      content: "There was an error executing this command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
