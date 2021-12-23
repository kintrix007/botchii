import { Channel, TextChannel, NewsChannel, DMChannel, Client, Snowflake, Message, MessageReaction, User, MessageEmbed, MessageAttachment, Role } from "discord.js";
export declare function isMessageChannel(channel: Channel): channel is TextChannel | NewsChannel | DMChannel;
export declare function fetchMessages(client: Client, msgLinksOrData: string[] | {
    channelID: Snowflake;
    messageID: Snowflake;
}[]): Promise<Message[]>;
export declare function cacheMessages(client: Client, msgLinksOrData: string[] | {
    channelID: Snowflake;
    messageID: Snowflake;
}[]): Promise<Message[]>;
export declare function fetchChannels(client: Client, channelIDs: Snowflake[]): Promise<Channel[]>;
export declare function fetchTextChannels(client: Client, channelIDs: string[]): Promise<(TextChannel | NewsChannel | DMChannel)[]>;
/**
 * @param msg Message to add the reactions to
 * @param reactions If it's an array, then adds the reactions while keeping the order,
 * if it's a set, then adds the reactions in random order (takes less time)
 */
export declare function addReactions(msg: Message, reactions: string[] | Set<string>): Promise<MessageReaction[] | undefined>;
export declare function quoteMessage(content: string, maxLength?: number): string;
export declare function getUserString(user: User): string;
export declare function getMessageLink(msg: Message): string;
export declare function parseMessageLink(msgLink: string): {
    guildID: string | undefined;
    channelID: string;
    messageID: string;
} | undefined;
export declare function fetchMessageLink(client: Client, msgLink: string): Promise<Message | undefined>;
export declare function getReplyMessage(message: Message): Promise<Message | undefined>;
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
declare type ReplyMessage = ReplyMessageBase & {
    message_reference: {
        channel_id: Snowflake;
        guild_id: Snowflake;
        message_id: Snowflake;
    };
    referenced_message: ReplyMessageBase;
};
/**
 * @param pings Does not do anything, not implemented yet.
 */
export declare function replyTo(message: Message, content: any, pings?: boolean): Promise<ReplyMessage>;
declare const messageColors: {
    readonly ok: 47872;
    readonly error: 12255232;
    readonly neutral: 34952;
};
declare type EmbedType = keyof typeof messageColors;
interface BasicEmbedData {
    title?: string;
    desc?: string;
    footer?: string;
    image?: string;
    timestamp?: number | Date;
}
export declare function embedToString(embed: MessageEmbed): string;
export declare function createEmbed(type: EmbedType, message: BasicEmbedData | string): (target: Message | User | TextChannel | NewsChannel | DMChannel) => string | MessageEmbed;
export declare function sendEmbed(target: Message | User | TextChannel | NewsChannel | DMChannel, type: EmbedType, message: BasicEmbedData | string): Promise<Message>;
export {};
