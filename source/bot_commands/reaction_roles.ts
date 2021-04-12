import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import rgiEmojiRegex from "emoji-regex/RGI_Emoji";
import { Snowflake } from "discord.js";

const cmd: types.Command = {
    name: "rr",
    func: cmdReactionRoles,
};

const emojiRegex = new RegExp(
    "(?:"
        +"("
            + rgiEmojiRegex().source
        +")" + "|"
        +"("
            + /<:[^:]{2,}:\d+>/.source
        +")"
    +")"
);

const lineRegex = new RegExp(/^\s*(?:<@&(\d+)>|(\d+))\s*/.source + emojiRegex.source);

// 1st | 2nd group: roleID
// 3rd       group: default emoji
// 4th       group: GuildEmoji

function cmdReactionRoles({ data, msg }: types.CombinedData) {
    
}

function extractEmojisAndRoles(lines: string[]) {
    const assocList = lines.map(line => {
        const match = line.match(lineRegex);
        if (!match) return undefined;
        const roleID       = match[1] ?? match[2];
        const defaultEmoji = match[3];
        const guildEmoji   = match[4];
        const isCustom = !!guildEmoji && !defaultEmoji;
        const emoji: types.CustomEmoji = {
            isCustom,
            string: (isCustom ? guildEmoji : defaultEmoji),
            isInvalid: !isCustom && !defaultEmoji
        };

        return [roleID, emoji];
    }).filter(x => x !== undefined) as [Snowflake, types.CustomEmoji][];
    
    return Object.fromEntries(assocList);
}

module.exports = cmd;
