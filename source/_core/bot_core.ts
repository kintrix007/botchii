import { DEFAULT_COMMANDS_DIR } from "./core_tools";
import * as types from "./types";
import { createCmdsListeners } from "./commands";
import { config } from "dotenv";
import { Client } from "discord.js";


interface SetupData {
    defaultPrefix?: string,
    commandDirs:    string[]
};

export async function initBot(setupData: SetupData) {
    config();
    const client = new Client();

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(data, [ DEFAULT_COMMANDS_DIR, ...setupData.commandDirs ]);
        
        // const currentTime = new Time(new Date());
        // console.log("the current time is:", currentTime.toString());
        console.log("-- bot setup complete --");
        console.log("-- bot ready --");
    });

    const defaultPrefix = setupData.defaultPrefix ?? "!";

    const data: types.Data = {
        client,
        defaultPrefix
    };

    console.log("-- authenticating bot... --");
    await loginBot(client);
    console.log("-- bot successfully authenticated --");
}

function loginBot(client: Client) {
    const token = process.env.TOKEN;
    return client.login(token);
}
