import { CommandCallData, loadPrefs, sendEmbed } from "../../_core/bot_core";
import { ChannelData, CHANNEL_PREFS_FILE } from "../command_prefs";

export default async function cmdGetChannel({ msg }: CommandCallData) {
    const channelPrefs = loadPrefs<ChannelData>(CHANNEL_PREFS_FILE);
    const channelData  = channelPrefs[msg.guild!.id];

    const fromChannelStrings = channelData?.fromChannels?.map(x => "<#"+x+">").join(", ") ?? "None set...";
    const toChannelStrings   = channelData?.toChannels  ?.map(x => "<#"+x+">").join(", ") ?? "None set...";

    sendEmbed(msg, "neutral", {
        title: "Channels",
        desc: `base: ${fromChannelStrings}\ntarget: ${toChannelStrings}`
    });
}
