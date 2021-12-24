import { Client, Intents } from "discord.js";
import { token } from "../config.json"
import { getCommandFiles, loadCommands } from "./commandLoader";

const DEFAULT_CLIENT = new Client({
    intents: [ Intents.FLAGS.GUILDS ],
    allowedMentions: { parse: [ "users" ], repliedUser: true }
});

export type Literal = string | number | boolean | undefined | null | void | {};
export function tuple<T extends Literal[]>(...args: T) { return args };

export const REPLY_STATUS = {
    success: 0x00bb00,
    failure: 0xbb0000,
    neutral: 0x008888,
} as const;
export type ReplyStatus = keyof typeof REPLY_STATUS;

export async function init(unauthClient = DEFAULT_CLIENT) {
    unauthClient.once("ready", async client => {
        console.log("bot online");
        await loadCommands(client);
    });
    
    unauthClient.login(token);
}
