import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { Client, MessageEmbed } from "discord.js";
import { Command, CommandCall } from "./types";
import { token, testServerId } from "../config.json"
import { REPLY_STATUS } from "./types";

const COMMAND_DIR = path.join(__dirname, "..", "commands");
const MAX_DESCRIPTION_LENGTH = 80;

const rest = new REST().setToken(token);
const allCommands: { [name: string]: Command } = {};

let hasRequiredCommands = true;

export async function loadCommands(client: Client<true>) {
    const commandFiles = getCommandFiles(COMMAND_DIR);
    requireCommands(commandFiles);

    // console.log("running setup for commands...");
    const setupPromises = Object.values(allCommands).map(x => x.setup?.(client));
    await Promise.allSettled(setupPromises);
    console.log("successfully ran setup for commands");

    Object.values(allCommands).forEach(x => {
        if (x.slashCommand.description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`The description of '${x.slashCommand.name}' should not be longer than ${MAX_DESCRIPTION_LENGTH}!\n'longDescription' should be used for that`);
        }
    });

    await registerSlashCommands(client);
    setUpListeners(client);
}

export function requireCommands(commandFiles: string[]) {
    // console.log("loading command modules...");
    commandFiles.forEach(f => {
        const command = require(f).default as Command;
        allCommands[command.slashCommand.name] = command;
    });
    hasRequiredCommands = true;
    console.log(`successfully loaded (${Object.keys(allCommands).length}) commands`);
}

export function getCommandFiles(dir: string): string[] {
    const items = fs.readdirSync(dir).map(f => path.join(dir, f));
    const dirs  = items.filter(p => fs.lstatSync(p).isDirectory());
    const files = items.filter(p => fs.lstatSync(p).isFile() && p.endsWith(".ts"));
    return [ ...files, ...dirs.map(d => getCommandFiles(d)).flat(1) ];
}

export async function registerSlashCommands(client: Client<true>) {
    // console.log("registering slash commands...");
    const commandJSONs = Object.values(allCommands).map(c => c.slashCommand.toJSON());

    //TODO change it to use guild commands only for testing
    // await rest.put(Routes.applicationCommands(client.user.id), { body: commandJSONs });
    await rest.put(Routes.applicationGuildCommands(client.user.id, testServerId), { body: commandJSONs });
    
    console.log("successfully registered slash commands");
}

export function setUpListeners(client: Client<true>) {
    // console.log("setting up slash command listeners...")
    client.on("interactionCreate", async inter => {
        if (!inter.isCommand()) return;
        const command = allCommands[inter.commandName];
        if (command === undefined) return;

        const cmdCall: CommandCall = {
            client: client,
            inter: inter,
        };
        const res = await command.execute(cmdCall);
        const replyOptions = getReplyOptionsFromRes(res);
        
        if (replyOptions === undefined) return;
        await inter.reply(replyOptions);
    });
    console.log("successfully set up slash command listeners");
}

export function getCommandNames() {
    if (!hasRequiredCommands) throw new Error("Cannot access commands before they are loaded.");
    return Object.keys(allCommands);
}

export function getCommand(name: string) {
    if (!hasRequiredCommands) throw new Error("Cannot access commands before they are loaded.");
    if (!Object.keys(allCommands).includes(name)) throw new Error(`Command ${name} does not exist.`);
    return allCommands[name]!;
}

function getReplyOptionsFromRes(res: Awaited<ReturnType<Command["execute"]>>) {
    if (res == undefined) return undefined;
    if (typeof res === "string") return { embeds: [ new MessageEmbed().setDescription(res).setColor(REPLY_STATUS.success) ] };
    if (res instanceof MessageEmbed) return { embeds: [res] };
    if (res instanceof Array) {
        if (typeof res[0] === "string") return { embeds: [ new MessageEmbed().setDescription(res[0]).setColor(REPLY_STATUS.success) ], ephemeral: res[1] }
        if (res[0] instanceof MessageEmbed) return { embeds: [res[0]], ephemeral: res[1] };
        return undefined;
    }
    //! Error prone. Has `void` as a possible return type, so any runtime value passes.
    //TODO Make a type guard to check if it is actually of `InteractionReplyOptions`.
    return res;
}
