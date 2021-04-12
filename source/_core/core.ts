import * as CoreTools from "./core_tools";
import * as types from "./types";
import { createCmdsListeners } from "./commands";
import { config } from "dotenv";
import { Client } from "discord.js";


const DEFAULT_PREFIX = "!";
const { DEFAULT_COMMANDS_DIR, COMMANDS_DIR } = CoreTools

export async function initBot() {
    config();
    const client = new Client();

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(data, [ DEFAULT_COMMANDS_DIR, COMMANDS_DIR ]);
        console.log("-- all message listeners set up --");

        // const currentTime = new Time(new Date());
        // console.log("the current time is:", currentTime.toString());
        console.log("-- bot setup complete --");
        console.log("-- bot ready --");
    });

    const data: types.Data = {
        client: client,
        defaultPrefix: DEFAULT_PREFIX
    };

    console.log("-- authenticating bot... --");
    await loginBot(client);
    console.log("-- bot successfully authenticated --");
}

function loginBot(client: Client) {
    const token = process.env.TOKEN;
    return client.login(token);
}
