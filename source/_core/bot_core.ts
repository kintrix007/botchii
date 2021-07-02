import { DEFAULT_COMMANDS_DIR } from "./general_utils";
import { impl } from "./bot_utils"
import { CommandContentModifier, CoreData, CustomCoreData, LoggedInClient } from "./types";
import { createCmdsListeners } from "./commands";
import { Client, ClientOptions } from "discord.js";
import * as path from "path";

export * from "./types";
export * from "./bot_utils";
export * from "./general_utils";
export * from "./dc_utils";
export { getCmd, getCmdCallData, getCmdList, getPermittedCmdList } from "./commands";
export { addListener } from "./listeners"

interface SetupData {
    commandDirs:              string[];
    defaultPrefix?:           string;
    options?:                 ClientOptions;
    commandContentModifiers?: CommandContentModifier[];
    onready?:                 (coreData: CoreData) => void;
};

const DEFAULT_PREFIX = "!";

export async function initBot(customCoreData: CustomCoreData, setupData: SetupData) {
    const {
        commandDirs,
        defaultPrefix = DEFAULT_PREFIX,
        options,
        commandContentModifiers = [],
        onready
    } = setupData;

    impl.setDefaultPrefix(defaultPrefix);
    impl.setCommandContentModifiers(commandContentModifiers);

    const client = new Client();
    if (options !== undefined) {
        const entries = Object.entries(options) as [keyof ClientOptions, any][]
        entries.forEach(([key, value]) => {
            client.options[key] = value;
        });
    }

    const normalizedCommandDirs = commandDirs.map(dir => path.normalize(dir));

    client.on("ready", async () => {
        console.log("-- bot online --");

        const coreData: CoreData = {
            client: client as LoggedInClient,
            defaultPrefix,
            ...customCoreData
        };

        await createCmdsListeners(coreData, [ DEFAULT_COMMANDS_DIR, ...normalizedCommandDirs ]);
        
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
    const token = impl.botToken;
    return client.login(token);
}
