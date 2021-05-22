import { DEFAULT_COMMANDS_DIR } from "./core_tools";
import * as types from "./types";
import { createCmdsListeners } from "./commands";
import { config } from "dotenv";
import { Client, ClientOptions } from "discord.js";

interface SetupData {
    commandDirs:    string[];
    defaultPrefix?: string;
    options:        ClientOptions;
};

const DEFAULT_PREFIX = "!";

export async function initBot(setupData: SetupData, commandData: types.CustomData) {
    config();
    const client = new Client();

    const defaultPrefix = setupData.defaultPrefix ?? DEFAULT_PREFIX;

    Object.entries(setupData.options).forEach(([key, value]) => {
        client.options[key as keyof Required<ClientOptions>] = value;
    })

    const data: types.Data = {
        client,
        defaultPrefix,
        ...commandData
    };

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(data, [ DEFAULT_COMMANDS_DIR, ...setupData.commandDirs ]);
        
        console.log(`the current time is: ${Date()}`);
        console.log("-- bot setup complete --");
        console.log("-- bot ready --");
    });

    console.log("-- authenticating bot... --");
    await loginBot(client);
    console.log("-- bot successfully authenticated --");
}

function loginBot(client: Client) {
    const token = process.env.TOKEN;
    return client.login(token);
}
