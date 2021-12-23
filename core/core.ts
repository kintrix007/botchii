import { Client, Intents } from "discord.js";
import { token } from "../config.json"
import { getCommandFiles, loadCommands } from "./commandLoader";

const DEFAULT_CLIENT = new Client({
    intents: [ Intents.FLAGS.GUILDS ],
    allowedMentions: { parse: [ "users" ], repliedUser: true }
});

export async function init(unauthClient = DEFAULT_CLIENT) {
    unauthClient.once("ready", async client => {
        console.log("bot online");
        await loadCommands(client);
    });
    
    unauthClient.login(token);
}
