import * as CoreTools from "../../_core/core_tools";
import * as types from "../../_core/types";
import * as Utilz from "../../utilz";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";

export default async function cmdGetChannel({ msg, args }: types.CombinedData) {
    const channelPrefs = CoreTools.loadPrefs<ChannelData>(CHANNEL_PREFS_FILE);
    const channelData  = channelPrefs[msg.guild!.id];

    const fromChannelStrs = channelData?.fromChannels?.map(x => "<#"+x+">").join(", ") ?? "None set...";
    const toChannelStrs   = channelData?.toChannels  ?.map(x => "<#"+x+">").join(", ") ?? "None set...";

    CoreTools.sendEmbed(msg, "neutral", {
        title: "Channels",
        desc: `base: ${fromChannelStrs}\ntarget: ${toChannelStrs}`
    });
}
