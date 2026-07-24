import { Client } from "discord.js";
import { katalogCommand } from "./katalog.js";
import { subscribeCommand } from "./subscribe.js";

const commands = [katalogCommand, subscribeCommand];

export function registerCommands(client: Client) {
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }
  console.log(`[Bot] Registered ${commands.length} commands`);
}

export { commands };
