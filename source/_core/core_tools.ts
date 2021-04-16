import fs from "fs";
import path from "path";
import * as types from "./types";
import { config } from "dotenv";
import { Client, DMChannel, GuildChannel, GuildMember, Message, MessageEmbed, NewsChannel, Snowflake, TextChannel, User } from "discord.js";

import { PrefixData } from "./default_commands/prefix";
import { AdminData } from "./default_commands/admin";

config();

export const CORE_DIR   = path.join(__dirname);
export const DEFAULT_COMMANDS_DIR = path.join(CORE_DIR, "default_commands");

export const ROOT_DIR   = path.join(CORE_DIR, "..", "..");
export const SOURCE_DIR = path.join(ROOT_DIR, "source");
export const PICS_DIR   = path.join(ROOT_DIR, "images");
export const PREFS_DIR  = path.join(ROOT_DIR, "prefs");

export const PREFIX_PREFS_FILE = "prefix.json";
export const ADMIN_PREFS_FILE  = "admin.json";

export async function cacheChannelMessages(client: Client, channelIDs: string[]) {
    let successCount = 0;
    
    for (const ID of channelIDs) {
        try {
            const channel = await client.channels.fetch(ID) as TextChannel;
            const messages = await channel.messages.fetch();
            successCount += messages.size;
        }
        catch (err) {
            console.error(err);
        }
    }

    return successCount;
}

export async function addReactions(msg: Message, reactions: string[], maxTries = 3) {
    try {
        for (const reaction of reactions) {
            await msg.react(reaction);
        }
    }
    catch (err) {
        if (maxTries === 0) return console.error(err);

        await msg.reactions.removeAll()
            .then(() => addReactions(msg, reactions, maxTries-1))
            .catch(console.error);
    }
}

export const removeAccents = (() => {
    const nonAccents: {[nonAccent: string]: string[]} = {
        "a": ["á", "å", "ǎ", "ä", "ȧ"],
        "c": ["ç", "č", "ċ"],
        "d": ["đ", "ḋ"],
        "e": ["é", "ë", "ě", "ĕ", "ę", "ė"],
        "i": ["í", "ï", "ĭ", "ǐ", "į", "ı"],
        "j": ["ǰ", "ȷ"],
        "l": ["ł"],
        "o": ["ó", "ö", "ő", "ǒ", "ǫ", "ȯ", "ø", "ǿ", "ò", "ô", "õ"],
        "s": ["š", "ş", "ṡ"],
        "u": ["ú", "ü", "ű", "ǔ", "ų", "û", "ů"],
        "y": ["ÿ", "ẏ", "ẙ"]
    };

    return (str: string) => (
        Object.entries(nonAccents).reduce((acc, [nonAccent, accents]) => (
            accents.reduce((a, accent) => {
                const lowerAccent = accent;
                const upperAccent = accent.toUpperCase();
                return a.replace(new RegExp(lowerAccent, "g"), nonAccent)
                        .replace(new RegExp(upperAccent, "g"), nonAccent.toUpperCase());
            }, acc)
        ), str)
    );
})();

export function capitalize(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
}

export function getUserString(user: User) {
    return `${user.username}#${user.discriminator}`;
}

export function getMessageLink(msg: Message) {
    const channel = msg.channel;

    if (channel instanceof GuildChannel) {
        return `https://discord.com/channels/${msg.guild!.id}/${channel.id}/${msg.id}`;
    } else {
        return `https://discord.com/channels/@me/${channel.id}/${msg.id}`;
    }
}

export function parseMessageLink(url: string) {
    const regex = /^https:\/\/discord.com\/channels\/(?:(\d+)|@me)\/(\d+)\/(\d+)\/?$/i;
    const match = url.match(regex);
    if (!match) return undefined;

    const guildID = match[1] as string | undefined;
    const channelID = match[2];
    const messageID = match[3];
    
    return {
        guildID,
        channelID,
        messageID
    };
}

export function nubBy<T>(arr: T[], isEqual: (a: T, b: T) => boolean): T[] {
    return arr.filter((x, idx) => {
        const foundIdx = arr.findIndex(a => isEqual(a, x));
        return foundIdx === idx || foundIdx === -1;
    });
}

// specific

export const sendEmbed = (() => {
    interface BasicEmbedData {
        title?:  string;
        desc?:   string;
        footer?: string;
        image?:  string;
    }
    
    const colorTable = {
        ok:      0x00bb00,
        error:   0xbb0000,
        neutral: 0x008888
    };

    return function(msg: Message, type: keyof typeof colorTable, message: BasicEmbedData | string) {
        const channel = msg.channel as TextChannel | NewsChannel;
        const perms = channel.permissionsFor(msg.client.user!)
        const hasPerms = perms?.has("EMBED_LINKS");

        if (hasPerms) {
            const embed = new MessageEmbed().setColor(colorTable[type]);

            if (typeof message === "string") {
                embed.setDescription(message);
            } else {
                if (message.title)  embed.setTitle(message.title);
                if (message.desc)   embed.setDescription(message.desc);
                if (message.footer) embed.setFooter(message.footer);
                if (message.image)  embed.setImage(message.image);
            }

            return msg.channel.send(embed)
        } else {
            let content = "";
            if (typeof message === "string") {
                content = message;
            } else {
                if (message.title)  content += `**${message.title}**\n\n`;
                if (message.desc)   content += `${message.desc}\n\n`;
                if (message.footer) content += `*${message.footer}*`;
            }

            return msg.channel.send(content);
        }
    };
})();

export function isAdmin(member: GuildMember | undefined | null) {
    if (!member) return false;
    const adminRole = getAdminRole(member.guild.id);

    return adminRole && member.roles.cache.some(role => role.id === adminRole.roleID) || member.hasPermission("ADMINISTRATOR");
}

export function isBotOwner(user: User) {
    return user.id === getBotOwnerID();
}

export function getAdminRole(guildID: Snowflake): AdminData[string] | undefined {
    const modRoles: AdminData = loadPrefs(ADMIN_PREFS_FILE, true);
    const modRole = modRoles[guildID];
    return modRole;
}

const getBotOwnerID = () => process.env.OWNER_ID;

export function getBotOwner(data: types.Data) {
    const ownerID = process.env.OWNER_ID;
    return data.client.users.fetch(ownerID ?? "");  // returns a Promise
}

// returns the string following the bot's prefix, without accents and in lowercase
export function prefixless(data: types.Data, msg: Message): string | undefined {
    const cont = removeAccents(msg.content.toLowerCase());
    const prefix = removeAccents(getPrefix(data, msg.guild!.id).toLowerCase());
    const regex = new RegExp(`^(<@!?${data.client.user!.id}>).+$`);
    
    if (cont.startsWith(prefix.toLowerCase())) {
        return cont.slice(prefix.length);
    }
    
    const match = cont.match(regex);
    if (match) {
        return cont.slice(match[1].length).trim();
    }
    
    return undefined;
}

export function getPrefix(data: types.Data, guildID: Snowflake): string {
    const prefixes: PrefixData = loadPrefs(PREFIX_PREFS_FILE, true);
    const prefix = prefixes[guildID] ?? data.defaultPrefix;
    return prefix;
}

export function savePrefs(filename: string, saveData: Object): void {
    if (!fs.existsSync(PREFS_DIR)) {
        fs.mkdirSync(PREFS_DIR);
        console.log(`created dir '${PREFS_DIR}' because it did not exist`);
    }

    const filePath = path.join(PREFS_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(saveData, undefined, 4));
    console.log(`saved prefs in '${filename}'`);
}

export function loadPrefs(filename: string, silent = false): {[guildID: string]: any} {
    if (!fs.existsSync(PREFS_DIR)) {
        fs.mkdirSync(PREFS_DIR);
        console.log(`created dir '${PREFS_DIR}' because it did not exist`);
    }
    
    const filePath = path.join(PREFS_DIR, filename);
    if (!fs.existsSync(filePath)) return {};

    const loadDataRaw = fs.readFileSync(filePath).toString();
    const loadData: {[guildID: string]: any} = JSON.parse(loadDataRaw);
    if (!silent)
        console.log(`loaded prefs from '${filename}'`);
    return loadData;
}
