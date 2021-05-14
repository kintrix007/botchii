import * as types from "./_core/types";
import * as CoreTools from "./_core/core_tools";
import { CountedEmoji } from "./custom_types";
import { GuildEmoji, MessageReaction } from "discord.js";
import path from "path";


export const PICS_DIR = path.join(CoreTools.ROOT_DIR, "images");

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
