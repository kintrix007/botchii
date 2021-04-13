import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import rgiEmojiRegex from "emoji-regex/RGI_Emoji";
import { Snowflake, TextChannel } from "discord.js";

const cmd: types.Command = {
    func: cmdReactionRoles,
    name: "reactionroles",
    aliases: [ "rr" ],
    group: "moderation",
    permissions: [ types.adminPermission ],
    usage: "reactionroles [message link]",
    // description: "",
    examples: [ "" ],
};

async function cmdReactionRoles({ data, args }: types.CombinedData) {
    console.log("ran");
    const msgLink = args[0];
    if (!msgLink) {
        return;
    }
    
    const parsedMessageLink = CoreTools.parseMessageLink(msgLink);
    console.log(parsedMessageLink);
    if (!parsedMessageLink) {
        return;
    }
    
    const { guildID, channelID, messageID } = parsedMessageLink;

    let rolesEmojis: { [roleID: string]: types.CustomEmoji };
    try {
        const channel = await data.client.channels.fetch(channelID) as TextChannel;
        const message = await channel.messages.fetch(messageID);
        const cont = message.content;
        rolesEmojis = extractEmojisAndRoles(cont.split("\n"));
    }
    catch (err) {
        console.error(err);
        return;
    }
    
}

function extractEmojisAndRoles(lines: string[]) {
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
