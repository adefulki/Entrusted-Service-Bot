import "dotenv/config";
import { Client, Events, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import { startApiServer } from "./api/server.js";
import { registerCommands, commands } from "./commands/index.js";
import { handleInteraction } from "./handlers/interaction.js";
import { handleGuildCreate } from "./events/guild-create.js";
import { handleGuildDelete } from "./events/guild-delete.js";

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Register commands collection
client.commands = new Collection();

client.once(Events.ClientReady, async () => {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
  registerCommands(client);

  // Deploy slash commands globally
  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
    const commandData = commands.map((cmd) => cmd.data.toJSON());

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commandData }
    );
    console.log(`[Bot] Deployed ${commandData.length} global slash commands`);
  } catch (error) {
    console.error("[Bot] Failed to deploy commands:", error);
  }
});

// Events
client.on("interactionCreate", (interaction) => {
  handleInteraction(interaction, client);
});

client.on("guildCreate", (guild) => {
  handleGuildCreate(guild);
});

client.on("guildDelete", (guild) => {
  handleGuildDelete(guild);
});

// Start Discord bot
client.login(process.env.DISCORD_TOKEN);

// Start internal HTTP API server for web app communication
startApiServer(client);

// Extend the Client type
declare module "discord.js" {
  interface Client {
    commands: Collection<string, any>;
  }
}
