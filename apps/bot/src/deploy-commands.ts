import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

async function deployCommands() {
  try {
    console.log("Started refreshing application (/) commands globally.");

    const commandData = commands.map((cmd) => cmd.data.toJSON());

    // Deploy globally so commands work in any server the bot joins
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commandData }
    );

    console.log("Successfully reloaded global application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}

deployCommands();
