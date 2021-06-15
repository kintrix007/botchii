import * as BotUtils from "./bot_utils";
import { CoreData, CustomCoreData } from "./types";
import { createCmdsListeners } from "./commands";
import { config } from "dotenv";
import { Client, ClientOptions } from "discord.js";
import * as path from "path";
config();

interface SetupData {
    commandDirs:    string[];
    defaultPrefix?: string;
    options?:       ClientOptions;
    onready?:       (coreData: CoreData) => void;
};

const DEFAULT_PREFIX = "!";

export async function initBot(
    customCoreData: CustomCoreData,
    setupData: SetupData
) {
    const { commandDirs, defaultPrefix = DEFAULT_PREFIX, options, onready } = setupData;
    BotUtils.setDefaultPrefix(defaultPrefix);
    const client = new Client();
    

    if (options !== undefined) {
        const entries = Object.entries(options) as [keyof ClientOptions, any][]
        entries.forEach(([key, value]) => {
            client.options[key] = value;
        });
    }
    
    const coreData: CoreData = {
        client,
        defaultPrefix,
        ...customCoreData
    };

    const normalizedCommandDirs = commandDirs.map(dir => path.normalize(dir));

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(coreData, [ BotUtils.DEFAULT_COMMANDS_DIR, ...normalizedCommandDirs ]);
        
        console.log("-- bot setup complete --");
        console.log("-- bot ready --");

        const guilds = Array.from(coreData.client.guilds.cache.values());
        console.log(
            `Online in ${guilds.length} guild${guilds.length === 1 ? '' : 's'}:`,
            guilds.map(x => x.name)
        );

        onready?.(coreData);
    });

    console.log("-- authenticating bot... --");
    await loginBot(client);
}

function loginBot(client: Client) {
    const token = process.env.TOKEN;
    return client.login(token);
}
