import { ROOT_DIR, fetchChannels, isMessageChannel } from "./_core/bot_core";
import { CountedEmoji, UserReactions } from "./custom_types";
import { CategoryChannel, Client, GuildEmoji, MessageReaction } from "discord.js";
import path from "path";


export const PICS_DIR = path.join(ROOT_DIR, "images");

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


export async function fetchTextChannels(client: Client, channelIDs: string[]) {
    const channels = await fetchChannels(client, channelIDs);
    return channels.map(x => x instanceof CategoryChannel ? Array.from(x.children.values()) : [x])
    .flat()
    .filter(isMessageChannel);
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
