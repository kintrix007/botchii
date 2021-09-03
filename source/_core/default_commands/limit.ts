import { Command, adminPermission, createEmbed, fetchTextChannels, parseChannels, sendEmbed, CommandCallData } from "../bot_core";
import { createCommandLimit, getCommandLimits, removeCommandLimit } from "../impl/limit_utils";
import { getCmd } from "../commands";
import { Guild } from "discord.js";

const description = ``;

export default <Command>{
    call:        cmdLimit,
    name:        "limitCommand",
    permissions: [ adminPermission ],
    group:       "admin",
    aliases:     [ "limit", "limits" ],
    usage:       "limitCommand [<command> <channels...>]",
    description: description,
    examples:    [ [], ["help", "#bot-stuff", "123456789012345678"] ],
}

async function cmdLimit({ msg, args }: CommandCallData) {
    const guild = msg.guild!;
    const [commandStr, ...channelIDsOrAliases] = args;
    
    if (commandStr === undefined) {
        return sendLimits(guild);
    }
    
    const command = getCmd(commandStr, false);

    if (command === undefined) {
        return createEmbed("error", `Command \`${commandStr}\` does not exist.`)
    }

    if (channelIDsOrAliases.length === 0) {
        removeCommandLimit(guild, command);
        return createEmbed("ok", `Successfully removed limit from command \`${command.name}\`!`);
    }

    const channelIDs = Array.from(new Set(parseChannels(msg.guild!, channelIDsOrAliases)));
    const channels = await fetchTextChannels(msg.client, channelIDs);
    
    if (channels.length === 0) {
        sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    createCommandLimit(guild, command, channels);
    return createEmbed("ok", `Successfully limited command \`${command.name}\` to be only used in: ${channels.map(x => "<#"+x.id+">").join(", ")}`);
}

function sendLimits(guild: Guild) {
    const limits = getCommandLimits(guild);

    if (limits === undefined || Object.values(limits).length === 0) {
        return createEmbed("neutral", "No command limits set...");
    }

    const limitsStr = Object.entries(limits)
    .map(([command, channelIDs]) => `\`${command}\` limited to ${channelIDs.map(x => "<#"+x+">").join(", ")}`)
    .join("\n");

    return createEmbed("neutral", {
        title: `Command limits:`,
        desc: limitsStr 
    });
}
