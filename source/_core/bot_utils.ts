import fs from "fs";
import path from "path";
import { Command, CommandContentModifier, CommandPermission, CoreData, Prefs } from "./types";
import { capitalize } from "./general_utils";
import { AdminData, ADMIN_PREFS_FILE, PrefixData, PREFIX_PREFS_FILE } from "./default_commands/command_prefs";
import { PermissionString, DMChannel, GuildMember, User, Snowflake, Message } from "discord.js";

export const BOT_CORE_DIR         = path.join(__dirname);
export const DEFAULT_COMMANDS_DIR = path.join(BOT_CORE_DIR, "default_commands");
export const ROOT_DIR             = path.join(BOT_CORE_DIR, "..", "..");
export const SOURCE_DIR = path.join(ROOT_DIR, "source");
export const PREFS_DIR  = path.join(ROOT_DIR, "prefs");


export const impl = new class{
    private CONFIG_FILE = path.join(ROOT_DIR, "config.json");
    private configObj = JSON.parse(fs.readFileSync(this.CONFIG_FILE).toString());
    private _defaultPrefix: string | undefined = undefined;
    private _messageContentModifiers: CommandContentModifier[] | undefined = undefined;
    
    constructor() {
        if (typeof this.configObj.botToken === "undefined") throw new Error("field 'botToken' is undefined in 'config.json'");
        if (typeof this.configObj.botOwnerID === "undefined") throw new Error("field 'botOwnerID' is undefined in 'config.json'");
        if (typeof this.configObj.botToken !== "string") throw new Error("field 'botToken' is not a string in 'config.json'");
        if (typeof this.configObj.botOwnerID !== "string") throw new Error("field 'botOwnerID' is not a string in 'config.json'");
    }

    get botToken() {
        const token = <string>this.configObj.botToken;
        return token;
    }

    get ownerID() {
        const ownerID = <string>this.configObj.botOwnerID;
        return ownerID;
    }
    
    get defaultPrefix() {
        if (this._defaultPrefix === undefined) throw new Error("default prefix is undefined!");
        return this._defaultPrefix!;
    }

    set defaultPrefix(newPrefix: string) {
        if (this._defaultPrefix !== undefined) throw new Error("'defaultPrefix' is already set!");
        this._defaultPrefix = newPrefix;
    }
    
    set messageContentModifiers(arr: CommandContentModifier[]) {
        if (this._messageContentModifiers !== undefined) throw new Error("'messageContentModifiers' is already set!");
        this._messageContentModifiers = [...arr]; // set it to a copy, not a reference
    }
    
    public applyMessageContentModifiers(cont: string) {
        return this._messageContentModifiers!.reduce((cont, modifier) => modifier(cont), cont);
    }
}();


export function isCommand(obj: unknown): obj is Command {
    if (typeof obj !== "object") return false;
    if (obj == null) return false;
    
    type BasicTypes = "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
    function test(field: unknown, types: BasicTypes[]): boolean {
        return types.some(x => typeof field === x);
    }
    function testArray(field: unknown, arrayTypes: BasicTypes[]): boolean {
        if (!(field instanceof Array)) return false;
        return field.every(x => test(x, arrayTypes));
    }
    function test2DArray(field: unknown, arrayTypes: BasicTypes[]): boolean {
        if (!(field instanceof Array)) return false;
        return field.every(x => testArray(x, arrayTypes));
    }
    
    const { setup, call, name, aliases, permissions, group, usage, description, examples } = obj as Command;
    return [
        test(setup, [ "undefined", "function" ]),
        test(call, [ "function" ]),
        test(name, [ "string" ]),
        test(aliases, [ "undefined" ]) || testArray(aliases, [ "string" ]),
        test(permissions, [ "undefined", "object" ]),
        test(group, [ "undefined", "string" ]),
        test(usage, [ "undefined", "string" ]),
        test(description, [ "undefined", "string" ]),
        test(examples, [ "undefined" ]) || test2DArray(examples, [ "string" ]),
    ].every(x => x);
}


export const adminPermission: CommandPermission = {
    test:         ({ msg }) => isAdmin(msg.member),
    errorMessage: ({ cmdName }) =>`The command \`${cmdName}\` can only be used by admins.`,
    description:  cmd => "Only people with the **admin role**, or with the **Administrator** permission can use this command.",
};
export const ownerPermission: CommandPermission = {
    test:         ({ msg }) => isBotOwner(msg.author),
    errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by the bot's owner.`,
    description:  cmd => "Only the bot's **owner** can use this command.",
};


export function createCommandPermission(permission: PermissionString) {
    const humanReadablePermission = humanReadable(permission);
    const cmdPerm: CommandPermission = {
        test:         ({ msg }) => msg.member?.hasPermission(permission) ?? false,
        errorMessage: ({ cmdName }) => `The command \`${cmdName}\` can only be used by people with **${humanReadablePermission}** permission.`,
        description:  cmd => `Only people with **${humanReadablePermission}** permission can use this command.`,
    };
    return cmdPerm;
}

export function createChannelSpecificCmdPermission(permission: PermissionString) {
    const humanReadablePermission = humanReadable(permission);
    const cmdPerm: CommandPermission = {
        test: ({ msg }) => {
            const channel = msg.channel;
            if (channel instanceof DMChannel) return true;
            if (msg.member === null) return false;
            const perms = channel.permissionsFor(msg.member);
            return perms?.has(permission) ?? false;
        },
        errorMessage: ({ cmdName }) => `You can only use \`${cmdName}\` if you have **${humanReadablePermission}** in this channel!`,
        description: cmd => `Only people, who have **${humanReadablePermission}** permission in a given channel, can use this command.`,
    };
    return cmdPerm;
}


export function isAdmin(member: GuildMember | undefined | null) {
    if (!member) return false;
    const adminRole = getAdminRole(member.guild.id);

    return member.roles.cache.some(role => role.id === adminRole?.roleID) || member.hasPermission("ADMINISTRATOR");
}

export function isBotOwner(user: User) {
    return user.id === getBotOwnerID();
}

export function getAdminRole(guildID: Snowflake) {
    const adminRoles = loadPrefs<AdminData>(ADMIN_PREFS_FILE, true);
    const adminRole = adminRoles[guildID];
    return adminRole;
}

export const getBotOwnerID = () => impl.ownerID;

export async function getBotOwner(data: CoreData) {
    const ownerID = impl.ownerID;
    return await data.client.users.fetch(ownerID);  // returns a Promise
}


/** returns the contents of `msg` after removing the prefix from the beginning of it */
export function prefixless(msg: Message): string | undefined {
    const guild = msg.guild;
    if (!guild) return undefined;
    const cont = msg.content;
    const prefix = impl.applyMessageContentModifiers(getPrefix(guild.id));
    
    if (impl.applyMessageContentModifiers(cont).startsWith(prefix)) {
        return cont.slice(prefix.length);
    }

    const regex = new RegExp(`^<@!?${msg.client.user!.id}>\\s*(.+?)\\s*$`, "i");
    const match = cont.match(regex);
    if (!match) return undefined;

    return match[1];
}

export function getPrefix(guildID: Snowflake) {
    const prefixes = loadPrefs<PrefixData>(PREFIX_PREFS_FILE, true);
    const prefixData = prefixes[guildID] ?? { prefix: impl.defaultPrefix };
    return prefixData.prefix;
}


export function savePrefs(filename: string, saveData: Prefs<{}>, silent = false) {
    if (!fs.existsSync(PREFS_DIR)) {
        fs.mkdirSync(PREFS_DIR);
        console.log(`created dir '${PREFS_DIR}' because it did not exist`);
    }

    const filePath = path.join(PREFS_DIR, filename + ".json");
    fs.writeFileSync(filePath, JSON.stringify(saveData, undefined, 2));
    if (!silent) console.log(`saved prefs in '${filename}'`);
}

/** returns {} if the given prefs file does not exist */
export function loadPrefs<T>(filename: string, silent = false) {
    if (!fs.existsSync(PREFS_DIR)) {
        fs.mkdirSync(PREFS_DIR);
        console.log(`created dir '${PREFS_DIR}' because it did not exist`);
    }
    
    const filePath = path.join(PREFS_DIR, filename + ".json");
    if (!fs.existsSync(filePath)) return {};

    const loadDataRaw = fs.readFileSync(filePath).toString();
    const loadData = JSON.parse(loadDataRaw) as Prefs<T>;
    
    if (!silent) console.log(`loaded prefs from '${filename}'`);

    return loadData;
}

/** 
 * Overwrites a part of the prefs file.
 * Where the keys overlap, it saves the data from `overwriteData`,
 * otherwise the data from the JSON prefs file.
 * Since the keys are always the guildID's it makes it easier to update the prefs for a single guild.
*/
export function updatePrefs<T>(filename: string, overwriteData: Prefs<T>, silent = false) {
    const newPrefs: Prefs<T> = { ...loadPrefs<T>(filename, true), ...overwriteData };
    savePrefs(filename, newPrefs, true);
    if (!silent) console.log(`updated prefs in '${filename}'`);
}

// local Utility

function humanReadable(perm: PermissionString) {
    const words = perm.toLowerCase().split("_");
    return words.map(capitalize).join(" ");
}
