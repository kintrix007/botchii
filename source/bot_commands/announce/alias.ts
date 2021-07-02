import { sendEmbed, loadPrefs, CommandCallData } from "../../_core/bot_core";
import * as Utilz from "../../utilz";
import { AliasData, ALIAS_PREFS_FILE } from "../command_prefs";
import { Message } from "discord.js";

export default async function cmdAlias({ msg, args }: CommandCallData) {
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
    const channelIDs = new Set(Utilz.parseChannels(msg.guild!, channelIDsOrAliases));
    const channels = await Utilz.fetchTextChannels(msg.client, channelIDs);

    if (channels.length === 0) {
        sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    Utilz.createChannelAlias(msg.guild!, alias, channels);
    sendEmbed(msg, "ok", `Successfully added channel alias \`${alias}\` for ${channels.join(", ")}`);
}

function removeAlias(msg: Message, alias: string) {
    Utilz.removeChannelAlias(msg.guild!, alias);
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
