import * as Utilz from "./classes/utilz";
import * as types from "./classes/types";
import Time from "./classes/time";
import { createCmdsListeners } from "./commands";
// import * as fs from "fs";
import * as DC from "discord.js";
import * as path from "path";
import { config } from "dotenv";

config();
const client = new DC.Client();

const DEFAULT_PREFIX = "!";
const CMDS_DIR = path.join(__dirname, "cmds");
const SOURCE_DIR = Utilz.sourceDir;

function main() {
    // declare some consts here

    client.on("ready", async () => {
        console.log("-- bot online --");

        await createCmdsListeners(data, CMDS_DIR);
        
        const currentTime = new Time(new Date());
        console.log("the current time is:", currentTime.toString());
        console.log("-- bot setup complete --");
        console.log("-- bot ready --");
    });

    const data: types.Data = {
        client: client,
        defaultPrefix: DEFAULT_PREFIX
    };

    (async () => {
        console.log("-- authenticating bot... --");
        await loginBot();
        console.log("-- bot successfully authenticated --");
    })();
}

function loginBot() {
    const token = process.env.TOKEN;
    return client.login(token);
}


main();
