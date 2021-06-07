import { DEFAULT_COMMANDS_DIR, setDefaultPrefix } from "./core_tools";
import * as types from "./types";
import { createCmdsListeners } from "./commands";
import { config } from "dotenv";
import { Client, ClientOptions } from "discord.js";
import * as path from "path";

interface SetupData {
    commandDirs:    string[];
    defaultPrefix?: string;
    onready?:        (data: types.Data) => void;
    options?:        ClientOptions;
};

const DEFAULT_PREFIX = "!";

export async function initBot(
    commandData: types.CustomData,
    { commandDirs, defaultPrefix = DEFAULT_PREFIX, onready, options }: SetupData
) {
    config();
    setDefaultPrefix(defaultPrefix);
    const client = new Client();

    if (options) {
        Object.entries(options).forEach(([key, value]) => {
            client.options[key as keyof ClientOptions] = value;
        });
    }

    const data: types.Data = {
        client,
        defaultPrefix,
        ...commandData
    };

    const normalizedCommandDirs = commandDirs.map(dir => path.normalize(dir));

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(data, [ DEFAULT_COMMANDS_DIR, ...normalizedCommandDirs ]);
        
        console.log("-- bot setup complete --");
        console.log("-- bot ready --");

        const guilds = Array.from(data.client.guilds.cache.values());
        console.log(
            `Added to ${guilds.length} guild${guilds.length === 1 ? '' : 's'}:`,
            guilds.map(x => x.name)
        );

        onready?.(data);
    });

    console.log("-- authenticating bot... --");
    await loginBot(client);
}

function loginBot(client: Client) {
    const token = process.env.TOKEN;
    return client.login(token);
}
