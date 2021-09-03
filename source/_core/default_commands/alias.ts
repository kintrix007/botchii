import { sendEmbed, loadPrefs, CommandCallData, adminPermission, Command, createChannelAlias, parseChannels, removeChannelAlias } from "../bot_core";
import { AliasData, ALIAS_PREFS_FILE } from "../../bot_commands/command_prefs";
import { Message } from "discord.js";
import { fetchTextChannels } from "../../utilz";

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
    const [alias, ...channelIDsOrAliases] = args;

    if (alias === undefined) {
        sendAliases(msg);
        return;
    }

    if (channelIDsOrAliases.length === 0) {
        removeAlias(msg, alias);
        return;
    }

    // removing duplicates by converting to set
    const channelIDs = Array.from(new Set(parseChannels(msg.guild!, channelIDsOrAliases)));
    const channels = await fetchTextChannels(msg.client, channelIDs);

    if (channels.length === 0) {
        sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    createChannelAlias(msg.guild!, alias, channels);
    sendEmbed(msg, "ok", `Successfully added channel alias \`${alias}\` for ${channels.join(", ")}`);
}

function removeAlias(msg: Message, alias: string) {
    removeChannelAlias(msg.guild!, alias);
    sendEmbed(msg, "ok", `Successfully removed channel alias \`${alias}\`.`);
}

function sendAliases(msg: Message) {
    const aliasData = loadPrefs<AliasData>(ALIAS_PREFS_FILE)[msg.guild!.id];

    if (aliasData === undefined || Object.values(aliasData.aliases).length === 0) {
        sendEmbed(msg, "neutral", "No aliases set...");
        return;
    }

    sendEmbed(msg, "neutral", {
        title: `${aliasData.guildName} aliases:`,
        desc: Object.entries(aliasData.aliases)
            .map(([alias, channelIDs]) =>
                `\`${alias}\` -> ${channelIDs?.map(x => "<#"+x+">")?.join(", ")}`)
            .join("\n")
    });
}
