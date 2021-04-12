import fs from "fs";
import path from "path";
import DC from "discord.js";
import * as types from "./types";
import { PrefixData } from "../cmds/prefix"
import { AdminData } from "../cmds/admin"
import { config } from "dotenv";

config();

export const rootDir    = path.join(__dirname, "..", "..");
export const sourceDir  = path.join(rootDir, "source");
export const picsDir    = path.join(rootDir, "images");
export const prefsDir   = path.join(rootDir, "prefs");

export const getDayString = (function() {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    
    return (function (date: Date): string {
        return days[date.getDay()];
    });
})();

export const getDayStringHun = (function() {
    const days = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
    
    return (function (date: Date): string {
        return days[date.getDay()];
    });
})();

export const translateDayStringToHun = (function() {
    const days: {[key: string]: string} = {
        "monday"    : "hétfő",
        "tuesday"   : "kedd",
        "wednesday" : "szerda",
        "thursday"  : "csütörtök",
        "friday"    : "péntek",
        "saturday"  : "szombat",
        "sunday"    : "vasárnap"
    };
    
    return (engDayString: string) => days[engDayString];
})();

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

export const properHunNameSort = function(arr: string[]): string[] {
    return arr.sort((str1: string, str2: string) => {
        const a = removeAccents(str1);
        const b = removeAccents(str2);
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    });
};

export function getUserString(user: DC.User) {
    return `${user.username}#${user.discriminator}`;
}

export function isAdmin(member: DC.GuildMember | undefined | null) {
    if (!member) return false;
    const adminRole = getAdminRole(member.guild.id);

    return adminRole && member.roles.cache.some(role => role.id === adminRole.roleID) || member.hasPermission("ADMINISTRATOR");
}

export function getAdminRole(guildID: DC.Snowflake): AdminData[string] | undefined {
    const modRoles: AdminData = loadPrefs("admin_roles.json", true);
    const modRole = modRoles[guildID];
    return modRole;
}

export function getMessageLink(msg: DC.Message) {
    const channel = msg.channel;

    if (channel instanceof DC.GuildChannel) {
        return `https://discord.com/channels/${msg.guild!.id}/${channel.id}/${msg.id}`;
    } else {
        return `https://discord.com/channels/@me/${channel.id}/${msg.id}`;
    }
}

export async function cacheChannelMessages(client: DC.Client, channelIDs: string[]) {
    let successCount = 0;
    
    for (const ID of channelIDs) {
        try {
            const channel = await client.channels.fetch(ID) as DC.TextChannel;
            const messages = await channel.messages.fetch();
            successCount += messages.size;
        }
        catch (err) {
            console.error(err);
        }
    }

    return successCount;
}

export function nubBy<T>(arr: T[], isEqual: (a: T, b: T) => boolean): T[] {
    return arr.filter((x, idx) => {
        const foundIdx = arr.findIndex(a => isEqual(a, x));
        return foundIdx === idx || foundIdx === -1;
    });
}

// specific

const getBotOwnerID = () => process.env.OWNER_ID;

export function getBotOwner(data: types.Data) {
    const ownerID = process.env.OWNER_ID;
    return data.client.users.fetch(ownerID ?? "");      // returns a Promise
}

export function isBotOwner(user: DC.User) {
    return user.id === getBotOwnerID();
}

// returns a lowercase, accentless string, that is after the specified prefix.
// returns an emtpy string if the string is incorrect in some way
export function prefixless(data: types.Data, msg: DC.Message): string {
    const prefix = removeAccents(getPrefix(data, msg.guild!.id).toLowerCase());

    const regex = new RegExp(`^(<@!?${data.client.user!.id}>).+$`);
    const cont = removeAccents(msg.content.toLowerCase());
    
    if (cont.startsWith(prefix.toLowerCase())) {
        return cont.slice(prefix.length);
    }
    
    const match = cont.match(regex);
    if (match) {
        return cont.slice(match[1].length).trim();
    }
    
    return "";
}

export function getPrefix(data: types.Data, guildID: DC.Snowflake): string {
    const prefixes: PrefixData = loadPrefs("prefixes.json", true);
    const prefix = prefixes[guildID] ?? data.defaultPrefix;
    return prefix;
}
export function savePrefs(filename: string, saveData: any): void {
    if (!fs.existsSync(prefsDir)) {
        fs.mkdirSync(prefsDir);
        console.log(`created dir '${prefsDir}' because it did not exist`);
    }

    const filePath = path.join(prefsDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(saveData, undefined, 4));
    console.log(`saved prefs in '${filename}'`);
}

export function loadPrefs(filename: string, silent = false): {[guildID: string]: any} {
    if (!fs.existsSync(prefsDir)) {
        fs.mkdirSync(prefsDir);
        console.log(`created dir '${prefsDir}' because it did not exist`);
    }
    
    const filePath = path.join(prefsDir, filename);
    if (!fs.existsSync(filePath)) return {};

    const loadDataRaw = fs.readFileSync(filePath).toString();
    const loadData: {[guildID: string]: any} = JSON.parse(loadDataRaw);
    if (!silent)
        console.log(`loaded prefs from '${filename}'`);
    return loadData;
}

// bot-specific

export function convertToCountedEmoji(reaction: DC.MessageReaction) {
    const {emoji, count} = reaction;
    const users = Array.from(reaction.users.cache.values());
    const isCustom = emoji instanceof DC.GuildEmoji;
    const counted: types.CountedEmoji = {
        isCustom,
        string: (isCustom ? `<:${emoji.name}:${emoji.id}>` : emoji.name),
        count: count ?? 0,
        users,
        isInvalid: isCustom && emoji.id === null || !isCustom && emoji.id != null || count === null || count === 0
    }
    return counted;
}
