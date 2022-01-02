import fs from "fs";
import path from "path";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { ApplicationCommand, Client, Collection, GuildResolvable, MessageEmbed } from "discord.js";
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
    await setUpGlobalPermissions(client);
    await setUpGuildPermissions(client);
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

function getCommandFiles(dir: string): string[] {
    const items = fs.readdirSync(dir).map(f => path.join(dir, f));
    const dirs  = items.filter(p => fs.lstatSync(p).isDirectory());
    const files = items.filter(p => fs.lstatSync(p).isFile() && p.endsWith(".ts"));
    return [ ...files, ...dirs.map(d => getCommandFiles(d)).flat(1) ];
}

async function registerSlashCommands(client: Client<true>) {
    // console.log("registering slash commands...");
    const globalCommandJSONs = Object.values(allCommands).filter(({ type }) => type === "global").map(({ slashCommand }) => slashCommand.toJSON());
    const guildCommandJSONs  = Object.values(allCommands).filter(({ type }) => type === "guild").map(({ slashCommand }) => slashCommand.toJSON());

    // TODO change it to select between the two without editing the code

    if (false) {
        //? For deployment
        await rest.put(Routes.applicationCommands(client.user.id), { body: globalCommandJSONs });
        const guildRegisterPromises = client.guilds.cache
            .map(guild => rest.put(Routes.applicationGuildCommands(client.user.id, guild.id), { body: guildCommandJSONs }));
        await Promise.allSettled(guildRegisterPromises);
    } else {
        //? For testing
        await rest.put(Routes.applicationGuildCommands(client.user.id, testServerId), { body: [ ...globalCommandJSONs, ...guildCommandJSONs ] });
    }

    console.log("successfully registered slash commands");
}

//! Hacky!
async function setUpGlobalPermissions(client: Client<true>) {
    if (client.application.owner === null) await client.application.fetch();

    const globalCommands = await client.application.commands.fetch();
    
    //TODO Update all permissions with one API call...
    const permissionPromises = globalCommands.map(_appCmd => {
        // For some reason the built-in type is incorrect??? 
        const appCmd = _appCmd as ApplicationCommand<{ guild?: GuildResolvable }>;
        const command = allCommands[appCmd.name];
        if (command?.type !== "global") return undefined;
        
        if (command?.permissions !== undefined) {
            return appCmd.permissions.set({
                permissions: command.permissions,
            });
        }
        return undefined;
    });
    
    await Promise.allSettled(permissionPromises);
    console.log("successfully set up permissions for global slash commands");
}

//! Hacky!
async function setUpGuildPermissions(client: Client<true>) {
    if (client.application.owner === null) await client.application.fetch();
    
    const guildCommandPromises = client.guilds.cache.map(async guild => await guild.commands.fetch());
    const guildCommands = <Awaited<typeof guildCommandPromises[number]>>new Collection();
    for await (const appCmd of guildCommandPromises) guildCommands.concat(appCmd);
    
    const permissionPromises = guildCommands.map(_appCmd => {
        // For some reason the built-in type is incorrect??? 
        const appCmd = _appCmd as ApplicationCommand<{ guild?: GuildResolvable }>;
        const command = allCommands[appCmd.name];
        if (command?.type !== "guild") return undefined;
        
        //TODO Make a system for guild-specific permissions
        if (false) {
            return appCmd.permissions.set({
                permissions: [],
                guild: appCmd.guild?.id,
            });
        }
        
        return undefined;
    });

    await Promise.allSettled(permissionPromises);
    console.log("successfully set up permissions for guild slash commands");
}

function setUpListeners(client: Client<true>) {
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
    //TODO Make a type guard to check if it is actually of type `InteractionReplyOptions`.
    return res;
}

export function getCommandNames() {
    if (!hasRequiredCommands) throw new Error("Cannot access commands before they are loaded.");
    return Object.keys(allCommands);
}

export function getCommand(name: string) {
    if (!hasRequiredCommands) throw new Error("Cannot access commands before they are loaded.");
    const command = allCommands[name];
    if (command === undefined) throw new Error(`Command ${name} does not exist.`);
    return command;
}
