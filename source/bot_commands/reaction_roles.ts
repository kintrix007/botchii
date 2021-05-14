import * as CoreTools from "../_core/core_tools";
import * as types from "../_core/types";
import rgiEmojiRegex from "emoji-regex/RGI_Emoji";
import { Client, Message, Snowflake, TextChannel } from "discord.js";
import { CustomEmoji } from "../custom_types";

export const RR_PREFS_FILE = "reaction_roles.json";

interface ReactionRoles {
    [roleID: string]: CustomEmoji;
}

export interface RRData {
    [guildID: string]: {
        readableGuildName:       string;
        targetChannelID:         string;
        reactionRolesMessageID?: string;
        reactionRoles?:          ReactionRoles;
    };
}

const description = "";

const cmd: types.Command = {
    func: cmdReactionRoles,
    name: "reactionroles",
    aliases: [ "rr" ],
    group: "roles",
    permissions: [ types.adminPermission, types.ownerPermission ],
    usage: "reactionroles [<channel|data> <channel|message link>]",
    // description: description,
    examples: [ "channel #reaction-roles", "data https://discord.com/channels/123456789012345678/012345678901234567/234567890123456789" ]
};

async function cmdReactionRoles(combData: types.CombinedData) {
    const option          = combData.args[0];
    const isGetter        = option === undefined;
    const isDataSetter    = [ "data", "roles", "reactions", "message" ].includes(option);
    const isChannelSetter = [ "target", "to", "channel" ].includes(option);

    if (isGetter) {
        getReactionRolesData(combData);
        return;
    }

    if (isDataSetter) {
        await setRRData(combData);
    } else
    if (isChannelSetter) {
        await setRRChannel(combData);
    } else {
        CoreTools.sendEmbed(combData.msg, "error", `calling \`${cmd.name}\` with option \`${option}\` is invalid.`);
        return;
    }
}

async function setRRChannel({ data, msg, args }: types.CombinedData) {
    const regex = /^(?:<#(\d+)>|(\d+))$/i;
    const channelIDStr = args[1];

    if (!channelIDStr) {
        CoreTools.sendEmbed(msg, "error", `Expected channel after \`${args[0]}\`.`);
        return;
    }

    const match = channelIDStr.match(regex);
    if (!match) {
        CoreTools.sendEmbed(msg, "error", "The given channel is invalid!");
        return;
    }
    const channelID = match[1] ?? match[2];
    
    try {
        const channel = await data.client.channels.fetch(channelID);
        // return if not a TextChannel - ChategoryChannel is not a TextChannel
        if (!(channel instanceof TextChannel)) {
            CoreTools.sendEmbed(msg, "error", "The given channel is invalid! (It needs to be a Text Channel)");
            return;
        }
    }
    catch (err) {
        console.error(err);
        return;
    }

    const guildID = msg.guild!.id;
    const guildName = msg.guild!.name;

    const rrData: RRData = CoreTools.loadPrefs(RR_PREFS_FILE);
    rrData[guildID] = {
        readableGuildName:      guildName,
        targetChannelID:        channelID,
        reactionRolesMessageID: rrData[guildID]?.reactionRolesMessageID,
        reactionRoles:          rrData[guildID]?.reactionRoles
    };
    CoreTools.savePrefs(RR_PREFS_FILE, rrData);

    CoreTools.sendEmbed(msg, "ok", `**<#${channelID}>** is now set as the reaction roles channel.`)
    console.log(`${msg.author.username}#${msg.author.discriminator} set the reaction roles channel to '${channelID}'`);
}

async function setRRData({ data, msg, args }: types.CombinedData) {
    const msgLink = args[1];
    if (!msgLink) {
        CoreTools.sendEmbed(msg, "error", `Expected message link after \`${args[0]}\`.`);
        return;
    }
    
    // get reactions-roles data message
    const parsedMessageLink = CoreTools.parseMessageLink(msgLink);
    if (!parsedMessageLink) {
        CoreTools.sendEmbed(msg, "error", "The given message link is invalid!");
        return;
    }

    const { channelID: linkChannelID, messageID: linkMessageID } = parsedMessageLink;
    const reactionRoles = await parseReactionRoles(data.client, linkChannelID, linkMessageID);
    if (!reactionRoles) {
        CoreTools.sendEmbed(msg, "error", "The given message link is invalid, or the message was deleted!");
        return;
    }
    
    const guildID = msg.guild!.id;
    const guildName = msg.guild!.name;
    const rrData: RRData = CoreTools.loadPrefs(RR_PREFS_FILE);

    // checking if the target channel has already been set up
    if (rrData[guildID] === undefined) {
        CoreTools.sendEmbed(msg, "error", "The reaction-roles target channel isn't set up!");
        return;
    }

    await updateReactionRolesMessage(msg, reactionRoles, rrData);

    // save prefs
    rrData[guildID] = {
        readableGuildName:      guildName,
        targetChannelID:        rrData[guildID].targetChannelID,
        reactionRolesMessageID: rrData[guildID].reactionRolesMessageID,
        reactionRoles:          reactionRoles
    };
    CoreTools.savePrefs(RR_PREFS_FILE, rrData);

    CoreTools.sendEmbed(msg, "ok", {
        title: "Success!",
        desc:  `The reaction-roles message in <#${rrData[guildID].targetChannelID}> is created, and up-to date!`
    });
    console.log(`${msg.author.username}#${msg.author.discriminator} has set up reaction-roles.`);
}

function getReactionRolesData({ data, msg }: types.CombinedData) {
    const guildID = msg.guild!.id;
    const rrData: RRData = CoreTools.loadPrefs(RR_PREFS_FILE);
}

async function parseReactionRoles(client: Client, channelID: Snowflake, messageID: Snowflake) {
    try {
        const channel = await client.channels.fetch(channelID);
        if (!(channel instanceof TextChannel)) {
            return undefined;
        };
        const message = await channel.messages.fetch(messageID);
        const cont = message.content;
        return extractEmojisAndRoles(cont.split("\n").map(x => x.trim()));
    }
    catch (err) {
        return undefined;
    }
}

async function updateReactionRolesMessage(msg: Message, reactionRoles: ReactionRoles, rrData: RRData) {
    const guildID = msg.guild!.id;

    const rrMessageContent = Object.entries(reactionRoles)
        .map(([roleID, emoji]) => `${emoji.string}  -  <@&${roleID}>`)
        .join("\n");

    try {
        const channel = await msg.client.channels.fetch(rrData[guildID].targetChannelID);
        if (!(channel instanceof TextChannel)) return;  // We know it is a TextChannel
        
        if (rrData[guildID].reactionRolesMessageID === undefined) {
            
            const message = await channel.send("**Loading...**");
            await message.edit(rrMessageContent);
            await CoreTools.addReactions(message, Object.entries(reactionRoles).map(([, emoji]) => emoji.string));
            rrData[guildID].reactionRolesMessageID = message.id;
            
        } else {

            let message: Message;
            
            try {
                message = await channel.messages.fetch(rrData[guildID].reactionRolesMessageID!);
            }
            catch (err) {
                message = await channel.send("Loading...");
                rrData[guildID].reactionRolesMessageID = message.id;
            }

            await message.edit(rrMessageContent);
            await CoreTools.addReactions(message, Object.entries(reactionRoles).map(([, emoji]) => emoji.string));
            
        }
        // rrData is a reference, so it's gonna get updated.
    }
    catch (err) {
        console.error(err);
        return undefined;
    }
}


function extractEmojisAndRoles(lines: string[]) {
    const emojiRegex = new RegExp(
        "(?:"
            + "(" + rgiEmojiRegex().source + ")"
            + "|"
            + "(" + /<a?:[^:]{2,}:\d+>/.source + ")"
        +")"
    );
    
    const lineRegex = new RegExp(/^/.source + emojiRegex.source + /\s+/.source + /(?:<@&(\d+)>|(\d+))/.source);
    
    // 1st       group: default emoji
    // 2nd       group: GuildEmoji    
    // 3rd | 4th group: roleID

    const assocList = lines.map(line => {
        const match = line.match(lineRegex);
        if (!match) return undefined;
        const defaultEmoji = match[1];
        const guildEmoji   = match[2];
        const roleID       = match[3] ?? match[4];
        const isCustom     = !!guildEmoji && !defaultEmoji;
        const emoji: CustomEmoji = {
            isCustom,
            string: (isCustom ? guildEmoji : defaultEmoji),
            isInvalid: !isCustom && !defaultEmoji
        };

        return [roleID, emoji] as const;
    }).filter(x => x !== undefined && !x[1].isInvalid) as [Snowflake, ReactionRoles[Snowflake]][];

    // console.log(Object.fromEntries(assocList));
    return Object.fromEntries(assocList);
}

module.exports = cmd;
