import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Client } from "discord.js";
import { Command, CommandCall } from "./types";
import { token } from "../config.json"

const COMMAND_DIR = path.join(__dirname, "..", "commands");

const rest = new REST().setToken(token);
const allCommands: { [name: string]: Command } = {};

export function getCommandFiles(dir: string): string[] {
    const items = fs.readdirSync(dir).map(f => path.join(dir, f));
    const dirs  = items.filter(p => fs.lstatSync(p).isDirectory());
    const files = items.filter(p => fs.lstatSync(p).isFile() && p.endsWith(".ts"));
    return [ ...files, ...dirs.map(d => getCommandFiles(d)).flat(1) ];
}

export async function loadCommands(client: Client<true>) {
    const commandFiles = getCommandFiles(COMMAND_DIR);
    commandFiles.forEach(f => {
        const command = require(f).default as Command;
        // console.log(command);
        allCommands[command.slashCommand.name] = command;
    });

    registerSlashCommands(client);
    setUpListeners(client);
}

export async function registerSlashCommands(client: Client<true>) {
    console.log("registering global slash commands...")
    const commandJSONs = Object.values(allCommands).map(c => c.slashCommand.toJSON());
    // console.log(commandJSONs);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commandJSONs });
    console.log("successfully registered global slash commands");
}

export function setUpListeners(client: Client<true>) {
    console.log("setting up slash command listeners...")
    client.on("interactionCreate", async inter => {
        if (!inter.isCommand()) return;
        const command = allCommands[inter.commandName];
        if (command === undefined) return;

        const cmdCall: CommandCall = {
            client: client,
            inter: inter,
        };
        const res = await command.execute(cmdCall);
        if (res === undefined) return;
        await inter.reply(res);
    });
    console.log("Successfully set up slash command listeners");
}

export function getCommandNames() {
    return Object.keys(allCommands);
}
