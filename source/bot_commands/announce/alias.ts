import * as CoreTools from "../../_core/core_tools";
import * as types from "../../_core/types";
import * as Utilz from "../../utilz";
import { AliasData, ALIAS_PREFS_FILE } from "../command_prefs";
import { Message } from "discord.js";

export default async function cmdAlias({ msg, args }: types.CombinedData) {
    const alias = args[0] as string | undefined;
    const channelIDsOrAliases = args.slice(1);

    if (!alias) {
        getAliases(msg);
        return;
    }

    if (channelIDsOrAliases.length === 0) {
        removeAlias(msg, alias);
        return;
    }

    const channelIDs = Utilz.parseChannels(msg.guild!, channelIDsOrAliases);
    const channels = await Utilz.fetchTextChannels(msg.client, channelIDs);

    if (channels.length === 0) {
        CoreTools.sendEmbed(msg, "error", "No valid channels given.");
        return;
    }

    Utilz.createChannelAlias(msg.guild!, alias, channels);
    CoreTools.sendEmbed(msg, "ok", `Successfully added channel alias \`${alias}\` for ${channels.join(", ")}`);
}

function removeAlias(msg: Message, alias: string) {
    Utilz.removeChannelAlias(msg.guild!, alias);
    CoreTools.sendEmbed(msg, "ok", `Successfully removed channel alias \`${alias}\`.`);
}

function getAliases(msg: Message) {
    const aliasData = CoreTools.loadPrefs<AliasData>(ALIAS_PREFS_FILE)[msg.guild!.id];

    if (aliasData === undefined || Object.values(aliasData.aliases).length === 0) {
        CoreTools.sendEmbed(msg, "neutral", "No aliases set...");
        return;
    }

    CoreTools.sendEmbed(msg, "neutral", {
        title: `${aliasData.guildName} aliases:`,
        desc: Object.entries(aliasData.aliases)
            .map(([alias, channelIDs]) =>
                `\`${alias}\` -> ${channelIDs?.map(x => "<#"+x+">")?.join(", ")}`)
            .join("\n")
    });
}
