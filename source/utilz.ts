import * as types from "./_core/types";
import * as BotUtils from "./_core/bot_utils";
import { CountedEmoji, UserReactions } from "./custom_types";
import { CategoryChannel, Channel, Client, DMChannel, Guild, GuildEmoji, MessageReaction, NewsChannel, Snowflake, TextChannel } from "discord.js";
import path from "path";
import { AliasData, ALIAS_PREFS_FILE } from "./bot_commands/command_prefs";


export const PICS_DIR = path.join(BotUtils.ROOT_DIR, "images");

export function convertToCountedEmoji(reaction: MessageReaction) {
    const {emoji, count} = reaction;
    const users = Array.from(reaction.users.cache.values());
    const isCustom = emoji instanceof GuildEmoji;
    const counted: CountedEmoji = {
        isCustom,
        string: (isCustom ? `<:${emoji.name}:${emoji.id}>` : emoji.name),
        count: count ?? 0,
        users,
        isInvalid: isCustom && emoji.id === null || !isCustom && emoji.id !== null || count === null || count === 0
    }
    return counted;
}


function parseChannel(guild: Guild, channelIDOrAlias: string) {
    const channelRegex = /^(?:(\d+)|<#(\d+)>)$/i;
    const match = channelIDOrAlias.match(channelRegex);
    const channelID = match?.[1] ?? match?.[2];
    const channelIDs = (match ? [ channelID ] : fromChannelAlias(guild, channelIDOrAlias)?.filter(x => x !== undefined));
    return channelIDs as Snowflake[] | undefined;
}

export function parseChannels(guild: Guild, channelAliasesOrIDs: string[] | Set<string>): Snowflake[] {
    return [...channelAliasesOrIDs]
    .map(aliasOrID => parseChannel(guild, aliasOrID))
    .flat(1)
    .filter((x): x is string => x !== undefined);
}

export function createChannelAlias(
    guild: Guild, alias: string,
    channelOrChannels: TextChannel | NewsChannel | DMChannel | Array<TextChannel | NewsChannel | DMChannel>
) {
    const channels = (channelOrChannels instanceof Array ? channelOrChannels : [channelOrChannels]);

    if (!channels.every(isTextChannel)) return;     // Just a runtime check as well...

    const aliasPrefs = BotUtils.loadPrefs<AliasData>(ALIAS_PREFS_FILE, true);
    const aliasData = {
        [guild.id]: {
            guildName: guild.name,
            aliases:   { ...(aliasPrefs[guild.id]?.aliases ?? {}), [alias]: channels.map(x => x.id) }
        }
    } as types.Prefs<AliasData>;
    BotUtils.updatePrefs(ALIAS_PREFS_FILE, aliasData);
}

export function removeChannelAlias(guild: Guild, alias: string) {
    const aliasPrefs = BotUtils.loadPrefs<AliasData>(ALIAS_PREFS_FILE, true);
    const aliasData = {
        [guild.id]: {
            guildName: guild.name,
            aliases:   { ...(aliasPrefs[guild.id]?.aliases ?? {}), [alias]: undefined }
        }
    } as types.Prefs<AliasData>;
    BotUtils.updatePrefs(ALIAS_PREFS_FILE, aliasData);
}

export function fromChannelAlias(guild: Guild, alias: string) {
    const aliasData = BotUtils.loadPrefs<AliasData>(ALIAS_PREFS_FILE);
    return aliasData[guild.id]?.aliases?.[alias];
}


export async function fetchTextChannels(client: Client, channelIDs: string[] | Set<string>) {
    const channelPromises = [...channelIDs].map(x => client.channels.fetch(x));
    const channels = await BotUtils.keepFulfilledResults(channelPromises);
    return channels.map(x => x instanceof CategoryChannel ? Array.from(x.children.values()) : x)
    .flat()
    .filter(isTextChannel);

    // let channels: Array<TextChannel | NewsChannel | DMChannel> = [];

    // for (const channelID of channelIDs) {
    //     try {
    //         const channel = await client.channels.fetch(channelID);
    //         if (!(isTextChannel(channel) || channel instanceof CategoryChannel)) continue;

    //         if (channel instanceof CategoryChannel) {
    //             channel.children.forEach(ch => {
    //                 if (isTextChannel(ch)) channels.push(ch);
    //             });
    //         } else {
    //             channels.push(channel);
    //         }
    //     }
    //     catch (err) {
    //         continue;
    //     }
    // }

    // return channels;
}

export function isTextChannel(channel: Channel): channel is TextChannel | NewsChannel | DMChannel {
    return channel instanceof TextChannel || channel instanceof NewsChannel || channel instanceof DMChannel;
}


export async function convertToUserReactions(reactions: MessageReaction[], fromCache = false) {
    if (!fromCache) await Promise.all(reactions.map(x => x.users.fetch()));

    let userReactions: UserReactions = {};

    reactions.forEach(reaction => {
        const users = Array.from(reaction.users.cache.values());
        users.forEach(usr => {
            userReactions[usr.id] = new Set([ ...(userReactions[usr.id] ?? []), reaction.emoji.toString() ]);
        });
    });

    return userReactions;
}


export function union<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a, ...b]);
}

export function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a].filter(x => b.has(x)));
}

export function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a].filter(x => !b.has(x)));
}

export function outersection<T>(a: Set<T>, b: Set<T>): Set<T> {
    return union(difference(a, b), difference(b, a));
}
