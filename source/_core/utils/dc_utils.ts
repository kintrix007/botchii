import { Channel, TextChannel, NewsChannel, DMChannel, Client, CategoryChannel, Snowflake, Message, MessageReaction, User, GuildChannel, MessageEmbed, Base, MessageType, MessageAttachment, Role } from "discord.js";
import { awaitAll, notOf } from "./general_utils";


export function isMessageChannel(channel: Channel): channel is TextChannel | NewsChannel | DMChannel {
    return channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof DMChannel;
}

export async function fetchMessages(client: Client, msgLinksOrData: string[] | { channelID: Snowflake, messageID: Snowflake }[]) {
    const targetMessages: { channelID: Snowflake, messageID: Snowflake }[] = (() => {
        if (isStringArray(msgLinksOrData)) {
            const msgLinks = msgLinksOrData;
            return msgLinks.map(link => {
                const { channelID, messageID } = parseMessageLink(link)!;
                return { channelID, messageID };
            });
        } else return msgLinksOrData;
    })();

    const messagePromises = targetMessages.map(x => getMessage(client, x));
    const [messages] = await awaitAll(messagePromises);
    return messages.filter(notOf(undefined));
}

export async function cacheMessages(client: Client, msgLinksOrData: string[] | { channelID: Snowflake, messageID: Snowflake }[]) {
    const messages = await fetchMessages(client, msgLinksOrData);
    const promises = messages.map(x => x.fetch());
    await Promise.allSettled(promises);
    return messages;
}

export async function fetchChannels(client: Client, channelIDs: Snowflake[] | Set<Snowflake>): Promise<Channel[]> {
    const channelPromises = [...channelIDs].map(x => client.channels.fetch(x));
    const [channels] = await awaitAll(channelPromises)
    return channels;
}

/**
 * @param msg Message to add the reactions to
 * @param reactions If it's an array, then adds the reactions while keeping the order,
 * if it's a set, then adds the reactions in random order (takes less time)
 */
export async function addReactions(msg: Message, reactions: string[] | Set<string>) {
    const channel = msg.channel;
    const perms = (channel instanceof DMChannel ? undefined : channel.permissionsFor(msg.client.user!));
    const canReact = perms?.has("ADD_REACTIONS") ?? false;
    if (!canReact) return undefined;

    if (reactions instanceof Array) {
        let reactionsResolved: MessageReaction[] = [];
        for (const reaction of reactions) {
            reactionsResolved.push(await msg.react(reaction));
        }
        return reactionsResolved;
    } else {
        const reactionPromises = [...reactions].map(r => msg.react(r));
        const [reactionsResolved] = await awaitAll(reactionPromises);
        
        return reactionsResolved;
    }

}

export function quoteMessage(content: string, maxLength = 50) {
    return "> " + (content.length > maxLength+3 ? content.slice(0, maxLength) + "..." : content).replace(/\s+/g, " ");
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

    const guildID = match[1];
    const channelID = match[2]!;
    const messageID = match[3]!;
    
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
        if (!isMessageChannel(channel)) return undefined;
        return await channel.messages.fetch(messageID);
    } catch {
        return undefined;
    }
}

export async function getReplyMessage(message: Message) {
    if (message.system) return undefined;
    const reference = message.reference;
    if (reference == null) return undefined;
    const { channelID, messageID } = reference;
    if (messageID == null) return undefined;
    if (message.channel.id !== channelID) return undefined;
    try {
        const replyMessage = await message.channel.messages.fetch(messageID);
        return replyMessage;
    } catch (err) {
        return undefined;
    }
}

interface ReplyMessageBase {
    id: Snowflake;
    type: number;
    content: string;
    channel_id: string;
    author: User;
    attachments: MessageAttachment[];
    embeds: MessageEmbed[];
    mentions: {
        id: Snowflake;
        username: string;
        avatar: string;
        discriminator: string;
        public_flags: number;
    }[];
    mention_roles: Role[];
    pinned: boolean;
    mention_everyone: boolean;
    tts: boolean;
    timestamp: string;
    edited_timestamp: number | null;
    flags: number;
    components: any[];
}

type ReplyMessage = ReplyMessageBase & {
    message_reference: {
        channel_id: Snowflake;
        guild_id: Snowflake;
        message_id: Snowflake;
    };
    referenced_message: ReplyMessageBase;
}


/**
 * @param pings Does not do anything, not implemented yet. 
 */
export async function replyTo(message: Message, content: any, pings: boolean = true) {
    const sentMessage: ReplyMessage = await (message.client as any).api.channels[message.channel.id].messages.post({
        data: {
            content: content,
            message_reference: {
                message_id: message.id,
                channel_id: message.channel.id,
                guild_id: message.guild?.id,
            },
        },
    });
    return sentMessage
}


// Embeds

const messageColors = {
    ok:      0x00bb00,
    error:   0xbb0000,
    neutral: 0x008888
} as const;
type EmbedType = keyof typeof messageColors;

interface BasicEmbedData {
    title?:     string;
    desc?:      string;
    footer?:    string;
    image?:     string;
    timestamp?: number | Date;
}

export function embedToString(embed: MessageEmbed) {
    let content = "";

    function addIfExists(property: string | null | undefined, wrapIn = "", end = "\n") {
        if (property != null) content += wrapIn + property + wrapIn + end;
    }
    
    addIfExists(embed.title, "**", "\n\n");
    addIfExists(embed.description);
    addIfExists(embed.footer?.text, "*");
    addIfExists(embed.timestamp?.toString(), "`");

    return content;
}

function hasEmbedPerms(target: Message | User | TextChannel | NewsChannel | DMChannel) {
    if (target instanceof Message) {
        const msg = target;
        const channel = msg.channel;
        const perms = (channel instanceof DMChannel ? undefined : channel.permissionsFor(target.client.user!));
        return perms?.has("EMBED_LINKS") ?? false;
    } else 
    if (target instanceof User) {
        return true;
    } else {
        const channel = target;
        const perms = (channel instanceof DMChannel ? undefined : channel.permissionsFor(target.client.user!));
        return perms?.has("EMBED_LINKS") ?? false;
    }
}

export function createEmbed(type: EmbedType, message: BasicEmbedData | string) {
    let messageEmbed = new MessageEmbed().setColor(messageColors[type]);

    if (typeof message === "string") {
        messageEmbed.setDescription(message);
    } else {
        if (message.title)     messageEmbed.setTitle(message.title);
        if (message.desc)      messageEmbed.setDescription(message.desc);
        if (message.footer)    messageEmbed.setFooter(message.footer);
        if (message.image)     messageEmbed.setImage(message.image);
        if (message.timestamp) messageEmbed.setTimestamp(message.timestamp);
    }

    const messageText = embedToString(messageEmbed);

    return (target: Message | User | TextChannel | NewsChannel | DMChannel) => {
        const hasPerms = hasEmbedPerms(target);
        
        return hasPerms ? messageEmbed : messageText;
    };
}

export function sendEmbed(target: Message | User | TextChannel | NewsChannel | DMChannel, type: EmbedType, message: BasicEmbedData | string) {
    let sendTarget: User | TextChannel | NewsChannel | DMChannel;
    
    if (target instanceof Message) {
        const msg = target;
        sendTarget = msg.channel;
    } else
    if (target instanceof User) {
        sendTarget = target;
    } else {
        sendTarget = target;
    }
    
    const embedOrString = createEmbed(type, message)(sendTarget);
    return typeof embedOrString == "string" ? sendTarget.send(embedOrString) : sendTarget.send(undefined, embedOrString);
}


// local utility

function isStringArray(arr: any): arr is Array<string> {
    if (!(arr instanceof Array)) return false;
    return arr.every(x => typeof x === "string")
}

async function getMessage(client : Client, { channelID, messageID }: { channelID: Snowflake, messageID: Snowflake }) {
    try {
        const channel = await client.channels.fetch(channelID);
        if (!isMessageChannel(channel)) return undefined;
        return await channel.messages.fetch(messageID);
    } catch {
        return undefined
    }
}
