import { CommandCallData, adminPermission, Command, createChannelAlias, parseChannels, removeChannelAlias, fetchTextChannels, createEmbed, getChannelAliases } from "../bot_core";
import { Guild } from "discord.js";

const description = `Allows you to create aliases to channels.
An alias can refer to one or more channels. e.g. \`fun\` could refer to \`#general\` and \`#memes\`.
It can also refer to chategories by their ID's, which is identical to listing all the channels under it.`;

export default <Command>{
    call:        cmdAlias,
    name:        "channelAlias",
    permissions: [ adminPermission ],
    group:       "announcement",
    aliases:     [ "alias", "aliases" ],
    usage:       "channelAlias [<name> <channels...>]",
    description: description,
    examples:    [ [], ["alias"], ["alias", "general", "123456789012345678"], ["from", "#announcements"], ["to", "general", "#memes"] ],
};

async function cmdAlias({ msg, args }: CommandCallData) {
    const guild = msg.guild!;
    const [alias, ...channelIDsOrAliases] = args;

    if (alias === undefined) {
        return sendAliases(guild);
    }

    if (channelIDsOrAliases.length === 0) {
        removeChannelAlias(guild, alias);
        return createEmbed("ok", `Successfully removed channel alias \`${alias}\`.`);
    }

    // removing duplicates by converting to set
    const channelIDs = Array.from(new Set(parseChannels(guild, channelIDsOrAliases)));
    const channels = await fetchTextChannels(msg.client, channelIDs);

    if (channels.length === 0) {
        return createEmbed("error", "No valid channels given.");
    }

    createChannelAlias(guild, alias, channels);
    return createEmbed("ok", `Successfully added channel alias \`${alias}\` for ${channels.join(", ")}`);
}

function sendAliases(guild: Guild) {
    const aliases = getChannelAliases(guild);

    if (aliases === undefined || Object.values(aliases).length === 0) {
        return createEmbed("neutral", "No aliases set...");
    }

    const aliasesStr = Object.entries(aliases)
    .map(([alias, channelIDs]) => `\`${alias}\` -> ${channelIDs.map(x => "<#"+x+">").join(", ")}`)
    .join("\n");

    return createEmbed("neutral", {
        title: `Channel aliases:`,
        desc: aliasesStr 
    });
}
