import fs from "fs";
import path from "path";
import * as types from "./types";
import { config } from "dotenv"; config();
import { Channel, Client, DMChannel, GuildChannel, GuildMember, Message, MessageEmbed, MessageReaction, NewsChannel, PermissionResolvable, PermissionString, Snowflake, TextChannel, User } from "discord.js";
import { PrefixData, PREFIX_PREFS_FILE, AdminData, ADMIN_PREFS_FILE } from "./default_commands/command_prefs";

export const BOT_CORE_DIR         = path.join(__dirname);
export const DEFAULT_COMMANDS_DIR = path.join(BOT_CORE_DIR, "default_commands");
export const ROOT_DIR             = path.join(BOT_CORE_DIR, "..", "..");
export const SOURCE_DIR           = path.join(ROOT_DIR, "source");
export const PREFS_DIR            = path.join(ROOT_DIR, "prefs");

export const messageColors = {
    ok:      0x00bb00,
    error:   0xbb0000,
    neutral: 0x008888
} as const;
type MessageType = keyof typeof messageColors;

interface BasicEmbedData {
    title?:     string;
    desc?:      string;
    footer?:    string;
    image?:     string;
    timestamp?: number | Date;
}


export async function cacheChannelMessages(client: Client, channelIDs: string[]) {
    let successCount = 0;
    
    for (const ID of channelIDs) {
        try {
            const channel = await client.channels.fetch(ID);
            if (!((channel instanceof TextChannel) || (channel instanceof NewsChannel) || (channel instanceof DMChannel))) continue;
            const messages = await channel.messages.fetch();
            successCount += messages.size;
        }
        catch (err) {
            console.error(err);
        }
    }

    return successCount;
}

export async function fetchMessages(client: Client, msgLinksOrData: string[] | { channelID: Snowflake, messageID: Snowflake }[]) {
    function isStringArray(arr: any): arr is Array<string> {
        if (!(arr instanceof Array)) return false;
        return arr.every(x => typeof x === "string")
    }

    const msgData = (() => {
        if (isStringArray(msgLinksOrData)) {
            const msgLinks = msgLinksOrData;
            return msgLinks.map(link => {
                const { channelID, messageID } = parseMessageLink(link)!;
                return { channelID, messageID };
            })
        } else return msgLinksOrData;
    })();

    let messages: Message[] = [];
    for (const { channelID, messageID } of msgData) {
        try {
            const channel = await client.channels.fetch(channelID);
            if (!(channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof DMChannel)) continue;
            const message = await channel.messages.fetch(messageID);
            messages.push(message);
        }
        catch (err) {
            continue;
        }
    }
    return messages;
}

export async function cacheMessages(client: Client, msgLinksOrData: string[] | { channelID: Snowflake, messageID: Snowflake }[]) {
    const messages = await fetchMessages(client, msgLinksOrData);
    for (const msg of messages) {
        await msg.fetch();
    }
    return messages;
}

export async function fetchChannels<T extends Channel>(client: Client, channelIDs: Snowflake[]): Promise<Channel[]> {
    let channels: Channel[] = [];

    for (const channelID of channelIDs) {
        try {
            const channel = await client.channels.fetch(channelID);
            channels.push(channel);
        }
        catch (err) {
            continue;
        }
    }
    
    return channels;
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

export async function addReactions(msg: Message, reactions: string[]) {
    const channel = msg.channel
    const perms = (channel instanceof DMChannel ? undefined : channel.permissionsFor(msg.client.user!));
    const canReact = perms?.has("ADD_REACTIONS") ?? false;

    if (!canReact) return undefined;
    const reactionPromises: MessageReaction[] = [];

    for (const reaction of reactions) {
        reactionPromises.push(await msg.react(reaction));
    }

    return reactionPromises;
}

export function quoteMessage(msg: Message, maxLength = 50) {
    return "> " + (msg.content.length > maxLength ? msg.content.slice(0, maxLength-3) + "..." : msg.content).replace(/\s+/g, " ");
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

export function parseMessageLink(msgLink: string) {
    const regex = /^https:\/\/discord.com\/channels\/(?:(\d+)|@me)\/(\d+)\/(\d+)\/?$/i;
    const match = msgLink.match(regex);
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

export async function fetchMessageLink(client: Client, msgLink: string) {
    try {
        const msgData = parseMessageLink(msgLink);
        if (!msgData) return undefined;
        const { channelID, messageID } = msgData;
        const channel = await client.channels.fetch(channelID);
        if (!(channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof DMChannel)) return undefined;
        return await channel.messages.fetch(messageID);
    }
    catch {
        return undefined;
    }
}

// UNTESTED!!!
export async function getReplyMessage(message: Message) {
    if (message.system) return undefined;
    const reference = message.reference;
    if (reference === null) return undefined;
    const { channelID, messageID } = reference;
    if (messageID === null) return undefined;
    if (message.channel.id !== channelID) return undefined;
    try {
        const replyMessage = await message.channel.messages.fetch(messageID);
        return replyMessage;
    }
    catch (err) {
        return undefined;
    }
}

export function createEmbed<T extends Message | User | TextChannel | NewsChannel | DMChannel>(
    target: T, type: MessageType, message: string | BasicEmbedData
): T extends DMChannel ? MessageEmbed : (
    T extends Message ? T["channel"] extends DMChannel
        ? MessageEmbed
        : string | MessageEmbed : string | MessageEmbed
);
export function createEmbed(target: Message | User | TextChannel | NewsChannel | DMChannel, type: MessageType, message: BasicEmbedData | string) {
    let hasPerms: boolean;
    
    if (target instanceof Message) {
        const msg = target;
        const channel = msg.channel;
        const perms = (channel instanceof DMChannel ? undefined : channel.permissionsFor(target.client.user!));
        hasPerms = perms?.has("EMBED_LINKS") ?? false;
    } else 
    if (target instanceof User) {
        hasPerms = true;
    } else {
        const channel = target;
        const perms = (channel instanceof DMChannel ? undefined : channel.permissionsFor(target.client.user!));
        hasPerms = perms?.has("EMBED_LINKS") ?? false;
    }


    if (hasPerms) {
        const embed = new MessageEmbed().setColor(messageColors[type]);

        if (typeof message === "string") {
            embed.setDescription(message);
        } else {
            if (message.title)     embed.setTitle(message.title);
            if (message.desc)      embed.setDescription(message.desc);
            if (message.footer)    embed.setFooter(message.footer);
            if (message.image)     embed.setImage(message.image);
            if (message.timestamp) embed.setTimestamp(message.timestamp);
        }

        return embed;
    } else {
        let content = "";
        if (typeof message === "string") {
            content = message;
        } else {
            if (message.title)  content += `**${message.title}**\n\n`;
            if (message.desc)   content += `${message.desc}\n\n`;
            if (message.footer) content += `*${message.footer}*`;
        }

        return content;
    }
}

export function sendEmbed(
    target: Message | User | TextChannel | NewsChannel | DMChannel, type: MessageType, message: BasicEmbedData | string
): Promise<Message>;
export function sendEmbed(
    target: Message | User | TextChannel | NewsChannel | DMChannel, type: MessageType, message: BasicEmbedData | string
) {
    let sendTarget: User | TextChannel | NewsChannel | DMChannel;
    
    if (target instanceof Message) {
        const msg = target;
        sendTarget = msg.channel;
    } else
    if (target instanceof User) {
        sendTarget = target;
    } else {
        const channel = target as TextChannel | NewsChannel;
        sendTarget = channel;
    }
    
    const embed = createEmbed(sendTarget, type, message);
    return ( typeof embed == "string" ? sendTarget.send(embed) : sendTarget.send("", embed) );
}

export function capitalize(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
}

export function nubBy<T>(arr: T[], isEqual: (a: T, b: T) => boolean): T[] {
    return arr.filter((x, idx) => {
        const foundIdx = arr.findIndex(a => isEqual(a, x));
        return foundIdx === idx || foundIdx === -1;
    });
}

// specific

export const channelSpecificCmdPermission = (() => {
    function humanReadable(perm: PermissionString) {
        const words = perm.toLowerCase().split("_");
        return words.map(capitalize).join(" ");
    }

    return (permission: PermissionString) => {
        const cmdPerm: types.CommandPermission = {
            func: msg => {
                const channel = msg.channel;
                if (channel instanceof DMChannel) return true;
                const perms = channel.permissionsFor(msg.member!);
                return perms?.has(permission) ?? false;
            },
            description: `Only people, who have **${humanReadable(permission)}** permission in a given channel, can use this command.`,
            errorMessage: ({ cmdName }) => `You can only use \`${cmdName}\` if you have **${humanReadable(permission)}** in this channel!`
        };
        return cmdPerm;
    }
})();

export function isAdmin(member: GuildMember | undefined | null) {
    if (!member) return false;
    const adminRole = getAdminRole(member.guild.id);

    return member.roles.cache.some(role => role.id === adminRole?.roleID) || member.hasPermission("ADMINISTRATOR");
}

export function isBotOwner(user: User) {
    return user.id === getBotOwnerID();
}

export function getAdminRole(guildID: Snowflake): AdminData | undefined {
    const adminRoles = loadPrefs<AdminData>(ADMIN_PREFS_FILE, true);
    const adminRole = adminRoles[guildID];
    return adminRole;
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

export function getPrefix(data: types.Data, guildID: Snowflake) {
    const prefixes = loadPrefs<PrefixData>(PREFIX_PREFS_FILE, true);
    const prefixData: PrefixData = prefixes[guildID] ?? { prefix: data.defaultPrefix };
    return prefixData.prefix;
}

export function savePrefs(filename: string, saveData: types.Prefs<{}>, silent = false) {
    if (!fs.existsSync(PREFS_DIR)) {
        fs.mkdirSync(PREFS_DIR);
        console.log(`created dir '${PREFS_DIR}' because it did not exist`);
    }

    const filePath = path.join(PREFS_DIR, filename + ".json");
    fs.writeFileSync(filePath, JSON.stringify(saveData, undefined, 4));
    if (!silent) console.log(`saved prefs in '${filename}'`);
}

export function loadPrefs<T>(filename: string, silent = false) {
    if (!fs.existsSync(PREFS_DIR)) {
        fs.mkdirSync(PREFS_DIR);
        console.log(`created dir '${PREFS_DIR}' because it did not exist`);
    }
    
    const filePath = path.join(PREFS_DIR, filename + ".json");
    if (!fs.existsSync(filePath)) return {};

    const loadDataRaw = fs.readFileSync(filePath).toString();
    const loadData = JSON.parse(loadDataRaw) as types.Prefs<T>;
    
    if (!silent) console.log(`loaded prefs from '${filename}'`);

    return loadData;
}

export function updatePrefs<T>(filename: string, overwriteData: types.Prefs<T>, silent = false) {
    const newPrefs: types.Prefs<T> = { ...loadPrefs<T>(filename, true), ...overwriteData };
    savePrefs(filename, newPrefs, true);
    if (!silent) console.log(`updated prefs in '${filename}'`);
}
