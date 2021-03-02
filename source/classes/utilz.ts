import * as fs from "fs";
import * as DC from "discord.js";
import * as types from "./types";
import * as path from "path";
import { config } from "dotenv";

config();

export const rootDir = path.join(__dirname, "..", "..");
export const sourceDir = path.join(rootDir, "source");
const prefsDirPath = path.join(sourceDir, "..", "prefs");

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
    return member.hasPermission("MANAGE_GUILD");
}

const getBotOwnerID = () => process.env.OWNER_ID;

export function getBotOwner(data: types.Data) {
    const ownerID = process.env.OWNER_ID;
    return data.client.users.fetch(ownerID ?? "");      // returns a Promise
}

export function isBotOwner(user: DC.User) {
    return user.id === getBotOwnerID();
}

// specific

// returns a lowercase, accentless string, that is after the specified prefix.
// returns an emtpy string if there it is incorrect
export function prefixless(data: types.Data, msg: DC.Message): string {
    const prefix = removeAccents(getPrefix(data, msg.guild!).toLowerCase());

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

export function getPrefix(data: types.Data, guild: DC.Guild): string {
    const guildID = guild.id;
    const prefixes: {[guild: string]: string} = loadPrefs("prefixes.json", true);
    const prefix = prefixes[guildID] ?? data.defaultPrefix;
    return prefix;
}

export function savePrefs(filename: string, saveData: any): void {
    if (!fs.existsSync(prefsDirPath)) {
        fs.mkdirSync(prefsDirPath);
        console.log(`created dir '${prefsDirPath}' because it did not exist`);
    }
    fs.writeFileSync(`${prefsDirPath}/${filename}`, JSON.stringify(saveData, undefined, 4));
    console.log(`saved prefs in '${filename}'`);
}

export function loadPrefs(filename: string, silent = false): {[guildID: string]: any} {
    if (!fs.existsSync(`${prefsDirPath}/${filename}`)) return {};

    const loadDataRaw = fs.readFileSync(`${prefsDirPath}/${filename}`).toString();
    const loadData: {[guildID: string]: any} = JSON.parse(loadDataRaw);
    if (!silent)
        console.log(`loaded prefs from '${filename}'`);
    return loadData;
}

// bot-specific

