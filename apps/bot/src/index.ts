import "dotenv/config";
import { Client, GatewayIntentBits, Collection } from "discord.js";
import { startApiServer } from "./api/server.js";
import { registerCommands } from "./commands/index.js";
import { handleInteraction } from "./handlers/interaction.js";

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

client.once("ready", () => {
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
  registerCommands(client);
});

client.on("interactionCreate", (interaction) => {
  handleInteraction(interaction, client);
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
