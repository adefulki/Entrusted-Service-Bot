import { Client } from "discord.js";
import { helpCommand } from "./help.js";
import { katalogCommand } from "./katalog.js";
import { subscribeCommand } from "./subscribe.js";
import { itemCommand } from "./item.js";
import { offerCommand } from "./offer.js";

const commands = [helpCommand, katalogCommand, subscribeCommand, itemCommand, offerCommand];

export function registerCommands(client: Client) {
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }
  console.log(`[Bot] Registered ${commands.length} commands`);
}

export { commands };
